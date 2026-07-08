import type { ClarifyVariablesConfig, ClarifyVariableValue } from '../../types.js'

const variablePattern = /{{\s*([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\s*}}/g

function getVariableValue(variables: ClarifyVariablesConfig, path: string): ClarifyVariableValue | undefined {
  let current: ClarifyVariableValue | undefined = variables
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    current = current[segment]
  }
  return current
}

function stringifyVariableValue(variables: ClarifyVariablesConfig, path: string, stack: string[]): string | undefined {
  if (stack.includes(path)) {
    throw new Error(`[clarify] variable "${path}" contains a circular reference: ${[...stack, path].join(' -> ')}`)
  }

  const value = getVariableValue(variables, path)
  if (value === undefined || typeof value === 'object') return undefined
  if (typeof value !== 'string') return String(value)

  return value.replace(variablePattern, (match, nestedPath: string) => stringifyVariableValue(variables, nestedPath, [...stack, path]) ?? match)
}

export function applyVariables(content: string, variables: ClarifyVariablesConfig = {}): string {
  return content.replace(variablePattern, (match, path: string) => stringifyVariableValue(variables, path, []) ?? match)
}
