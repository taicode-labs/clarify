import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RequestField } from './OpenApiRequestFields'
import { OpenApiResponseViewer } from './OpenApiResponseViewer'

describe('OpenApiResponseViewer', () => {
  it('renders a designed empty state on the theme-scoped response surface', () => {
    const markup = renderToStaticMarkup(<OpenApiResponseViewer />)

    expect(markup).toContain('clarify-api-response')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('Ready for a request')
  })

  it('renders request failures as an alert', () => {
    const markup = renderToStaticMarkup(<OpenApiResponseViewer error="Network unavailable" />)

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Request failed')
    expect(markup).toContain('Network unavailable')
  })
})

describe('RequestField', () => {
  it('renders a Markdown field description in an accessible tip', () => {
    const markup = renderToStaticMarkup(
      <RequestField
        spec={{ openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }}
        parameter={{ name: 'limit', in: 'query', description: 'Maximum **number** of results.', schema: { type: 'integer' } }}
        value=""
        enabled
        onChange={() => {}}
        onEnabledChange={() => {}}
      />,
    )

    expect(markup).toContain('aria-describedby=')
    expect(markup).toContain('role="tooltip"')
    expect(markup).toContain('size-7')
    expect(markup).toContain('!border-b-0')
    expect(markup).toContain('<strong>number</strong>')
  })

  it('uses the schema description when the parameter has none', () => {
    const markup = renderToStaticMarkup(
      <RequestField
        spec={{ openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }}
        parameter={{ name: 'cursor', in: 'query', schema: { type: 'string', description: 'Pagination cursor.' } }}
        value=""
        enabled
        onChange={() => {}}
        onEnabledChange={() => {}}
      />,
    )

    expect(markup).toContain('Pagination cursor.')
  })
})
