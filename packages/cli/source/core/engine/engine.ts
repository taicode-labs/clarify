import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { ConfigEnv, Plugin } from 'vite'

import { cliPackageVersion } from '../../cli/package.js'
import { createProjectContentProcessor } from '../../parsers/content/content.js'
import { findContentRoutes, findLocalizedContentRoutes, applyConfiguredPageRoutePaths, buildNavigation, buildNavigationFromTabsConfig, buildLocalizedNavigationFromTabsConfig } from '../../parsers/routes/routes.js'
import type { ClarifyEmitAsset, ClarifyHtmlTransformInput, ClarifyPlugin, ContentRoute, NavigationTree, ClarifyPage, ClarifyProjectContext  } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from '../config/options.js'
import { findClarifyConfigFile } from '../config/user-config.js'
import { runBuildAssetsHooks, runBuildDoneHooks, runDevConfigureServerHooks, runHooks } from '../plugin/hooks.js'
import { loadBuildPlugins } from '../plugin/manager.js'
import { resolveProjectContext } from '../project/project-context.js'
import { writeClarifyEnvDts } from '../runtime/env-types.js'
import {
  SSR_ENTRY_CODE,
  buildSSRBundle,
  createTempEntryFile,
  renderSSGRoutes,
} from '../runtime/ssg.js'
import { logStartupHints } from '../runtime/startup.js'
import {
  buildVirtualModules,
  resolveVirtualModuleId,
  stripVirtualPrefix,
  type VirtualModules,
} from '../runtime/virtual-modules.js'

import { ClarifyContext } from './context.js'
import { runInterceptHooks, runPhase, runTapHooks } from './phases.js'
import type { BuildSSRBundleOptions, ClarifyEngineRuntime, PrepareOptions } from './types.js'

export type { ClarifyEngineMode, ClarifyEngineRuntime, PrepareOptions } from './types.js'

function loadVirtualModule(id: string, modules: VirtualModules): string | null {
  const bareId = stripVirtualPrefix(id)
  return modules.get(bareId) ?? modules.get(id) ?? null
}

export function assertNoContentDiagnostics(routes: ContentRoute[]): void {
  const failures = routes.filter(route => route.diagnostic)
  if (failures.length === 0) return

  const summary = failures
    .map(route => `- ${route.path}: ${route.diagnostic?.title ?? 'Content error'}${route.diagnostic?.filePath ? ` (${route.diagnostic.filePath})` : ''}`)
    .join('\n')
  throw new Error(`[clarify] Content diagnostics prevented the build:\n${summary}`)
}

export class ClarifyEngine {
  readonly options: ClarifyBuildOptions
  readonly root: string
  configFilePath?: string
  readonly ctx: ClarifyContext

  private runtime: ClarifyEngineRuntime = { command: 'build', mode: 'production' }
  private virtualModules: VirtualModules = new Map()
  private buildEnabled = true
  private initializedOptions?: ClarifyBuildOptions

  constructor(options: ClarifyBuildOptions = {}) {
    this.options = options
    this.root = resolve(options.projectRoot ?? process.cwd())
    this.configFilePath = findClarifyConfigFile(this.root) ?? undefined

    // Create a minimal context with placeholder values. The real config
    // resolution and plugin loading happen in initialize(), which is always
    // called before any real work. This avoids redundant work in the
    // constructor and keeps Engine construction cheap.
    const placeholderConfig = resolveProjectConfig({})
    const placeholderOptions = resolveBuildOptions(options)
    this.ctx = new ClarifyContext({
      projectRoot: this.root,
      contentRoot: join(this.root, placeholderOptions.rootDirectory),
      projectConfig: placeholderConfig,
      generateOptions: placeholderOptions,
      version: cliPackageVersion,
      routes: [],
      navigation: { kind: 'flat', nodes: [] },
      plugins: [],
    })
  }

