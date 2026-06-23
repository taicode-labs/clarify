import clsx from 'clsx'
import { Fragment, useId } from 'react'

import { HighlightExcerpt, HighlightQuery } from './Highlight'
import type { SearchDisplayItem } from './types'

type SearchResultProps = {
  result: SearchDisplayItem
  query: string
  active: boolean
  onActive: () => void
  onSelect: () => void
}

export function SearchResult(arg0: SearchResultProps) {
  const { result, query, active, onActive, onSelect } = arg0
  const id = useId()
  const hierarchy = result.type === 'quick'
    ? [result.sectionTitle, result.pageTitle].filter((value): value is string => typeof value === 'string')
    : []

  return (
    <li
      id={id}
      className={clsx('clarify-search-result group block cursor-pointer px-4 py-3', active && 'clarify-search-result-active')}
      aria-selected={active}
      onMouseEnter={onActive}
      onMouseMove={onActive}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
    >
      <div className="clarify-search-result-title">
        <HighlightQuery text={result.title} query={query} />
      </div>
      {hierarchy.length > 0 ? (
        <div className="clarify-search-result-hierarchy mt-1 truncate whitespace-nowrap">
          {hierarchy.map((item, itemIndex, items) => (
            <Fragment key={`${item}-${itemIndex}`}>
              <HighlightQuery text={item} query={query} />
              <span className={itemIndex === items.length - 1 ? 'sr-only' : 'clarify-search-result-separator mx-2'}>/</span>
            </Fragment>
          ))}
        </div>
      ) : null}
      {result.type === 'full-text' && result.excerpt ? (
        <p className="clarify-search-result-excerpt mt-1 line-clamp-2 text-xs leading-5 text-(--clarify-theme-tokens-colors-muted)">
          <HighlightExcerpt excerpt={result.excerpt} query={query} />
        </p>
      ) : null}
    </li>
  )
}
