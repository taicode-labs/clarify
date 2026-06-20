import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { create } from 'zustand'

import { useBuiltInText } from '../i18n'
import { copyTextToClipboard } from '../utils/clipboard'

const languageNames: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  jsx: 'React JSX',
  tsx: 'React TSX',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  go: 'Go',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
}

function getPanelTitle(arg0: { title?: string; language?: string; fallbackTitle?: string }) {  const { title, language, fallbackTitle = 'Code' } = arg0

  if (title) return title
  if (language && language in languageNames) return languageNames[language]
  return fallbackTitle
}

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (isValidElement(node)) return getNodeText((node.props as { children?: ReactNode }).children)
  return ''
}

function ClipboardIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        strokeWidth="0"
        d="M5.5 13.5v-5a2 2 0 0 1 2-2l.447-.894A2 2 0 0 1 9.737 4.5h.527a2 2 0 0 1 1.789 1.106l.447.894a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2Z"
      />
      <path
        fill="none"
        strokeLinejoin="round"
        d="M12.5 6.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2m5 0-.447-.894a2 2 0 0 0-1.79-1.106h-.527a2 2 0 0 0-1.789 1.106L7.5 6.5m5 0-1 1h-3l-1-1"
      />
    </svg>
  )
}

function CopyButton(arg0: { code: string }) {  const { code } = arg0

  const t = useBuiltInText()
  const [copyCount, setCopyCount] = useState(0)
  const copied = copyCount > 0

  useEffect(() => {
    if (copyCount === 0) return undefined
    const timeout = window.setTimeout(() => setCopyCount(0), 1000)
    return () => window.clearTimeout(timeout)
  }, [copyCount])

  if (!code) return null

  return (
    <button
      type="button"
      className={clsx(
        'clarify-code-copy group/button absolute top-3.5 right-4 overflow-hidden rounded-full py-1 pr-3 pl-2 text-2xs font-medium opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus:opacity-100',
        copied
          ? 'bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-primary)_12%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-primary)_24%,transparent)] ring-inset'
          : 'bg-white/5 hover:bg-white/7.5 dark:bg-white/2.5 dark:hover:bg-white/5',
      )}
      onClick={() => {
        void copyTextToClipboard(code).then((ok) => {
          if (ok) setCopyCount((count) => count + 1)
        })
      }}
    >
      <span
        aria-hidden={copied}
        className={clsx(
          'pointer-events-none flex items-center gap-0.5 text-zinc-400 transition duration-300',
          copied && '-translate-y-1.5 opacity-0',
        )}
      >
        <ClipboardIcon className="h-5 w-5 fill-zinc-500/20 stroke-zinc-500 transition-colors group-hover/button:stroke-zinc-400" />
        {t('actions.copy')}
      </span>
      <span
        aria-hidden={!copied}
        className={clsx(
          'pointer-events-none absolute inset-0 flex items-center justify-center text-(--clarify-theme-tokens-colors-primary) transition duration-300',
          !copied && 'translate-y-1.5 opacity-0',
        )}
      >
        {t('actions.copied')}
      </span>
    </button>
  )
}

function CodePanelHeader(arg0: { tag?: string; label?: string }) {  const { tag, label } = arg0

  if (!tag && !label) return null

  return (
    <div className="clarify-code-panel-header flex h-9 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 px-4 dark:border-b-white/5 dark:bg-white/1">
      {tag ? <span className="clarify-code-panel-tag font-semibold text-(--clarify-theme-tokens-colors-primary)">{tag}</span> : null}
      {tag && label ? <span className="h-0.5 w-0.5 rounded-full bg-zinc-500" /> : null}
      {label ? <span className="text-xs text-zinc-400">{label}</span> : null}
    </div>
  )
}

function CodePanel(arg0: {
  children: ReactNode
  tag?: string
  label?: string
  code?: string
}) {
  const { children } = arg0
  let { tag, label, code } = arg0

  const child = Children.only(children)

  if (isValidElement(child)) {
    const props = child.props as { tag?: string; label?: string; code?: string; children?: ReactNode }
    tag = props.tag ?? tag
    label = props.label ?? label
    code = props.code ?? code ?? getNodeText(props.children)
  }

  const copyText = code ?? getNodeText(children)

  return (
    <div className="clarify-code-panel group dark:bg-white/2.5">
      <CodePanelHeader tag={tag} label={label} />
      <div className="relative">
        <pre className="clarify-code-pre overflow-x-auto p-4 text-xs text-white">{children}</pre>
        <CopyButton code={copyText} />
      </div>
    </div>
  )
}