  configureRuntime(runtime: Partial<ClarifyEngineRuntime>): void {
    this.runtime = { ...this.runtime, ...runtime }
  }

  async initialize(env: ConfigEnv = { command: this.runtime.command, mode: this.runtime.mode }, options: ClarifyBuildOptions = this.options, prepareOptions: PrepareOptions = {}): Promise<ClarifyBuildOptions> {
    if (this.initializedOptions && !prepareOptions.force) return this.initializedOptions

    const seedPlugins = loadBuildPlugins(options, { htmlShell: prepareOptions.htmlShell })
    this.ctx.plugins = seedPlugins
    const context = await runPhase(seedPlugins, 'config:load', this.ctx, () => resolveProjectContext(options, env))

    this.configFilePath = context.configFilePath
    this.ctx.updateProjectState({
      projectRoot: context.projectRoot,
      contentRoot: context.contentRoot,
      projectConfig: context.projectConfig,
      generateOptions: context.buildOptions,
      version: context.projectContext.version,
    })
    await runPhase(seedPlugins, 'config:resolve', this.ctx, () => undefined)

    // Reload plugins with the fully resolved options (which now include
    // plugins declared in the config file) and run the plugins:load phase.
    // The seed plugins above only carried user-supplied options.plugins so
    // that config:load/config:resolve hooks could fire before the config
    // file was read; the final plugin set replaces them here.
    const finalPlugins = loadBuildPlugins(context.resolvedOptions, { htmlShell: prepareOptions.htmlShell })
    this.ctx.plugins = finalPlugins
    await runPhase(finalPlugins, 'plugins:load', this.ctx, () => undefined)
    this.initializedOptions = context.resolvedOptions

    return context.resolvedOptions
  }

  /**
   * Runs the full pre-build/pre-dev preparation: initialize (config load +
   * resolve + plugins:load), site discovery (routes + navigation), and module
   * building. This is the single entry point that prepares the engine before
   * handing it to a Vite adapter or running a check, so callers never need to
   * call initialize/discoverSite separately.
   *
   * Options:
   * - `force`: re-run even if already prepared (config-file hot reload).
   * - `htmlShell`: toggle the HTML shell builtin plugin (default true).
   * - `skipModules`: skip `buildModules()` (check command).
   * - `skipHints`: skip `logStartupHints()` (check command).
   *
   * Idempotent: calling prepare() again with the same env is a no-op unless
   * `force` is set.
   */
  async prepare(env: ConfigEnv = { command: this.runtime.command, mode: this.runtime.mode }, options: ClarifyBuildOptions = this.options, prepareOptions: PrepareOptions = {}): Promise<ClarifyBuildOptions> {
    this.configureRuntime({ command: env.command, mode: env.mode })
    const resolvedOptions = await this.initialize(env, options, prepareOptions)
    await this.discoverSite()
    if (!prepareOptions.skipModules) await this.buildModules()
    if (!prepareOptions.skipHints) this.logStartupHints()
    return resolvedOptions
  }

  get projectConfig(): ClarifyContext['projectConfig'] {
    return this.ctx.projectConfig
  }

  get generateOptions(): ClarifyContext['generateOptions'] {
    return this.ctx.generateOptions
  }

  get contentRoot(): string {
    return this.ctx.contentRoot
  }

  get routes(): ContentRoute[] {
    return this.ctx.routes
  }

  get navigation(): NavigationTree {
    return this.ctx.navigation
  }

  get plugins(): ClarifyPlugin[] {
    return this.ctx.plugins
  }

  get modules(): VirtualModules {
    return this.virtualModules
  }

  loadModule(id: string): string | null {
    return loadVirtualModule(id, this.virtualModules)
  }

