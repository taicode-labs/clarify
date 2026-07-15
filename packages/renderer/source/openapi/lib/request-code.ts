import { snippetz } from '@scalar/snippetz'
import type { ClientId, HarRequest, TargetId } from '@scalar/snippetz'

import type { OpenApiMediaType, OpenApiParameter, OpenApiServer, RequestAuthInput, RequestAuthInputs, RequestCodeExample } from '../types'

import { getContentExample, isRecord, joinPath, stringifyExample } from './helpers'
import type { OpenAPIOperationSource, OpenAPISpec } from './utils'

type RequestContent = { mediaType: string; value: OpenApiMediaType }

export type RequestCodeInput = {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContent?: RequestContent
  server?: OpenApiServer
  serverVariables?: Record<string, string>
  auth?: RequestAuthInputs
  operationSource?: OpenAPIOperationSource
}

type RequestBody = {
  serialized?: string
  params?: NonNullable<HarRequest['postData']>['params']
}

type BodySizeParam = { name: string; value?: unknown }

type SnippetTarget<T extends TargetId = TargetId> = {
  target: T
  client: ClientId<T>
}

const snippetControlCharacters = [
  { character: '\n', placeholder: '\uE000', escape: '\\n' },
  { character: '\r', placeholder: '\uE001', escape: '\\r' },
  { character: '\t', placeholder: '\uE002', escape: '\\t' },
] as const

const snippetGenerator = snippetz()

function getAuthPlaceholder(name: string): string {
  const normalizedName = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()
  return `YOUR_${normalizedName || 'CREDENTIAL'}`
}

function redactAuth(auth: RequestAuthInputs = []): RequestAuthInputs {
  return auth.map(input => ({ ...input, value: getAuthPlaceholder(input.name) }))
}

function protectSnippetControlCharacters(value: unknown): unknown {
  if (typeof value === 'string') {
    return snippetControlCharacters.reduce(
      (result, item) => result.replaceAll(item.character, item.placeholder),
      value,
    )
  }

  if (Array.isArray(value)) return value.map(protectSnippetControlCharacters)
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, protectSnippetControlCharacters(item)]),
  )
}

function restoreSnippetControlCharacters(code: string): string {
  return snippetControlCharacters.reduce(
    (result, item) => result.replaceAll(item.placeholder, item.escape),
    code,
  )
}

function getDefaultServer(spec: OpenAPISpec): OpenApiServer {
  const servers = (spec as Record<string, unknown>).servers
  if (!Array.isArray(servers)) return { url: 'https://api.example.com' }

  const firstServer = servers.find(isRecord)
  return firstServer && typeof firstServer.url === 'string' ? firstServer : { url: 'https://api.example.com' }
}

function getDefaultWebhookServer(): OpenApiServer {
  return { url: 'https://webhook.example.com' }
}

function expandServerUrl(server: OpenApiServer, serverVariables: Record<string, string> = {}): string {
  return (server.url ?? 'https://api.example.com').replace(/\{([^}]+)\}/g, (_, name: string) => {
    const fallback = server.variables?.[name]?.default ?? name
    return serverVariables[name] ?? fallback
  })
}

function buildOperationUrl(input: RequestCodeInput): string {
  const defaultServer = input.operationSource === 'webhook' ? getDefaultWebhookServer() : getDefaultServer(input.spec)
  const serverUrl = expandServerUrl(input.server ?? defaultServer, input.serverVariables)
  return joinPath(serverUrl, input.path)
}

function getQueryString(parameters: OpenApiParameter[], auth: RequestAuthInputs = []): HarRequest['queryString'] {
  const queryString = parameters
    .filter((parameter) => parameter.in === 'query' && parameter.name)
    .map((parameter) => ({ name: parameter.name, value: encodeUrlPlaceholders(`{${parameter.name}}`) }))

  for (const input of auth) {
    if (input.scheme.type === 'apiKey' && input.scheme.in === 'query' && input.scheme.name) {
      queryString.push({ name: input.scheme.name, value: input.value })
    }
  }

  return queryString
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

function getFormParams(value: unknown, requestContent: RequestContent): RequestBody['params'] {
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
  return requestBody?.params?.reduce((size: number, param: BodySizeParam) => size + param.name.length + String(param.value ?? '').length, 0) ?? 0
}

function getRequestBody(requestContent?: RequestContent): RequestBody | undefined {
  const value = getContentExample(requestContent?.value)
  if (!requestContent || typeof value === 'undefined') return undefined

  if (isFormMediaType(requestContent.mediaType)) {
    const params = getFormParams(value, requestContent)
    return params.length > 0 ? { params } : undefined
  }

  return { serialized: stringifyExample(protectSnippetControlCharacters(value)) }
}

function getAuthorizationValue(auth: RequestAuthInput): string | undefined {
  if (auth.scheme.type === 'http' && auth.scheme.scheme?.toLowerCase() === 'bearer') return `Bearer ${auth.value}`
  if (auth.scheme.type === 'http' && auth.scheme.scheme?.toLowerCase() === 'basic') return `Basic ${auth.value}`
  if (auth.scheme.type === 'oauth2' || auth.scheme.type === 'openIdConnect') return `Bearer ${auth.value}`
  return undefined
}

function getAuthHeader(auth: RequestAuthInput): Record<string, string> {
  if (auth.scheme.type === 'apiKey' && auth.scheme.in === 'header' && auth.scheme.name) {
    return { [auth.scheme.name]: auth.value }
  }

  const authorization = getAuthorizationValue(auth)
  return authorization ? { Authorization: authorization } : {}
}

function getRequestHeaders(requestContent?: RequestContent, auth: RequestAuthInputs = []): Record<string, string> {
  return {
    ...Object.assign({}, ...auth.map(getAuthHeader)),
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
  const url = encodeUrlPlaceholders(buildOperationUrl(input))

  return {
    method: input.method,
    url,
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headers: Object.entries(getRequestHeaders(input.requestContent, input.auth)).map(([name, value]) => ({ name, value })),
    queryString: getQueryString(input.parameters, input.auth),
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

function buildSnippetErrorMessage(error: unknown): string {
  const detail = error instanceof Error && error.message ? `\n\nDetails: ${error.message}` : ''
  return `Request example unavailable.\n\nThe selected OpenAPI example could not be converted into a code snippet. Please check that the example value matches its media type, for example valid JSON for application/json.${detail}`
}

function buildSnippet(input: RequestCodeInput, target: SnippetTarget): string {
  try {
    const result = snippetGenerator.print(target.target, target.client, buildHarRequest(input))
    return restoreSnippetControlCharacters(decodeUrlPlaceholders(result || ''))
  } catch (error) {
    return buildSnippetErrorMessage(error)
  }
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
  const redactedInput = { ...input, auth: redactAuth(input.auth) }

  return requestSnippetOptions.map((option) => ({
    key: `${option.languageKey}:${option.client}`,
    title: option.title,
    language: option.language,
    languageKey: option.languageKey,
    clientKey: option.client,
    clientTitle: option.clientTitle,
    code: buildSnippet(redactedInput, option),
  }))
}
