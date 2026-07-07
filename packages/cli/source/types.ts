import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { HtmlTagDescriptor, ViteDevServer } from 'vite'

import type { UISlotRegistration, ContentDocument } from '@clarify-labs/renderer'

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

export type ContentRouteIdentity = {
  path: string
  kind?: string
  title?: string
  locale?: string
  filePath?: string
  basePath?: string
  isFallback?: boolean
  isBareAlias?: boolean
  alternates?: Record<string, string>
  virtualModuleId?: string
}

export type ContentRoute = {
  kind: string
  path: string
  title: string
  locale?: string
  filePath: string
  basePath?: string
  isFallback?: boolean
  /** Indicates this route is a bare alias for the default locale (e.g., /path instead of /locale/path). Should not be indexed. */
  isBareAlias?: boolean
  alternates?: Record<string, string>
  virtualModuleId: string

  /** Shared renderer document contract produced by the parser layer. */
  document?: ContentDocument

  /** Parsed source payload captured during route discovery. */
  source?: {
    content?: string
    frontmatter?: Record<string, unknown>
  }

  /** OpenAPI-specific data prepared for renderer-backed route modules. */
  openapi?: {
    /** OpenAPI operation tag filter applied to this route. Undefined means all operations. */
    tagFilter?: string[]
  }

  /** Output metadata emitted for downstream plugins. */
  artifact?: {
    contentArtifactUrl?: string
    sourceUrl?: string
  }
}

export type ClarifyNavigationTab = {
  type: 'tab'
  path: string
  title: string
  icon?: string
  children: ClarifyNavigationNode[]
}

export type TabbedNavigation = { tabs: ClarifyNavigationTab[] }

export type LocalizedNavigation = Record<string, ClarifyNavigationNode[]>

export type LocalizedTabbedNavigation = Record<string, TabbedNavigation>

export type NavigationTree = ClarifyNavigationNode[] | LocalizedNavigation | TabbedNavigation | LocalizedTabbedNavigation

export type ClarifyPage = {
  path: string
  filePath: string
  frontmatter: Record<string, unknown>
  content: string
}

export type ClarifyNavigationNode = {
  path: string
  title: string
  icon?: string
  children?: ClarifyNavigationNode[]
  sections?: Pick<ContentSection, 'id' | 'title' | 'badge' | 'tags'>[]
}

// ────────────────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyProjectContext = {
  projectRoot: string
  contentRoot: string
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  version: string
}

export type ClarifyHookContext = ClarifyProjectContext & {
  routes: ContentRoute[]
  navigation: NavigationTree
}

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

export type ClarifyHooks = {
  'content:transform'?: (
    input: ClarifyContentTransformInput,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyContentTransformInput> | ClarifyContentTransformInput
  'pages:resolved'?: (
    pages: ClarifyPage[],
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage[]> | ClarifyPage[]
  'page:transform'?: (
    page: ClarifyPage,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage> | ClarifyPage
  'routes:discover'?: (
    input: ClarifyRouteDiscoveryInput,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyRouteDiscoveryInput> | ClarifyRouteDiscoveryInput
  'routes:discovered'?: (
    routes: ContentRoute[],
    ctx: ClarifyHookContext
  ) => Promise<ContentRoute[]> | ContentRoute[]
  'routes:resolved'?: (
    input: { routes: ContentRoute[]; navigation: NavigationTree },
    ctx: ClarifyHookContext
  ) => Promise<{ routes: ContentRoute[]; navigation: NavigationTree }> | { routes: ContentRoute[]; navigation: NavigationTree }
  'modules:before'?: (
    modules: Map<string, string>,
    ctx: ClarifyHookContext
  ) => Promise<Map<string, string>> | Map<string, string>
  'html:transform'?: (
    input: ClarifyHtmlTransformInput,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyHtmlTransformInput> | ClarifyHtmlTransformInput
  'dev:configureServer'?: (
    server: ViteDevServer,
    ctx: ClarifyHookContext
  ) => Promise<void> | void
  'build:assets'?: (ctx: ClarifyHookContext) => Promise<ClarifyEmitAsset[]> | ClarifyEmitAsset[]
  'build:done'?: (ctx: ClarifyHookContext) => Promise<void> | void
}

export type ClarifyPlugin = {
  name: string
  hooks?: Partial<ClarifyHooks>
  slots?: UISlotRegistration[]
}
