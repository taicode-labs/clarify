import type { FilterPattern } from 'vite';

// ────────────────────────────────────────────────────────────────────────────────
// Author Config (clarify.json)
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyProjectConfig = {
  /** Site title. Used in Header and SEO meta tags. */
  title?: string;

  /** Site description. Used in SEO meta tags. */
  description?: string;

  /** Path to site logo image (relative to docsRoot or absolute). */
  logo?: string;

  /** Base path for the docs site. Can be overridden by plugin options. Default: '/' */
  routeBase?: string;

  /** Theme token overrides. Phase 1 supports primary color only. */
  theme?: {
    primary?: string;
  };
};

// ────────────────────────────────────────────────────────────────────────────────
// Plugin Options
// ────────────────────────────────────────────────────────────────────────────────

export type ClarifyPluginOptions = {
  /** Root directory for MDX content. Default: 'source/content' */
  docsRoot?: string;

  /** Base path for the docs site. Overrides clarify.json if set. Default: '/' */
  routeBase?: string;

  /** Output directory for the built docs site. Overrides Vite's build.outDir. Default: 'dist' */
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
  logo?: string;
  theme: { primary?: string };
  description: string;
  routeBase: string;
  docRoot: string;
  outPath: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Route / Page
// ────────────────────────────────────────────────────────────────────────────────

export type MdxRoute = {
  path: string;
  filePath: string;
  virtualModuleId: string;
};

export type ClarifyPage = {
  path: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  content: string;
};

export type ClarifyNavNode = {
  path: string;
  title: string;
  children?: ClarifyNavNode[];
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
    navTree: ClarifyNavNode[],
    ctx: ClarifyHookContext
  ) => Promise<{ routes: MdxRoute[]; navTree: ClarifyNavNode[] }> | { routes: MdxRoute[]; navTree: ClarifyNavNode[] };
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
