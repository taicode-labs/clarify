import { CloseButton } from '@headlessui/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useSectionStore } from '../app/SectionProvider'
import { useBuiltInText } from '../i18n'
import type { NavigationNode } from '../types'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'
import { remToPx } from '../utils/remToPx'

import { NavigationIcon } from './icons'

type NavigationGroup = {
  title: string
  icon?: string
  nodes: NavigationNode[]
}

function normalizePath(path: string) {
  return path === '' ? '/' : path
}

function navigationToGroups(navigation: NavigationNode[], defaultTitle: string): NavigationGroup[] {
  return navigation.map((node) => ({
    title: node.children?.length ? node.title : defaultTitle,
    icon: node.icon,
    nodes: node.children?.length ? node.children : [node],
  }))
}

function containsActivePath(node: NavigationNode, pathname: string, currentLocale?: string): boolean {
  return isSameRoutePath(node.path, pathname, currentLocale)
    || node.children?.some(child => containsActivePath(child, pathname, currentLocale))
    || false
}

const sectionBadgeColorStyles: Record<string, string> = {
  GET: 'text-emerald-500 dark:text-emerald-400',
  POST: 'text-sky-500 dark:text-sky-400',
  PUT: 'text-amber-500 dark:text-amber-400',
  PATCH: 'text-amber-500 dark:text-amber-400',
  DELETE: 'text-red-500 dark:text-rose-500',
  OPTIONS: 'text-violet-500 dark:text-violet-400',
  HEAD: 'text-zinc-500 dark:text-zinc-400',
  TRACE: 'text-fuchsia-500 dark:text-fuchsia-400',
  WEBHOOK: 'text-violet-500 dark:text-violet-400',
}

type SectionBadgeProps = { children: string }

function SectionBadge(arg0: SectionBadgeProps) {
  const { children } = arg0

  return (
    <span
      className={clsx(
        'clarify-navigation-section-badge inline-flex shrink-0 justify-end font-semibold uppercase tracking-wide',
        sectionBadgeColorStyles[children.toUpperCase()] ?? 'clarify-ui-menu-description',
      )}
    >
      {children}
    </span>
  )
}

type NavigationPageProps = {
  node: NavigationNode
  pathname: string
  currentLocale?: string
  ancestorsExpanded: boolean
}

function getVisibleSectionHighlightRange(sectionIds: string[], visibleSectionIds: string[]) {
  const validVisibleSectionIds = visibleSectionIds.filter(id => id === '_top' || sectionIds.includes(id))
  if (!validVisibleSectionIds.length) return undefined

  const firstVisibleSectionId = validVisibleSectionIds[0]!
  const lastVisibleSectionId = validVisibleSectionIds[validVisibleSectionIds.length - 1]!
  const pageHeight = remToPx(2.25)
  const sectionOffset = pageHeight + remToPx(0.25)
  const sectionHeight = remToPx(2)
  const getSectionTop = (id: string) => {
    if (id === '_top') return 0
    return sectionOffset + sectionIds.indexOf(id) * sectionHeight
  }
  const top = getSectionTop(firstVisibleSectionId)
  const bottom = lastVisibleSectionId === '_top'
    ? pageHeight
    : getSectionTop(lastVisibleSectionId) + sectionHeight

  return { top, height: bottom - top }
}

type VisibleSectionHighlightProps = {
  top: number
  height: number
}

function VisibleSectionHighlight(arg0: VisibleSectionHighlightProps) {
  const { top, height } = arg0

  return (
    <motion.div
      className="clarify-navigation-section-highlight pointer-events-none absolute inset-x-0 top-0"
      initial={false}
      animate={{ opacity: 1, height, top, transition: { duration: 0.2, ease: 'easeOut' } }}
      style={{ borderRadius: 'var(--clarify-theme-tokens-radius-md)' }}
    />
  )
}

