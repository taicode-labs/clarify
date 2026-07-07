import type { Section } from '../app/SectionProvider'
import type { Config } from '../core/types'

import type { PreviewEndpoint } from './openapi'
import type { PreviewGuide } from './types'

export const embeddedEndpoint = {
  method: 'GET',
  path: '/examples/basic-request',
  summary: 'Basic request',
  description: 'Rendered from api.openapi.json inside the MDX guide.',
  parameters: [
    { name: 'cursor', in: 'query', type: 'string', description: 'Start after this cursor.' },
    { name: 'limit', in: 'query', type: 'integer', description: 'Max items to return.' },
    { name: 'X-Trace-Id', in: 'header', type: 'string', description: 'Optional request trace.' },
  ],
  responseDescription: 'A page of example records.',
  responseSchema: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object' } },
      next: { type: 'string' },
    },
  },
  responseExample: {
    items: [],
    next: 'cursor_2',
  },
} satisfies PreviewEndpoint

export const embeddedGuide = {
  label: 'source/en-US/openapi/embedding.mdx',
  title: 'Embed OpenAPI in MDX',
  body: 'Use MDX for workflow context, then render the exact operation from the spec.',
  embed: '<OpenApiOperation specPath="/api" path="/examples/basic-request" method="get" />',
  outputs: ['/openapi/embedding', '/api', '/api.openapi.json', '/llms.txt'],
} satisfies PreviewGuide

export const staticOutputEndpoint = {
  method: 'POST',
  path: '/api/{id}/path',
  summary: 'Create static build',
  description: 'Build static docs from MDX and OpenAPI sources.',
  parameters: [
    { name: 'id', in: 'path', type: 'string', required: true, description: 'Project ID.' }
  ],
  responseDescription: 'Build metadata and static outputs.',
  responseSchema: {
    type: 'object',
    required: ['id', 'status', 'outputs'],
    properties: {
      id: { type: 'string', description: 'Build identifier.' },
      status: { type: 'string', enum: ['queued', 'running', 'ready'], description: 'Current build state.' },
      outputs: {
        type: 'array',
        description: 'Generated static artifacts.',
        items: {
          type: 'object',
          required: ['path', 'kind'],
          properties: {
            path: { type: 'string' },
            kind: { type: 'string', enum: ['html', 'asset', 'openapi', 'llms'] },
          },
        },
      },
    },
  },
  requestDescription: 'Static build options.',
  requestSchema: {
    type: 'object',
    required: ['source', 'output'],
    properties: {
      source: { type: 'string', description: 'MDX source root.' },
      output: { type: 'string', description: 'Static output root.' },
      includeSearchIndex: { type: 'boolean', description: 'Generate search data.' },
    },
  },
  requestExample: {
    source: 'source',
    output: 'output',
    includeSearchIndex: true,
  },
  responseExample: {
    id: 'build_01HY',
    status: 'ready',
    outputs: [
      { path: '/openapi/index.html', kind: 'html' },
      { path: '/api.openapi.json', kind: 'openapi' },
      { path: '/llms.txt', kind: 'llms' },
    ],
  },
} satisfies PreviewEndpoint

export const previewConfig = {
  title: 'Clarify preview',
  description: 'Renderer preview environment',
  rootDirectory: 'source',
  routePrefix: '/',
  assetPrefix: '/',
  outputDirectory: 'output',
  theme: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#60a5fa',
        background: '#ffffff',
        foreground: '#18181b',
        surface: '#ffffff',
        muted: '#71717a',
        border: 'rgb(24 24 27 / 0.1)',
        codeBackground: '#f4f4f5',
      },
      radius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
    layout: {
      maxWidth: '88rem',
    },
    editor: false,
  },
  i18n: {
    defaultLocale: 'en',
    missing: 'fallback',
    locales: [{ code: 'en', label: 'English' }],
  },
} satisfies Config

export const methodStyleVars: Record<string, string> = {
  GET: 'bg-(--clarify-http-method-get-background) text-(--clarify-http-method-get-text)',
  POST: 'bg-(--clarify-http-method-post-background) text-(--clarify-http-method-post-text)',
  PUT: 'bg-(--clarify-http-method-put-background) text-(--clarify-http-method-put-text)',
  PATCH: 'bg-(--clarify-http-method-patch-background) text-(--clarify-http-method-patch-text)',
  DELETE: 'bg-(--clarify-http-method-delete-background) text-(--clarify-http-method-delete-text)',
}

export const mainPreviewPath = '/openapi/embedding'

export const mainPreviewSections = [
  { id: 'overview', title: 'Overview' },
  { id: 'request-example', title: 'Request example' }
] satisfies Section[]
