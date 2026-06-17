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
  offsetRem?: number
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

function useVisibleSections(sectionStore: StoreApi<SectionState>) {
  const setVisibleSections = useStore(sectionStore, (state) => state.setVisibleSections)
  const sections = useStore(sectionStore, (state) => state.sections)

  useEffect(() => {
    function checkVisibleSections() {
      const { innerHeight, scrollY } = window
      const newVisibleSections: string[] = []

      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const { id, headingRef, offsetRem = 0 } = sections[sectionIndex]

        if (!headingRef?.current) {
          continue
        }

        const offset = remToPx(offsetRem)
        const top = headingRef.current.getBoundingClientRect().top + scrollY

        if (sectionIndex === 0 && top - offset > scrollY) {
          newVisibleSections.push('_top')
        }

        const nextSection = sections[sectionIndex + 1]
        const bottom =
          (nextSection?.headingRef?.current?.getBoundingClientRect().top ?? Infinity) +
          scrollY -
          remToPx(nextSection?.offsetRem ?? 0)

        if (
          (top > scrollY && top < scrollY + innerHeight) ||
          (bottom > scrollY && bottom < scrollY + innerHeight) ||
          (top <= scrollY && bottom >= scrollY + innerHeight)
        ) {
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
  }, [setVisibleSections, sections])
}

const SectionStoreContext = createContext<StoreApi<SectionState> | null>(null)

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function SectionProvider({
  sections,
  children,
}: {
  sections: Section[]
  children: ReactNode
}) {
  const [sectionStore] = useState(() => createSectionStore(sections))

  useVisibleSections(sectionStore)

  useIsomorphicLayoutEffect(() => {
    sectionStore.setState({ sections })
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
