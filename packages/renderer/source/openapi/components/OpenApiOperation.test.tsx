import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SectionProvider } from '../../app/SectionProvider'
import { ConfigContext } from '../../core/context'
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
