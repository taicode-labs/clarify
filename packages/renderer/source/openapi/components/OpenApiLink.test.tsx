import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ConfigContext, OpenApiSpecsContext } from '../../core/context'
import type { Config } from '../../core/types'
import type { OpenAPISpec } from '../lib/utils'

import { OpenApiLink } from './OpenApiLink'

const config = { routePrefix: '/', assetPrefix: '/' } as Config
const spec: OpenAPISpec = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List pets',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/pets/{petId}': {
      get: {
        operationId: 'getPet',
        responses: { 200: { description: 'OK' } },
      },
    },
  },
}

function render(operationId: string, href?: string, inline = false) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/guide']}>
      <ConfigContext.Provider value={config}>
        <OpenApiSpecsContext.Provider value={{ 'virtual:clarify-page/api': spec }}>
          <OpenApiLink specPath="/api" operationId={operationId} href={href} inline={inline} />
        </OpenApiSpecsContext.Provider>
      </ConfigContext.Provider>
    </MemoryRouter>,
  )
}

describe('OpenApiLink', () => {
  it('links to the matching operation in the OpenAPI document', () => {
    const markup = render('listPets')

    expect(markup).toContain('href="/api#listPets"')
    expect(markup).toContain('>GET</span>')
    expect(markup).toContain('List pets')
    expect(markup).toContain('/pets')
  })

  it('falls back to the path when the operation has no summary', () => {
    const markup = render('getPet')

    expect(markup).toContain('>GET</span>')
    expect(markup).toContain('/pets/{petId}')
    expect(markup).not.toContain('mt-0.5 block truncate')
  })

  it('supports a different public OpenAPI document path', () => {
    expect(render('listPets', '/reference/api')).toContain('href="/reference/api#listPets"')
  })

  it('renders a compact inline link when requested', () => {
    const markup = render('listPets', undefined, true)

    expect(markup).toContain('clarify-openapi-link-inline')
    expect(markup).toContain('inline-flex')
    expect(markup).toContain('align-[0.125em]')
    expect(markup).toContain('List pets')
    expect(markup).not.toContain('/pets')
  })

  it('renders a diagnostic when the operation does not exist', () => {
    expect(render('missingOperation')).toContain('Operation not found or operationId is not unique: missingOperation')
  })
})
