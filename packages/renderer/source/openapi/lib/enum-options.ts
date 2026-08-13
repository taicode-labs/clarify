import { isRecord } from './helpers'

export type EnumOption = {
  key: string
  value: unknown
  valueText: string
  label: string
  description?: string
}

function enumValueKey(value: unknown): string {
  return `${value === null ? 'null' : typeof value}:${JSON.stringify(value)}`
}

function enumMetadata(schema: Record<string, unknown>, keys: string[], values: unknown[]): Array<string | undefined> {
  const metadata = keys.map((key) => schema[key]).find((value) => Array.isArray(value) || isRecord(value))

  if (Array.isArray(metadata)) {
    return values.map((_, index) => typeof metadata[index] === 'string' ? metadata[index] : undefined)
  }

  if (isRecord(metadata)) {
    return values.map((value) => {
      const item = metadata[String(value)]
      return typeof item === 'string' ? item : undefined
    })
  }

  return values.map(() => undefined)
}

export function getEnumOptions(schema: unknown): EnumOption[] {
  if (!isRecord(schema) || !Array.isArray(schema.enum)) return []

  const values = schema.enum
  const labels = enumMetadata(schema, ['x-enumLabels', 'x-enumNames', 'x-enum-varnames'], values)
  const descriptions = enumMetadata(schema, ['x-enumDescriptions'], values)

  return values.map((value, index) => {
    const valueText = String(value)
    return {
      key: enumValueKey(value),
      value,
      valueText,
      label: labels[index] ?? valueText,
      description: descriptions[index],
    }
  })
}
