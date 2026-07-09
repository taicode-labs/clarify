import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { Plugin } from 'vite'

import { cliPackageVersion } from '../../cli/package.js'
import type { ClarifyEmitAsset, ClarifyHookContext, ClarifyPlugin, ContentRoute, NavigationTree } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from '../config/options.js'
import { findClarifyConfigFile } from '../config/user-config.js'
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
import { resolveClarifySite } from '../site/site.js'
import { createBuiltinPlugins } from '../plugin/builtin.js'
import { runBuildAssetsHooks, runBuildDoneHooks, runDevConfigureServerHooks, runHooks } from '../plugin/hooks.js'

import { ClarifyContext } from './context.js'
import { runInterceptHooks, runPhase, runTapHooks } from './phases.js'

export type ClarifyEngineMode = 'development' | 'production'

export type BuildSSRBundleOptions = {
  root: string
  ssrEntry: string
  ssrOutDir: string
  plugins: Plugin[]
}

export type ClarifyEngineRuntime = {
  command: 'build' | 'serve'
  mode: ClarifyEngineMode | string
  themeEditor?: boolean
  outputDirectory?: string
  ssrPlugins?: Plugin[]
  buildSSRBundle?: (options: BuildSSRBundleOptions) => Promise<void>
}

export type ClarifyEngineState = {
  projectRoot: string
  contentRoot: string
  configFilePath?: string
  projectConfig: ClarifyContext['projectConfig']
  generateOptions: ClarifyContext['generateOptions']
  routes: ContentRoute[]
  navigation: NavigationTree
  plugins: ClarifyPlugin[]
  virtualModules: VirtualModules
  ctx: ClarifyContext
}

export function loadVirtualModule(id: string, modules: VirtualModules): string | null {
  const bareId = stripVirtualPrefix(id)
  return modules.get(bareId) ?? modules.get(id) ?? null
}

export class ClarifyEngine {
  readonly options: ClarifyBuildOptions
  readonly root: string
  readonly configFilePath?: string
  readonly ctx: ClarifyContext

  private runtime: ClarifyEngineRuntime = { command: 'build', mode: 'production' }
  private virtualModules: VirtualModules = new Map()
  private buildEnabled = true

  constructor(options: ClarifyBuildOptions = {}) {
    this.options = options
    this.root = resolve(options.projectRoot ?? process.cwd())
    this.configFilePath = findClarifyConfigFile(this.root) ?? undefined

    const projectConfig = resolveProjectConfig(options)
    const generateOptions = resolveBuildOptions(options)
    const contentRoot = join(this.root, generateOptions.rootDirectory)
    const plugins = [...createBuiltinPlugins(), ...(options.plugins ?? [])]

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

  async discoverSite(overrides?: ClarifyBuildOptions): Promise<void> {
    await runPhase(this.plugins, 'site:discover', this.ctx, async () => {
      const site = await resolveClarifySite(overrides ?? this.options)
      this.ctx.updateProjectState({
        projectRoot: site.root,
        contentRoot: site.contentRoot,
        projectConfig: site.projectConfig,
        generateOptions: site.generateOptions,
        version: cliPackageVersion,
      })
      this.ctx.plugins = site.plugins
      this.ctx.routes = site.routes
      this.ctx.navigation = site.navigation
    })
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

  runtimeContext(): Omit<ClarifyHookContext, 'routes' | 'navigation'> {
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
