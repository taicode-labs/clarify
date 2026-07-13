import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'

import { safeDecodeURIComponent } from '../utils/hash'

import { useSectionStore } from './SectionProvider'

type SectionHashSyncProps = {
  hashScrollSuppressedUntilRef: RefObject<number>
}

const HASH_UPDATE_DEBOUNCE_MS = 120

function replaceHash(sectionId?: string) {
  if (typeof window === 'undefined') return

  const nextHash = sectionId ? `#${encodeURIComponent(sectionId)}` : ''
  if (window.location.hash === nextHash) return
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
}

function useReleaseHashSyncOnManualScroll(hashScrollSuppressedUntilRef: RefObject<number>) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const release = () => {
      hashScrollSuppressedUntilRef.current = 0
    }
    const releaseOnScrollKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) release()
    }

    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchmove', release, { passive: true })
    window.addEventListener('keydown', releaseOnScrollKey)
    return () => {
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchmove', release)
      window.removeEventListener('keydown', releaseOnScrollKey)
    }
  }, [hashScrollSuppressedUntilRef])
}

export function SectionHashSync(arg0: SectionHashSyncProps) {
  const { hashScrollSuppressedUntilRef } = arg0
  const location = useLocation()
  const pathnameRef = useRef(location.pathname)
  const hashUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sections = useSectionStore((state) => state.sections)
  const visibleSections = useSectionStore((state) => state.visibleSections)

  if (pathnameRef.current !== location.pathname) {
    pathnameRef.current = location.pathname
    hashScrollSuppressedUntilRef.current = Date.now() + 1200
  }

  useReleaseHashSyncOnManualScroll(hashScrollSuppressedUntilRef)

  useEffect(() => {
    if (!sections.length || !visibleSections.length) return
    if (!location.hash && Date.now() < hashScrollSuppressedUntilRef.current) return

    const visibleSectionId = visibleSections.find((id) => id !== '_top' && sections.some((section) => section.id === id))
    const hashSectionId = location.hash ? safeDecodeURIComponent(location.hash.slice(1)) : undefined

    if (hashSectionId && Date.now() < hashScrollSuppressedUntilRef.current && !visibleSections.includes(hashSectionId)) return

    hashUpdateTimeoutRef.current = setTimeout(() => {
      replaceHash(visibleSections[0] === '_top' ? undefined : visibleSectionId)
    }, HASH_UPDATE_DEBOUNCE_MS)

    return () => {
      if (hashUpdateTimeoutRef.current !== undefined) {
        clearTimeout(hashUpdateTimeoutRef.current)
        hashUpdateTimeoutRef.current = undefined
      }
    }
  }, [hashScrollSuppressedUntilRef, location.hash, sections, visibleSections])

  return null
}
