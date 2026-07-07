import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { renderContentDocument } from './content-renderer'
import type { ContentDocument } from './content'

describe('renderContentDocument', () => {
  it('renders markdown and openapi blocks through the provided callbacks', () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc',
      source: '/doc',
      content: [
        { kind: 'markdown', value: 'Hello world' },
        {
          kind: 'openapi',
          spec: { specFileKey: 'api', specPath: '/api' },
          operation: { path: '/users', method: 'get' },
        },
      ],
      metadata: {},
    }

    const rendered = renderContentDocument(document, {
      renderMarkdown: block => createElement('p', { 'data-testid': 'markdown' }, block.value),
      renderOpenApi: block => createElement('code', { 'data-testid': 'openapi' }, `${block.operation?.path ?? ''}:${block.operation?.method ?? ''}`),
    })

    expect(rendered).toBeTruthy()
  })

  it('wraps default markdown rendering in the same prose shell as MDX pages', () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc',
      source: '/doc',
      content: [
        { kind: 'markdown', value: '## Heading\n\n- Item' },
      ],
      metadata: {},
    }

    const html = renderToStaticMarkup(renderContentDocument(document))

    expect(html).toContain('clarify-mdx-page')
    expect(html).toContain('clarify-prose')
    expect(html).toContain('<h2>Heading</h2>')
    expect(html).toContain('<li>Item</li>')
  })
})
