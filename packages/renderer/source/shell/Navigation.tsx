import { CloseButton } from '@headlessui/react'
import clsx from 'clsx'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useSectionStore } from '../app/SectionProvider'
import { useBuiltInText } from '../i18n'
import type { NavigationNode } from '../types'
import { safeDecodeURIComponent } from '../utils/hash'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'
import { remToPx } from '../utils/remToPx'

import { NavigationIcon } from './icons'
import { useIsInsideMobileNavigation } from './mobile'

type NavGroup = {
  title: string
  icon?: string
  links: NavigationNode[]
}

function useInitialValue<T>(value: T, condition = true) {
  const [initialValue] = useState(value)
  return condition ? initialValue : value
}

function normalizePath(path: string) {
  return path === '' ? '/' : path
}

function navigationToGroups(navigation: NavigationNode[], defaultTitle: string): NavGroup[] {
  return navigation.map((node) => {
    const children = node.children?.length ? node.children : [node]

    return {
      title: node.children?.length ? node.title : defaultTitle,
      icon: node.icon,
      links: children,
    }
  })
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
}

type SectionBadgeProps = { children: string }

function SectionBadge(arg0: SectionBadgeProps) {  const { children } = arg0

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

type NavLinkProps = {
  href: string
  children: React.ReactNode
  badge?: string
  icon?: string
  tags?: string[]
  active?: boolean
  isAnchorLink?: boolean
  level?: number
  asButton?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  ariaExpanded?: boolean
  suffix?: React.ReactNode
  muted?: boolean
}

function NavLink(arg0: NavLinkProps) {  const {
  href,
  children,
  badge,
  icon,
  active = false,
  isAnchorLink = false,
  level,
  asButton = false,
  onClick,
  ariaExpanded,
  suffix,
  muted = false,
} = arg0

  function handleClick() {
    if (!isAnchorLink) return

    const hashIndex = href.indexOf('#')
    if (hashIndex === -1) return

    const targetId = safeDecodeURIComponent(href.slice(hashIndex + 1))
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView()
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('scroll'))
      })
    })
  }

  const commonClasses = clsx(
    'clarify-navigation-link flex h-8 items-center justify-between gap-2 pr-3 transition',
    asButton ? 'clarify-navigation-directory-link' : isAnchorLink ? 'clarify-navigation-anchor-link' : 'pl-4',
  )
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {icon ? <NavigationIcon name={icon} className="h-3.5 w-3.5" /> : null}
        {badge ? <SectionBadge>{badge}</SectionBadge> : null}
        <span className="min-w-0 truncate whitespace-nowrap">{children}</span>
      </span>
      {suffix}
    </>
  )

  if (asButton) {
    return (
      <CloseButton
        as="button"
        type="button"
        aria-expanded={ariaExpanded}
        onClick={onClick}
        data-muted={muted ? 'true' : undefined}
        className={commonClasses}
        style={undefined}
      >
        {content}
      </CloseButton>
    )
  }

  return (
    <CloseButton
      as={Link}
      to={href}
      aria-current={active ? 'page' : undefined}
      onClick={handleClick}
      data-muted={muted ? 'true' : undefined}
      className={commonClasses}
      style={isAnchorLink ? { paddingLeft: `${1.75 + Math.max(0, (level ?? 2) - 2) * 0.75}rem` } : undefined}
    >
      {content}
    </CloseButton>
  )
}

type VisibleSectionHighlightProps = { pathname: string; visibleLinks: NavigationNode[] }

function flattenNavigationLinks(links: NavigationNode[]): NavigationNode[] {
  return links.flatMap(link => link.children?.length ? flattenNavigationLinks(link.children) : link)
}

function flattenVisibleNavigationLinks(links: NavigationNode[]): NavigationNode[] {
  return links.flatMap(link => [link, ...(link.children?.length ? flattenVisibleNavigationLinks(link.children) : [])])
}

function hasActiveDescendant(node: NavigationNode, pathname: string): boolean {
  return !!node.children?.some((child) =>
    isSameRoutePath(normalizePath(child.path), pathname) || hasActiveDescendant(child, pathname),
  )
}

function VisibleSectionHighlight(arg0: VisibleSectionHighlightProps) {  const { pathname, visibleLinks } = arg0

  const [sections, visibleSections] = useInitialValue(
    [useSectionStore((s) => s.sections), useSectionStore((s) => s.visibleSections)],
    useIsInsideMobileNavigation(),
  )

  const isPresent = useIsPresent()
  const firstVisibleSectionIndex = Math.max(
    0,
    [{ id: '_top' }, ...sections].findIndex((section) => section.id === visibleSections[0]),
  )
  const itemHeight = remToPx(2)
  const height = isPresent ? Math.max(1, visibleSections.length) * itemHeight : itemHeight
  const activeIndex = flattenVisibleNavigationLinks(visibleLinks).findIndex((link) => isSameRoutePath(normalizePath(link.path), pathname))
  if (activeIndex === -1) return null
  const top = activeIndex * itemHeight + firstVisibleSectionIndex * itemHeight

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, top, height, transition: { duration: 0.2, ease: 'easeOut' } }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
      className="clarify-navigation-section-highlight absolute inset-x-0 top-0 will-change-transform"
      style={{ borderRadius: 'var(--clarify-theme-tokens-radius-sm)', height, top }}
    />
  )
}

type ActivePageMarkerProps = { pathname: string; visibleLinks: NavigationNode[] }

