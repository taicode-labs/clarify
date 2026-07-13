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
  depth: number
}

function NavigationPage(arg0: NavigationPageProps) {
  const { node, pathname, currentLocale, depth } = arg0
  const sections = useSectionStore(state => state.sections)
  const active = isSameRoutePath(node.path, pathname, currentLocale)
  const href = normalizePath(node.path)

  return (
    <li className="clarify-navigation-page relative">
      <CloseButton
        as={Link}
        to={href}
        aria-current={active ? 'page' : undefined}
        className="clarify-navigation-link group relative flex min-h-9 items-center gap-2 rounded-(--clarify-theme-tokens-radius-md) py-1.5 pr-3 no-underline transition"
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
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
                  className="clarify-navigation-anchor-link flex min-h-8 items-center gap-2 pr-3 no-underline transition"
                  style={{ paddingLeft: `${2.25 + depth * 0.75 + Math.max(0, (section.level ?? 2) - 2) * 0.75}rem` }}
                >
                  {section.badge ? <SectionBadge>{section.badge}</SectionBadge> : null}
                  <span className="min-w-0 flex-1 truncate whitespace-nowrap">{section.title}</span>
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
  depth: number
}

function NavigationBranch(arg0: NavigationBranchProps) {
  const { node, pathname, currentLocale, depth } = arg0
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
        className="clarify-navigation-branch-trigger group flex min-h-9 w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-md) py-1.5 pr-3 text-left transition"
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      >
        <ChevronRight className="clarify-navigation-chevron h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-aria-expanded:rotate-90" />
        {node.icon ? <NavigationIcon name={node.icon} className="clarify-navigation-item-icon h-3.5 w-3.5 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">{node.title}</span>
        <span className="clarify-navigation-branch-count tabular-nums">{node.children?.length}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={controlsId}
            className="clarify-navigation-branch-content relative overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          >
            <div
              className="clarify-navigation-tree-line absolute inset-y-1 w-px"
              style={{ left: `${1.18 + depth * 0.75}rem` }}
            />
            <NavigationNodes nodes={node.children ?? []} pathname={pathname} currentLocale={currentLocale} depth={depth + 1} />
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
  depth: number
}

function NavigationNodes(arg0: NavigationNodesProps) {
  const { nodes, pathname, currentLocale, depth } = arg0

  return (
    <ul role="list" className="clarify-navigation-tree py-0.5">
      {nodes.map((node, index) => node.children?.length ? (
        <NavigationBranch
          key={`${node.path}-${node.title}-${index}`}
          node={node}
          pathname={pathname}
          currentLocale={currentLocale}
          depth={depth}
        />
      ) : (
        <NavigationPage
          key={`${node.path}-${node.title}-${index}`}
          node={node}
          pathname={pathname}
          currentLocale={currentLocale}
          depth={depth}
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
      <div className="mt-2">
        <NavigationNodes nodes={group.nodes} pathname={pathname} currentLocale={currentLocale} depth={0} />
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
