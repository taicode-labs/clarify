import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { Chrome } from '../chrome'
import { PreviewEnvironment } from '../environment'
import { embeddedEndpoint, embeddedGuide, mainPreviewPath, mainPreviewSections } from '../fixtures'
import { MainContentPreview } from '../main-content'
import { MainPreviewMobileNavigation, PreviewNavigation } from '../navigation'

export function MainPreview() {
  const [isMobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const navigationProps = { endpoint: embeddedEndpoint, guide: embeddedGuide, outputs: embeddedGuide.outputs ?? [] }

  return (
    <PreviewEnvironment initialEntry={mainPreviewPath} sections={mainPreviewSections}>
      <Chrome
        title="source/en-US/openapi/embedding.mdx"
        status="Rendered from OpenAPI + MDX"
        headerAction={
          <button
            type="button"
            className="clarify-preview-mobile-menu-button -my-1 flex size-7 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-strong) transition hover:bg-(--clarify-ui-hover-background)"
            aria-controls="clarify-main-preview-mobile-navigation"
            aria-expanded={isMobileNavigationOpen}
            aria-label={isMobileNavigationOpen ? 'Close documentation menu' : 'Open documentation menu'}
            onClick={() => setMobileNavigationOpen((value) => !value)}
          >
            {isMobileNavigationOpen ? <X className="h-4 w-4 shrink-0" /> : <Menu className="h-4 w-4 shrink-0" />}
          </button>
        }
      >
        <div className="clarify-preview-shell relative grid overflow-hidden">
          <MainPreviewMobileNavigation {...navigationProps} isOpen={isMobileNavigationOpen} onClose={() => setMobileNavigationOpen(false)} />
          <aside className="clarify-preview-sidebar border-r border-(--clarify-theme-tokens-colors-border) px-1 py-4 text-sm/7 dark:border-white/10 dark:bg-white/5">
            <PreviewNavigation {...navigationProps} />
          </aside>
          <MainContentPreview />
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}
