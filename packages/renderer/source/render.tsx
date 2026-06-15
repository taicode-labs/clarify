import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
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

  hydrateRoot(
    target,
    <StrictMode>
      <BrowserRouter basename={config.routeBase}>
        <AppShell config={config} routes={routes} />
      </BrowserRouter>
    </StrictMode>
  );
}
