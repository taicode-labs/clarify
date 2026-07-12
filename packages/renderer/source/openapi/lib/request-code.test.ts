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
})
