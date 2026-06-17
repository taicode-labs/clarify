import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import { AppShell } from '../app/AppShell'
import { ThemeProvider } from '../components/ThemeProvider'
import { ClarifyConfigContext, OpenApiSpecsContext } from '../context'
import type { ServerRenderOptions } from '../types'

/**
 * Clarify 服务端渲染入口。
 * 由 @clarify/vite-plugin 在构建时调用，为每条路由生成 React HTML 片段。
 * 返回 `div#root` 内部的 HTML，由 vite-plugin 组装为完整的 HTML 文档。
 */
export function renderToHTML(options: ServerRenderOptions): string {
  const { config, routes, navigation, openApiSpecs = {}, url } = options

  return renderToString(
    <StrictMode>
      <StaticRouter basename={config.routePrefix} location={url}>
        <ClarifyConfigContext.Provider value={config}>
          <OpenApiSpecsContext.Provider value={openApiSpecs}>
            <ThemeProvider>
              <AppShell config={config} routes={routes} navigation={navigation ?? []} />
            </ThemeProvider>
          </OpenApiSpecsContext.Provider>
        </ClarifyConfigContext.Provider>
      </StaticRouter>
    </StrictMode>
  )
}
