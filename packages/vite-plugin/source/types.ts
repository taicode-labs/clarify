import type { FilterPattern } from 'vite'

// ────────────────────────────────────────────────────────────────────────────────
// Author Config (clarify.json)
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyLogoConfig = string | { light?: string; dark?: string }

export type ClarifyFaviconConfig = string | { light?: string; dark?: string }

export type ClarifyNavbarLink = {
  label: string
  href: string
  external?: boolean
}

export type ClarifyBannerConfig = {
  content: string
  dismissible?: boolean
}

export type ClarifyFooterConfig = {
  socials?: Record<string, string>
  copyright?: string
}

export type ClarifyPagesItem =
  | string
  | {
    page: string
    /** If set, this navigation item is a redirect entry.
     *  The value is the destination path. */
    redirect?: string
  }

export type ClarifyPagesGroup = {
  group: string
  pages: ClarifyPagesItem[]
}

/** Use the string "FileTree" to auto-generate pages from the file system. */
export type ClarifyPagesConfig = ClarifyPagesGroup[] | 'FileTree'

export type ClarifyProjectConfig = {
  /** Site title. Used in Header and SEO meta tags. */
  title?: string

  /** Site description. Used in SEO meta tags. */
  description?: string

  /** Path to site logo image (relative to documentationRoot or absolute). Supports light/dark mode. */
  logo?: ClarifyLogoConfig

  /** Favicon path or light/dark variants. */
  favicon?: ClarifyFaviconConfig

  /** Theme token overrides. */
  theme?: {
    primary?: string
  }

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

  /** Sidebar pages. Array of groups with ordered page references, or "FileTree" for auto-generation.
   *  If omitted, pages are auto-generated from the file system (same as "FileTree").
   *  Page references are relative paths without .mdx extension, e.g. "index", "advanced/ssg".
   */
  pages?: ClarifyPagesConfig
}

// ────────────────────────────────────────────────────────────────────────────────
// Generate Options (engineering / build config)
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyGenerateOptions = {
  /** Root directory for MDX content. Default: 'source/content' */
  rootDirectory?: string
  /** Output directory for the built docs site. Overrides Vite's build.outDir. Default: 'output' */
  outputDirectory?: string

  /** Custom include/exclude filters for MDX processing. */
  include?: FilterPattern
  exclude?: FilterPattern

  /** Clarify 插件扩展。用于注册翻译、搜索等扩展插件。 */
  plugins?: ClarifyPlugin[]
}

// ────────────────────────────────────────────────────────────────────────────────
// Resolved Config (internal, with defaults applied)
// ────────────────────────────────────────────────────────────────────────────────

export type ResolvedProjectConfig = {
  title: string
  logo?: ClarifyLogoConfig
  favicon?: ClarifyFaviconConfig
  theme: { primary?: string }
  description: string
  routePrefix: string
  navbar?: { links?: ClarifyNavbarLink[] }
  banner?: ClarifyBannerConfig
  footer?: ClarifyFooterConfig
  pages?: ClarifyPagesConfig
}

export type ResolvedGenerateOptions = {
  rootDirectory: string
  outputDirectory: string
}

// ────────────────────────────────────────────────────────────────────────────────
// Route / Page
// ────────────────────────────────────────────────────────────────────────────────

export type MdxRoute = {
  path: string
  filePath: string
  virtualModuleId: string
  title: string
}

export type ClarifyPage = {
  path: string
  filePath: string
  frontmatter: Record<string, unknown>
  content: string
}

export type ClarifyNavigationNode = {
  path: string
  title: string
  children?: ClarifyNavigationNode[]
}

// ────────────────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyHookContext = {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedGenerateOptions
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
  'routes:resolved'?: (
    routes: MdxRoute[],
    navigation: ClarifyNavigationNode[],
    ctx: ClarifyHookContext
  ) => Promise<{ routes: MdxRoute[]; navigation: ClarifyNavigationNode[] }> | { routes: MdxRoute[]; navigation: ClarifyNavigationNode[] }
  'modules:before'?: (
    modules: Map<string, string>,
    ctx: ClarifyHookContext
  ) => Promise<Map<string, string>> | Map<string, string>
  'build:done'?: (ctx: ClarifyHookContext) => Promise<void> | void
}

export type ClarifyPlugin = {
  name: string
  hooks: Partial<ClarifyHooks>
}
