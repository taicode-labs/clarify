import { StrictMode } from 'react'
import { hydrateRoot, createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import type { RenderOptions } from '../types'

import { ClarifyShell } from './ClarifyShell'

let root: Root | undefined

/**
 * Clarify 客户端 Hydration 入口。
 * 在文档项目的 main.tsx 中调用：
 * ```ts
 * import { render } from '@clarify-labs/renderer';
 * import { routes } from 'virtual:clarify/routes';
 * import { config } from 'virtual:clarify/config';
 * render({ config, routes });
 * ```
 */
function isHydrationDebugEnabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('clarifyHydrationDebug') === '1' || window.localStorage.getItem('clarify:hydration-debug') === '1'
  } catch {
    return false
  }
}

export function render(options: RenderOptions) {
  const { config, routes, navigation, openApiSpecs = {}, runtimeSlots, container, themeEditor = false } = options

  const target = container ?? document.getElementById('root')
  if (!target) {
    throw new Error('[clarify] 渲染失败：找不到挂载节点，请确保 HTML 中存在 id="root" 的元素')
  }

  const app = (
    <StrictMode>
      <BrowserRouter basename={config.routePrefix}>
        <ClarifyShell
          config={config}
          routes={routes}
          navigation={navigation}
          openApiSpecs={openApiSpecs}
          runtimeSlots={runtimeSlots}
          themeEditor={themeEditor}
        />
      </BrowserRouter>
    </StrictMode>
  )

  const hydrationDebug = isHydrationDebugEnabled()

  if (root) {
    root.render(app)
    return
  }

  try {
    root = hydrateRoot(target as Element, app, {
      onRecoverableError(error, errorInfo) {
        // Phase 1: suppress hydration mismatch noise by default. React 19
        // recovers automatically, but diagnostics can be enabled explicitly.
        if (hydrationDebug) {
          console.warn('[clarify] Recoverable hydration error:', error, errorInfo)
        }
      },
    })
  } catch (err) {
    console.warn('[clarify] Hydration failed, falling back to client render:', err)
    root = createRoot(target as Element)
    root.render(app)
  }
}
