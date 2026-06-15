import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { RenderOptions } from './types';

/**
 * Clarify 渲染入口。
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

  createRoot(target).render(
    <StrictMode>
      <App config={config} routes={routes} />
    </StrictMode>
  );
}
