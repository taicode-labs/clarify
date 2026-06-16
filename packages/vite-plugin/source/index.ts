import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';

import type { Plugin, ResolvedConfig } from 'vite';
import mdxPlugin from '@mdx-js/rollup';
import type { FilterPattern } from 'vite';
import { compile } from '@mdx-js/mdx';

const _require = createRequire(import.meta.url);

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
  let viteConfig: ResolvedConfig;

  const clarifyPlugin: Plugin = {
    name: 'clarify:core',
    enforce: 'pre',
    config() {
      return {
        build: {
          outDir: resolved.outPath,
          manifest: true,
        },
        define: {
          __CLARIFY_DOCS_ROOT__: JSON.stringify(resolved.docRoot),
          __CLARIFY_TITLE__: JSON.stringify(resolved.title),
          __CLARIFY_BASE__: JSON.stringify(resolved.routeBase),
        },
      };
    },
    configResolved(config) {
      viteConfig = config;
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
    async closeBundle() {
      // ── Phase 1: Static HTML Generation ──
      if (process.env.SKIP_CLARIFY_SSG) {
        await runHooks(plugins, 'build:done', undefined as any, ctx);
        return;
      }

      const outDir = viteConfig.build.outDir;
      const manifestPath = join(outDir, '.vite', 'manifest.json');

      // 1. Load renderToHTML via plain Node ESM (no ssrLoadModule needed)
      // @ts-ignore resolved at runtime via Node ESM
      const { renderToHTML } = await import('@clarify/renderer/server');

      // 2. Compile MDX files to function-body and evaluate into React components
      // @ts-ignore resolved at runtime via Node ESM
      const jsxRuntime = await import('react/jsx-runtime');

      let routeComponents: Array<{ path: string; component: any }> = [];
      try {
        for (const route of routes) {
          const mdxSource = readFileSync(route.filePath, 'utf-8');
          const compiled = await compile(mdxSource, {
            jsxImportSource: 'react',
            outputFormat: 'function-body',
          });
          const code = String(compiled.value).replace(/arguments\[0\]/g, '__mdx_args');
          const script = new Script(`(function(__mdx_args) { "use strict"; ${code} })({ jsx: jsx, jsxs: jsxs, Fragment: Fragment })`);
          const mod = script.runInNewContext({
            jsx: jsxRuntime.jsx,
            jsxs: jsxRuntime.jsxs,
            Fragment: jsxRuntime.Fragment,
          });
          routeComponents.push({
            path: route.path,
            component: (mod as any)?.default ?? (mod as any),
          });
        }
      } catch (err) {
        console.error('[clarify] Failed to compile/evaluate MDX route modules:', err);
        await runHooks(plugins, 'build:done', undefined as any, ctx);
        return;
      }

      // 3. Read build manifest for client asset paths
      let clientJsPath = '/source/main.tsx';
      let clientCssPath: string | undefined;
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          const entry = manifest['index.html'];
          if (entry) {
            clientJsPath = '/' + entry.file;
            if (entry.css?.[0]) {
              clientCssPath = '/' + entry.css[0];
            }
          }
        } catch {
          // Fallback: keep default paths
        }
      }

      // 4. Render each route to static HTML
      for (const route of routeComponents) {
        try {
          const appHtml = renderToHTML({
            config: resolved,
            routes: routeComponents,
            url: route.path,
          });

          const cssLink = clientCssPath
            ? `<link rel="stylesheet" crossorigin href="${clientCssPath}">`
            : '';

          const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(resolved.title)}</title>
    ${resolved.description ? `<meta name="description" content="${escapeHtml(resolved.description)}" />` : ''}
    ${cssLink}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="${clientJsPath}"></script>
  </body>
</html>`;

          const outFile = join(outDir, route.path, 'index.html');
          mkdirSync(dirname(outFile), { recursive: true });
          writeFileSync(outFile, html, 'utf-8');
        } catch (err) {
          console.error(`[clarify] Failed to render route "${route.path}":`, err);
        }
      }

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type { Plugin } from 'vite';
