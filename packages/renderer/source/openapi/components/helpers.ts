import { useBuiltInText } from '../../core/i18n'
import { getOperationPathItem, isRecord } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type {
  ExampleEntry,
  OpenApiSecurityRequirement,
  OpenApiSecurityScheme,
  OpenApiServer,
  RequestCodeExample,
} from '../types'

import type { SelectOption } from './SelectControl'

type AuthPlaceholderArg = { scheme: OpenApiSecurityScheme }

export function getServers(spec: OpenAPISpec, operation: OpenAPIOperation, path?: string, source: OpenAPIOperationSource = 'path'): OpenApiServer[] {
  const operationServers = (operation as Record<string, unknown>).servers
  const pathServers = path ? getOperationPathItem(spec, path, source)?.servers : undefined
  const servers = Array.isArray(operationServers)
    ? operationServers
    : Array.isArray(pathServers)
      ? pathServers
      : source === 'webhook'
        ? [{ url: 'https://webhook.example.com' }]
        : (spec as Record<string, unknown>).servers
  if (!Array.isArray(servers)) return [{ url: 'https://api.example.com' }]
  const validServers = servers.filter((server): server is OpenApiServer => isRecord(server) && typeof server.url === 'string')
  return validServers.length > 0 ? validServers : [{ url: 'https://api.example.com' }]
}

export function getServerKey(server: OpenApiServer, index: number): string {
  return `${index}:${server.url ?? ''}`
}

export function getServerLabel(server: OpenApiServer, index: number): string {
  return server.url ?? `Server ${index + 1}`
}

export function defaultServerVariables(server?: OpenApiServer): Record<string, string> {
  return Object.fromEntries(
    Object.entries(server?.variables ?? {}).map(([name, variable]) => [name, variable.default ?? variable.enum?.[0] ?? '']),
  )
}

function getSecuritySchemes(spec: OpenAPISpec): Record<string, OpenApiSecurityScheme> {
  const schemes = (spec as Record<string, unknown>).components
  if (!isRecord(schemes) || !isRecord(schemes.securitySchemes)) return {}

  return Object.fromEntries(
    Object.entries(schemes.securitySchemes).filter((entry): entry is [string, OpenApiSecurityScheme] => isRecord(entry[1])),
  )
}

function getSecurityRequirements(spec: OpenAPISpec, operation: OpenAPIOperation): OpenApiSecurityRequirement[] {
  const operationSecurity = (operation as Record<string, unknown>).security
  if (Array.isArray(operationSecurity)) return operationSecurity.filter(isRecord) as OpenApiSecurityRequirement[]

  const specSecurity = (spec as Record<string, unknown>).security
  return Array.isArray(specSecurity) ? specSecurity.filter(isRecord) as OpenApiSecurityRequirement[] : []
}

export type AuthSchemeOption = { name: string; scheme: OpenApiSecurityScheme; scopes: string[] }
export type AuthOption = { key: string; label: string; schemes: AuthSchemeOption[] }

export function getAuthOptions(spec: OpenAPISpec, operation: OpenAPIOperation): AuthOption[] {
  const schemes = getSecuritySchemes(spec)
  const requirements = getSecurityRequirements(spec, operation)

  return requirements.map((requirement, index) => {
    const requirementSchemes = Object.keys(requirement)
      .map((name) => ({ name, scheme: schemes[name], scopes: requirement[name] ?? [] }))
      .filter((option): option is AuthSchemeOption => Boolean(option.scheme))
    return {
      key: `requirement:${index}`,
      label: requirementSchemes.map((option) => option.name).join(' + '),
      schemes: requirementSchemes,
    }
  })
}

export function authPlaceholder(auth?: AuthPlaceholderArg): string {
  if (!auth) return ''
  if (auth.scheme.type === 'apiKey') return '{api_key}'
  if (auth.scheme.type === 'http' && auth.scheme.scheme?.toLowerCase() === 'basic') return '{base64_credentials}'
  return '{token}'
}

export function authLabel(name: string, scheme: OpenApiSecurityScheme): string {
  const location = scheme.type === 'apiKey' && scheme.in && scheme.name ? ` · ${scheme.in}: ${scheme.name}` : ''
  return `${name}${location}`
}

export function getExampleLabel(example: ExampleEntry, t: ReturnType<typeof useBuiltInText>): string {
  return example.generated && example.title === 'schema' ? t('openapi.schemaExample') : example.title
}

export function getLanguageOptions(codeOptions?: RequestCodeExample[]): SelectOption[] {
  const languages = new Map<string, string>()
  for (const option of codeOptions ?? []) languages.set(option.languageKey, option.title)
  return Array.from(languages, ([value, label]) => ({ value, label }))
}

export function getClientOptions(codeOptions: RequestCodeExample[] | undefined, languageKey?: string): SelectOption[] {
  return (codeOptions ?? [])
    .filter((option) => option.languageKey === languageKey)
    .map((option) => ({ value: option.clientKey, label: option.clientTitle }))
}
