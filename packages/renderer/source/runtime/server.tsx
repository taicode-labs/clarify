import { StrictMode } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import type { ServerRenderOptions } from '../core/types'
import { prefixHref } from '../utils/href'

import { ClarifyShell } from './ClarifyShell'

/**
 * Clarify 服务端渲染入口。
 * 由 @clarify-labs/cli 在构建时调用，为每条路由生成 React HTML 片段。
 * 返回 `div#root` 内部的 HTML，由 Clarify CLI 组装为完整的 HTML 文档。
 *
 * 这里的 server render 是构建阶段能力，不代表 Clarify 默认要求
 * 请求期的 Node.js SSR 部署。默认部署模型仍然是 build-time SSR + static hosting。
 */
export async function renderToHTML(options: ServerRenderOptions): Promise<string> {
  const { config, routes, navigation, openApis = {}, runtimeSlots, url, themeEditor = false } = options
  const location = prefixHref(url, config.routePrefix)

  const stream = await renderToReadableStream(
    <StrictMode>
      <StaticRouter
        location={location}
        basename={config.routePrefix}
      >
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

  await stream.allReady

  return new Response(stream).text()
}
