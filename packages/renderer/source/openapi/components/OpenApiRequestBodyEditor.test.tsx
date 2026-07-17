import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../lib/utils'

import { OpenApiRequestBodyEditor } from './OpenApiRequestBodyEditor'
import { initialRequestBody, requestBodyForExample } from './useOpenApiRequestState'

const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1' }, paths: {} } as OpenAPISpec
const noop = () => {}

describe('OpenApiRequestBodyEditor', () => {
  it('keeps JSON object schemas in a document editor', () => {
    const markup = renderToStaticMarkup(
      <OpenApiRequestBodyEditor
        spec={spec}
        mediaType="application/json"
        content={{ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, count: { type: 'integer' }, active: { type: 'boolean' }, role: { type: 'string', enum: ['admin', 'reader'] } } } }}
        body={'{"name":"Report","count":2,"active":true,"role":"admin"}'}
        files={{}}
        onBodyChange={noop}
        onFileChange={noop}
      />,
    )

    expect(markup).toContain('<textarea')
    expect(markup).toContain('aria-label="application/json"')
    expect(markup).toContain('&quot;name&quot;:&quot;Report&quot;')
    expect(markup).not.toContain('aria-label="name"')
  })

  it('renders URL-encoded schemas as typed form fields', () => {
    const markup = renderToStaticMarkup(
      <OpenApiRequestBodyEditor
        spec={spec}
        mediaType="application/x-www-form-urlencoded; charset=utf-8"
        content={{ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, count: { type: 'integer' }, active: { type: 'boolean' }, role: { type: 'string', enum: ['admin', 'reader'] } } } }}
        body={'{"name":"Report","count":2,"active":true,"role":"admin"}'}
        files={{}}
        onBodyChange={noop}
        onFileChange={noop}
      />,
    )

    expect(markup).toContain('aria-label="name"')
    expect(markup).toContain('type="number"')
    expect(markup).toContain('type="checkbox"')
    expect(markup).toContain('<select')
    expect(markup).not.toContain('<textarea')
  })

  it('renders multipart binary properties and binary roots as file inputs', () => {
    const propertyMarkup = renderToStaticMarkup(
      <OpenApiRequestBodyEditor spec={spec} mediaType="multipart/form-data" content={{ schema: { type: 'object', properties: { upload: { type: 'string', format: 'binary' } } } }} body="{}" files={{}} onBodyChange={noop} onFileChange={noop} />,
    )
    const rootMarkup = renderToStaticMarkup(
      <OpenApiRequestBodyEditor spec={spec} mediaType="application/octet-stream" content={{ schema: { type: 'string', format: 'binary' } }} body="" files={{}} onBodyChange={noop} onFileChange={noop} />,
    )

    expect(propertyMarkup).toContain('aria-label="upload"')
    expect(propertyMarkup).toContain('type="file"')
    expect(rootMarkup).toContain('aria-label="application/octet-stream"')
    expect(rootMarkup).toContain('type="file"')
  })

  it('keeps unstructured textual bodies in a source editor', () => {
    const markup = renderToStaticMarkup(
      <OpenApiRequestBodyEditor spec={spec} mediaType="text/plain" content={{ schema: { type: 'string' } }} body="hello" files={{}} onBodyChange={noop} onFileChange={noop} />,
    )

    expect(markup).toContain('<textarea')
    expect(markup).toContain('hello')
    expect(markup).not.toContain('type="file"')
  })

  it('does not send generated placeholders for binary fields', () => {
    expect(initialRequestBody(spec, { schema: { type: 'string', format: 'binary' } })).toBe('')
    expect(initialRequestBody(spec, { schema: { type: 'object', properties: { title: { type: 'string' }, upload: { type: 'string', format: 'binary' } } } })).toBe('{\n  "title": "string"\n}')
    expect(initialRequestBody(spec, { example: 'document contents', schema: { type: 'string', format: 'binary' } })).toBe('document contents')
  })

  it('selects a named body example and falls back to the default example', () => {
    const content = {
      examples: {
        personal: { value: { name: 'Alice' } },
        enterprise: { value: { name: 'Acme' } },
      },
    }

    expect(requestBodyForExample(spec, content, 'enterprise')).toBe('{\n  "name": "Acme"\n}')
    expect(requestBodyForExample(spec, content, 'missing')).toBe('{\n  "name": "Alice"\n}')
  })
})
