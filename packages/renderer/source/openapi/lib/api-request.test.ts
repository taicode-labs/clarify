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
      auth: [{ scheme: { type: 'http', scheme: 'bearer' }, value: 'secret' }],
      mediaType: 'application/json',
      body: '{"name":"Ada"}',
    })

    expect(request.url).toBe('https://eu.example.com/v1/users/a%2Fb?expand=teams')
    expect(request.init.method).toBe('POST')
    expect(request.init.credentials).toBe('include')
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
      auth: [{ scheme: { type: 'apiKey', in: 'query', name: 'key' }, value: 'abc' }],
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

  it('applies every scheme in one security requirement', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/private',
      server: { url: 'https://api.example.com' },
      parameters: [],
      parameterValues: {},
      auth: [
        { scheme: { type: 'http', scheme: 'basic' }, value: 'dXNlcjpwYXNz' },
        { scheme: { type: 'apiKey', in: 'query', name: 'api_key' }, value: 'secret' },
      ],
    })

    expect(request.url).toBe('https://api.example.com/private?api_key=secret')
    expect(new Headers(request.init.headers).get('Authorization')).toBe('Basic dXNlcjpwYXNz')
  })

  it('serializes array, deep object, and empty query parameters', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/search',
      server: { url: 'https://api.example.com' },
      parameters: [
        { name: 'tags', in: 'query', schema: { type: 'array' } },
        { name: 'filter', in: 'query', style: 'deepObject', schema: { type: 'object' } },
        { name: 'empty', in: 'query', allowEmptyValue: true },
      ],
      parameterValues: {
        'query:tags': '["docs","api"]',
        'query:filter': '{"status":"active","limit":10}',
        'query:empty': '',
      },
    })

    expect(request.url).toBe('https://api.example.com/search?tags=docs&tags=api&filter%5Bstatus%5D=active&filter%5Blimit%5D=10&empty=')
  })

  it('applies query style and explode rules', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/search',
      server: { url: 'https://api.example.com' },
      parameters: [
        { name: 'colors', in: 'query', style: 'pipeDelimited', explode: false, schema: { type: 'array' } },
        { name: 'coords', in: 'query', style: 'spaceDelimited', explode: false, schema: { type: 'array' } },
        { name: 'filter', in: 'query', style: 'form', explode: false, schema: { type: 'object' } },
      ],
      parameterValues: {
        'query:colors': '["blue","black"]',
        'query:coords': '[10,20]',
        'query:filter': '{"role":"admin","active":true}',
      },
    })

    expect(request.url).toBe('https://api.example.com/search?colors=blue%7Cblack&coords=10+20&filter=role%2Cadmin%2Cactive%2Ctrue')
  })

  it('applies path and header style and explode rules', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/users/{labels}/{coords}',
      server: { url: 'https://api.example.com' },
      parameters: [
        { name: 'labels', in: 'path', required: true, style: 'label', explode: true, schema: { type: 'object' } },
        { name: 'coords', in: 'path', required: true, style: 'matrix', explode: true, schema: { type: 'array' } },
        { name: 'X-Filter', in: 'header', style: 'simple', explode: true, schema: { type: 'object' } },
      ],
      parameterValues: {
        'path:labels': '{"role":"admin","active":true}',
        'path:coords': '[10,20]',
        'header:X-Filter': '{"role":"admin","active":true}',
      },
    })

    expect(request.url).toBe('https://api.example.com/users/.role=admin.active=true/;coords=10;coords=20')
    expect(new Headers(request.init.headers).get('X-Filter')).toBe('role=admin,active=true')
  })

  it('omits disabled parameters without discarding their values', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/search',
      server: { url: 'https://api.example.com' },
      parameters: [
        { name: 'active', in: 'query' },
        { name: 'draft', in: 'query' },
        { name: 'X-Trace-Id', in: 'header' },
      ],
      parameterValues: {
        'query:active': 'yes',
        'query:draft': 'preserved',
        'header:X-Trace-Id': 'trace-1',
      },
      parameterEnabled: {
        'query:active': true,
        'query:draft': false,
        'header:X-Trace-Id': false,
      },
    })

    expect(request.url).toBe('https://api.example.com/search?active=yes')
    expect(new Headers(request.init.headers).has('X-Trace-Id')).toBe(false)
  })

  it('leaves cookie parameters to the browser credential policy', () => {
    const request = buildApiRequest({
      method: 'GET',
      path: '/profile',
      server: { url: 'https://api.example.com' },
      parameters: [{ name: 'session', in: 'cookie' }],
      parameterValues: { 'cookie:session': 'manual-cookie' },
    })

    expect(new Headers(request.init.headers).has('Cookie')).toBe(false)
    expect(request.init.credentials).toBe('include')
  })

  it('builds URL-encoded and multipart bodies from object input', () => {
    const common = {
      method: 'POST',
      path: '/upload',
      server: { url: 'https://api.example.com' },
      parameters: [],
      parameterValues: {},
      body: '{"name":"report","tags":["a","b"]}',
    }
    const encoded = buildApiRequest({ ...common, mediaType: 'application/x-www-form-urlencoded' })
    const multipart = buildApiRequest({ ...common, mediaType: 'multipart/form-data' })

    expect(encoded.init.body).toBeInstanceOf(URLSearchParams)
    expect(String(encoded.init.body)).toBe('name=report&tags=%5B%22a%22%2C%22b%22%5D')
    expect(new Headers(encoded.init.headers).get('Content-Type')).toBe('application/x-www-form-urlencoded')
    expect(multipart.init.body).toBeInstanceOf(FormData)
    expect(new Headers(multipart.init.headers).has('Content-Type')).toBe(false)
  })

  it('includes selected files in multipart bodies without setting the boundary header', () => {
    const file = new File(['report'], 'report.txt', { type: 'text/plain' })
    const request = buildApiRequest({
      method: 'POST',
      path: '/upload',
      server: { url: 'https://api.example.com' },
      parameters: [],
      parameterValues: {},
      mediaType: 'multipart/form-data',
      body: '{"description":"Quarterly report"}',
      bodyFiles: { upload: file },
    })

    const body = request.init.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('description')).toBe('Quarterly report')
    expect(body.get('upload')).toBe(file)
    expect(new Headers(request.init.headers).has('Content-Type')).toBe(false)
  })

  it('uses a selected file as a binary request body', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const request = buildApiRequest({
      method: 'PUT',
      path: '/avatar',
      server: { url: 'https://api.example.com' },
      parameters: [],
      parameterValues: {},
      mediaType: 'image/png',
      bodyFiles: { '': file },
    })

    expect(request.init.body).toBe(file)
    expect(new Headers(request.init.headers).get('Content-Type')).toBe('image/png')
  })
})
