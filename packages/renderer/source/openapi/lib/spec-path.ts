import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useConfig, useLocale, useOpenApis } from '../../core/context'

import type { OpenAPISpec } from './utils'

type OpenApiSpecResult = {
  spec: OpenAPISpec | null
  loading: boolean
}

type OpenApiSpecModule = { default: OpenAPISpec } | OpenAPISpec
type LoadedOpenApiSpec = {
  loader: () => Promise<OpenApiSpecModule>
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
 * 为绝对 specPath 生成带 locale 前缀的候选模块 ID。
 *
 * 所有 locale 的 spec 都注册在 `virtual:clarify-page/<locale>/...` 下，
 * 因此绝对路径（如 `/api`）需要显式注入 locale 前缀才能命中。
 * 相对路径会因为当前路由已含 locale 前缀而自动解析到正确的 spec。
 */
function localizeSpecModuleId(moduleId: string, specPath: string, locale: string | undefined, _defaultLocale: string | undefined): string | undefined {
  if (!locale) return undefined
  // 仅处理绝对路径；相对路径已经基于含 locale 前缀的当前路由解析。
  if (!specPath.startsWith('/') || specPath.startsWith(VIRTUAL_PREFIX)) return undefined
  const rest = moduleId.slice(VIRTUAL_PREFIX.length)
  if (rest.startsWith(`${locale}/`) || rest === locale) return undefined
  return `${VIRTUAL_PREFIX}${locale}/${rest}`
}

export function useOpenApiSpec(spec?: OpenAPISpec, specPath?: string): OpenApiSpecResult {
  const config = useConfig()
  const locale = useLocale()
  const specs = useOpenApis()
  const location = useLocation()
  const [loadedSpec, setLoadedSpec] = useState<LoadedOpenApiSpec | null>(null)
  const normalized = specPath ? normalizeSpecPath(specPath, location.pathname, config.routePrefix) : undefined
  const localized = specPath && normalized ? localizeSpecModuleId(normalized, specPath, locale, config.i18n?.defaultLocale) : undefined
  const registryValue = normalized ? (localized && specs[localized] ? specs[localized] : specs[normalized]) : undefined

  useEffect(() => {
    let cancelled = false

    if (!isOpenApiSpecLoader(registryValue)) return

    registryValue()
      .then(module => {
        if (!cancelled) setLoadedSpec({ loader: registryValue, spec: getLoadedSpec(module) })
      })
      .catch(() => {
        if (!cancelled) setLoadedSpec({ loader: registryValue, spec: null })
      })

    return () => {
      cancelled = true
    }
  }, [registryValue])

  if (spec) return { spec, loading: false }
  if (!specPath) return { spec: null, loading: false }
  if (isOpenApiSpecLoader(registryValue)) {
    const currentSpec = loadedSpec?.loader === registryValue ? loadedSpec.spec : null
    return { spec: currentSpec, loading: loadedSpec?.loader !== registryValue }
  }
  return { spec: registryValue ?? null, loading: false }
}
