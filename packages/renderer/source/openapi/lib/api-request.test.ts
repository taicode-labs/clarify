import { describe, expect, it } from 'vitest'

import { buildApiRequest } from './api-request'

describe('buildApiRequest', () => {
  it('builds path, query, header, auth, and JSON body values', () => {
    const request = buildApiRequest({
      method: 'post',
      path: '/users/{userId}',
      server: { url: 'https://{region}.example.com/v1', variables: { region: { default: 'us' } } },
      serverVariables: { region: 'eu' },
      parameters: [
        { name: 'userId', in: 'path' },
        { name: 'expand', in: 'query' },
        { name: 'X-Trace-Id', in: 'header' },
      ],
      parameterValues: {
        'path:userId': 'a/b',
        'query:expand': 'teams',
        'header:X-Trace-Id': 'trace-1',
      },
      auth: { scheme: { type: 'http', scheme: 'bearer' }, value: 'secret' },
      mediaType: 'application/json',
      body: '{"name":"Ada"}',
    })

    expect(request.url).toBe('https://eu.example.com/v1/users/a%2Fb?expand=teams')
    expect(request.init.method).toBe('POST')
    expect(request.init.body).toBe('{"name":"Ada"}')
    expect(new Headers(request.init.headers)).toEqual(expect.objectContaining({}))
    expect(new Headers(request.init.headers).get('Authorization')).toBe('Bearer secret')
    expect(new Headers(request.init.headers).get('X-Trace-Id')).toBe('trace-1')
    expect(new Headers(request.init.headers).get('Content-Type')).toBe('application/json')
  })

  it('places api keys in the query string and omits GET bodies', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/status',
      server: { url: 'https://api.example.com' },
      parameters: [],
      parameterValues: {},
      auth: { scheme: { type: 'apiKey', in: 'query', name: 'key' }, value: 'abc' },
      body: 'ignored',
    })

    expect(request.url).toBe('https://api.example.com/status?key=abc')
    expect(request.init.body).toBeUndefined()
  })

  it('resolves relative server URLs against the current page', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/users',
      server: { url: '/api/v1' },
      baseUrl: 'https://docs.example.com/reference/openapi',
      parameters: [],
      parameterValues: {},
    })

    expect(request.url).toBe('https://docs.example.com/api/v1/users')
  })
})
