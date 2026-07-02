import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
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

function getVisibleViewportTop(scrollY: number, headerRef?: RefObject<HTMLElement | null>) {
  const headerBottom = headerRef?.current?.getBoundingClientRect().bottom ?? 0

  return scrollY + Math.max(0, headerBottom)
}

function useVisibleSections(sectionStore: StoreApi<SectionState>, headerRef?: RefObject<HTMLElement | null>) {
  const setVisibleSections = useStore(sectionStore, (state) => state.setVisibleSections)
  const sections = useStore(sectionStore, (state) => state.sections)

  useEffect(() => {
    function checkVisibleSections() {
      const { innerHeight, scrollY } = window
      const viewportTop = getVisibleViewportTop(scrollY, headerRef)
      const viewportBottom = scrollY + innerHeight
      const newVisibleSections: string[] = []

      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const { id, headingRef, offsetRem = 0 } = sections[sectionIndex]

        if (!headingRef?.current) {
          continue
        }

        const offset = remToPx(offsetRem)
        const top = headingRef.current.getBoundingClientRect().top + scrollY

        if (sectionIndex === 0 && top - offset > viewportTop) {
          newVisibleSections.push('_top')
        }

        const nextSection = sections[sectionIndex + 1]
        const bottom =
          (nextSection?.headingRef?.current?.getBoundingClientRect().top ?? Infinity) +
          scrollY

        if (bottom > viewportTop && top < viewportBottom) {
          newVisibleSections.push(id)
        }
      }

      setVisibleSections(newVisibleSections)
    }

    const raf = window.requestAnimationFrame(() => checkVisibleSections())
    window.addEventListener('scroll', checkVisibleSections, { passive: true })
    window.addEventListener('resize', checkVisibleSections)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', checkVisibleSections)
      window.removeEventListener('resize', checkVisibleSections)
    }
  }, [headerRef, setVisibleSections, sections])
}

const SectionStoreContext = createContext<StoreApi<SectionState> | null>(null)

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type SectionProviderProps = {
  sections: Section[]
  headerRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function SectionProvider(arg0: SectionProviderProps) {  const {
  sections,
  headerRef,
  children,
} = arg0

  const [sectionStore] = useState(() => createSectionStore(sections))

  useVisibleSections(sectionStore, headerRef)

  useIsomorphicLayoutEffect(() => {
    sectionStore.setState((state) => ({
      sections: sections.map((section) => {
        const registeredSection = state.sections.find((item) => item.id === section.id)
        return {
          ...section,
          headingRef: registeredSection?.headingRef,
          offsetRem: registeredSection?.offsetRem ?? section.offsetRem,
        }
      }),
      visibleSections: [],
    }))
  }, [sectionStore, sections])

  return <SectionStoreContext.Provider value={sectionStore}>{children}</SectionStoreContext.Provider>
}

export function useSectionStore<T>(selector: (state: SectionState) => T) {
  const store = useContext(SectionStoreContext)

  if (!store) {
    throw new Error('[clarify] useSectionStore must be used within SectionProvider')
  }

  return useStore(store, selector)
}
