import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ContentDocument } from './content'
import { createComponentRouteComponent, createContentRouteComponent, renderContentDocument } from './content-renderer'

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
      markdown: block => createElement('p', { 'data-testid': 'markdown' }, block.value),
      openapi: block => createElement('code', { 'data-testid': 'openapi' }, `${block.operation?.path ?? ''}:${block.operation?.method ?? ''}`),
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
    expect(html).toContain('clarify-heading')
    expect(html).toContain('Heading</a></h2>')
    expect(html).toContain('<li>Item</li>')
  })

  it('does not execute JSX-style MDX components through the current react-markdown path', () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc',
      source: '/doc',
      content: [
        {
          kind: 'markdown',
          value: [
            '<Button href="/start">Start</Button>',
            '<Card title="Card title">Card body</Card>',
            '<CodeGroup title="Install"><code>pnpm install</code></CodeGroup>',
            '<Callout>Body</Callout>',
          ].join('\n\n'),
        },
      ],
      metadata: {},
    }

    const html = renderToStaticMarkup(renderContentDocument(document))

    expect(html).toContain('Start')
    expect(html).toContain('Body')
    expect(html).not.toContain('&lt;Callout')
    expect(html).not.toContain('clarify-button')
    expect(html).not.toContain('Card title')
    expect(html).not.toContain('clarify-code-group')
  })

  it('renders component-only routes through an explicit component route helper', () => {
    const Component = () => createElement('div', { 'data-testid': 'component-route' }, 'component')
    const rendered = createElement(createComponentRouteComponent({ component: Component }))

    expect(rendered).toBeTruthy()
  })

  it('renders content-document routes through a unified content route helper', () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc',
      source: '/doc',
      content: [{ kind: 'markdown', value: 'Hello' }],
      metadata: {},
    }

    const rendered = createElement(createContentRouteComponent({ contentDocument: document }))

    expect(rendered).toBeTruthy()
  })
})
