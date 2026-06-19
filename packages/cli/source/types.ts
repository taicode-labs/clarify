import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { HtmlTagDescriptor, ViteDevServer } from 'vite'

import type { ResolvedBuildOptions } from './core/options.js'

export type {
  ClarifyBuildOptions,
  ResolvedBuildOptions,
} from './core/options.js'

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
}

export type ClarifyFooterConfig = {
  links?: ClarifyNavbarLink[]
  socials?: Record<string, string>
  copyright?: ClarifyLocalizedText
}

export type ClarifyThemePreset = 'default' | 'mint' | 'violet'

export type ClarifyThemeColorTokensConfig = {
  /** Brand primary color for active states, links, and emphasis. */
  primary?: string
  /** Secondary accent color for subtle emphasis. */
  accent?: string
  /** Page background color. */
  background?: string
  /** Primary text color. */
  foreground?: string
  /** Card and elevated surface background color. */
  surface?: string
  /** Muted text and secondary UI color. */
  muted?: string
  /** Border and divider color. */
  border?: string
  /** Inline code and code block background color. */
  codeBackground?: string
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
  | {
    page: string
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
    /** Icon name from lucide-react, e.g. "Webhook". */
    icon?: string
    /** Override the page title. Defaults to spec.info.title. */
    title?: ClarifyLocalizedText
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

  /** Path to site logo image (relative to rootDirectory or absolute). Supports light/dark mode. */
  logo?: ClarifyLogoConfig

  /** Favicon path or light/dark variants. */
  favicon?: ClarifyFaviconConfig

  /** Theme preset and token overrides. */
  theme?: ClarifyThemeConfig

  /** Base path for the docs site. Default: '/' */
  routePrefix?: string

  /** Top navigation links. */
  navbar?: {
    links?: ClarifyNavbarLink[]
  }

  /** Announcement banner displayed at the top of the page. */
  banner?: ClarifyBannerConfig

  /** Footer configuration. */
  footer?: ClarifyFooterConfig

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
  description: string
  routePrefix: string
  favicon?: ClarifyFaviconConfig
  theme: ResolvedClarifyThemeConfig
  navbar?: { links?: ClarifyNavbarLink[] }
  banner?: ClarifyBannerConfig
  footer?: ClarifyFooterConfig
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
  title: string
  message: string
  filePath?: string
  cause?: string
}

export type ContentRoute = {
  path: string
  basePath?: string
  locale?: string
  isFallback?: boolean
  alternates?: Record<string, string>
  title: string
  filePath: string
  virtualModuleId: string
  kind: 'mdx' | 'openapi'
  frontmatter?: Record<string, unknown>
  /** Normalized source content captured during route discovery. */
  content?: string
  diagnostic?: ContentDiagnostic
  sections?: ContentSection[]
  contentArtifactUrl?: string
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

export type ClarifyHookContext = {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  routes: ContentRoute[]
  navigation: NavigationTree
}

export type ClarifyRouteDiscoveryInput = {
  contentRoot: string
  locale?: string
  routes: ContentRoute[]
}

export type ClarifyHtmlTransformInput = {
  html: string
  tags: HtmlTagDescriptor[]
  clientEntryId: string
  dev: boolean
}

export type ClarifyHooks = {
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
  'build:done'?: (ctx: ClarifyHookContext) => Promise<void> | void
}

export type ClarifyPlugin = {
  name: string
  hooks: Partial<ClarifyHooks>
}
