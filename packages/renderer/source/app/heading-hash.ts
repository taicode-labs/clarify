export type ResolvedHeadingHash = {
  requestedId: string
  canonicalId: string
  wasAlias: boolean
}

const HASH_SCROLL_RETRY_DELAYS = [0, 100, 300, 700, 1200]

export function resolveHeadingHash(hash: string, aliases?: Record<string, string>): ResolvedHeadingHash | undefined {
  let requestedId: string
  try {
    requestedId = decodeURIComponent(hash.startsWith('#') ? hash.slice(1) : hash)
  } catch {
    return undefined
  }

  const mappedId = aliases && Object.hasOwn(aliases, requestedId) ? aliases[requestedId] : undefined
  const canonicalId = mappedId ?? requestedId
  return {
    requestedId,
    canonicalId,
    wasAlias: canonicalId !== requestedId,
  }
}

export function canonicalHeadingUrl(location: Pick<Location, 'pathname' | 'search'>, canonicalId: string): string {
  return `${location.pathname}${location.search}#${encodeURIComponent(canonicalId)}`
}

export function scrollToHeadingId(id: string): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !id) return () => {}

  const timeouts: ReturnType<typeof setTimeout>[] = []
  let cancelled = false

  const cancel = () => {
    cancelled = true
    timeouts.forEach(clearTimeout)
  }
  const cancelOnScrollKey = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) cancel()
  }
  const tryScrollToTarget = (attempt: number) => {
    if (cancelled) return
    const target = document.getElementById(id)
    if (!target) return

    target.scrollIntoView({ behavior: attempt === 0 ? 'smooth' : 'auto', block: 'start' })
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'))
    })
  }

  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchmove', cancel, { passive: true })
  window.addEventListener('pointerdown', cancel, { passive: true })
  window.addEventListener('keydown', cancelOnScrollKey)
  HASH_SCROLL_RETRY_DELAYS.forEach((delay, attempt) => {
    timeouts.push(setTimeout(() => tryScrollToTarget(attempt), delay))
  })

  return () => {
    cancel()
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchmove', cancel)
    window.removeEventListener('pointerdown', cancel)
    window.removeEventListener('keydown', cancelOnScrollKey)
  }
}
