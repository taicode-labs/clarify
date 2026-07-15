import { describe, expect, it } from 'vitest'

import { buildApiExchangeCodeExamples } from './api-exchange-code'

describe('buildApiExchangeCodeExamples', () => {
  it('uses the actual request snapshot for cURL and Fetch examples', () => {
    const examples = buildApiExchangeCodeExamples({
      url: 'https://api.example.com/users?expand=teams',
      method: 'POST',
      headers: [['content-type', 'application/json']],
      body: '{"name":"Ada"}',
    })

    expect(examples[0].code).toContain("curl --request POST 'https://api.example.com/users?expand=teams'")
    expect(examples[0].code).toContain("--data-raw '{\"name\":\"Ada\"}'")
    expect(examples[1].code).toContain('await fetch("https://api.example.com/users?expand=teams"')
  })

  it('redacts credentials from headers and query parameters', () => {
    const code = buildApiExchangeCodeExamples({
      url: 'https://api.example.com/users?api_key=secret&filter=active',
      method: 'GET',
      headers: [['authorization', 'Bearer secret'], ['x-trace-id', 'trace-1']],
    }).map((example) => example.code).join('\n')

    expect(code).not.toContain('Bearer secret')
    expect(code).not.toContain('api_key=secret')
    expect(code).toContain('<redacted>')
    expect(code).toContain('trace-1')
  })
})
