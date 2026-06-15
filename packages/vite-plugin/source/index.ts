import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import mdxPlugin from '@mdx-js/rollup';
import type { FilterPattern } from 'vite';

// ────────────────────────────────────────────────────────────────────────────────
// Types
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

export type ResolvedClarifyOptions = {
  title: string;
  logo?: string;
  theme: { primary?: string };
  description: string;
  routeBase: string;
  docRoot: string;
  outPath: string;
};

export type MdxRoute = {
  path: string;
  filePath: string;
  virtualModuleId: string;
};

// ── Plugin Hooks ───────────────────────────────────────────────────────────────

export type ClarifyHookContext = {
  config: ResolvedClarifyOptions;
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

// ────────────────────────────────────────────────────────────────────────────────
// Config Resolution
// ────────────────────────────────────────────────────────────────────────────────

function loadProjectConfig(root: string): ClarifyProjectConfig {
  const configPath = join(root, 'clarify.json');
  if (!existsSync(configPath)) return {};
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ClarifyProjectConfig;
  } catch {
    return {};
  }
}

function resolveOptions(
  root: string,
  pluginOptions: ClarifyPluginOptions = {}
): ResolvedClarifyOptions {
  const projectConfig = loadProjectConfig(root);
  return {
    title: projectConfig.title ?? 'Clarify Docs',
    description: projectConfig.description ?? '',
    logo: projectConfig.logo,
    routeBase: pluginOptions.routeBase ?? projectConfig.routeBase ?? '/',
    theme: projectConfig.theme ?? {},
    docRoot: pluginOptions.docsRoot ?? 'source/content',
    outPath: pluginOptions.outPath ?? 'dist',
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// File Discovery
// ────────────────────────────────────────────────────────────────────────────────

function findMdxFiles(dir: string, base: string = dir): MdxRoute[] {
  const routes: MdxRoute[] = [];
  if (!existsSync(dir)) return routes;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...findMdxFiles(fullPath, base));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const relativePath = relative(base, fullPath);
      const pathParts = relativePath.replace(/\.mdx$/, '').split('/');
      // index.mdx → /, getting-started.mdx → /getting-started
      const path = '/' + pathParts.map(p => p === 'index' ? '' : p).filter(Boolean).join('/');
      const cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      routes.push({
        path: cleanPath,
        filePath: fullPath,
        virtualModuleId: 'virtual:clarify-page/' + relativePath.replace(/\.mdx$/, '').replace(/\/+/g, '/'),
      });
    }
  }
  return routes;
}

// ────────────────────────────────────────────────────────────────────────────────
// Virtual Module Generators
// ────────────────────────────────────────────────────────────────────────────────

function generateConfigModule(config: ResolvedClarifyOptions): string {
  return `export const config = ${JSON.stringify(config)};`;
}

function generateRoutesModule(routes: MdxRoute[]): string {
  const imports = routes.map((r, i) => `import Page${i} from '${r.virtualModuleId}';`).join('\n');
  const routesArray = routes.map((r, i) => `  { path: ${JSON.stringify(r.path)}, component: Page${i} }`).join(',\n');

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navTree = []; // Phase 2\n`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Plugin
// ────────────────────────────────────────────────────────────────────────────────

const VIRTUAL_CONFIG = 'virtual:clarify-config';
const VIRTUAL_ROUTES = 'virtual:clarify-routes';

async function runHooks<K extends keyof ClarifyHooks>(
  plugins: ClarifyPlugin[],
  hookName: K,
  input: Parameters<NonNullable<ClarifyHooks[K]>>[0],
  ctx: ClarifyHookContext
): Promise<Parameters<NonNullable<ClarifyHooks[K]>>[0]> {
  let result = input;
  for (const plugin of plugins) {
    const hook = plugin.hooks[hookName] as any;
    if (!hook) continue;
    try {
      result = await hook(result, ctx);
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`);
    }
  }
  return result;
}

export function clarifyPlugin(options: ClarifyPluginOptions = {}): Plugin[] {
  const root = process.cwd();
  const resolved = resolveOptions(root, options);
  const docRoot = join(root, resolved.docRoot);
  const routes = findMdxFiles(docRoot);

  // Track which virtual page modules exist
  const pageMap = new Map<string, string>();
  for (const route of routes) {
    pageMap.set(route.virtualModuleId, route.filePath);
  }

  const plugins = options.plugins ?? [];
  const ctx: ClarifyHookContext = { config: resolved };

  const clarifyPlugin: Plugin = {
    name: 'clarify:core',
    enforce: 'pre',
    config() {
      return {
        build: {
          outDir: resolved.outPath,
        },
        define: {
          __CLARIFY_DOCS_ROOT__: JSON.stringify(resolved.docRoot),
          __CLARIFY_TITLE__: JSON.stringify(resolved.title),
          __CLARIFY_BASE__: JSON.stringify(resolved.routeBase),
        },
      };
    },
    resolveId(id) {
      if (id === VIRTUAL_CONFIG || id === VIRTUAL_ROUTES) {
        return id;
      }
      if (pageMap.has(id)) {
        return id;
      }
      return null;
    },
    async load(id) {
      if (id === VIRTUAL_CONFIG) {
        return generateConfigModule(resolved);
      }
      if (id === VIRTUAL_ROUTES) {
        // TODO: invoke hooks 'routes:resolved' here in future
        return generateRoutesModule(routes);
      }
      const filePath = pageMap.get(id);
      if (filePath) {
        // TODO: invoke hooks 'page:transform' here in future
        return `export { default } from '${filePath}';`;
      }
      return null;
    },
    async buildEnd() {
      await runHooks(plugins, 'build:done', undefined as any, ctx);
    },
  };

  // MDX processing via @mdx-js/rollup
  const mdx = mdxPlugin({
    include: options.include ?? ['**/*.mdx'],
    exclude: options.exclude,
  });

  return [clarifyPlugin, mdx];
}

export type { Plugin } from 'vite';
