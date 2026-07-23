import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { HtmlTagDescriptor, ViteDevServer } from 'vite'

import type { ContentDiagnostic, UISlotRegistration } from '@clarify-labs/renderer'

import type { ResolvedBuildOptions } from './core/config/options.js'

export type {
  ClarifyBuildOptions,
  ResolvedBuildOptions,
} from './core/config/options.js'
export type { ContentDiagnostic } from '@clarify-labs/renderer'

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document

// ────────────────────────────────────────────────────────────────────────────────
// Project Config (clarify.ts/js/json)
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyLogoConfig = string | { light?: string; dark?: string }

export type ClarifyFaviconConfig = string | { light?: string; dark?: string }

export type ClarifyLocalizedText = string | Record<string, string>

export type ClarifyLocaleConfig = {
  code: string
  label: string
  dir?: 'ltr' | 'rtl'
}

export type ClarifyLocalesConfig = {
  /** Default visible locale. Localized content is read from rootDirectory/<locale>. */
  default?: string
  /** Missing translation behavior. Fallback uses default locale content. */
  missing?: 'fallback' | '404' | 'hide'
  locales: ClarifyLocaleConfig[]
}

export type ResolvedClarifyLocalesConfig = {
  default: string
  missing: 'fallback' | '404' | 'hide'
  locales: ClarifyLocaleConfig[]
}

export type ClarifyNavbarLink = {
  label: ClarifyLocalizedText
  href: string
  external?: boolean
}

export type ClarifyBannerConfig = {
  content: ClarifyLocalizedText
  dismissible?: boolean
  link?: ClarifyNavbarLink
}

export type ClarifyFooterConfig = {
  links?: ClarifyNavbarLink[]
  socials?: Record<string, string>
  copyright?: ClarifyLocalizedText
}

export type ClarifyVariablePrimitive = string | number | boolean

export type ClarifyVariableValue = ClarifyVariablePrimitive | { [key: string]: ClarifyVariableValue }

export type ClarifyVariablesConfig = Record<string, ClarifyVariableValue>

export type ClarifyRepositoryConfig = {
  /** Repository web URL, for example https://github.com/owner/repo. */
  url?: string
  /** Source branch. Default: main. */
  branch?: string
  /** Directory prefix inside the repository that maps to rootDirectory. */
  directory?: string
}

export type ClarifyThemePreset = 'default' | 'base'

export type ClarifyThemeModeColorValue = {
  light?: string
  dark?: string
}

export type ClarifyThemeColorValue = string | ClarifyThemeModeColorValue

export type ClarifyThemeColorTokensConfig = {
  /** Brand primary color for active states, links, and emphasis. */
  primary?: ClarifyThemeColorValue
  /** Secondary accent color for subtle emphasis. */
  accent?: ClarifyThemeColorValue
  /** Page background color. */
  background?: ClarifyThemeColorValue
  /** Primary text color. */
  foreground?: ClarifyThemeColorValue
  /** Card and elevated surface background color. */
  surface?: ClarifyThemeColorValue
  /** Muted text and secondary UI color. */
  muted?: ClarifyThemeColorValue
  /** Border and divider color. */
  border?: ClarifyThemeColorValue
  /** Inline code and code block background color. */
  codeBackground?: ClarifyThemeColorValue
}

export type ClarifyThemeRadiusTokensConfig = {
  sm?: string
  md?: string
  lg?: string
  xl?: string
}

export type ClarifyThemeTokensConfig = {
  colors?: ClarifyThemeColorTokensConfig
  radius?: ClarifyThemeRadiusTokensConfig
}

export type ClarifyThemeLayoutConfig = {
  /** Max width for the overall documentation layout. */
  maxWidth?: string
}

export type ClarifyThemeConfig = {
  /** Visual baseline for built-in styles. Overrides below are applied on top. */
  preset?: ClarifyThemePreset
  /** Design token overrides applied on top of the selected preset. */
  tokens?: ClarifyThemeTokensConfig
  /** Documentation layout overrides applied on top of the selected preset. */
  layout?: ClarifyThemeLayoutConfig
}

export type ClarifyLayoutConfig = {
  /** Desktop location for top-level navigation tabs. */
  tabs?: 'subnav' | 'navbar'
}

export type ResolvedClarifyThemeTokensConfig = {
  colors: Required<ClarifyThemeColorTokensConfig>
  radius: Required<ClarifyThemeRadiusTokensConfig>
}

export type ResolvedClarifyThemeLayoutConfig = Required<ClarifyThemeLayoutConfig>

export type ResolvedClarifyThemeConfig = {
  preset: ClarifyThemePreset
  tokens: ResolvedClarifyThemeTokensConfig
  layout: ResolvedClarifyThemeLayoutConfig
}

