import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { ConfigEnv, Plugin } from 'vite'

import { cliPackageVersion } from '../../cli/package.js'
import type { ClarifyEmitAsset, ClarifyHookContext, ClarifyHtmlTransformInput, ClarifyPlugin, ContentRoute, NavigationTree, ClarifyPage  } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from '../config/options.js'
import { findClarifyConfigFile } from '../config/user-config.js'
import { runBuildAssetsHooks, runBuildDoneHooks, runDevConfigureServerHooks, runHooks } from '../plugin/hooks.js'
import { loadBuildPlugins, loadBuildPluginsForContext } from '../plugin/manager.js'
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
  RESOLVED_CLIENT_ENTRY,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_CONFIG,
  VIRTUAL_OPENAPI,
  VIRTUAL_ROUTES,
  VIRTUAL_SERVER_ROUTES,
  VIRTUAL_SLOT,
  VIRTUAL_SLOTS,
  buildVirtualModules,
  stripVirtualPrefix,
  type VirtualModules,
} from '../runtime/virtual-modules.js'

import { ClarifyContext } from './context.js'
import { runInterceptHooks, runPhase, runTapHooks } from './phases.js'
import type { BuildSSRBundleOptions, ClarifyEngineRuntime, ClarifyEngineState, PrepareOptions } from './types.js'

export type { ClarifyEngineMode, ClarifyEngineRuntime, ClarifyEngineState, PrepareOptions } from './types.js'