  async discoverSite(): Promise<void> {
    const plugins = this.ctx.plugins
    const contentRoot = this.ctx.contentRoot
    const { i18n, tabs } = this.ctx.projectConfig

    // Phase 3: site:discover - scan content directory. The Engine provides the
    // default discovery logic (i18n-aware content scanning) directly; user
    // plugins can extend or replace it via the routes:discover pipeline hook.
    let routes = await runPhase(plugins, 'site:discover', this.ctx, async () => {
      const processor = createProjectContentProcessor(plugins, this.ctx)
      const options = { contentProcessor: processor }

      const discovered = i18n
        ? await findLocalizedContentRoutes(contentRoot, i18n, options)
        : await findContentRoutes(contentRoot, contentRoot, options)

      // Run routes:discover hook so plugins can augment the discovered routes.
      const result = await runHooks(plugins, 'routes:discover', { contentRoot, routes: discovered }, this.ctx)
      return runHooks(plugins, 'routes:discovered', result.routes, this.ctx)
    })

    // Phase 4: content:process - post-discovery adjustments. Map routes to
    // pages, run pages:resolved pipeline, then write back any page-level
    // changes (frontmatter/content) onto the routes.
    routes = await runPhase(plugins, 'content:process', this.ctx, async () => {
      const pages = routes.map<ClarifyPage>(route => ({
        path: route.path,
        filePath: route.source.filePath,
        frontmatter: route.source.frontmatter ?? {},
        content: route.source.content ?? '',
      }))
      const resolvedPages = await runHooks(plugins, 'pages:resolved', pages, this.ctx)
      const pageByPath = new Map(resolvedPages.map(p => [p.path, p]))
      return routes.map(route => {
        const page = pageByPath.get(route.path)
        if (!page) return route
        return {
          ...route,
          source: {
            ...route.source,
            frontmatter: page.frontmatter,
            content: page.content,
          },
        }
      })
    })

    // Build navigation directly. The Engine applies configured page route
    // paths and builds the navigation tree (tabs-based or auto-generated).
    // User plugins can intercept via the routes:resolved hook.
    routes = applyConfiguredPageRoutePaths(routes, tabs, i18n)
    const navigation = tabs
      ? i18n
        ? (buildLocalizedNavigationFromTabsConfig(routes, tabs, i18n) ?? { kind: 'localized-tabbed', locales: {} })
        : buildNavigationFromTabsConfig(routes, tabs)
      : { kind: 'flat' as const, nodes: buildNavigation(routes) }
    const resolved = await runHooks(plugins, 'routes:resolved', { routes, navigation }, this.ctx)
    this.ctx.routes = resolved.routes
    this.ctx.navigation = resolved.navigation
  }

  logStartupHints(): void {
    logStartupHints({
      projectRoot: this.root,
      contentRoot: this.contentRoot,
      contentDirExists: existsSync(this.contentRoot),
      hasRoutes: this.routes.length > 0,
    })
  }

  async buildModules(): Promise<void> {
    await runPhase(this.plugins, 'modules:build', this.ctx, async () => {
      this.virtualModules = buildVirtualModules({
        projectConfig: this.projectConfig,
        generateOptions: this.generateOptions,
        routes: this.routes,
        navigation: this.navigation,
        plugins: this.plugins,
        themeEditor: this.runtime.command === 'serve' || this.runtime.themeEditor === true || this.projectConfig.features.themeEditor.enabled,
        version: this.ctx.version,
      })
      this.virtualModules = await runHooks(this.plugins, 'modules:before', this.virtualModules, this.ctx)
    })
  }

  writeEnvTypes(): void {
    writeClarifyEnvDts(this.root, this.plugins)
  }

  hasContentRouteForFile(filePath: string): boolean {
    return this.routes.some(route => route.source.filePath === filePath)
  }

  async collectBuildAssets(): Promise<ClarifyEmitAsset[]> {
    if (!this.buildEnabled) return []
    return runBuildAssetsHooks(this.plugins, this.ctx)
  }