export type ClarifyPagesItem =
  | string
  | ClarifyPagesGroup
  | {
    page: string
    /** Explicit route path. Defaults to the path generated from page. */
    path?: string
    /** Override the page title. Defaults to localized route title. */
    title?: ClarifyLocalizedText
    /** Icon name from lucide-react, e.g. "BookOpen". */
    icon?: string
    /** If set, this navigation item is a redirect entry.
     *  The value is treated as a locale-independent page path for internal links. */
    redirect?: string
  }
  | {
    openapi: string
    /** Explicit route path. Defaults to the path generated from openapi and filter. */
    path?: string
    /** Icon name from lucide-react, e.g. "Webhook". */
    icon?: string
    /** Override the page title. Defaults to spec.info.title. */
    title?: ClarifyLocalizedText
    /** Filter which OpenAPI operations are included in this page. */
    filter?: {
      /** Only include operations matching one of these OpenAPI operation tags. */
      tags?: string[]
    }
  }

export type ClarifyPagesGroup = {
  group: ClarifyLocalizedText
  /** Icon name from lucide-react, e.g. "BookOpen". */
  icon?: string
  /** Pages or nested groups within this section. */
  pages: ClarifyPagesItem[]
}

/** Use the string "FileTree" to auto-generate pages from the file system. */
export type ClarifyPagesConfig = ClarifyPagesGroup[] | 'FileTree'

export type ClarifyPageRouteIntent = {
  kind: 'page'
  ref: string
  path?: string
  redirect?: string
  title?: ClarifyLocalizedText
  icon?: string
}

export type ClarifyOpenAPIRouteIntent = {
  kind: 'openapi'
  ref: string
  path?: string
  tagFilter?: string[]
  title?: ClarifyLocalizedText
  icon?: string
}

export type ClarifyRouteIntent = ClarifyPageRouteIntent | ClarifyOpenAPIRouteIntent

export type ClarifyTabItem = {
  tab: ClarifyLocalizedText
  /** Icon name from lucide-react, e.g. "BookOpen". */
  icon?: string
  /** Sidebar pages within this tab. Defaults to "FileTree". */
  pages?: ClarifyPagesConfig
}

export type ClarifyTabsConfig = ClarifyTabItem[]

export type ClarifyNavigationConfig = {
  /** Links displayed in the top navigation. */
  links?: ClarifyNavbarLink[]
  /** Top-level documentation tabs. Each tab owns its sidebar pages. */
  tabs?: ClarifyTabsConfig
}

export type ClarifyFeatureConfig<Options extends object = Record<never, never>> = boolean | ({ enabled?: boolean } & Options)

export type ClarifyFeaturesConfig = {
  search?: ClarifyFeatureConfig<{
    /** Whether to emit the MCP search index + descriptor for `clarify mcp`. Default: true. */
    mcp?: boolean
  }>
  repository?: ClarifyFeatureConfig<ClarifyRepositoryConfig>
  themeEditor?: ClarifyFeatureConfig
  openapi?: ClarifyFeatureConfig<{
    playground?: boolean
  }>
}

export type ResolvedClarifyFeaturesConfig = {
  search: { enabled: boolean; mcp: boolean }
  repository: { enabled: boolean; url?: string; branch?: string; directory?: string }
  themeEditor: { enabled: boolean }
  openapi: {
    enabled: boolean
    playground: boolean
  }
}

export type ClarifyProjectConfig = {
  /** Site title. Used in Header and SEO meta tags. */
  title?: string

  /** Site description. Used in SEO meta tags. */
  description?: string

  /** Canonical public site URL. Enables sitemap.xml and robots.txt generation. */
  siteUrl?: string

  /** Route prefix where the site is mounted. Default: '/'. */
  routePrefix?: string

  /** Path or URL prefix for emitted assets. Defaults to routePrefix. */
  assetPrefix?: string

  /** Path to site logo image (relative to rootDirectory or absolute). Supports light/dark mode. */
  logo?: ClarifyLogoConfig

  /** URL used when clicking the top navigation logo. Defaults to '/'. */
  homeUrl?: string

  /** Favicon path or light/dark variants. */
  favicon?: ClarifyFaviconConfig

  /** Theme preset, token overrides, and layout options. */
  theme?: ClarifyThemeConfig

  /** Placement of built-in documentation layout regions. */
  layout?: ClarifyLayoutConfig

  /** Top navigation links and documentation tabs. */
  navigation?: ClarifyNavigationConfig

  /** Announcement banner displayed at the top of the page. */
  banner?: ClarifyBannerConfig

  /** Footer configuration. */
  footer?: ClarifyFooterConfig

  /** Localized content configuration. */
  locales?: ClarifyLocalesConfig

  /** Reusable constants available in supported content via {{ variableName }} placeholders. */
  variables?: ClarifyVariablesConfig

  /** Optional product capabilities. All built-in features are enabled by default. */
  features?: ClarifyFeaturesConfig
}

