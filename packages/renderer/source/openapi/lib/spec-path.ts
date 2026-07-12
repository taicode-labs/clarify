import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useConfig, useLocale, useOpenApiSpecs } from '../../core/context'

import type { OpenAPISpec } from './utils'

type OpenApiSpecResult = {
  spec: OpenAPISpec | null
  loading: boolean
}

type OpenApiSpecModule = { default: OpenAPISpec } | OpenAPISpec

type LoadedSpecState = {
  loader?: () => Promise<OpenApiSpecModule>
  spec: OpenAPISpec | null
}

function isOpenApiSpecLoader(value: unknown): value is () => Promise<OpenApiSpecModule> {
  return typeof value === 'function'
}

function getLoadedSpec(value: OpenApiSpecModule): OpenAPISpec {
  return value && typeof value === 'object' && 'default' in value
    ? value.default
    : value
}

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

/**
 * Prefer a locale-qualified registry key for absolute specPath values, then
 * fall back to the normalized key. The CLI registers visible route aliases,
 * while relative paths already resolve through the current localized route.
 */
function specModuleCandidates(moduleId: string, specPath: string, locale: string | undefined): string[] {
  const candidates: string[] = []
  if (locale && specPath.startsWith('/') && !specPath.startsWith(VIRTUAL_PREFIX)) {
    const rest = moduleId.slice(VIRTUAL_PREFIX.length)
    if (!rest.startsWith(`${locale}/`) && rest !== locale) candidates.push(`${VIRTUAL_PREFIX}${locale}/${rest}`)
  }
  candidates.push(moduleId)
  return candidates
}

export function useOpenApiSpec(spec?: OpenAPISpec, specPath?: string): OpenApiSpecResult {
  const config = useConfig()
  const locale = useLocale()
  const specs = useOpenApiSpecs()
  const location = useLocation()
  const [loadedSpec, setLoadedSpec] = useState<LoadedSpecState>({ spec: null })
  const normalized = specPath ? normalizeSpecPath(specPath, location.pathname, config.routePrefix) : undefined
  const candidates = specPath && normalized ? specModuleCandidates(normalized, specPath, locale) : []
  const registryValue = candidates.map(candidate => specs[candidate]).find(Boolean)

  useEffect(() => {
    let cancelled = false

    if (!isOpenApiSpecLoader(registryValue)) return

    registryValue().then(module => {
      if (!cancelled) setLoadedSpec({ loader: registryValue, spec: getLoadedSpec(module) })
    }).catch(() => {
      if (!cancelled) setLoadedSpec({ loader: registryValue, spec: null })
    })

    return () => {
      cancelled = true
    }
  }, [registryValue])

  if (spec) return { spec, loading: false }
  if (!specPath) return { spec: null, loading: false }
  if (isOpenApiSpecLoader(registryValue)) {
    return loadedSpec.loader === registryValue
      ? { spec: loadedSpec.spec, loading: false }
      : { spec: null, loading: true }
  }
  return { spec: registryValue ?? null, loading: false }
}
