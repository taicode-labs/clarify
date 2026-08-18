import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'

import { useSectionStore } from './SectionProvider'

type SectionHashSyncProps = {
  hashScrollSuppressedUntilRef: RefObject<number>
  hashNavigationEpochRef: RefObject<number>
}

const HASH_UPDATE_DEBOUNCE_MS = 120

function replaceHash(sectionId?: string) {
  if (typeof window === 'undefined') return

  const nextHash = sectionId ? `#${encodeURIComponent(sectionId)}` : ''
  if (window.location.hash === nextHash) return
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
}

export function installHashSyncManualInputRelease(hashScrollSuppressedUntilRef: RefObject<number>, hashNavigationEpochRef: RefObject<number>): () => void {
  if (typeof window === 'undefined') return () => {}

  const release = () => {
    hashScrollSuppressedUntilRef.current = 0
    hashNavigationEpochRef.current += 1
  }
  const releaseOnScrollKey = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) release()
  }

  window.addEventListener('wheel', release, { passive: true })
  window.addEventListener('touchmove', release, { passive: true })
  window.addEventListener('pointerdown', release, { passive: true })
  window.addEventListener('keydown', releaseOnScrollKey)
  return () => {
    window.removeEventListener('wheel', release)
    window.removeEventListener('touchmove', release)
    window.removeEventListener('pointerdown', release)
    window.removeEventListener('keydown', releaseOnScrollKey)
  }
}

function useReleaseHashSyncOnManualScroll(hashScrollSuppressedUntilRef: RefObject<number>, hashNavigationEpochRef: RefObject<number>) {
  useEffect(
    () => installHashSyncManualInputRelease(hashScrollSuppressedUntilRef, hashNavigationEpochRef),
    [hashNavigationEpochRef, hashScrollSuppressedUntilRef],
  )
}

export function scheduleSectionHashUpdate(sectionId: string | undefined, hashScrollSuppressedUntilRef: RefObject<number>, hashNavigationEpochRef: RefObject<number>): () => void {
  const scheduledEpoch = hashNavigationEpochRef.current
  const timeout = setTimeout(() => {
    if (scheduledEpoch !== hashNavigationEpochRef.current) return
    if (Date.now() < hashScrollSuppressedUntilRef.current) return
    replaceHash(sectionId)
  }, HASH_UPDATE_DEBOUNCE_MS)
  return () => clearTimeout(timeout)
}

export function SectionHashSync(arg0: SectionHashSyncProps) {
  const { hashNavigationEpochRef, hashScrollSuppressedUntilRef } = arg0
  const location = useLocation()
  const sections = useSectionStore((state) => state.sections)
  const visibleSections = useSectionStore((state) => state.visibleSections)

  useReleaseHashSyncOnManualScroll(hashScrollSuppressedUntilRef, hashNavigationEpochRef)

  useEffect(() => {
    if (!sections.length || !visibleSections.length) return
    if (Date.now() < hashScrollSuppressedUntilRef.current) return

    const visibleSectionId = visibleSections.find((id) => id !== '_top' && sections.some((section) => section.id === id))
    return scheduleSectionHashUpdate(
      visibleSections[0] === '_top' ? undefined : visibleSectionId,
      hashScrollSuppressedUntilRef,
      hashNavigationEpochRef,
    )
  }, [hashNavigationEpochRef, hashScrollSuppressedUntilRef, location.hash, sections, visibleSections])

  return null
}