// ────────────────────────────────────────────────────────────────────────────────
// Resolved Config (internal, with defaults applied)
// ────────────────────────────────────────────────────────────────────────────────

export type ResolvedProjectConfig = {
  title: string
  description: string
  siteUrl?: string
  routePrefix: string
  assetPrefix: string
  logo?: ClarifyLogoConfig
  homeUrl?: string
  favicon?: ClarifyFaviconConfig
  theme: ResolvedClarifyThemeConfig
  layout?: Required<ClarifyLayoutConfig>
  navigation?: ClarifyNavigationConfig
  banner?: ClarifyBannerConfig
  footer?: ClarifyFooterConfig
  locales?: ResolvedClarifyLocalesConfig
  variables: ClarifyVariablesConfig
  features: ResolvedClarifyFeaturesConfig
}

// ────────────────────────────────────────────────────────────────────────────────
// Route / Page
// ────────────────────────────────────────────────────────────────────────────────

export type ContentSection = {
  id: string
  title: string
  level: number
  badge?: string
  tags?: string[]
}

export type ContentRouteMeta = {
  title: string
  description?: string
  keywords?: string[]
  sections?: ContentSection[]
}

export type PageRouteModule = {
  pageVirtualModuleId: string
}

export type MarkdownRouteModule = PageRouteModule & {
  contentVirtualModuleId: string
}

export type OpenAPIRouteModule = PageRouteModule & {
  contentVirtualModuleId?: never
}

export type ContentRouteModule = MarkdownRouteModule | OpenAPIRouteModule

export type OpenAPIContentRouteState = {
  /** Operation tag filter applied to this route. Undefined means all operations. */
  tagFilter?: string[]
  /** Deduplicated id derived from the source OpenAPI spec file path. */
  sourceSpecId?: string
  /** Spec virtual module id fragment used by this route after route-level filtering. */
  routeSpecModuleId?: string
}

export type ContentRouteArtifacts = {
  /** Public URL for the machine-readable content artifact served or emitted for this route. */
  contentArtifactUrl?: string
}

export type ContentRouteSource = {
  filePath: string
  frontmatter?: Record<string, unknown>
  /** Normalized source content captured during route discovery. */
  content?: string
  /** Public edit URL for this route's source file. */
  sourceEditUrl?: string
}

type ContentRouteBase = {
  path: string
  basePath?: string
  locale?: string
  isFallback?: boolean
  /** Indicates this route is a bare alias for the default locale (e.g., /path instead of /locale/path). Should not be indexed. */
  isBareAlias?: boolean
  alternates?: Record<string, string>
  meta: ContentRouteMeta
  source: ContentRouteSource
  diagnostic?: ContentDiagnostic
  artifacts?: ContentRouteArtifacts
}

export type MarkdownContentRoute = ContentRouteBase & {
  kind: 'markdown' | 'markdown+jsx'
  module: MarkdownRouteModule
  openapi?: never
}

export type OpenAPIContentRoute = ContentRouteBase & {
  kind: 'openapi'
  module: OpenAPIRouteModule
  openapi?: OpenAPIContentRouteState
}

export type ContentRoute = MarkdownContentRoute | OpenAPIContentRoute

export type ClarifyNavigationTab = {
  type: 'tab'
  path: string
  title: string
  icon?: string
  children: ClarifyNavigationNode[]
}

export type FlatNavigationTree = {
  kind: 'flat'
  nodes: ClarifyNavigationNode[]
}

export type TabbedNavigation = {
  kind: 'tabbed'
  tabs: ClarifyNavigationTab[]
}

export type LocalizedNavigation = {
  kind: 'localized'
  locales: Record<string, ClarifyNavigationNode[]>
}

export type LocalizedTabbedNavigation = {
  kind: 'localized-tabbed'
  locales: Record<string, Omit<TabbedNavigation, 'kind'>>
}

export type NavigationTree = FlatNavigationTree | LocalizedNavigation | TabbedNavigation | LocalizedTabbedNavigation

export type ClarifyPage = {
  path: string
  filePath: string
  frontmatter: Record<string, unknown>
  content: string
}

export type NavigationSection = {
  id: string
  title: string
  level?: number
  badge?: string
  tags?: string[]
}

