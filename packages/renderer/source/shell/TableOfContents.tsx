import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { useSectionStore } from '../app/SectionProvider'
import { useBuiltInText } from '../core/i18n'
import type { RouteItem } from '../types'
import { safeDecodeURIComponent } from '../utils/hash'
import { remToPx } from '../utils/remToPx'

import { ContentActions } from './ContentActions'

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

function SectionBadge(arg0: SectionBadgeProps) {
  const { children } = arg0

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 justify-end font-semibold uppercase tracking-wide',
        sectionBadgeColorStyles[children.toUpperCase()] ?? 'clarify-ui-menu-description',
      )}
    >
      {children}
    </span>
  )
}

type SectionLinkProps = {
  href: string
  children: React.ReactNode
  badge?: string
  tags?: string[]
  level?: number
  active?: boolean
}

function SectionLink(arg0: SectionLinkProps) {
  const { href, children, badge, level = 2, active = false } = arg0

  function handleClick() {
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

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={clsx(
        'clarify-toc-link flex h-8 items-center gap-2 pr-3 text-sm transition',
        active ? 'clarify-toc-link-active' : 'clarify-toc-link-inactive',
      )}
      style={{ paddingLeft: `${0.75 + Math.max(0, level - 2) * 0.75}rem` }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {badge ? <SectionBadge>{badge}</SectionBadge> : null}
        <span className="min-w-0 truncate whitespace-nowrap">{children}</span>
      </span>
    </Link>
  )
}

type SectionHighlightProps = {
  activeIndex: number
}

function SectionHighlight(arg0: SectionHighlightProps) {
  const { activeIndex } = arg0

  if (activeIndex === -1) return null

  const itemHeight = remToPx(2)
  const top = activeIndex * itemHeight
  const height = itemHeight

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

export type TableOfContentsProps = {
  currentPath: string
  className?: string
  route?: RouteItem
  routePrefix?: string
}

export function TableOfContents(arg0: TableOfContentsProps) {
  const { currentPath, className, route, routePrefix } = arg0
  const t = useBuiltInText()
  const sections = useSectionStore((s) => s.sections)
  const visibleSections = useSectionStore((s) => s.visibleSections)

  const activeSection = visibleSections[0]
  const activeSectionIndex = sections.findIndex((section) => section.id === activeSection)

  return (
    <div className={clsx('clarify-table-of-contents-wrapper', className)}>
      <div className="mb-6 flex justify-end">
        <ContentActions route={route} routePrefix={routePrefix} />
      </div>
      {sections.length > 0 ? (
        <nav className="clarify-table-of-contents" aria-label={t('tableOfContents.label')}>
          <h2 className="clarify-toc-title mb-3 px-3 text-sm font-semibold tracking-tight">
            {t('tableOfContents.title')}
          </h2>
          <div className="relative">
            <AnimatePresence initial={false}>
              <SectionHighlight activeIndex={activeSectionIndex} />
            </AnimatePresence>
            <AnimatePresence initial={false}>
              <motion.ul
                role="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="relative"
              >
                {sections.map((section) => (
                  <li key={section.id}>
                    <SectionLink
                      href={`${currentPath}#${section.id}`}
                      badge={section.badge}
                      tags={section.tags}
                      level={section.level}
                      active={section.id === activeSection}
                    >
                      {section.title}
                    </SectionLink>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
