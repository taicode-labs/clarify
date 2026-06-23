import { Fragment } from 'react'
import type { ReactNode } from 'react'

function stripHtml(value: string): string {
  if (typeof document === 'undefined') return value.replace(/<[^>]*>/g, '')
  const template = document.createElement('template')
  template.innerHTML = value
  return template.content.textContent ?? ''
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type HighlightQueryProps = { text: string; query: string }

export function HighlightQuery(arg0: HighlightQueryProps) {
  const { text, query } = arg0

  if (!query) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-transparent text-(--clarify-theme-tokens-colors-primary) underline">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function renderExcerptNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const element = node as HTMLElement
  const children = Array.from(element.childNodes).map((child, index) => renderExcerptNode(child, `${key}-${index}`))

  if (element.tagName.toLowerCase() === 'mark') {
    return (
      <mark key={key} className="bg-transparent text-(--clarify-theme-tokens-colors-primary) underline">
        {children}
      </mark>
    )
  }

  return <Fragment key={key}>{children}</Fragment>
}

type HighlightExcerptProps = { excerpt: string; query: string }

export function HighlightExcerpt(arg0: HighlightExcerptProps) {
  const { excerpt, query } = arg0

  if (typeof document === 'undefined' || !excerpt.includes('<mark')) {
    return <HighlightQuery text={stripHtml(excerpt)} query={query} />
  }

  const template = document.createElement('template')
  template.innerHTML = excerpt

  return <>{Array.from(template.content.childNodes).map((node, index) => renderExcerptNode(node, String(index)))}</>
}
