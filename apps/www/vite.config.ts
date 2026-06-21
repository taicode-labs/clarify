import { build, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { routes } from './source/ssg-routes';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = dirname(fileURLToPath(new URL(import.meta.url)));
const outputDir = join(root, 'output');

function clarifySsgPlugin() {
  return {
    name: 'clarify:ssg',
    async closeBundle() {
      const ssrOutDir = join(outputDir, '.ssr');

      await build({
        root,
        configFile: false,
        plugins: [react(), tailwindcss()],
        build: {
          ssr: 'source/entry-server.tsx',
          outDir: ssrOutDir,
          emptyOutDir: true,
          rollupOptions: {
            input: 'source/entry-server.tsx',
          },
        },
      });

      const template = await readFile(join(outputDir, 'index.html'), 'utf8');
      const ssrBundlePath = join(ssrOutDir, 'entry-server.js');
      const { render } = await import(pathToFileURL(ssrBundlePath).href);

      for (const route of routes) {
        const appHtml = render(route);
        const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
        const filePath = route === '/' ? join(outputDir, 'index.html') : join(outputDir, route, 'index.html');

        if (route === '/404.html') {
          await writeFile(join(outputDir, '404.html'), html);
          continue;
        }

        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, html);
      }

      await rm(ssrOutDir, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clarifySsgPlugin()],
  build: {
    outDir: 'output',
  },
});
