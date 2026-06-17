import { CloseButton } from '@headlessui/react'
import clsx from 'clsx'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Tag } from '../components'
import { useSectionStore } from '../components/SectionProvider'
import type { NavigationNode } from '../types'
import { remToPx } from '../utils/remToPx'
import { useIsInsideMobileNavigation } from './mobile'

type NavGroup = {
  title: string
  links: Array<{
    title: string
    href: string
    tag?: string
  }>
}

function useInitialValue<T>(value: T, condition = true) {
  const initialValue = useRef(value).current
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
      links: children.map((child) => ({
        title: child.title,
        href: normalizePath(child.path),
      })),
    }
  })
}

function TopLevelNavItem({ href, children }: { href: string; children: React.ReactNode }) {
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

function NavLink({
  href,
  children,
  tag,
  active = false,
  isAnchorLink = false,
}: {
  href: string
  children: React.ReactNode
  tag?: string
  active?: boolean
  isAnchorLink?: boolean
}) {
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
        'flex justify-between gap-2 py-1 pr-3 text-sm transition',
        isAnchorLink ? 'pl-7' : 'pl-4',
        active
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
      )}
    >
      <span className="truncate">{children}</span>
      {tag ? (
        <Tag variant="small" color="zinc">
          {tag}
        </Tag>
      ) : null}
    </CloseButton>
  )
}

function VisibleSectionHighlight({ group, pathname }: { group: NavGroup; pathname: string }) {
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

function ActivePageMarker({ group, pathname }: { group: NavGroup; pathname: string }) {
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

function NavigationGroup({ group, className }: { group: NavGroup; className?: string }) {
  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const [pathname, sections] = useInitialValue(
    [useLocation().pathname, useSectionStore((s) => s.sections)],
    isInsideMobileNavigation,
  )
  const isActiveGroup = group.links.findIndex((link) => link.href === pathname) !== -1

  return (
    <li className={clsx('relative mt-6', className)}>
      <motion.h2 layout="position" className="text-xs font-semibold text-zinc-900 dark:text-white">
        {group.title}
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
              <NavLink href={link.href} active={link.href === pathname}>
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
                        <NavLink href={`${link.href}#${section.id}`} tag={section.tag} isAnchorLink>
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

export function Navigation({ navigation, className }: { navigation: NavigationNode[]; className?: string }) {
  const groups = navigationToGroups(navigation)

  return (
    <nav className={className}>
      <ul role="list">
        <TopLevelNavItem href="/">Home</TopLevelNavItem>
        {groups.map((group, groupIndex) => (
          <NavigationGroup key={group.title} group={group} className={groupIndex === 0 ? 'md:mt-0' : ''} />
        ))}
      </ul>
    </nav>
  )
}
