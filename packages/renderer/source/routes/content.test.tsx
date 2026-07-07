import { createElement } from 'react'
import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { ContentDocument } from '../content/index'
import { ConfigContext, OpenApisContext } from '../core/context'
import type { Config } from '../core/types'
import { Markdown } from '../markdown/Markdown'
import type { OpenAPISpec } from '../openapi/lib/utils'

import { createComponentRouteComponent, createContentRouteComponent, renderContentDocument } from './content'

async function renderToHtml(node: React.ReactNode): Promise<string> {
  const stream = await renderToReadableStream(node)
  await stream.allReady
  return new Response(stream).text()
}

const testConfig = {
  title: 'Test docs',
  description: 'A test site',
  rootDirectory: '.',
  routePrefix: '/',
  assetPrefix: '/',
  outputDirectory: 'dist',
  theme: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#7c3aed',
        background: '#ffffff',
        foreground: '#111827',
        surface: '#ffffff',
        muted: '#6b7280',
        border: '#e5e7eb',
        codeBackground: '#f3f4f6',
      },
      radius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
    layout: { maxWidth: '80rem' },
    editor: false,
  },
} as const satisfies Config

const testOpenApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Projects API',
    version: '1.0.0',
    description: 'Returns **active** projects.\n\n- Use `limit` for page size.',
  },
  paths: {
    '/v1/projects': {
      get: {
        summary: 'List projects',
        description: 'Returns **active** projects.\n\n- Use `limit` for page size.',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
      post: {
        summary: 'Create project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
          },
        },
      },
    },
  },
} satisfies OpenAPISpec

function renderWithRuntimeProviders(node: React.ReactNode, openApis: Record<string, OpenAPISpec> = {}): Promise<string> {
  return renderToHtml(
    <ConfigContext.Provider value={testConfig}>
      <OpenApisContext.Provider value={openApis}>
        <StaticRouter location="/doc">
          {node}
        </StaticRouter>
      </OpenApisContext.Provider>
    </ConfigContext.Provider>
  )
}

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

  it('wraps default markdown rendering in the same prose shell as MDX pages', async () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc',
      source: '/doc',
      content: [
        { kind: 'markdown', value: '## Heading\n\n- Item' },
      ],
      metadata: {},
    }

    const html = await renderToHtml(renderContentDocument(document))

    expect(html).toContain('clarify-mdx-page')
    expect(html).toContain('clarify-prose')
    expect(html).toContain('clarify-heading')
    expect(html).toContain('Heading</a></h2>')
    expect(html).toContain('<li>Item</li>')
  })

  it('executes JSX-style MDX components through the MDX runtime', async () => {
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

    const html = await renderWithRuntimeProviders(renderContentDocument(document))

    expect(html).toContain('Start')
    expect(html).toContain('Body')
    expect(html).not.toContain('&lt;Callout')
    expect(html).toContain('clarify-button')
    expect(html).toContain('Card title')
    expect(html).toContain('clarify-code-group')
  })

  it('executes JSX-style MDX components through the shared Markdown entry', async () => {
    const html = await renderWithRuntimeProviders(
      await Markdown({
        children: [
          'Plain paragraph.',
          '<Callout title="Runtime callout">Rendered through Markdown entry.</Callout>',
          '<Button href="/docs">Read docs</Button>',
        ].join('\n\n'),
      })
    )

    expect(html).toContain('Plain paragraph.')
    expect(html).toContain('clarify-callout')
    expect(html).toContain('Runtime callout')
    expect(html).toContain('clarify-button')
    expect(html).not.toContain('&lt;Callout')
  })

  it('renders the docs template built-in component set through the MDX runtime', async () => {
    const document: ContentDocument = {
      id: 'docs-components',
      title: 'Writing content',
      source: '/guides/writing-content',
      content: [
        {
          kind: 'markdown',
          value: [
            '<Callout title="Use callouts for important notes">Callouts are useful for setup requirements.</Callout>',
            '<Note>Note is a lightweight MDX primitive.</Note>',
            '<CardGroup cols={3}>',
            '  <Card title="Concept" icon="Lightbulb">Explain the idea behind a feature.</Card>',
            '  <Card title="Guide" icon="Route">Walk users through a workflow step by step.</Card>',
            '</CardGroup>',
            '<CodeGroup title="Install dependencies">',
            '```bash title="pnpm"',
            'pnpm add @clarify-labs/cli',
            '```',
            '',
            '```bash title="npm"',
            'npm install @clarify-labs/cli',
            '```',
            '</CodeGroup>',
            '<Properties>',
            '  <Property name="title" type="string">Site title used in the header.</Property>',
            '</Properties>',
            '<Row>',
            '  <Col>### Explain the workflow</Col>',
            '  <Col sticky>Sticky column</Col>',
            '</Row>',
          ].join('\n\n'),
        },
      ],
      metadata: {},
    }

    const html = await renderWithRuntimeProviders(renderContentDocument(document))

    expect(html).toContain('clarify-callout')
    expect(html).toContain('clarify-note')
    expect(html).toContain('clarify-code-group')
    expect(html).toContain('clarify-properties')
    expect(html).toContain('clarify-property')
    expect(html).toContain('clarify-row')
    expect(html).toContain('clarify-col')
    expect(html).toContain('Concept')
    expect(html).toContain('Guide')
    expect(html).toContain('pnpm add @clarify-labs/cli')
    expect(html).toContain('Sticky column')
  })

  it('renders embedded OpenAPI components through the MDX runtime', async () => {
    const document: ContentDocument = {
      id: 'openapi-embedding',
      title: 'Embed API endpoints',
      source: '/api/embedding',
      content: [
        {
          kind: 'markdown',
          value: [
            '<OpenApiOperation specPath="/api" path="/v1/projects" method="get" />',
            '<OpenApiDocument specPath="/api" />',
            '<Callout title="Spec path convention">specPath is generated from the OpenAPI filename.</Callout>',
          ].join('\n\n'),
        },
      ],
      metadata: {},
    }

    const html = await renderWithRuntimeProviders(renderContentDocument(document), { 'virtual:clarify-page/api': testOpenApiSpec })

    expect(html).toContain('List projects')
    expect(html).toContain('Create project')
    expect(html).toContain('clarify-callout')
    expect(html).not.toContain('&lt;OpenApiOperation')
  })

  it('returns a route component that renders content documents', async () => {
    const document: ContentDocument = {
      id: 'doc',
      title: 'Doc route',
      source: '/doc-route',
      content: [{ kind: 'markdown', value: 'Route body' }],
      metadata: {},
    }

    const Component = createContentRouteComponent({ contentDocument: document })
    const html = await renderToHtml(createElement(Component))

    expect(html).toContain('Route body')
  })

  it('returns a route component that can render a provided document component', async () => {
    const Component = createComponentRouteComponent({ component: () => createElement('div', null, 'Component route') })
    const html = renderToStaticMarkup(createElement(Component))

    expect(html).toContain('Component route')
  })
})
