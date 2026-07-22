import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { OpenApiRequestWorkbench } from './OpenApiRequest'
import { RequestField } from './OpenApiRequestFields'
import { canPreviewResponse, getResponseTextPreview, OpenApiResponseViewer } from './OpenApiResponseViewer'

function createExchange(contentType: string, body: string) {
  const blob = new Blob([body], { type: contentType })
  return {
    request: { url: 'https://example.com', method: 'GET', headers: [] },
    status: 200,
    statusText: 'OK',
    url: 'https://example.com',
    redirected: false,
    duration: 12,
    size: blob.size,
    headers: [['content-type', contentType]] as Array<[string, string]>,
    contentType,
    body,
    blob,
  }
}

describe('response body previews', () => {
  it('formats JSON and YAML before syntax highlighting', () => {
    expect(getResponseTextPreview('application/json; charset=utf-8', '{"name":"Clarify","ready":true}')).toEqual({
      code: '{\n  "name": "Clarify",\n  "ready": true\n}',
      language: 'json',
    })
    expect(getResponseTextPreview('application/yaml', 'name: Clarify\nitems: [one, two]')).toEqual({
      code: 'name: Clarify\nitems:\n  - one\n  - two',
      language: 'yaml',
    })
  })

  it('maps textual response types to syntax highlighting languages', () => {
    expect(getResponseTextPreview('text/css', 'body { color: red; }')).toEqual({ code: 'body { color: red; }', language: 'css' })
    expect(getResponseTextPreview('application/xml', '<message>ok</message>')).toEqual({ code: '<message>ok</message>', language: 'xml' })
  })

  it('only enables preview for supported response types', () => {
    expect(canPreviewResponse('application/json')).toBe(true)
    expect(canPreviewResponse('text/plain')).toBe(true)
    expect(canPreviewResponse('text/html')).toBe(true)
    expect(canPreviewResponse('image/png')).toBe(true)
    expect(canPreviewResponse('audio/mpeg')).toBe(true)
    expect(canPreviewResponse('video/mp4')).toBe(true)
    expect(canPreviewResponse('application/octet-stream')).toBe(false)
    expect(canPreviewResponse('application/pdf')).toBe(false)
    expect(canPreviewResponse('')).toBe(false)
  })

  it('previews HTML in a sandboxed iframe', () => {
    const markup = renderToStaticMarkup(<OpenApiResponseViewer exchange={createExchange('text/html', '<h1>Hello</h1>')} />)

    expect(markup).toContain('<iframe')
    expect(markup).toContain('sandbox=""')
    expect(markup).toContain('srcDoc="&lt;h1&gt;Hello&lt;/h1&gt;"')
  })

  it.each([
    ['image/png', '<img', undefined],
    ['audio/mpeg', '<audio', 'controls=""'],
    ['video/mp4', '<video', 'controls=""'],
  ])('previews %s with its native media element', (contentType, element, attribute) => {
    const markup = renderToStaticMarkup(<OpenApiResponseViewer exchange={createExchange(contentType, 'media')} />)

    expect(markup).toContain(element)
    if (attribute) expect(markup).toContain(attribute)
  })
})

describe('OpenApiResponseViewer', () => {
  it('uses the shared code tabs with the active indicator aligned to the toolbar border', () => {
    const markup = renderToStaticMarkup(<OpenApiResponseViewer exchange={createExchange('application/json', '{"ok":true}')} />)

    expect(markup).toContain('clarify-tabs m-0 min-h-72')
    expect(markup).toContain('h-10 gap-0 border-(--clarify-code-border) px-3')
    expect(markup).toContain('absolute inset-x-2.5 h-0.5 bg-(--clarify-ui-tab-indicator) -bottom-px')
  })

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

describe('OpenApiRequestWorkbench', () => {
  it('renders as an embeddable request workbench', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {},
    }
    const markup = renderToStaticMarkup(
      <OpenApiRequestWorkbench spec={spec} path="/users" method="GET" operation={{ responses: { 200: { description: 'OK' } } }} />,
    )

    expect(markup).toContain('clarify-openapi-request')
    expect(markup).toContain('rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border)')
    expect(markup).toContain('/users')
    expect(markup).not.toContain('Ready for a request')
  })

  it('keeps the empty response module in the request dialog', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }
    const markup = renderToStaticMarkup(
      <OpenApiRequestWorkbench spec={spec} path="/users" method="GET" operation={{ responses: { 200: { description: 'OK' } } }} compact />,
    )

    expect(markup).toContain('Ready for a request')
  })

  it('initializes parameters and the request body from the selected request example', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }
    const operation = {
      parameters: [{ name: 'account', in: 'query', examples: { personal: { value: 'personal' }, enterprise: { value: 'enterprise' } } }],
      requestBody: {
        content: {
          'application/json': {
            examples: {
              personal: { value: { name: 'Alice' } },
              enterprise: { value: { name: 'Acme' } },
            },
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    }
    const markup = renderToStaticMarkup(
      <OpenApiRequestWorkbench spec={spec} path="/users" method="POST" operation={operation} requestExample="enterprise" />,
    )

    expect(markup).toContain('value="enterprise"')
    expect(markup).toContain('&quot;name&quot;: &quot;Acme&quot;')
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
