import type { OpenApiParameter } from '../types'

import { parameterKey } from './api-request'
import { isRecord, resolveSchema, schemaToType } from './helpers'
import type { OpenAPISpec } from './utils'

export type RequestParameterIssue = 'required' | 'invalidArray' | 'invalidObject' | 'invalidNumber' | 'invalidInteger' | 'invalidDate' | 'invalidDateTime' | 'invalidEnum'

function structuredIssue(value: string, type: string): RequestParameterIssue | undefined {
  if (!type.includes('[]') && !type.includes('object')) return undefined

  try {
    const parsed = JSON.parse(value)
    if (type.includes('[]') && !Array.isArray(parsed)) return 'invalidArray'
    if (type.includes('object') && !isRecord(parsed)) return 'invalidObject'
  } catch {
    return type.includes('[]') ? 'invalidArray' : 'invalidObject'
  }

  return undefined
}

function scalarIssue(value: string, type: string, format: unknown): RequestParameterIssue | undefined {
  if (type.includes('integer') && !Number.isInteger(Number(value))) return 'invalidInteger'
  if (type.includes('number') && !Number.isFinite(Number(value))) return 'invalidNumber'
  if (format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'invalidDate'
  if (format === 'date-time' && Number.isNaN(Date.parse(value))) return 'invalidDateTime'
  return undefined
}

export function validateRequestParameter(spec: OpenAPISpec, parameter: OpenApiParameter, value: string): RequestParameterIssue | undefined {
  if (!value) return parameter.required ? 'required' : undefined

  const schema = resolveSchema(spec, parameter.schema)
  const schemaRecord = isRecord(schema) ? schema : undefined
  const type = schemaToType(schema) ?? 'string'
  const options = Array.isArray(schemaRecord?.enum) ? schemaRecord.enum.map(String) : []

  if (options.length > 0 && !options.includes(value)) return 'invalidEnum'
  return structuredIssue(value, type) ?? scalarIssue(value, type, schemaRecord?.format)
}

export function validateRequestParameters(spec: OpenAPISpec, parameters: OpenApiParameter[], values: Record<string, string>): Record<string, RequestParameterIssue> {
  return Object.fromEntries(parameters.filter((parameter) => parameter.in !== 'cookie').flatMap((parameter) => {
    const key = parameterKey(parameter)
    const issue = validateRequestParameter(spec, parameter, values[key] ?? '')
    return issue ? [[key, issue]] : []
  }))
}