export type ClarifyNavigationNode = {
  path: string
  title: string
  icon?: string
  children?: ClarifyNavigationNode[]
  sections?: NavigationSection[]
}

// ────────────────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyProjectContext = {
  version: string
  projectRoot: string
  contentRoot: string
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
}

export type ClarifyRouteState = {
  routes: ContentRoute[]
  navigation: NavigationTree
}

export type ClarifyPluginState = {
  plugins: ClarifyPlugin[]
}

export type ClarifyPluginStore = {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  has(key: string): boolean
  delete(key: string): boolean
}

export type ClarifyHookContext = ClarifyProjectContext & ClarifyRouteState & ClarifyPluginState & ClarifyPluginStore

export type ClarifyRouteDiscoveryInput = {
  contentRoot: string
  locale?: string
  routes: ContentRoute[]
}

export type ClarifyContentKind = 'markdown' | 'markdown+jsx' | 'openapi'

export type ClarifyContentTransformInput = {
  kind: ClarifyContentKind
  source: string
  filePath?: string
  frontmatter: Record<string, unknown>
  content: string
}

export type ClarifyHtmlTransformInput = {
  html: string
  tags: HtmlTagDescriptor[]
  clientEntryId: string
  dev: boolean
}

export type ClarifyEmitAsset = {
  /** Output path relative to the build output directory, e.g. 'llms.txt' or 'guide/api.md'. */
  fileName: string
  /** Asset content as a UTF-8 string or raw bytes. */
  source: string | Uint8Array
}

export type MaybePromise<T> = T | Promise<T>

export type ClarifyTapHook = (ctx: ClarifyHookContext) => MaybePromise<void>

export type ClarifyInterceptHook = (ctx: ClarifyHookContext) => MaybePromise<boolean>

export type ClarifyPipelineHook<Input> = (input: Input, ctx: ClarifyHookContext) => MaybePromise<Input>

export type ClarifyCollectorHook<Result> = (ctx: ClarifyHookContext) => MaybePromise<Result[]>

export type ClarifyRoutesResolvedInput = {
  routes: ContentRoute[]
  navigation: NavigationTree
}

export type ClarifyLifecycleHooks = {
  'before:config:load'?: ClarifyTapHook
  'after:config:load'?: ClarifyTapHook
  'before:config:resolve'?: ClarifyTapHook
  'after:config:resolve'?: ClarifyTapHook
  'before:plugins:load'?: ClarifyTapHook
  'after:plugins:load'?: ClarifyTapHook
  'before:site:discover'?: ClarifyTapHook
  'after:site:discover'?: ClarifyTapHook
  'before:content:process'?: ClarifyTapHook
  'after:content:process'?: ClarifyTapHook
  'before:modules:build'?: ClarifyTapHook
  'after:modules:build'?: ClarifyTapHook
  'before:build'?: ClarifyTapHook
  'after:build'?: ClarifyTapHook
  'before:ssg'?: ClarifyTapHook
  'after:ssg'?: ClarifyTapHook
  'before:dev:server'?: ClarifyTapHook
  'after:dev:server'?: ClarifyTapHook
}

export type ClarifyPipelineHooks = {
  'content:transform'?: ClarifyPipelineHook<ClarifyContentTransformInput>
  'pages:resolved'?: ClarifyPipelineHook<ClarifyPage[]>
  'routes:discover'?: ClarifyPipelineHook<ClarifyRouteDiscoveryInput>
  'routes:discovered'?: ClarifyPipelineHook<ContentRoute[]>
  'routes:resolved'?: ClarifyPipelineHook<ClarifyRoutesResolvedInput>
  'modules:before'?: ClarifyPipelineHook<Map<string, string>>
  'html:transform'?: ClarifyPipelineHook<ClarifyHtmlTransformInput>
}

export type ClarifyBuildHooks = {
  'build:assets'?: ClarifyCollectorHook<ClarifyEmitAsset>
  'build:done'?: ClarifyTapHook
  'build:shouldRun'?: ClarifyInterceptHook
  'ssg:shouldRun'?: ClarifyInterceptHook
}

export type ClarifyDevServerPostHook = () => void

export type ClarifyDevHooks = {
  'dev:configureServer'?: (server: ViteDevServer, ctx: ClarifyHookContext) => MaybePromise<void | ClarifyDevServerPostHook>
}

export type ClarifyHooks = ClarifyLifecycleHooks & ClarifyPipelineHooks & ClarifyBuildHooks & ClarifyDevHooks

export type ClarifyPlugin = {
  name: string
  enforce?: 'pre' | 'post'
  priority?: number
  dependsOn?: string[]
  hooks?: Partial<ClarifyHooks>
  slots?: UISlotRegistration[]
}
