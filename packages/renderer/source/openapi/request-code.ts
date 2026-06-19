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
  serialized?: string
  params?: NonNullable<HarRequest['postData']>['params']
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

function isFormMediaType(mediaType: string): boolean {
  return mediaType.includes('multipart/form-data') || mediaType.includes('application/x-www-form-urlencoded')
}

function isBinarySchema(schema: unknown): boolean {
  return isRecord(schema) && schema.type === 'string' && schema.format === 'binary'
}

function getSchemaProperties(schema: unknown): Record<string, unknown> {
  return isRecord(schema) && isRecord(schema.properties) ? schema.properties : {}
}

function getFieldValue(name: string, value: unknown, schema: unknown): unknown {
  if (isRecord(value) && typeof value[name] !== 'undefined') return value[name]
  if (isBinarySchema(schema)) return `@${name}`
  return undefined
}

function getFormParams(value: unknown, requestContent: { mediaType: string; value: OpenApiMediaType }): RequestBody['params'] {
  const properties = getSchemaProperties(requestContent.value.schema)
  const fieldNames = Array.from(new Set([...Object.keys(properties), ...(isRecord(value) ? Object.keys(value) : [])]))

  return fieldNames.flatMap((name) => {
    const fieldValue = getFieldValue(name, value, properties[name])
    if (typeof fieldValue === 'undefined') return []

    const contentType = requestContent.value.encoding?.[name]?.contentType
    const serializedValue = typeof fieldValue === 'string' ? fieldValue : stringifyExample(fieldValue)

    return [{
      name,
      value: serializedValue,
      ...(contentType ? { contentType } : {}),
    }]
  })
}

function getBodySize(requestBody?: RequestBody): number {
  if (requestBody?.serialized) return requestBody.serialized.length
  return requestBody?.params?.reduce((size: number, param: { name: string; value?: unknown }) => size + param.name.length + String(param.value ?? '').length, 0) ?? 0
}

function getRequestBody(requestContent?: { mediaType: string; value: OpenApiMediaType }): RequestBody | undefined {
  const value = getContentExample(requestContent?.value)
  if (!requestContent || typeof value === 'undefined') return undefined

  if (isFormMediaType(requestContent.mediaType)) {
    const params = getFormParams(value, requestContent)
    return params.length > 0 ? { params } : undefined
  }

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
    bodySize: getBodySize(requestBody),
    postData: requestBody
      ? {
          mimeType: input.requestContent?.mediaType ?? '',
          ...(requestBody.serialized ? { text: requestBody.serialized } : {}),
          ...(requestBody.params ? { params: requestBody.params } : {}),
        }
      : undefined,
  }
}

function buildSnippet(input: RequestCodeInput, target: SnippetTarget): string {
  const result = snippetGenerator.print(target.target, target.client, buildHarRequest(input))
  return decodeUrlPlaceholders(result || '')
}

type RequestSnippetOption = SnippetTarget & {
  languageKey: string
  title: string
  language: string
  clientTitle: string
}

