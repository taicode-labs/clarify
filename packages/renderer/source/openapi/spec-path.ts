import { useLocation } from 'react-router-dom'

import { useClarifyConfig, useOpenApis } from '../context'

import type { OpenAPISpec } from './utils'

const VIRTUAL_PREFIX = 'virtual:clarify-page/'

function resolveRelativePath(fromDir: string, to: string): string {
  const parts = (fromDir + '/' + to).split('/').filter(Boolean)
  const stack: string[] = []
  for (const part of parts) {
    if (part === '..') {
      stack.pop()
    } else if (part !== '.') {
      stack.push(part)
    }
  }
  return stack.join('/')
}

function normalizeSpecPath(specPath: string, currentRoutePath?: string, routePrefix = ''): string {
  if (specPath.startsWith(VIRTUAL_PREFIX)) return specPath

  const normalizedRoutePrefix = routePrefix.replace(/^\/+|\/+$/g, '')
  const normalizedSpecPath = specPath.startsWith('/') && normalizedRoutePrefix && specPath.slice(1).startsWith(`${normalizedRoutePrefix}/`)
    ? '/' + specPath.slice(normalizedRoutePrefix.length + 2)
    : specPath

  if (normalizedSpecPath.startsWith('/')) {
    return VIRTUAL_PREFIX + normalizedSpecPath.replace(/^\//, '')
  }
  const fromDir = currentRoutePath === '/' ? '' : currentRoutePath?.replace(/^\//, '').replace(/\/[^/]*$/, '') ?? ''
  const normalizedFromDir = normalizedRoutePrefix && fromDir.startsWith(`${normalizedRoutePrefix}/`)
    ? fromDir.slice(normalizedRoutePrefix.length + 1)
    : fromDir
  return VIRTUAL_PREFIX + resolveRelativePath(normalizedFromDir, normalizedSpecPath)
}

export function useOpenApiSpec(spec?: OpenAPISpec, specPath?: string): OpenAPISpec | null {
  const specs = useOpenApis()
  const location = useLocation()
  const config = useClarifyConfig()

  if (spec) return spec
  if (!specPath) return null

  const normalized = normalizeSpecPath(specPath, location.pathname, config.routePrefix)
  return specs[normalized] ?? null
}