function CodeGroupHeader(arg0: { title?: string; children: ReactNode; selectedIndex: number }) {  const { title, children, selectedIndex } = arg0

  const t = useBuiltInText()
  const hasTabs = Children.count(children) > 1

  if (!title && !hasTabs) return null

  return (
    <div className="clarify-code-group-header flex min-h-[calc(--spacing(12)+1px)] flex-wrap items-start gap-x-4 border-b border-zinc-700 bg-zinc-800 px-4 dark:border-zinc-800 dark:bg-transparent">
      {title ? <h3 className="mr-auto pt-3 text-xs font-semibold text-white">{title}</h3> : null}
      {hasTabs ? (
        <TabList className="clarify-code-tabs -mb-px flex gap-4 text-xs font-medium">
          {Children.map(children, (child, childIndex) => (
            <Tab
              className={clsx(
                'clarify-code-tab border-b py-3 transition data-selected:not-data-focus:outline-hidden',
                childIndex === selectedIndex
                  ? 'border-(--clarify-theme-tokens-colors-primary) text-(--clarify-theme-tokens-colors-primary)'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300',
              )}
            >
              {getPanelTitle({ ...(isValidElement(child) ? (child.props as { title?: string; language?: string }) : {}), fallbackTitle: t('actions.code') })}
            </Tab>
          ))}
        </TabList>
      ) : null}
    </div>
  )
}

function CodeGroupPanels(arg0: ComponentPropsWithoutRef<typeof CodePanel>) {  const { children, ...props } = arg0

  const hasTabs = Children.count(children) > 1

  if (hasTabs) {
    return (
      <TabPanels>
        {Children.map(children, (child) => (
          <TabPanel>
            <CodePanel {...props}>{child}</CodePanel>
          </TabPanel>
        ))}
      </TabPanels>
    )
  }

  return <CodePanel {...props}>{children}</CodePanel>
}

function usePreventLayoutShift() {
  const positionRef = useRef<HTMLElement>(null)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (typeof rafRef.current !== 'undefined') window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    positionRef,
    preventLayoutShift(callback: () => void) {
      if (!positionRef.current) return

      const initialTop = positionRef.current.getBoundingClientRect().top
      callback()

      rafRef.current = window.requestAnimationFrame(() => {
        const newTop = positionRef.current?.getBoundingClientRect().top ?? initialTop
        window.scrollBy(0, newTop - initialTop)
      })
    },
  }
}

const usePreferredLanguageStore = create<{
  preferredLanguages: string[]
  addPreferredLanguage: (language: string) => void
}>()((set) => ({
  preferredLanguages: [],
  addPreferredLanguage: (language) =>
    set((state) => ({
      preferredLanguages: [...state.preferredLanguages.filter((preferredLanguage) => preferredLanguage !== language), language],
    })),
}))

function useTabGroupProps(availableLanguages: string[]) {
  const { preferredLanguages, addPreferredLanguage } = usePreferredLanguageStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeLanguage = [...availableLanguages].sort(
    (a, z) => preferredLanguages.indexOf(z) - preferredLanguages.indexOf(a),
  )[0]
  const languageIndex = availableLanguages.indexOf(activeLanguage)
  const newSelectedIndex = languageIndex === -1 ? selectedIndex : languageIndex

  if (newSelectedIndex !== selectedIndex) setSelectedIndex(newSelectedIndex)

  const { positionRef, preventLayoutShift } = usePreventLayoutShift()

  return {
    as: 'div' as const,
    ref: positionRef,
    selectedIndex,
    onChange: (nextSelectedIndex: number) => {
      preventLayoutShift(() => addPreferredLanguage(availableLanguages[nextSelectedIndex]))
    },
  }
}

const CodeGroupContext = createContext(false)

export function CodeGroup(arg0: ComponentPropsWithoutRef<typeof CodeGroupPanels> & { title?: string }) {  const {
  children,
  title,
  ...props
} = arg0

  const t = useBuiltInText()
  const languages =
    Children.map(children, (child) =>
      getPanelTitle({ ...(isValidElement(child) ? (child.props as { title?: string; language?: string }) : {}), fallbackTitle: t('actions.code') }),
    ) ?? []
  const tabGroupProps = useTabGroupProps(languages)
  const hasTabs = Children.count(children) > 1
  const containerClassName = 'clarify-code-group my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10'
  const header = (
    <CodeGroupHeader title={title} selectedIndex={tabGroupProps.selectedIndex}>
      {children}
    </CodeGroupHeader>
  )
  const panels = <CodeGroupPanels {...props}>{children}</CodeGroupPanels>

  return (
    <CodeGroupContext.Provider value={true}>
      {hasTabs ? (
        <TabGroup {...tabGroupProps} className={containerClassName}>
          <div className="not-prose">
            {header}
            {panels}
          </div>
        </TabGroup>
      ) : (
        <div className={containerClassName}>
          <div className="not-prose">
            {header}
            {panels}
          </div>
        </div>
      )}
    </CodeGroupContext.Provider>
  )
}

export function Code(arg0: ComponentPropsWithoutRef<'code'> & { code?: string; language?: string; title?: string }) {  const { children, ...props } = arg0

  const isGrouped = useContext(CodeGroupContext)

  if (isGrouped && typeof children === 'string') {
    return <code {...props} dangerouslySetInnerHTML={{ __html: children }} />
  }

  return <code {...props}>{children}</code>
}

export function Pre(arg0: ComponentPropsWithoutRef<typeof CodeGroup>) {  const { children, ...props } = arg0

  const isGrouped = useContext(CodeGroupContext)

  if (isGrouped) return children

  return <CodeGroup {...props}>{children}</CodeGroup>
}
