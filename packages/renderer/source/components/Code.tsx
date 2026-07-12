import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Check, Clipboard } from 'lucide-react'
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { create } from 'zustand'

import { useBuiltInText } from '../core/i18n'
import { copyTextToClipboard } from '../utils/clipboard'

import { Mermaid } from './Mermaid'

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

type GetPanelTitleArgs = { title?: string; language?: string; fallbackTitle?: string }

function getPanelTitle(arg0: GetPanelTitleArgs) {  const { title, language, fallbackTitle = 'Code' } = arg0

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

function getCodeLanguage(node: ReactNode): string | undefined {
  if (!isValidElement(node)) return undefined

  const { className, language, children } = node.props as { className?: string; language?: string; children?: ReactNode }
  if (language) return language

  const languageClass = className?.split(/\s+/).find(value => value.startsWith('language-'))
  if (languageClass) return languageClass.slice('language-'.length)

  return Children.toArray(children).map(getCodeLanguage).find(Boolean)
}

type CopyButtonProps = { code: string }

function CopyButton(arg0: CopyButtonProps) {  const { code } = arg0

  const t = useBuiltInText()
  const [copyCount, setCopyCount] = useState(0)
  const copied = copyCount > 0

  useEffect(() => {
    if (copyCount === 0) return undefined
    const timeout = setTimeout(() => setCopyCount(0), 1000)
    return () => clearTimeout(timeout)
  }, [copyCount])

  if (!code) return null

  return (
    <button
      type="button"
      className={clsx(
        'clarify-code-copy group/button absolute top-3.5 right-4 inline-flex items-center gap-1 overflow-hidden rounded-full border border-(--clarify-code-border) py-1 pr-3 pl-2 text-2xs font-medium whitespace-nowrap opacity-100 shadow-sm backdrop-blur-sm transition sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100',
        copied ? 'clarify-code-copy-copied text-(--clarify-code-text)' : 'bg-(--clarify-code-control-background) text-(--clarify-code-text) hover:bg-(--clarify-code-control-background-hover)',
      )}
      onClick={() => {
        void copyTextToClipboard(code).then((ok) => {
          if (ok) setCopyCount((count) => count + 1)
        })
      }}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 stroke-(--clarify-theme-tokens-colors-primary)" />
          {t('actions.copied')}
        </>
      ) : (
        <>
          <Clipboard className="h-3.5 w-3.5 stroke-(--clarify-code-muted) transition-colors group-hover/button:stroke-(--clarify-code-text)" />
          {t('actions.copy')}
        </>
      )}
    </button>
  )
}

type CodePanelHeaderProps = { tag?: string; label?: string }

function CodePanelHeader(arg0: CodePanelHeaderProps) {  const { tag, label } = arg0

  if (!tag && !label) return null

  return (
    <div className="clarify-code-panel-header flex h-9 items-center gap-2 border-y border-(--clarify-code-border) border-t-transparent bg-(--clarify-code-background) px-4">
      {tag ? <span className="clarify-code-panel-tag font-semibold text-(--clarify-theme-tokens-colors-primary)">{tag}</span> : null}
      {tag && label ? <span className="h-0.5 w-0.5 rounded-full bg-(--clarify-code-faint)" /> : null}
      {label ? <span className="truncate text-xs text-(--clarify-code-muted)">{label}</span> : null}
    </div>
  )
}

type CodePanelProps = {
  children: ReactNode
  tag?: string
  label?: string
  code?: string
}

function CodePanel(arg0: CodePanelProps) {
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
    <div className="clarify-code-panel group bg-(--clarify-code-background)">
      <CodePanelHeader tag={tag} label={label} />
      <div className="relative">
        <pre className="clarify-code-pre overflow-x-auto p-4 text-xs text-(--clarify-code-text)">{children}</pre>
        <CopyButton code={copyText} />
      </div>
    </div>
  )
}

type CodeGroupHeaderProps = { title?: string; children: ReactNode; selectedIndex: number }

