import type { ApiRequestSnapshot } from './api-exchange'

export type ApiExchangeCodeExample = {
  id: 'curl' | 'fetch'
  label: string
  language: 'bash' | 'javascript'
  code: string
}

const sensitiveName = /authorization|cookie|api[-_]?key|token|secret|signature/i

function redactUrl(value: string): string {
  const url = new URL(value)
  Array.from(url.searchParams.keys()).forEach((name) => {
    if (sensitiveName.test(name)) url.searchParams.set(name, '<redacted>')
  })
  return url.toString()
}

function redactedHeaders(headers: Array<[string, string]>): Array<[string, string]> {
  return headers.map(([name, value]) => [name, sensitiveName.test(name) ? '<redacted>' : value])
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function buildCurl(snapshot: ApiRequestSnapshot): string {
  const lines = [`curl --request ${snapshot.method.toUpperCase()} ${shellQuote(redactUrl(snapshot.url))}`]
  redactedHeaders(snapshot.headers).forEach(([name, value]) => lines.push(`  --header ${shellQuote(`${name}: ${value}`)}`))
  if (snapshot.body) lines.push(`  --data-raw ${shellQuote(snapshot.body)}`)
  return lines.join(' \\\n')
}

function buildFetch(snapshot: ApiRequestSnapshot): string {
  const init = {
    method: snapshot.method.toUpperCase(),
    headers: Object.fromEntries(redactedHeaders(snapshot.headers)),
    ...(snapshot.body ? { body: snapshot.body } : {}),
  }
  return `const response = await fetch(${JSON.stringify(redactUrl(snapshot.url))}, ${JSON.stringify(init, null, 2)})`
}

export function buildApiExchangeCodeExamples(snapshot: ApiRequestSnapshot): ApiExchangeCodeExample[] {
  return [
    { id: 'curl', label: 'cURL', language: 'bash', code: buildCurl(snapshot) },
    { id: 'fetch', label: 'Fetch', language: 'javascript', code: buildFetch(snapshot) },
  ]
}
