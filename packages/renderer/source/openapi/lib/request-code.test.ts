import { describe, expect, it } from 'vitest'

import { buildRequestCodeExamples } from './request-code'

describe('buildRequestCodeExamples', () => {
  it('escapes multiline strings in JavaScript request bodies', () => {
    const examples = buildRequestCodeExamples({
      spec: { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} },
      path: '/pages',
      method: 'POST',
      parameters: [],
      requestContent: {
        mediaType: 'application/json',
        value: {
          example: {
            content: '# Getting Started\n\nInstall Clarify.',
          },
        },
      },
    })

    const fetchExample = examples.find(example => example.languageKey === 'javascript' && example.clientKey === 'fetch')

    expect(fetchExample).toBeDefined()
    expect(fetchExample?.code).toContain("content: '# Getting Started\\n\\nInstall Clarify.'")
    expect(() => Function(fetchExample?.code ?? '')).not.toThrow()
  })

  it('includes every scheme without exposing credentials', () => {
    const examples = buildRequestCodeExamples({
      spec: { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} },
      path: '/private',
      method: 'GET',
      parameters: [],
      auth: [
        { name: 'bearerAuth', scheme: { type: 'http', scheme: 'bearer' }, value: 'token' },
        { name: 'apiKey', scheme: { type: 'apiKey', in: 'query', name: 'api_key' }, value: 'secret' },
      ],
    })

    const curl = examples.find(example => example.clientKey === 'curl')?.code
    expect(curl).toContain('Authorization: Bearer YOUR_BEARER_AUTH')
    expect(curl).toContain('api_key=YOUR_API_KEY')
    expect(examples.every(example => !example.code.includes('token') && !example.code.includes('secret'))).toBe(true)
  })
})
