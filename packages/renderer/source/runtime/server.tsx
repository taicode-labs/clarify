import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import type { ServerRenderOptions } from '../types'
import { prefixHref } from '../utils/href'

import { ClarifyShell } from './ClarifyShell'

/**
 * Clarify 服务端渲染入口。
 * 由 @clarify-labs/cli 在构建时调用，为每条路由生成 React HTML 片段。
 * 返回 `div#root` 内部的 HTML，由 Clarify CLI 组装为完整的 HTML 文档。
 */
export function renderToHTML(options: ServerRenderOptions): string {
  const { config, routes, navigation, openApis = {}, runtimeSlots, url, themeEditor = false } = options
  const location = prefixHref(url, config.routePrefix)

  return renderToString(
    <StrictMode>
      <StaticRouter basename={config.routePrefix} location={location}>
        <ClarifyShell
          config={config}
          routes={routes}
          navigation={navigation}
          openApis={openApis}
          runtimeSlots={runtimeSlots}
          themeEditor={themeEditor}
        />
      </StaticRouter>
    </StrictMode>
  )
}
