import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, NavigationTree, ResolvedProjectConfig } from '../../types.js'
import type { ResolvedBuildOptions } from '../config/options.js'

export type ClarifyContextInit = {
  projectRoot: string
  contentRoot: string
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  version: string
  routes?: ContentRoute[]
  navigation?: NavigationTree
  plugins?: ClarifyPlugin[]
}

type ContextListener = () => void

export class ClarifyContext implements ClarifyHookContext {
  projectRoot: string
  contentRoot: string
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  version: string

  private values = new Map<string, unknown>()
  private routeListeners = new Set<ContextListener>()
  private navigationListeners = new Set<ContextListener>()
  private pluginListeners = new Set<ContextListener>()
  private currentRoutes: ContentRoute[]
  private currentNavigation: NavigationTree
  private currentPlugins: ClarifyPlugin[]

  constructor(init: ClarifyContextInit) {
    this.projectRoot = init.projectRoot
    this.contentRoot = init.contentRoot
    this.projectConfig = init.projectConfig
    this.generateOptions = init.generateOptions
    this.version = init.version
    this.currentRoutes = init.routes ?? []
    this.currentNavigation = init.navigation ?? []
    this.currentPlugins = init.plugins ?? []
  }

  get routes(): ContentRoute[] {
    return this.currentRoutes
  }

  set routes(routes: ContentRoute[]) {
    this.currentRoutes = routes
    this.notify(this.routeListeners)
  }

  get navigation(): NavigationTree {
    return this.currentNavigation
  }

  set navigation(navigation: NavigationTree) {
    this.currentNavigation = navigation
    this.notify(this.navigationListeners)
  }

  get plugins(): ClarifyPlugin[] {
    return this.currentPlugins
  }

  set plugins(plugins: ClarifyPlugin[]) {
    this.currentPlugins = plugins
    this.notify(this.pluginListeners)
  }

  get isI18n(): boolean {
    return Boolean(this.projectConfig.i18n)
  }

  get defaultLocale(): string | undefined {
    return this.projectConfig.i18n?.defaultLocale
  }

  get<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined
  }

  set<T>(key: string, value: T): void {
    this.values.set(key, value)
  }

  has(key: string): boolean {
    return this.values.has(key)
  }

  delete(key: string): boolean {
    return this.values.delete(key)
  }

  onRoutesChange(listener: ContextListener): () => void {
    this.routeListeners.add(listener)
    return () => this.routeListeners.delete(listener)
  }

  onNavigationChange(listener: ContextListener): () => void {
    this.navigationListeners.add(listener)
    return () => this.navigationListeners.delete(listener)
  }

  onPluginsChange(listener: ContextListener): () => void {
    this.pluginListeners.add(listener)
    return () => this.pluginListeners.delete(listener)
  }

  updateProjectState(update: {
    projectRoot?: string
    contentRoot?: string
    projectConfig?: ResolvedProjectConfig
    generateOptions?: ResolvedBuildOptions
    version?: string
  }): void {
    if (update.projectRoot !== undefined) this.projectRoot = update.projectRoot
    if (update.contentRoot !== undefined) this.contentRoot = update.contentRoot
    if (update.projectConfig !== undefined) this.projectConfig = update.projectConfig
    if (update.generateOptions !== undefined) this.generateOptions = update.generateOptions
    if (update.version !== undefined) this.version = update.version
  }

  private notify(listeners: Set<ContextListener>): void {
    for (const listener of listeners) listener()
  }
}
