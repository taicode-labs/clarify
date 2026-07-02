import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { useSectionStore } from '../app/SectionProvider'
import { useBuiltInText } from '../core/i18n'
import { safeDecodeURIComponent } from '../utils/hash'

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
        'clarify-toc-link flex h-7 items-center gap-2 pr-3 text-sm transition',
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

export type TableOfContentsProps = {
  currentPath: string
  className?: string
}

export function TableOfContents(arg0: TableOfContentsProps) {
  const { currentPath, className } = arg0
  const t = useBuiltInText()
  const sections = useSectionStore((s) => s.sections)
  const visibleSections = useSectionStore((s) => s.visibleSections)

  if (sections.length === 0) {
    return null
  }

  const activeSection = visibleSections[0]

  return (
    <nav className={clsx('clarify-table-of-contents', className)} aria-label={t('tableOfContents.label')}>
      <h2 className="clarify-toc-title mb-3 px-3 text-sm font-semibold tracking-tight">
        {t('tableOfContents.title')}
      </h2>
      <AnimatePresence initial={false}>
        <motion.ul
          role="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="space-y-1"
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
    </nav>
  )
}
