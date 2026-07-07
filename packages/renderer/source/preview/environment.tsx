import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { SectionProvider } from '../app/SectionProvider'
import type { Section } from '../app/SectionProvider'
import { ConfigContext, LocaleContext, OpenApisContext } from '../core/context'

import { previewConfig } from './fixtures'

type PreviewEnvironmentProps = {
  children: ReactNode
  initialEntry?: string
  sections?: Section[]
}

export function PreviewEnvironment(arg0: PreviewEnvironmentProps) {
  const { children, initialEntry = '/preview', sections = [] } = arg0

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <ConfigContext.Provider value={previewConfig}>
        <LocaleContext.Provider value={previewConfig.i18n.defaultLocale}>
          <OpenApisContext.Provider value={{}}>
            <SectionProvider sections={sections}>
              {children}
            </SectionProvider>
          </OpenApisContext.Provider>
        </LocaleContext.Provider>
      </ConfigContext.Provider>
    </MemoryRouter>
  )
}