export function loadVirtualModule(id: string, modules: VirtualModules): string | null {
  const bareId = stripVirtualPrefix(id)
  return modules.get(bareId) ?? modules.get(id) ?? null
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

    const projectConfig = resolveProjectConfig(options)
    const generateOptions = resolveBuildOptions(options)
    const contentRoot = join(this.root, generateOptions.rootDirectory)
    const plugins = loadBuildPlugins(options)

    this.ctx = new ClarifyContext({
      projectRoot: this.root,
      contentRoot,
      projectConfig,
      generateOptions,
      version: cliPackageVersion,
      routes: [],
      navigation: [],
      plugins,
    })
  }

  configureRuntime(runtime: Partial<ClarifyEngineRuntime>): void {
    this.runtime = { ...this.runtime, ...runtime }
  }

  async initialize(env: ConfigEnv = { command: this.runtime.command, mode: this.runtime.mode }, options: ClarifyBuildOptions = this.options, force = false): Promise<ClarifyBuildOptions> {
    if (this.initializedOptions && !force) return this.initializedOptions

    const seedPlugins = loadBuildPlugins(options)
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
    // loadBuildPluginsForContext has side effects: it sets ctx.plugins and
    // runs the plugins:load phase. The returned array is ctx.plugins itself.
    await loadBuildPluginsForContext(this.ctx, context.resolvedOptions)
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
    const resolvedOptions = await this.initialize(env, options, prepareOptions.force ?? false)
    await this.discoverSite(resolvedOptions, { htmlShell: prepareOptions.htmlShell })
    if (!prepareOptions.skipModules) await this.buildModules()
    if (!prepareOptions.skipHints) this.logStartupHints()
    return resolvedOptions
  }

  get state(): ClarifyEngineState {
    return {
      projectRoot: this.root,
      contentRoot: this.ctx.contentRoot,
      configFilePath: this.configFilePath,
      projectConfig: this.ctx.projectConfig,
      generateOptions: this.ctx.generateOptions,
      routes: this.ctx.routes,
      navigation: this.ctx.navigation,
      plugins: this.ctx.plugins,
      virtualModules: this.virtualModules,
      ctx: this.ctx,
    }
  }

  get hookContext(): ClarifyHookContext {
    return this.ctx
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

  async discoverSite(overrides?: ClarifyBuildOptions, siteOptions?: { htmlShell?: boolean }): Promise<void> {
    const options = overrides ?? this.initializedOptions ?? this.options
    const context = await resolveProjectContext(options)
    const root = context.projectRoot
    const projectConfig = context.projectConfig
    const generateOptions = context.buildOptions
    const contentRoot = context.contentRoot

    this.ctx.updateProjectState({
      projectRoot: root,
      contentRoot,
      projectConfig,
      generateOptions,
      version: context.projectContext.version,
    })

    // Phase 2: plugins:load - register builtin + user plugins. This runs
    // even when initialize() was called earlier, because discoverSite() may be
    // invoked with different overrides (e.g. htmlShell toggled off).
    const plugins = await loadBuildPluginsForContext(this.ctx, context.resolvedOptions, { htmlShell: siteOptions?.htmlShell ?? true })

    // Phase 3: site:discover - scan content directory via routes:discover pipeline.
    // The actual discovery logic (i18n handling, fallback routes, bare aliases)
    // lives in the site-discovery builtin plugin, keeping the Engine as a pure
    // orchestrator.
    let routes = await runPhase(plugins, 'site:discover', this.ctx, async () => {
      const discovered = await runHooks(plugins, 'routes:discover', { contentRoot, routes: [] }, this.ctx)
      return discovered.routes
    })
    routes = await runHooks(plugins, 'routes:discovered', routes, this.ctx)

    // Phase 4: content:process - post-discovery adjustments. Map routes to
    // pages, run pages:resolved pipeline, then write back any page-level
    // changes (frontmatter/content) onto the routes. applyConfiguredPageRoutePaths
    // and navigation building are handled by the navigation builtin plugin in
    // routes:resolved below.
    routes = await runPhase(plugins, 'content:process', this.ctx, async () => {
      const pages = routes.map<ClarifyPage>(route => ({
        path: route.path,
        filePath: route.filePath,
        frontmatter: route.frontmatter ?? {},
        content: route.content ?? '',
      }))
      const resolvedPages = await runHooks(plugins, 'pages:resolved', pages, this.ctx)
      const pageByPath = new Map(resolvedPages.map(p => [p.path, p]))
      return routes.map(route => {
        const page = pageByPath.get(route.path)
        if (!page) return route
        return {
          ...route,
          frontmatter: page.frontmatter,
          content: page.content,
        }
      })
    })

    // Build navigation and apply configured page route paths via the navigation
    // builtin plugin (runs as enforce:'post').
    const resolved = await runHooks(plugins, 'routes:resolved', { routes, navigation: {} as NavigationTree }, this.ctx)
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
        themeEditor: this.runtime.command === 'serve' || this.runtime.themeEditor === true || this.projectConfig.theme.editor,
        version: this.ctx.version,
      })
      this.virtualModules = await runHooks(this.plugins, 'modules:before', this.virtualModules, this.ctx)
    })
  }

  writeEnvTypes(): void {
    writeClarifyEnvDts(this.root, this.plugins)
  }

  hasContentRouteForFile(filePath: string): boolean {
    return this.routes.some(route => route.filePath === filePath)
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
    if (!this.buildEnabled) return
    await runPhase(this.plugins, 'ssg', this.ctx, async () => {
      if (process.env.SKIP_CLARIFY_SSG) {
        await this.runBuildDone()
        return
      }

      if (!(await runInterceptHooks(this.plugins, 'ssg:shouldRun', this.ctx))) {
        await this.runBuildDone()
        return
      }

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

      await this.runBuildDone()
    })
  }

  async refresh(overrides?: ClarifyBuildOptions): Promise<void> {
    await this.discoverSite(overrides)
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

  runtimeContext(): Omit<ClarifyHookContext, 'routes' | 'navigation'> {
    return {
      projectRoot: this.root,
      contentRoot: this.contentRoot,
      projectConfig: this.projectConfig,
      generateOptions: this.generateOptions,
      version: this.ctx.version,
      plugins: this.ctx.plugins,
    }
  }

  createSSGVirtualPlugin(): Plugin {
    return {
      name: 'clarify:virtual-ssg',
      resolveId: id => {
        if (id === VIRTUAL_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
        if (id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
        if (id === VIRTUAL_SERVER_ROUTES) return id
        if (id === VIRTUAL_OPENAPI) return id
        if (id === VIRTUAL_CONFIG) return id
        if (id === VIRTUAL_ROUTES) return id
        if (id === VIRTUAL_SLOTS) return id
        if (id === VIRTUAL_SLOT) return id
        if (this.virtualModules.has(stripVirtualPrefix(id))) return stripVirtualPrefix(id)
        const route = this.routes.find(route => route.virtualModuleId === id)
        if (route) return id
        return null
      },
      load: id => this.loadModule(id),
    }
  }
}

export function createClarifyEngine(options: ClarifyBuildOptions = {}): ClarifyEngine {
  return new ClarifyEngine(options)
}
