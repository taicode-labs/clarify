import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SectionProvider } from '../../app/SectionProvider'
import { ConfigContext, LocaleContext } from '../../core/context'
import type { Config } from '../../core/types'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'

import { OpenApiOperation } from './OpenApiOperation'

const spec: OpenAPISpec = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
}

const operation: OpenAPIOperation = {
  operationId: 'listPets',
  'x-clarify-section-id': 'listPets',
  summary: 'List pets',
  responses: { 200: { description: 'OK' } },
}

describe('OpenApiOperation', () => {
  it('renders documentation without the request control when the playground is disabled', () => {
    const config = {
      routePrefix: '/',
      assetPrefix: '/',
      features: {
        search: { enabled: true, mcp: true },
        repository: { enabled: true },
        themeEditor: { enabled: false },
        openapi: { enabled: true, playground: false },
      },
    } as Config

    const markup = renderToStaticMarkup(
      <ConfigContext.Provider value={config}>
        <SectionProvider sections={[]}>
          <OpenApiOperation spec={spec} path="/pets" method="GET" operation={operation} />
        </SectionProvider>
      </ConfigContext.Provider>,
    )

    expect(markup).toContain('List pets')
    expect(markup).toContain('GET')
    expect(markup).toContain('/pets')
    expect(markup).not.toContain('Try request')
  })
})

describe('operation deprecation', () => {
  it.each([
    ['en-US', 'Deprecated'],
    ['zh-CN', '已弃用'],
  ])('renders a localized badge in %s without disabling the operation', (locale, label) => {
    const markup = renderToStaticMarkup(
      <LocaleContext.Provider value={locale}>
        <SectionProvider sections={[]}>
          <OpenApiOperation spec={spec} path="/pets" method="GET" operation={{ ...operation, deprecated: true }} />
        </SectionProvider>
      </LocaleContext.Provider>,
    )

    expect(markup).toMatch(new RegExp(`<h2[^>]*id="listPets"[\\s\\S]*?${label}[\\s\\S]*?</h2>`))
    expect(markup).toContain('href="#listPets"')
    expect(markup).toContain('/pets')
    expect(markup).toContain(locale === 'zh-CN' ? '发起测试请求' : 'Try request')
  })

  it.each([false, undefined])('does not mark operations with deprecated=%s', (deprecated) => {
    const markup = renderToStaticMarkup(
      <SectionProvider sections={[]}>
        <OpenApiOperation spec={spec} path="/pets" method="GET" operation={{ ...operation, deprecated }} />
      </SectionProvider>,
    )

    expect(markup).not.toContain('Deprecated')
    expect(markup).toContain('List pets')
  })
})