  async beginBuild(): Promise<boolean> {
    this.buildEnabled = await runInterceptHooks(this.plugins, 'build:shouldRun', this.ctx)
    if (!this.buildEnabled) return false
    await runTapHooks(this.plugins, 'before:build', this.ctx)
    return true
  }

  async endBuild(): Promise<void> {
    if (!this.buildEnabled) return
    await runTapHooks(this.plugins, 'after:build', this.ctx)
  }

  shouldRunBuild(): boolean {
    return this.buildEnabled
  }

  async configureDevServer(server: Parameters<typeof runDevConfigureServerHooks>[1]): Promise<void> {
    await runPhase(this.plugins, 'dev:server', this.ctx, async () => {
      await runDevConfigureServerHooks(this.plugins, server, this.ctx)
    })
  }

  async runBuildDone(): Promise<void> {
    if (!this.buildEnabled) return
    await runBuildDoneHooks(this.plugins, this.ctx)
  }

  async runSSG(): Promise<void> {
    if (!this.buildEnabled || !this.projectConfig.features.ssg.enabled) return
    await runPhase(this.plugins, 'ssg', this.ctx, async () => {
      if (process.env.SKIP_CLARIFY_SSG) return

      if (!(await runInterceptHooks(this.plugins, 'ssg:shouldRun', this.ctx))) return

      if (this.generateOptions.ssg.failOnError) assertNoContentDiagnostics(this.routes)

      const outputDir = this.runtime.outputDirectory ?? this.generateOptions.outputDirectory
      if (!outputDir) throw new Error('[clarify] outputDirectory is required before SSG runs')

      const ssrOutputDir = join(outputDir, '.ssr')
      let tempEntryPath: string | undefined

      try {
        tempEntryPath = createTempEntryFile(SSR_ENTRY_CODE)
        const buildSSR = this.runtime.buildSSRBundle ?? ((options: BuildSSRBundleOptions) => buildSSRBundle(options.root, options.ssrEntry, options.ssrOutDir, options.plugins))

        await buildSSR({
          root: this.root,
          ssrEntry: tempEntryPath,
          ssrOutDir: ssrOutputDir,
          plugins: this.runtime.ssrPlugins ?? [],
        })

        const ssrBundlePath = join(ssrOutputDir, 'entry-server.js')
        await renderSSGRoutes(this.routes, this.runtimeContext(), outputDir, ssrBundlePath, this.generateOptions.ssg.failOnError)
      } catch (err) {
        console.error('[clarify] SSG failed:', err)
        if (this.generateOptions.ssg.failOnError) throw err
      } finally {
        if (tempEntryPath) {
          try {
            rmSync(tempEntryPath, { force: true })
          } catch {
            // ignore cleanup errors
          }
        }
      }

    })
    await this.runBuildDone()
  }

  async refresh(): Promise<void> {
    await this.discoverSite()
    await this.buildModules()
  }

  /**
   * Runs the `html:transform` pipeline hook and returns the transformed
   * input. Adapters call this from their `transformIndexHtml` hook instead
   * of invoking `runHooks` directly, keeping hook execution inside Engine.
   */
  async transformHtml(input: ClarifyHtmlTransformInput): Promise<ClarifyHtmlTransformInput> {
    return runHooks(this.plugins, 'html:transform', input, this.ctx)
  }

  runtimeContext(): ClarifyProjectContext {
    return {
      projectRoot: this.root,
      contentRoot: this.contentRoot,
      projectConfig: this.projectConfig,
      generateOptions: this.generateOptions,
      version: this.ctx.version,
    }
  }

  createSSGVirtualPlugin(): Plugin {
    return {
      name: 'clarify:virtual-ssg',
      resolveId: id => resolveVirtualModuleId(id, this.virtualModules, this.routes),
      load: id => this.loadModule(id),
    }
  }
}

export function createClarifyEngine(options: ClarifyBuildOptions = {}): ClarifyEngine {
  return new ClarifyEngine(options)
}
