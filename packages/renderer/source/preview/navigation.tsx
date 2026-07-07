import type { NavigationNode } from '../core/types'
import { Navigation } from '../shell'

import { mainPreviewPath, staticOutputEndpoint } from './fixtures'
import type { PreviewEndpoint } from './openapi'
import type { PreviewGuide } from './types'

type CreatePreviewNavigationProps = {
  endpoint: PreviewEndpoint
  guide?: PreviewGuide
  outputs: string[]
}

export type PreviewNavigationProps = {
  endpoint: PreviewEndpoint
  guide?: PreviewGuide
  outputs: string[]
}

function createPreviewNavigation(arg0: CreatePreviewNavigationProps): NavigationNode[] {
  const { endpoint, guide, outputs } = arg0

  return [
    {
      title: 'Guides',
      path: '/guides',
      icon: 'BookOpenText',
      children: [
        { title: guide?.title ?? 'MDX guide', path: mainPreviewPath, icon: 'FileText' },
        { title: 'Getting started', path: '/getting-started', icon: 'Rocket' },
      ],
    },
    {
      title: 'API Reference',
      path: '/api',
      icon: 'Braces',
      children: [
        { title: endpoint.summary, path: endpoint.path, icon: 'Cable' },
        { title: 'Generate static output', path: staticOutputEndpoint.path, icon: 'UploadCloud' },
      ],
    },
    {
      title: 'Build Output',
      path: '/output',
      icon: 'PackageCheck',
      children: [
        { title: `Routes (${outputs.length})`, path: '/output/routes', icon: 'ListTree' }
      ],
    },
  ] satisfies NavigationNode[]
}

export function PreviewNavigation(arg0: PreviewNavigationProps) {
  return <Navigation navigation={createPreviewNavigation(arg0)} className="px-2" />
}

type MainPreviewMobileNavigationProps = PreviewNavigationProps & {
  isOpen: boolean
  onClose: () => void
}

export function MainPreviewMobileNavigation(arg0: MainPreviewMobileNavigationProps) {
  const { isOpen, onClose, ...navigationProps } = arg0
  const navigationId = 'clarify-main-preview-mobile-navigation'

  return (
    <div className="clarify-preview-mobile-navigation pointer-events-none absolute inset-0 z-20">
      {isOpen ? (
        <button
          type="button"
          className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] dark:bg-black/30"
          aria-label="Close documentation menu"
          onClick={onClose}
        />
      ) : null}
      <aside
        id={navigationId}
        className="pointer-events-auto absolute top-0 bottom-0 left-0 w-64 max-w-[82%] overflow-y-auto border-r border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-1 py-4 text-sm/7 shadow-2xl shadow-zinc-900/20 transition-transform duration-200 ease-out data-closed:-translate-x-full dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40"
        data-closed={!isOpen ? 'true' : undefined}
      >
        <PreviewNavigation {...navigationProps} />
      </aside>
    </div>
  )
}