function ActivePageMarker(arg0: ActivePageMarkerProps) {  const { pathname, visibleLinks } = arg0

  const itemHeight = remToPx(2)
  const offset = remToPx(0.25)
  const activePageIndex = flattenVisibleNavigationLinks(visibleLinks).findIndex((link) => isSameRoutePath(normalizePath(link.path), pathname))
  if (activePageIndex === -1) return null
  const top = offset + activePageIndex * itemHeight

  return (
    <motion.div
      className="absolute left-2 h-6 w-px bg-(--clarify-theme-tokens-colors-primary)"
      initial={{ opacity: 0, top }}
      animate={{ opacity: 1, top, transition: { duration: 0.2, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
      style={{ top }}
    />
  )
}

type NavigationGroupProps = { group: NavGroup; className?: string }

function NavigationGroup(arg0: NavigationGroupProps) {  const { group, className } = arg0

  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const [pathname, sections] = useInitialValue(
    [normalizeRoutePath(useLocation().pathname), useSectionStore((s) => s.sections)],
    isInsideMobileNavigation,
  )
  const isActiveGroup = flattenNavigationLinks(group.links).findIndex((link) => isSameRoutePath(normalizePath(link.path), pathname)) !== -1
  const [nodeOpenState, setNodeOpenState] = useState<Map<string, boolean>>(() => new Map())

  function toggleNode(path: string, defaultOpen: boolean) {
    setNodeOpenState((current) => {
      const next = new Map(current)
      const currentState = next.has(path) ? next.get(path) ?? false : defaultOpen
      next.set(path, !currentState)
      return next
    })
  }

  function getVisibleLinks(nodes: NavigationNode[]): NavigationNode[] {
    return nodes.flatMap((node) => {
      const href = normalizePath(node.path)
      const children = node.children ?? []
      const hasExplicitState = nodeOpenState.has(href)
      const explicitOpen = nodeOpenState.get(href)
      const active = isSameRoutePath(href, pathname)
      const hasActiveChild = children.some((child) => isSameRoutePath(normalizePath(child.path), pathname) || hasActiveDescendant(child, pathname))
      const defaultOpen = active || hasActiveChild
      const isOpen = children.length > 0 && (hasExplicitState ? explicitOpen : defaultOpen)

      return [node, ...(isOpen ? getVisibleLinks(children) : [])]
    })
  }

  function renderNavigationNode(node: NavigationNode, depth = 0) {
    const href = normalizePath(node.path)
    const children = node.children ?? []
    const active = isSameRoutePath(href, pathname)
    const hasChildren = children.length > 0
    const hasActiveChild = hasChildren && children.some((child) => isSameRoutePath(normalizePath(child.path), pathname) || hasActiveDescendant(child, pathname))
    const hasExplicitState = nodeOpenState.has(href)
    const explicitOpen = nodeOpenState.get(href)
    const defaultOpen = active || hasActiveChild
    const isOpen = hasChildren && (hasExplicitState ? explicitOpen : defaultOpen)
    if (hasChildren) {
      return (
        <li key={`${href}-${node.title}`} className="relative">
          <NavLink
            href={href}
            icon={node.icon}
            active={active}
            level={depth + 1}
            asButton
            muted={!active}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toggleNode(href, defaultOpen)
            }}
            ariaExpanded={isOpen}
            suffix={
              <NavigationIcon
                name="ChevronDown"
                className={clsx('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
              />
            }
          >
            {node.title}
          </NavLink>
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.ul
                role="list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: { duration: 0.15 } }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
              >
                {children.map(child => renderNavigationNode(child, depth + 1))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </li>
      )
    }

    return (
      <li key={href} className="relative">
        <NavLink href={href} icon={node.icon} active={active} level={depth + 1}>
          {node.title}
        </NavLink>
        <AnimatePresence initial={false}>
          {active && sections.length > 0 ? (
            <motion.ul
              role="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {sections.map((section) => (
                <li key={section.id}>
                  <NavLink href={`${href}#${section.id}`} badge={section.badge} tags={section.tags} isAnchorLink level={section.level}>
                    {section.title}
                  </NavLink>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    )
  }

  const visibleLinks = getVisibleLinks(group.links)

  return (
    <li className={clsx('clarify-navigation-group relative mb-6', className)}>
      <h2 className="clarify-navigation-group-title flex items-center gap-2">
        <NavigationIcon name={group.icon} className="clarify-navigation-group-title-icon h-3.5 w-3.5" />
        <span>{group.title}</span>
      </h2>
      <div className="relative mt-3 pl-2">
        <AnimatePresence initial={!isInsideMobileNavigation}>
          {isActiveGroup ? <VisibleSectionHighlight pathname={pathname} visibleLinks={visibleLinks} /> : null}
        </AnimatePresence>
        <div className="absolute inset-y-0 left-2 w-px bg-(--clarify-theme-tokens-colors-border) dark:bg-white/5" />
        <AnimatePresence initial={false}>
          {isActiveGroup ? <ActivePageMarker pathname={pathname} visibleLinks={visibleLinks} /> : null}
        </AnimatePresence>
        <ul role="list" className="border-l border-transparent">
          {group.links.map(link => renderNavigationNode(link))}
        </ul>
      </div>
    </li>
  )
}

export type NavigationProps = { navigation: NavigationNode[]; className?: string }

export function Navigation(arg0: NavigationProps) {  const { navigation, className } = arg0

  const t = useBuiltInText()
  const groups = navigationToGroups(navigation, t('navigation.documentation'))

  return (
    <nav className={clsx('clarify-navigation', className)}>
      <ul role="list" className="clarify-navigation-list">
        {groups.map((group, groupIndex) => (
          <NavigationGroup key={group.title} group={group} className={groupIndex === 0 ? 'mt-0' : ''} />
        ))}
      </ul>
    </nav>
  )
}
