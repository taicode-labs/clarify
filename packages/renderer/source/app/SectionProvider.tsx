import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'

import { remToPx } from '../utils/remToPx'

export interface Section {
  id: string
  title: string
  level?: number
  offsetRem?: number
  badge?: string
  tags?: string[]
  headingRef?: RefObject<HTMLHeadingElement | null>
}

interface SectionState {
  sections: Section[]
  visibleSections: string[]
  setVisibleSections: (visibleSections: string[]) => void
  registerHeading: (heading: {
    id: string
    ref: RefObject<HTMLHeadingElement | null>
    offsetRem: number
  }) => void
}

function createSectionStore(sections: Section[]) {
  return createStore<SectionState>()((set) => ({
    sections,
    visibleSections: [],
    setVisibleSections: (visibleSections) =>
      set((state) =>
        state.visibleSections.join() === visibleSections.join()
          ? {}
          : { visibleSections },
      ),
    registerHeading: ({ id, ref, offsetRem }) =>
      set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id
            ? {
                ...section,
                headingRef: ref,
                offsetRem,
              }
            : section,
        ),
      })),
  }))
}

function getHeaderBlockedTop(innerHeight: number, headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  const blockedTop = headerTopAreaRef?.current?.offsetHeight ?? 0
  return Math.max(0, Math.min(innerHeight, blockedTop))
}

function getVisibleViewportTop(scrollY: number, innerHeight: number, headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  return scrollY + getHeaderBlockedTop(innerHeight, headerTopAreaRef)
}

function getVisibleViewportBottom(scrollY: number, innerHeight: number, headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  const blockedTop = getHeaderBlockedTop(innerHeight, headerTopAreaRef)

  return scrollY + Math.max(0, innerHeight - blockedTop)
}

type VisibilitySnapshot = {
  scrollY: number
  innerHeight: number
  blockedTop: number
  viewportTop: number
  viewportBottom: number
  visibleSections: string[]
}

function computeVisibleSections(sections: Section[], scrollY: number, viewportTop: number, viewportBottom: number) {
  const visibleSections: string[] = []

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const { id, headingRef, offsetRem = 0 } = sections[sectionIndex]

    if (!headingRef?.current) continue

    const offset = remToPx(offsetRem)
    const top = headingRef.current.getBoundingClientRect().top + scrollY
    const sectionTop = top - offset

    if (sectionIndex === 0 && sectionTop > viewportTop) {
      visibleSections.push('_top')
    }

    const nextSection = sections[sectionIndex + 1]
    const nextOffset = remToPx(nextSection?.offsetRem ?? offsetRem)
    const sectionBottom =
      (nextSection?.headingRef?.current?.getBoundingClientRect().top ?? Infinity) +
      scrollY -
      nextOffset

    if (sectionBottom > viewportTop && sectionTop < viewportBottom) {
      visibleSections.push(id)
    }
  }

  return visibleSections
}

function useSectionVisibilityDebug(_headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  const lastDebugSignatureRef = useRef('')

  return (snapshot: VisibilitySnapshot) => {
    const { scrollY, innerHeight, blockedTop, visibleSections } = snapshot
    const debugSignature = [
      Math.round(scrollY),
      innerHeight,
      Math.round(blockedTop),
      visibleSections.join(','),
    ].join('|')

    if (lastDebugSignatureRef.current === debugSignature) return
    lastDebugSignatureRef.current = debugSignature
  }
}

function useSectionVisibilityObserver(checkVisibleSections: () => void, headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined

    checkVisibleSections()
    window.addEventListener('scroll', checkVisibleSections, { passive: true })
    window.addEventListener('resize', checkVisibleSections)

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            checkVisibleSections()
          })
    if (resizeObserver && headerTopAreaRef?.current) {
      resizeObserver.observe(headerTopAreaRef.current)
    }

    return () => {
      window.removeEventListener('scroll', checkVisibleSections)
      window.removeEventListener('resize', checkVisibleSections)
      resizeObserver?.disconnect()
    }
  }, [checkVisibleSections, headerTopAreaRef])
}

function useVisibleSections(sectionStore: StoreApi<SectionState>, headerTopAreaRef?: RefObject<HTMLDivElement | null>) {
  const setVisibleSections = useStore(sectionStore, (state) => state.setVisibleSections)
  const sections = useStore(sectionStore, (state) => state.sections)
  const emitVisibilityDebug = useSectionVisibilityDebug(headerTopAreaRef)

  const checkVisibleSections = useCallback(() => {
    if (typeof window === 'undefined') return

    const { innerHeight, scrollY } = window
    const viewportTop = getVisibleViewportTop(scrollY, innerHeight, headerTopAreaRef)
    const viewportBottom = getVisibleViewportBottom(scrollY, innerHeight, headerTopAreaRef)
    const blockedTop = getHeaderBlockedTop(innerHeight, headerTopAreaRef)
    const newVisibleSections = computeVisibleSections(sections, scrollY, viewportTop, viewportBottom)

    emitVisibilityDebug({
      scrollY,
      innerHeight,
      blockedTop,
      viewportTop,
      viewportBottom,
      visibleSections: newVisibleSections,
    })

    setVisibleSections(newVisibleSections)
  }, [emitVisibilityDebug, headerTopAreaRef, sections, setVisibleSections])

  useSectionVisibilityObserver(checkVisibleSections, headerTopAreaRef)
}

function useSyncSections(sectionStore: StoreApi<SectionState>, sections: Section[]) {
  useIsomorphicLayoutEffect(() => {
    sectionStore.setState((state) => {
      const nextSections = sections.map((section) => {
        const registeredSection = state.sections.find((item) => item.id === section.id)
        return {
          ...section,
          headingRef: registeredSection?.headingRef,
          offsetRem: registeredSection?.offsetRem ?? section.offsetRem,
        }
      })
      const nextSectionIds = new Set(nextSections.map(section => section.id))

      return {
        sections: nextSections,
        visibleSections: state.visibleSections.filter(id => id === '_top' || nextSectionIds.has(id)),
      }
    })
  }, [sectionStore, sections])
}

const SectionStoreContext = createContext<StoreApi<SectionState> | null>(null)

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type SectionProviderProps = {
  sections: Section[]
  headerTopAreaRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function SectionProvider(arg0: SectionProviderProps) {  const {
  sections,
  headerTopAreaRef,
  children,
} = arg0

  const [sectionStore] = useState(() => createSectionStore(sections))

  useVisibleSections(sectionStore, headerTopAreaRef)
  useSyncSections(sectionStore, sections)

  return <SectionStoreContext.Provider value={sectionStore}>{children}</SectionStoreContext.Provider>
}

export function useSectionStore<T>(selector: (state: SectionState) => T) {
  const store = useContext(SectionStoreContext)

  if (!store) {
    throw new Error('[clarify] useSectionStore must be used within SectionProvider')
  }

  return useStore(store, selector)
}
