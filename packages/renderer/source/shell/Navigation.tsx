import { CloseButton } from '@headlessui/react'
import clsx from 'clsx'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Tag } from '../components'
import { useSectionStore } from '../components/SectionProvider'
import type { NavigationNode } from '../types'
import { remToPx } from '../utils/remToPx'

import { useIsInsideMobileNavigation } from './mobile'

type NavGroup = {
  title: string
  icon?: string
  links: Array<{
    title: string
    href: string
    icon?: string
  }>
}

type LucideIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

function NavigationIcon(arg0: { name?: string; className?: string }) {  const { name, className } = arg0

  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name]

  if (!Icon) return null

  return <Icon className={clsx('shrink-0 stroke-current', className)} aria-hidden="true" />
}

function useInitialValue<T>(value: T, condition = true) {
  const [initialValue] = useState(value)
  return condition ? initialValue : value
}

function normalizePath(path: string) {
  return path === '' ? '/' : path
}

function navigationToGroups(navigation: NavigationNode[]): NavGroup[] {
  return navigation.map((node) => {
    const children = node.children?.length ? node.children : [node]

    return {
      title: node.children?.length ? node.title : 'Documentation',
      icon: node.icon,
      links: children.map((child) => ({
        title: child.title,
        href: normalizePath(child.path),
        icon: child.icon,
      })),
    }
  })
}

function TopLevelNavItem(arg0: { href: string; children: React.ReactNode }) {  const { href, children } = arg0

  return (
    <li className="md:hidden">
      <CloseButton
        as={Link}
        to={href}
        className="block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </CloseButton>
    </li>
  )
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

function SectionBadge(arg0: { children: string }) {  const { children } = arg0

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 justify-end font-mono text-[0.625rem]/6 font-semibold uppercase tracking-wide',
        sectionBadgeColorStyles[children.toUpperCase()] ?? 'text-zinc-500 dark:text-zinc-400',
      )}
    >
      {children}
    </span>
  )
}

function NavLink(arg0: {
  href: string
  children: React.ReactNode
  badge?: string
  icon?: string
  tags?: string[]
  active?: boolean
  isAnchorLink?: boolean
}) {  const {
  href,
  children,
  badge,
  icon,
  tags,
  active = false,
  isAnchorLink = false,
} = arg0

  function handleClick() {
    if (!isAnchorLink) return

    const hashIndex = href.indexOf('#')
    if (hashIndex === -1) return

    const targetId = decodeURIComponent(href.slice(hashIndex + 1))
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView()
    })
  }

  return (
    <CloseButton
      as={Link}
      to={href}
      aria-current={active ? 'page' : undefined}
      onClick={handleClick}
      className={clsx(
        'clarify-navigation-link flex justify-between gap-2 py-1 pr-3 text-sm transition',
        isAnchorLink ? 'clarify-navigation-anchor-link pl-7' : 'pl-4',
        active
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {icon ? <NavigationIcon name={icon} className="h-3.5 w-3.5" /> : null}
        {badge ? <SectionBadge>{badge}</SectionBadge> : null}
        <span className="min-w-0 truncate">{children}</span>
      </span>
      {tags?.length ? (
        <span className="flex shrink-0 gap-1">
          {tags.map((tag) => (
            <Tag key={tag} variant="small" color="zinc">
              {tag}
            </Tag>
          ))}
        </span>
      ) : null}
    </CloseButton>
  )
}

function VisibleSectionHighlight(arg0: { group: NavGroup; pathname: string }) {  const { group, pathname } = arg0

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
  const top = group.links.findIndex((link) => link.href === pathname) * itemHeight + firstVisibleSectionIndex * itemHeight

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      className="absolute inset-x-0 top-0 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5"
      style={{ borderRadius: 8, height, top }}
    />
  )
}

function ActivePageMarker(arg0: { group: NavGroup; pathname: string }) {  const { group, pathname } = arg0

  const itemHeight = remToPx(2)
  const offset = remToPx(0.25)
  const activePageIndex = group.links.findIndex((link) => link.href === pathname)
  const top = offset + activePageIndex * itemHeight

  return (
    <motion.div
      layout
      className="absolute left-2 h-6 w-px bg-emerald-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      style={{ top }}
    />
  )
}

function NavigationGroup(arg0: { group: NavGroup; className?: string }) {  const { group, className } = arg0

  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const [pathname, sections] = useInitialValue(
    [useLocation().pathname, useSectionStore((s) => s.sections)],
    isInsideMobileNavigation,
  )
  const isActiveGroup = group.links.findIndex((link) => link.href === pathname) !== -1

  return (
    <li className={clsx('clarify-navigation-group relative mt-6', className)}>
      <motion.h2 layout="position" className="clarify-navigation-group-title flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
        <NavigationIcon name={group.icon} className="h-3.5 w-3.5" />
        <span>{group.title}</span>
      </motion.h2>
      <div className="relative mt-3 pl-2">
        <AnimatePresence initial={!isInsideMobileNavigation}>
          {isActiveGroup ? <VisibleSectionHighlight group={group} pathname={pathname} /> : null}
        </AnimatePresence>
        <motion.div layout className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5" />
        <AnimatePresence initial={false}>
          {isActiveGroup ? <ActivePageMarker group={group} pathname={pathname} /> : null}
        </AnimatePresence>
        <ul role="list" className="border-l border-transparent">
          {group.links.map((link) => (
            <motion.li key={link.href} layout="position" className="relative">
              <NavLink href={link.href} icon={link.icon} active={link.href === pathname}>
                {link.title}
              </NavLink>
              <AnimatePresence mode="popLayout" initial={false}>
                {link.href === pathname && sections.length > 0 ? (
                  <motion.ul
                    role="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    {sections.map((section) => (
                      <li key={section.id}>
                        <NavLink href={`${link.href}#${section.id}`} badge={section.badge} tags={section.tags} isAnchorLink>
                          {section.title}
                        </NavLink>
                      </li>
                    ))}
                  </motion.ul>
                ) : null}
              </AnimatePresence>
            </motion.li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export function Navigation(arg0: { navigation: NavigationNode[]; className?: string }) {  const { navigation, className } = arg0

  const groups = navigationToGroups(navigation)

  return (
    <nav className={clsx('clarify-navigation', className)}>
      <ul role="list" className="clarify-navigation-list">
        <TopLevelNavItem href="/">Home</TopLevelNavItem>
        {groups.map((group, groupIndex) => (
          <NavigationGroup key={group.title} group={group} className={groupIndex === 0 ? 'md:mt-0' : ''} />
        ))}
      </ul>
    </nav>
  )
}
