import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './App';
import type { RenderOptions } from './types';

/**
 * Clarify 客户端 Hydration 入口。
 * 在文档项目的 main.tsx 中调用：
 * ```ts
 * import { render } from '@clarify/renderer';
 * import { routes } from 'virtual:clarify-routes';
 * import { config } from 'virtual:clarify-config';
 * render({ config, routes });
 * ```
 */
export function render(options: RenderOptions) {
  const { config, routes, container } = options;

  const target = container ?? document.getElementById('root');
  if (!target) {
    throw new Error('[clarify] 渲染失败：找不到挂载节点，请确保 HTML 中存在 id="root" 的元素');
  }

  const app = (
    <StrictMode>
      <BrowserRouter basename={config.routeBase}>
        <AppShell config={config} routes={routes} />
      </BrowserRouter>
    </StrictMode>
  );

  try {
    hydrateRoot(target as Element, app, {
      onRecoverableError() {
        // Phase 1: suppress all hydration mismatch noise caused by different MDX
        // compilation paths on server (@mdx-js/mdx function-body) vs client
        // (@mdx-js/rollup program). React 19 auto-recovers cleanly.
      },
    });
  } catch (err) {
    console.warn('[clarify] Hydration failed, falling back to client render:', err);
    createRoot(target as Element).render(app);
  }
}
