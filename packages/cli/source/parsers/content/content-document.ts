import type { ContentBlock, ContentDocument } from '@clarify-labs/renderer'

import type { ContentRoute, ContentRouteIdentity } from '../../types.js'

function withDefinedValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>
}

export function getContentRouteIdentity(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): ContentRouteIdentity {
  const identity = {
    path: route.document?.route?.path ?? route.document?.id ?? route.path,
    title: route.document?.route?.title ?? route.document?.title ?? route.title,
    filePath: route.document?.route?.filePath ?? route.document?.source ?? route.filePath,
  } as ContentRouteIdentity

  const extra = withDefinedValues({
    basePath: route.document?.route?.basePath ?? route.basePath,
    locale: route.document?.route?.locale ?? route.locale,
    isFallback: route.document?.route?.isFallback ?? route.isFallback,
    isBareAlias: route.document?.route?.isBareAlias ?? route.isBareAlias,
    alternates: route.document?.route?.alternates ?? route.alternates,
    virtualModuleId: route.document?.route?.virtualModuleId ?? route.virtualModuleId,
  }) as Partial<ContentRouteIdentity>

  return {
    ...identity,
    ...extra,
  }
}

export function getContentRoutePath(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string {
  return getContentRouteIdentity(route).path
}

export function getContentRouteTitle(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string | undefined {
  return getContentRouteIdentity(route).title
}

export function getContentRouteFilePath(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string | undefined {
  return getContentRouteIdentity(route).filePath
}

export function getContentRouteBasePath(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string | undefined {
  return getContentRouteIdentity(route).basePath
}

export function getContentRouteLocale(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string | undefined {
  return getContentRouteIdentity(route).locale
}

export function getContentRouteIsFallback(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): boolean | undefined {
  return getContentRouteIdentity(route).isFallback
}

export function getContentRouteIsBareAlias(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): boolean | undefined {
  return getContentRouteIdentity(route).isBareAlias
}

export function getContentRouteAlternates(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): Record<string, string> | undefined {
  return getContentRouteIdentity(route).alternates
}

export function getContentRouteVirtualModuleId(route: Pick<ContentRoute, 'document' | 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>): string | undefined {
  return getContentRouteIdentity(route).virtualModuleId
}

export function syncContentDocumentRoute(route: ContentRoute): ContentDocument | undefined {
  if (!route.document) return undefined

  const identity = getContentRouteIdentity(route)
  return {
    ...route.document,
    id: identity.path,
    title: identity.title ?? route.document.title,
    source: identity.filePath ?? route.document.source,
    route: identity,
  }
}

export function createContentDocument(route: Pick<ContentRoute, 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>, blocks: ContentBlock[], metadata: ContentDocument['metadata'] = {}): ContentDocument {
  const identity = getContentRouteIdentity(route)
  return {
    id: identity.path,
    title: identity.title,
    source: identity.filePath,
    route: identity,
    content: blocks,
    metadata,
  }
}
