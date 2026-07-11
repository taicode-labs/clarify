import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { HtmlTagDescriptor, ViteDevServer } from 'vite'

import type { UISlotRegistration } from '@clarify-labs/renderer'

import type { ResolvedBuildOptions } from './core/config/options.js'

export type {
  ClarifyBuildOptions,
  ResolvedBuildOptions,
} from './core/config/options.js'

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

export type ClarifyI18nConfig = {
  /** Default visible locale. Content is read from rootDirectory/defaultLocale. */
  defaultLocale?: string
  /** Missing translation behavior. Fallback uses default locale content. */
  missing?: 'fallback' | '404' | 'hide'
  locales: ClarifyLocaleConfig[]
}

export type ResolvedClarifyI18nConfig = Required<Pick<ClarifyI18nConfig, 'defaultLocale' | 'missing'>> & {
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

export type ClarifySourceConfig = {
  /** Repository web URL, for example https://github.com/owner/repo. */
  repository: string
  /** Source branch used for edit links. Default: main. */
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
  /** Expose the live theme editor in the built site. Dev mode enables it automatically. */
  editor?: boolean
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
  editor: boolean
}

export type ClarifyPagesItem =
  | string
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

export type ClarifyProjectConfig = {
  /** Site title. Used in Header and SEO meta tags. */
  title?: string

  /** Site description. Used in SEO meta tags. */
  description?: string

  /** Canonical public site URL. Enables sitemap.xml and robots.txt generation. */
  siteUrl?: string

  /** Source repository configuration for Edit this page links. */
  source?: ClarifySourceConfig

  /** Path to site logo image (relative to rootDirectory or absolute). Supports light/dark mode. */
  logo?: ClarifyLogoConfig

  /** URL used when clicking the top navigation logo. Defaults to '/'. */
  homeUrl?: string

  /** Favicon path or light/dark variants. */
  favicon?: ClarifyFaviconConfig

  /** Theme preset, token overrides, and editor options. */
  theme?: ClarifyThemeConfig

  /** Base path for the docs site. Default: '/' */
  routePrefix?: string

  /** Base path or URL for emitted static assets. Defaults to routePrefix. */
  assetPrefix?: string

  /** Top navigation links. */
  navbar?: {
    links?: ClarifyNavbarLink[]
  }

  /** Announcement banner displayed at the top of the page. */
  banner?: ClarifyBannerConfig

  /** Footer configuration. */
  footer?: ClarifyFooterConfig

  /** Reusable constants available in supported content via {{ variableName }} placeholders. */
  variables?: ClarifyVariablesConfig

  /** Native multi-language support. Locale content lives under rootDirectory/{locale}. */
  i18n?: ClarifyI18nConfig

  /** Top-level documentation tabs. Each tab owns its own sidebar pages. */
  tabs?: ClarifyTabsConfig
}

// ────────────────────────────────────────────────────────────────────────────────
// Resolved Config (internal, with defaults applied)
// ────────────────────────────────────────────────────────────────────────────────

export type ResolvedProjectConfig = {
  title: string
  logo?: ClarifyLogoConfig
  homeUrl?: string
  description: string
  siteUrl?: string
  source?: ClarifySourceConfig
  routePrefix: string
  assetPrefix: string
  favicon?: ClarifyFaviconConfig
  theme: ResolvedClarifyThemeConfig
  navbar?: { links?: ClarifyNavbarLink[] }
  banner?: ClarifyBannerConfig
  footer?: ClarifyFooterConfig
  variables: ClarifyVariablesConfig
  i18n?: ResolvedClarifyI18nConfig
  tabs?: ClarifyTabsConfig
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

export type ContentDiagnostic = {
  kind: string
  title: string
  message: string
  details?: string
  filePath?: string
}

export type ContentRouteMeta = {
  title: string
  description?: string
  keywords?: string[]
  sections?: ContentSection[]
}

export type ContentRouteModule = {
  virtualModuleId: string
}

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

export type ContentRoute = {
  path: string
  basePath?: string
  locale?: string
  isFallback?: boolean
  /** Indicates this route is a bare alias for the default locale (e.g., /path instead of /locale/path). Should not be indexed. */
  isBareAlias?: boolean
  alternates?: Record<string, string>
  kind: string
  meta: ContentRouteMeta
  module: ContentRouteModule
  source: ContentRouteSource
  /** OpenAPI-specific route state. Present only for OpenAPI routes. */
  openapi?: OpenAPIContentRouteState
  diagnostic?: ContentDiagnostic
  artifacts?: ContentRouteArtifacts
}

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

export type ClarifyContentKind = 'mdx' | 'openapi'

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

export type ClarifyDevHooks = {
  'dev:configureServer'?: (server: ViteDevServer, ctx: ClarifyHookContext) => MaybePromise<void>
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
