import { Search as SearchIcon } from 'lucide-react'
import { forwardRef } from 'react'

import { useBuiltInText } from '../../i18n'

export const SearchInput = forwardRef<
  React.ElementRef<'input'>,
  {
    query: string
    setQuery: (query: string) => void
    onClose: () => void
    onSubmit: () => void
    activeDescendantId?: string
  }
>(function SearchInput(arg0, inputRef) {
  const { query, setQuery, onClose, onSubmit, activeDescendantId } = arg0
  const t = useBuiltInText()

  return (
    <div className="clarify-search-input group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute top-0 left-3 h-full w-5 stroke-(--clarify-theme-tokens-colors-muted)" />
      <input
        ref={inputRef}
        data-autofocus
        role="combobox"
        aria-expanded={query !== ''}
        aria-controls="clarify-search-results"
        aria-activedescendant={activeDescendantId}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (query) setQuery('')
            else onClose()
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            onSubmit()
          }
        }}
        placeholder={t('search.placeholder')}
        className="clarify-search-field flex-auto appearance-none bg-transparent pr-4 pl-10 outline-hidden focus:w-full focus:flex-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
      />
    </div>
  )
})