function CodeGroupHeader(arg0: CodeGroupHeaderProps) {  const { title, children, selectedIndex } = arg0

  const t = useBuiltInText()
  const hasTabs = Children.count(children) > 1
  const indicatorLayoutId = useId()

  if (!title && !hasTabs) return null

  return (
    <div className="clarify-code-group-header flex min-h-(--clarify-code-header-min-height) flex-wrap items-start gap-x-4 border-b border-(--clarify-code-border) bg-(--clarify-code-header-background) px-4">
      {title ? <h3 className="mr-auto pt-3 text-xs font-semibold text-(--clarify-code-text)">{title}</h3> : null}
      {hasTabs ? (
        <TabList className="clarify-code-tabs -mr-2 -mb-px flex gap-0 text-xs font-medium">
          {Children.map(children, (child, childIndex) => (
            <Tab
              className={clsx(
                'clarify-code-tab relative border-b border-transparent px-2 py-3 transition-colors hover:bg-(--clarify-code-control-background-hover) data-selected:not-data-focus:outline-hidden',
                childIndex === selectedIndex
                  ? 'text-(--clarify-code-accent-text)'
                  : 'text-(--clarify-code-control-text) hover:text-(--clarify-code-text)',
              )}
            >
              {getPanelTitle({ ...(isValidElement(child) ? (child.props as { title?: string; language?: string }) : {}), fallbackTitle: t('actions.code') })}
              {childIndex === selectedIndex ? (
                <motion.span
                  layoutId={indicatorLayoutId}
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-(--clarify-code-accent-text)"
                  transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
                />
              ) : null}
            </Tab>
          ))}
        </TabList>
      ) : null}
    </div>
  )
}

type CodeGroupPanelsProps = ComponentPropsWithoutRef<typeof CodePanel>

function CodeGroupPanels(arg0: CodeGroupPanelsProps) {  const { children, ...props } = arg0

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

  // Only sync the selection from the globally preferred language when the
  // languages are unambiguous (each appears at most once). When languages
  // collide (e.g. two `bash` panels), index resolution by language name would
  // always return the first match and break tab switching, so we rely on the
  // local selection instead.
  const languagesAreUnique = new Set(availableLanguages).size === availableLanguages.length
  if (languagesAreUnique) {
    const activeLanguage = [...availableLanguages].sort(
      (a, z) => preferredLanguages.indexOf(z) - preferredLanguages.indexOf(a),
    )[0]
    const languageIndex = availableLanguages.indexOf(activeLanguage)
    const newSelectedIndex = languageIndex === -1 ? selectedIndex : languageIndex

    if (newSelectedIndex !== selectedIndex) setSelectedIndex(newSelectedIndex)
  }

  const { positionRef, preventLayoutShift } = usePreventLayoutShift()

  return {
    as: 'div' as const,
    ref: positionRef,
    selectedIndex,
    onChange: (nextSelectedIndex: number) => {
      setSelectedIndex(nextSelectedIndex)
      preventLayoutShift(() => addPreferredLanguage(availableLanguages[nextSelectedIndex]))
    },
  }
}

const CodeGroupContext = createContext(false)

type CodeGroupProps = ComponentPropsWithoutRef<typeof CodeGroupPanels> & { title?: string }

export function CodeGroup(arg0: CodeGroupProps) {  const {
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
  const containerClassName = 'clarify-code-group my-6 overflow-hidden rounded-2xl bg-(--clarify-code-background) shadow-md ring-1 ring-(--clarify-code-border)'
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

type CodeProps = ComponentPropsWithoutRef<'code'> & { code?: string; language?: string; title?: string }

export function Code(arg0: CodeProps) {  const { children, ...props } = arg0

  const isGrouped = useContext(CodeGroupContext)

  if (isGrouped && typeof children === 'string') {
    return <code {...props} dangerouslySetInnerHTML={{ __html: children }} />
  }

  return <code {...props}>{children}</code>
}

type PreProps = ComponentPropsWithoutRef<typeof CodeGroup> & { language?: string; code?: string }

export function Pre(arg0: PreProps) {  const { children, language, code, ...props } = arg0

  const isGrouped = useContext(CodeGroupContext)
  const resolvedLanguage = language ?? getCodeLanguage(children)
  const resolvedCode = code ?? getNodeText(children)

  if (resolvedLanguage === 'mermaid') {
    return <Mermaid chart={resolvedCode} />
  }

  if (isGrouped) return children

  return <CodeGroup {...props}>{children}</CodeGroup>
}
