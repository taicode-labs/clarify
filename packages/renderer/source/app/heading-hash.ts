export type ResolvedHeadingHash = {
  requestedId: string
  canonicalId: string
  wasAlias: boolean
}

export function resolveHeadingHash(hash: string, aliases?: Record<string, string>): ResolvedHeadingHash | undefined {
  let requestedId: string
  try {
    requestedId = decodeURIComponent(hash.startsWith('#') ? hash.slice(1) : hash)
  } catch {
    return undefined
  }

  const canonicalId = aliases?.[requestedId] ?? requestedId
  return {
    requestedId,
    canonicalId,
    wasAlias: canonicalId !== requestedId,
  }
}

export function canonicalHeadingUrl(location: Pick<Location, 'pathname' | 'search'>, canonicalId: string): string {
  return `${location.pathname}${location.search}#${encodeURIComponent(canonicalId)}`
}