const requestSnippetOptions: RequestSnippetOption[] = [
  { languageKey: 'shell', title: 'Shell', language: 'bash', target: 'shell', client: 'curl', clientTitle: 'cURL' },
  { languageKey: 'shell', title: 'Shell', language: 'bash', target: 'shell', client: 'wget', clientTitle: 'Wget' },
  { languageKey: 'shell', title: 'Shell', language: 'bash', target: 'shell', client: 'httpie', clientTitle: 'HTTPie' },
  { languageKey: 'javascript', title: 'JavaScript', language: 'javascript', target: 'js', client: 'fetch', clientTitle: 'Fetch' },
  { languageKey: 'javascript', title: 'JavaScript', language: 'javascript', target: 'js', client: 'axios', clientTitle: 'Axios' },
  { languageKey: 'javascript', title: 'JavaScript', language: 'javascript', target: 'js', client: 'ofetch', clientTitle: 'ofetch' },
  { languageKey: 'javascript', title: 'JavaScript', language: 'javascript', target: 'js', client: 'xhr', clientTitle: 'XHR' },
  { languageKey: 'typescript', title: 'TypeScript', language: 'typescript', target: 'js', client: 'fetch', clientTitle: 'Fetch' },
  { languageKey: 'typescript', title: 'TypeScript', language: 'typescript', target: 'js', client: 'axios', clientTitle: 'Axios' },
  { languageKey: 'typescript', title: 'TypeScript', language: 'typescript', target: 'js', client: 'ofetch', clientTitle: 'ofetch' },
  { languageKey: 'python', title: 'Python', language: 'python', target: 'python', client: 'requests', clientTitle: 'Requests' },
  { languageKey: 'python', title: 'Python', language: 'python', target: 'python', client: 'python3', clientTitle: 'http.client' },
  { languageKey: 'python', title: 'Python', language: 'python', target: 'python', client: 'httpx_sync', clientTitle: 'HTTPX' },
  { languageKey: 'python', title: 'Python', language: 'python', target: 'python', client: 'aiohttp', clientTitle: 'aiohttp' },
  { languageKey: 'go', title: 'Go', language: 'go', target: 'go', client: 'native', clientTitle: 'NewRequest' },
  { languageKey: 'node', title: 'Node.js', language: 'javascript', target: 'node', client: 'fetch', clientTitle: 'Fetch' },
  { languageKey: 'node', title: 'Node.js', language: 'javascript', target: 'node', client: 'axios', clientTitle: 'Axios' },
  { languageKey: 'node', title: 'Node.js', language: 'javascript', target: 'node', client: 'ofetch', clientTitle: 'ofetch' },
  { languageKey: 'node', title: 'Node.js', language: 'javascript', target: 'node', client: 'undici', clientTitle: 'undici' },
  { languageKey: 'java', title: 'Java', language: 'java', target: 'java', client: 'nethttp', clientTitle: 'java.net.http' },
  { languageKey: 'java', title: 'Java', language: 'java', target: 'java', client: 'okhttp', clientTitle: 'OkHttp' },
  { languageKey: 'java', title: 'Java', language: 'java', target: 'java', client: 'unirest', clientTitle: 'Unirest' },
  { languageKey: 'java', title: 'Java', language: 'java', target: 'java', client: 'asynchttp', clientTitle: 'AsyncHttp' },
  { languageKey: 'csharp', title: 'C#', language: 'csharp', target: 'csharp', client: 'httpclient', clientTitle: 'HttpClient' },
  { languageKey: 'csharp', title: 'C#', language: 'csharp', target: 'csharp', client: 'restsharp', clientTitle: 'RestSharp' },
  { languageKey: 'php', title: 'PHP', language: 'php', target: 'php', client: 'guzzle', clientTitle: 'Guzzle' },
  { languageKey: 'php', title: 'PHP', language: 'php', target: 'php', client: 'curl', clientTitle: 'cURL' },
  { languageKey: 'php', title: 'PHP', language: 'php', target: 'php', client: 'laravel', clientTitle: 'Laravel HTTP Client' },
  { languageKey: 'ruby', title: 'Ruby', language: 'ruby', target: 'ruby', client: 'native', clientTitle: 'net::http' },
  { languageKey: 'rust', title: 'Rust', language: 'rust', target: 'rust', client: 'reqwest', clientTitle: 'reqwest' },
  { languageKey: 'swift', title: 'Swift', language: 'swift', target: 'swift', client: 'nsurlsession', clientTitle: 'NSURLSession' },
  { languageKey: 'kotlin', title: 'Kotlin', language: 'kotlin', target: 'kotlin', client: 'okhttp', clientTitle: 'OkHttp' },
  { languageKey: 'powershell', title: 'PowerShell', language: 'powershell', target: 'powershell', client: 'restmethod', clientTitle: 'Invoke-RestMethod' },
  { languageKey: 'powershell', title: 'PowerShell', language: 'powershell', target: 'powershell', client: 'webrequest', clientTitle: 'Invoke-WebRequest' },
]

export function buildRequestCodeExamples(input: RequestCodeInput): RequestCodeExample[] {
  return requestSnippetOptions.map((option) => ({
    key: `${option.languageKey}:${option.client}`,
    title: option.title,
    language: option.language,
    languageKey: option.languageKey,
    clientKey: option.client,
    clientTitle: option.clientTitle,
    code: buildSnippet(input, option),
  }))
}
