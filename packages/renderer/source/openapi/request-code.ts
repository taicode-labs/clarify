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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function getServerUrl(spec: OpenAPISpec): string {
  const servers = (spec as Record<string, unknown>).servers
  if (!Array.isArray(servers)) return ''

  const firstServer = servers.find(isRecord)
  return typeof firstServer?.url === 'string' ? firstServer.url : ''
}

function buildOperationUrl(spec: OpenAPISpec, path: string, parameters: OpenApiParameter[]): string {
  const query = parameters
    .filter((parameter) => parameter.in === 'query' && parameter.name)
    .map((parameter) => `${parameter.name}={${parameter.name}}`)
    .join('&')
  const serverUrl = getServerUrl(spec).replace(/\/$/, '')
  return `${serverUrl}${path}${query ? `?${query}` : ''}`
}

function getRequestExample(requestContent?: { mediaType: string; value: OpenApiMediaType }): unknown {
  return getContentExample(requestContent?.value)
}

function getRequestHeaders(requestContent?: { mediaType: string; value: OpenApiMediaType }): Record<string, string> {
  return {
    Authorization: 'Bearer {token}',
    Accept: 'application/json',
    ...(requestContent ? { 'Content-Type': requestContent.mediaType } : {}),
  }
}

function buildCurlExample(arg0: RequestCodeInput): string {  const {
  spec,
  path,
  method,
  parameters,
  requestContent,
} = arg0

  const url = buildOperationUrl(spec, path, parameters)
  const lines = [`curl ${method === 'GET' ? '-G ' : ''}${shellQuote(url)}`]

  if (method !== 'GET') lines.push(`  -X ${method}`)
  for (const [name, value] of Object.entries(getRequestHeaders(requestContent))) {
    lines.push(`  -H ${shellQuote(`${name}: ${value}`)}`)
  }

  const requestExample = getRequestExample(requestContent)
  if (requestContent && typeof requestExample !== 'undefined') {
    lines.push(`  -d ${shellQuote(stringifyExample(requestExample))}`)
  }

  return lines.join(' \\\n')
}

function buildJavaScriptExample(arg0: RequestCodeInput): string {  const {
  spec,
  path,
  method,
  parameters,
  requestContent,
} = arg0

  const url = buildOperationUrl(spec, path, parameters)
  const headers = JSON.stringify(getRequestHeaders(requestContent), null, 2)
  const requestExample = getRequestExample(requestContent)
  const body = typeof requestExample === 'undefined'
    ? ''
    : `\nconst body = ${stringifyExample(requestExample)}\n`
  const bodyOption = typeof requestExample === 'undefined'
    ? ''
    : requestContent?.mediaType.includes('json')
      ? ',\n  body: JSON.stringify(body)'
      : ',\n  body'

  return `${body}const response = await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(method)},\n  headers: ${headers}${bodyOption}\n})\n\nconst data = await response.json()`
}

function pythonLiteral(value: unknown, indent = 0): string {
  const nextIndent = indent + 2
  const pad = ' '.repeat(indent)
  const nextPad = ' '.repeat(nextIndent)

  if (value === null) return 'None'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'True' : 'False'

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[\n${value.map((item) => `${nextPad}${pythonLiteral(item, nextIndent)}`).join(',\n')}\n${pad}]`
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    return `{\n${entries.map(([key, item]) => `${nextPad}${JSON.stringify(key)}: ${pythonLiteral(item, nextIndent)}`).join(',\n')}\n${pad}}`
  }

  return 'None'
}

function buildPythonExample(arg0: RequestCodeInput): string {  const {
  spec,
  path,
  method,
  parameters,
  requestContent,
} = arg0

  const url = buildOperationUrl(spec, path, parameters)
  const headers = pythonLiteral(getRequestHeaders(requestContent))
  const requestExample = getRequestExample(requestContent)
  const payload = typeof requestExample === 'undefined'
    ? ''
    : `\npayload = ${pythonLiteral(requestExample)}`
  const bodyArgument = typeof requestExample === 'undefined'
    ? ''
    : requestContent?.mediaType.includes('json')
      ? ', json=payload'
      : ', data=payload'

  return `import requests\n\nurl = ${JSON.stringify(url)}\nheaders = ${headers}${payload}\n\nresponse = requests.request(${JSON.stringify(method)}, url, headers=headers${bodyArgument})\nprint(response.json())`
}

function buildGoExample(arg0: RequestCodeInput): string {  const {
  spec,
  path,
  method,
  parameters,
  requestContent,
} = arg0

  const url = buildOperationUrl(spec, path, parameters)
  const requestExample = getRequestExample(requestContent)
  const bodyText = typeof requestExample === 'undefined' ? '' : stringifyExample(requestExample)
  const bodyReader = bodyText ? `strings.NewReader(${JSON.stringify(bodyText)})` : 'nil'
  const imports = bodyText ? 'import (\n  "fmt"\n  "net/http"\n  "strings"\n)' : 'import (\n  "fmt"\n  "net/http"\n)'
  const headerLines = Object.entries(getRequestHeaders(requestContent))
    .map(([name, value]) => `req.Header.Set(${JSON.stringify(name)}, ${JSON.stringify(value)})`)
    .join('\n')

  return `package main\n\n${imports}\n\nfunc main() {\n  req, err := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, ${bodyReader})\n  if err != nil {\n    panic(err)\n  }\n\n${headerLines.split('\n').map((line) => `  ${line}`).join('\n')}\n\n  resp, err := http.DefaultClient.Do(req)\n  if err != nil {\n    panic(err)\n  }\n  defer resp.Body.Close()\n\n  fmt.Println(resp.Status)\n}`
}

export function buildRequestCodeExamples(input: RequestCodeInput): RequestCodeExample[] {
  return [
    { key: 'curl', title: 'cURL', language: 'bash', code: buildCurlExample(input) },
    { key: 'javascript', title: 'JavaScript', language: 'javascript', code: buildJavaScriptExample(input) },
    { key: 'python', title: 'Python', language: 'python', code: buildPythonExample(input) },
    { key: 'go', title: 'Go', language: 'go', code: buildGoExample(input) },
  ]
}
