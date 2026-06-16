import type { FilterPattern } from 'vite'

// ────────────────────────────────────────────────────────────────────────────────
// Author Config (clarify.json)
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyLogoConfig = string | { light?: string; dark?: string };

export type ClarifyFaviconConfig = string | { light?: string; dark?: string };

export type ClarifyNavbarLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type ClarifyBannerConfig = {
  content: string;
  dismissible?: boolean;
};

export type ClarifyFooterConfig = {
  socials?: Record<string, string>;
  copyright?: string;
};

export type ClarifyPagesItem =
  | string
  | {
      page: string;
      /** If set, this navigation item is a redirect entry.
       *  The value is the destination path. */
      redirect?: string;
    };

export type ClarifyPagesGroup = {
  group: string;
  pages: ClarifyPagesItem[];
};

export type ClarifyPagesConfig = ClarifyPagesGroup[];

export type ClarifyProjectConfig = {
  /** Site title. Used in Header and SEO meta tags. */
  title?: string;

  /** Site description. Used in SEO meta tags. */
  description?: string;

  /** Path to site logo image (relative to documentationRoot or absolute). Supports light/dark mode. */
  logo?: ClarifyLogoConfig;

  /** Favicon path or light/dark variants. */
  favicon?: ClarifyFaviconConfig;

  /** Base path for the docs site. Can be overridden by plugin options. Default: '/' */
  routeBase?: string;

  /** Theme token overrides. */
  theme?: {
    primary?: string;
  };

  /** Top navigation links. */
  navbar?: {
    links?: ClarifyNavbarLink[];
  };

  /** Announcement banner displayed at the top of the page. */
  banner?: ClarifyBannerConfig;

  /** Footer configuration. */
  footer?: ClarifyFooterConfig;

  /** Sidebar pages. Array of groups with ordered page references.
   *  If omitted, pages are auto-generated from the file system.
   *  Page references are relative paths without .mdx extension, e.g. "index", "advanced/ssg".
   */
  pages?: ClarifyPagesConfig;
};

// ────────────────────────────────────────────────────────────────────────────────
// Plugin Options
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyPluginOptions = {
  /** Root directory for MDX content. Default: 'source/content' */
  docsRoot?: string;

  /** Base path for the docs site. Overrides clarify.json if set. Default: '/' */
  routeBase?: string;

  /** Output directory for the built docs site. Overrides Vite's build.outDir. Default: 'output' */
  outPath?: string;

  /** Custom include/exclude filters for MDX processing. */
  include?: FilterPattern;
  exclude?: FilterPattern;

  /** Clarify 插件扩展。用于注册翻译、搜索等扩展插件。 */
  plugins?: ClarifyPlugin[];
};

// ────────────────────────────────────────────────────────────────────────────────
// Resolved Options
// ────────────────────────────────────────────────────────────────────────────────

export type ResolvedClarifyOptions = {
  title: string;
  logo?: ClarifyLogoConfig;
  favicon?: ClarifyFaviconConfig;
  theme: { primary?: string };
  description: string;
  routeBase: string;
  documentationRoot: string;
  outputDirectory: string;
  navbar?: { links?: ClarifyNavbarLink[] };
  banner?: ClarifyBannerConfig;
  footer?: ClarifyFooterConfig;
  pages?: ClarifyPagesConfig;
};

// ────────────────────────────────────────────────────────────────────────────────
// Route / Page
// ────────────────────────────────────────────────────────────────────────────────

export type MdxRoute = {
  path: string;
  filePath: string;
  virtualModuleId: string;
  title: string;
};

export type ClarifyPage = {
  path: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  content: string;
};

export type ClarifyNavigationNode = {
  path: string;
  title: string;
  children?: ClarifyNavigationNode[];
};

// ────────────────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyHookContext = {
  config: ResolvedClarifyOptions;
};

export type ClarifyHooks = {
  'pages:resolved'?: (
    pages: ClarifyPage[],
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage[]> | ClarifyPage[];
  'page:transform'?: (
    page: ClarifyPage,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage> | ClarifyPage;
  'routes:resolved'?: (
    routes: MdxRoute[],
    navigation: ClarifyNavigationNode[],
    ctx: ClarifyHookContext
  ) => Promise<{ routes: MdxRoute[]; navigation: ClarifyNavigationNode[] }> | { routes: MdxRoute[]; navigation: ClarifyNavigationNode[] };
  'modules:before'?: (
    modules: Map<string, string>,
    ctx: ClarifyHookContext
  ) => Promise<Map<string, string>> | Map<string, string>;
  'build:done'?: (ctx: ClarifyHookContext) => Promise<void> | void;
};

export type ClarifyPlugin = {
  name: string;
  hooks: Partial<ClarifyHooks>;
};