function NavigationPage(arg0: NavigationPageProps) {
  const { node, pathname, currentLocale, ancestorsExpanded } = arg0
  const sections = useSectionStore(state => state.sections)
  const visibleSections = useSectionStore(state => state.visibleSections)
  const active = isSameRoutePath(node.path, pathname, currentLocale)
  const href = normalizePath(node.path)
  const highlightRange = active && ancestorsExpanded
    ? getVisibleSectionHighlightRange(sections.map(section => section.id), visibleSections)
    : undefined

  return (
    <li className="clarify-navigation-page relative">
      {highlightRange ? <VisibleSectionHighlight {...highlightRange} /> : null}
      <CloseButton
        as={Link}
        to={href}
        aria-current={active ? 'page' : undefined}
        className="clarify-navigation-link group relative z-10 flex min-h-9 items-center gap-2 rounded-(--clarify-theme-tokens-radius-md) py-1.5 pr-3 pl-2 no-underline transition"
      >
        <span className="clarify-navigation-active-marker absolute inset-y-1.5 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-aria-current:opacity-100" />
        {node.icon ? <NavigationIcon name={node.icon} className="clarify-navigation-item-icon h-3.5 w-3.5 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">{node.title}</span>
      </CloseButton>

      <AnimatePresence initial={false}>
        {active && sections.length > 0 ? (
          <motion.ul
            role="list"
            className="clarify-navigation-sections relative py-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          >
            {sections.map(section => (
              <li key={section.id}>
                <CloseButton
                  as={Link}
                  to={`${href}#${section.id}`}
                  className="clarify-navigation-anchor-link relative z-10 flex min-h-8 items-center pr-3 pl-2 no-underline transition"
                >
                  <span className="clarify-navigation-section-indent flex shrink-0" aria-hidden="true">
                    {Array.from({ length: Math.max(1, (section.level ?? 2) - 1) }, (_, index) => (
                      <ChevronRight key={index} className="invisible h-3.5 w-3.5" />
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {section.badge ? <SectionBadge>{section.badge}</SectionBadge> : null}
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap">{section.title}</span>
                  </span>
                </CloseButton>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

type NavigationBranchProps = {
  node: NavigationNode
  pathname: string
  currentLocale?: string
  ancestorsExpanded: boolean
}

function NavigationBranch(arg0: NavigationBranchProps) {
  const { node, pathname, currentLocale, ancestorsExpanded } = arg0
  const controlsId = useId()
  const active = containsActivePath(node, pathname, currentLocale)
  const [expansionOverride, setExpansionOverride] = useState<boolean>()
  const expanded = expansionOverride ?? active

  return (
    <li className="clarify-navigation-branch relative">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controlsId}
        data-active={active || undefined}
        onClick={() => setExpansionOverride(!expanded)}
        className="clarify-navigation-branch-trigger group flex min-h-9 w-full items-center rounded-(--clarify-theme-tokens-radius-md) py-1.5 pr-3 pl-2 text-left transition"
      >
        {node.icon ? <NavigationIcon name={node.icon} className="clarify-navigation-item-icon h-3.5 w-3.5 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate pl-2 whitespace-nowrap">{node.title}</span>
        <ChevronRight className="clarify-navigation-chevron ml-2 h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-aria-expanded:rotate-90" />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={controlsId}
            className="clarify-navigation-branch-content grid grid-cols-[auto_minmax(0,1fr)] overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          >
            <div className="grid">
              <ChevronRight aria-hidden="true" className="invisible col-start-1 row-start-1 h-3.5 w-3.5" />
            </div>
            <div className="col-start-2">
              <NavigationNodes
                nodes={node.children ?? []}
                pathname={pathname}
                currentLocale={currentLocale}
                ancestorsExpanded={ancestorsExpanded && expanded}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

type NavigationNodesProps = {
  nodes: NavigationNode[]
  pathname: string
  currentLocale?: string
  ancestorsExpanded: boolean
}

function NavigationNodes(arg0: NavigationNodesProps) {
  const { nodes, pathname, currentLocale, ancestorsExpanded } = arg0

  return (
    <ul role="list" className="clarify-navigation-tree py-0.5">
      {nodes.map((node, index) => node.children?.length ? (
        <NavigationBranch
          key={`${node.path}-${node.title}-${index}`}
          node={node}
          pathname={pathname}
          currentLocale={currentLocale}
          ancestorsExpanded={ancestorsExpanded}
        />
      ) : (
        <NavigationPage
          key={`${node.path}-${node.title}-${index}`}
          node={node}
          pathname={pathname}
          currentLocale={currentLocale}
          ancestorsExpanded={ancestorsExpanded}
        />
      ))}
    </ul>
  )
}

type NavigationGroupProps = {
  group: NavigationGroup
  pathname: string
  className?: string
  currentLocale?: string
}

function NavigationGroup(arg0: NavigationGroupProps) {
  const { group, pathname, className, currentLocale } = arg0

  return (
    <li className={clsx('clarify-navigation-group relative mb-7', className)}>
      <h2 className="clarify-navigation-group-title flex items-center gap-2 px-2">
        <NavigationIcon name={group.icon} className="clarify-navigation-group-title-icon h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">{group.title}</span>
      </h2>
      <div className="mt-2 px-2">
        <NavigationNodes nodes={group.nodes} pathname={pathname} currentLocale={currentLocale} ancestorsExpanded />
      </div>
    </li>
  )
}

export type NavigationProps = { navigation: NavigationNode[]; className?: string; currentLocale?: string }

export function Navigation(arg0: NavigationProps) {
  const { navigation, className, currentLocale } = arg0
  const t = useBuiltInText()
  const pathname = normalizeRoutePath(useLocation().pathname)
  const groups = navigationToGroups(navigation, t('navigation.documentation'))

  return (
    <nav className={clsx('clarify-navigation', className)}>
      <ul role="list" className="clarify-navigation-list">
        {groups.map((group, groupIndex) => (
          <NavigationGroup
            key={`${group.title}-${groupIndex}`}
            group={group}
            pathname={pathname}
            className={groupIndex === 0 ? 'mt-0' : ''}
            currentLocale={currentLocale}
          />
        ))}
      </ul>
    </nav>
  )
}
