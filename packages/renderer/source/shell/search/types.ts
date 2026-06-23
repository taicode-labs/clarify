export type SearchItem = {
  title: string
  pageTitle: string
  sectionTitle?: string
  url: string
  keywords: string
}

export type PagefindSearchResultData = {
  url: string
  meta: {
    title?: string
  }
  excerpt?: string
}

export type PagefindSearchResult = {
  id: string
  data: () => Promise<PagefindSearchResultData>
}

export type Pagefind = {
  init?: () => Promise<void>
  search: (query: string, options?: { limit?: number }) => Promise<{ results: PagefindSearchResult[] }>
}

export type FullTextSearchItem = {
  type: 'full-text'
  id: string
  title: string
  url: string
  excerpt?: string
}

export type QuickSearchItem = SearchItem & { type: 'quick' }

export type SearchDisplayItem = FullTextSearchItem | QuickSearchItem
