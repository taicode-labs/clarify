import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppShell } from './App';
import type { ServerRenderOptions } from './types';

/**
 * Clarify 服务端渲染入口。
 * 由 @clarify/vite-plugin 在构建时调用，为每条路由生成静态 HTML。
 */
export function renderToHTML(options: ServerRenderOptions): string {
  const { config, routes, url } = options;

  const appHtml = renderToString(
    <StrictMode>
      <StaticRouter basename={config.routeBase} location={url}>
        <AppShell config={config} routes={routes} />
      </StaticRouter>
    </StrictMode>
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(config.title)}</title>
    ${config.description ? `<meta name="description" content="${escapeHtml(config.description)}" />` : ''}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/source/main.tsx"></script>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
