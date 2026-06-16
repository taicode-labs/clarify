import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { MdxRoute, ResolvedClarifyOptions } from './types.js';

export function findMdxFiles(dir: string, base: string = dir): MdxRoute[] {
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

export function generateConfigModule(config: ResolvedClarifyOptions): string {
  return `export const config = ${JSON.stringify(config)};`;
}

export function generateRoutesModule(routes: MdxRoute[]): string {
  const imports = routes.map((r, i) => `import Page${i} from '${r.virtualModuleId}';`).join('\n');
  const routesArray = routes.map((r, i) => `  { path: ${JSON.stringify(r.path)}, component: Page${i} }`).join(',\n');

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navTree = []; // Phase 2\n`;
}
