import { snippetz } from '@scalar/snippetz'
import type { ClientId, HarRequest, TargetId } from '@scalar/snippetz'

import { getContentExample, isRecord, stringifyExample } from './helpers'
import type { OpenApiMediaType, OpenApiParameter, RequestCodeExample } from './types'
import type { OpenAPISpec } from './utils'

export type RequestCodeInput = {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContent?: { mediaType: string; value: OpenApiMediaType }
}

type RequestBody = {
  serialized: string
}

type SnippetTarget<T extends TargetId = TargetId> = {
  target: T
  client: ClientId<T>
}

const snippetGenerator = snippetz()

function getServerUrl(spec: OpenAPISpec): string {
  const servers = (spec as Record<string, unknown>).servers
  if (!Array.isArray(servers)) return 'https://api.example.com'

  const firstServer = servers.find(isRecord)
  return typeof firstServer?.url === 'string' ? firstServer.url : 'https://api.example.com'
}

function buildOperationUrl(spec: OpenAPISpec, path: string): string {
  const serverUrl = getServerUrl(spec).replace(/\/$/, '')
  return `${serverUrl}${path}`
}

function getQueryString(parameters: OpenApiParameter[]): HarRequest['queryString'] {
  return parameters
    .filter((parameter) => parameter.in === 'query' && parameter.name)
    .map((parameter) => ({ name: parameter.name, value: encodeUrlPlaceholders(`{${parameter.name}}`) }))
}

function getRequestBody(requestContent?: { mediaType: string; value: OpenApiMediaType }): RequestBody | undefined {
  const value = getContentExample(requestContent?.value)
  if (!requestContent || typeof value === 'undefined') return undefined

  return { serialized: stringifyExample(value) }
}

function getRequestHeaders(requestContent?: { mediaType: string; value: OpenApiMediaType }): Record<string, string> {
  return {
    Authorization: 'Bearer {token}',
    Accept: 'application/json',
    ...(requestContent ? { 'Content-Type': requestContent.mediaType } : {}),
  }
}

function encodeUrlPlaceholders(url: string): string {
  return url.replace(/\{([^}]+)\}/g, (_, name: string) => `%7B${encodeURIComponent(name)}%7D`)
}

function decodeUrlPlaceholders(code: string): string {
  return code.replace(/%7B([^%]+)%7D/g, (_, name: string) => `{${decodeURIComponent(name)}}`)
}

function buildHarRequest(input: RequestCodeInput): HarRequest {
  const requestBody = getRequestBody(input.requestContent)
  const url = encodeUrlPlaceholders(buildOperationUrl(input.spec, input.path))

  return {
    method: input.method,
    url,
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headers: Object.entries(getRequestHeaders(input.requestContent)).map(([name, value]) => ({ name, value })),
    queryString: getQueryString(input.parameters),
    headersSize: -1,
    bodySize: requestBody ? requestBody.serialized.length : 0,
    postData: requestBody
      ? {
          mimeType: input.requestContent?.mediaType ?? '',
          text: requestBody.serialized,
        }
      : undefined,
  }
}

function buildSnippet(input: RequestCodeInput, target: SnippetTarget): string {
  const result = snippetGenerator.print(target.target, target.client, buildHarRequest(input))
  return decodeUrlPlaceholders(result || '')
}

export function buildRequestCodeExamples(input: RequestCodeInput): RequestCodeExample[] {
  return [
    {
      key: 'curl',
      title: 'cURL',
      language: 'bash',
      code: buildSnippet(input, { target: 'shell', client: 'curl' }),
    },
    {
      key: 'javascript',
      title: 'JavaScript',
      language: 'javascript',
      code: buildSnippet(input, { target: 'js', client: 'fetch' }),
    },
    {
      key: 'typescript',
      title: 'TypeScript',
      language: 'typescript',
      code: buildSnippet(input, { target: 'js', client: 'fetch' }),
    },
    {
      key: 'python',
      title: 'Python',
      language: 'python',
      code: buildSnippet(input, { target: 'python', client: 'requests' }),
    },
    {
      key: 'go',
      title: 'Go',
      language: 'go',
      code: buildSnippet(input, { target: 'go', client: 'native' }),
    },
    {
      key: 'node',
      title: 'Node.js',
      language: 'javascript',
      code: buildSnippet(input, { target: 'node', client: 'fetch' }),
    },
    {
      key: 'java',
      title: 'Java',
      language: 'java',
      code: buildSnippet(input, { target: 'java', client: 'nethttp' }),
    },
    {
      key: 'csharp',
      title: 'C#',
      language: 'csharp',
      code: buildSnippet(input, { target: 'csharp', client: 'httpclient' }),
    },
    {
      key: 'php',
      title: 'PHP',
      language: 'php',
      code: buildSnippet(input, { target: 'php', client: 'guzzle' }),
    },
    {
      key: 'ruby',
      title: 'Ruby',
      language: 'ruby',
      code: buildSnippet(input, { target: 'ruby', client: 'native' }),
    },
    {
      key: 'rust',
      title: 'Rust',
      language: 'rust',
      code: buildSnippet(input, { target: 'rust', client: 'reqwest' }),
    },
    {
      key: 'swift',
      title: 'Swift',
      language: 'swift',
      code: buildSnippet(input, { target: 'swift', client: 'nsurlsession' }),
    },
    {
      key: 'kotlin',
      title: 'Kotlin',
      language: 'kotlin',
      code: buildSnippet(input, { target: 'kotlin', client: 'okhttp' }),
    },
    {
      key: 'powershell',
      title: 'PowerShell',
      language: 'powershell',
      code: buildSnippet(input, { target: 'powershell', client: 'restmethod' }),
    },
  ]
}
