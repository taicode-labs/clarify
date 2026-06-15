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
    load(id) {
      if (id === VIRTUAL_CONFIG) {
        return generateConfigModule(resolved);
      }
      if (id === VIRTUAL_ROUTES) {
        return generateRoutesModule(routes);
      }
      const filePath = pageMap.get(id);
      if (filePath) {
        // Re-export the actual MDX file
        return `export { default } from '${filePath}';`;
      }
      return null;
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
