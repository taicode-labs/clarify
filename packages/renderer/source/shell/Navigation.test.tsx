import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SectionProvider } from '../app/SectionProvider'
import { LocaleContext } from '../core/context'
import type { NavigationNode } from '../types'

import { Navigation } from './Navigation'

const navigation: NavigationNode[] = [
  {
    path: '/guides/start',
    title: 'Guides',
    children: [
      {
        path: '/guides/start',
        title: 'Basics',
        children: [
          { path: '/guides/start', title: 'Start' },
          { path: '/guides/configure', title: 'Configure' },
        ],
      },
      {
        path: '/guides/advanced/performance',
        title: 'Advanced',
        children: [
          { path: '/guides/advanced/performance', title: 'Performance' },
        ],
      },
    ],
  },
]

describe('Navigation', () => {
  it('expands the active branch and marks only the active page', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/guides/configure']}>
        <SectionProvider sections={[
          { id: 'overview', title: 'Overview', level: 2 },
          { id: 'details', title: 'Details', level: 3 },
        ]}
        >
          <Navigation navigation={navigation} />
        </SectionProvider>
      </MemoryRouter>,
    )

    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('Advanced')
    expect(html).toContain('href="/guides/advanced/performance"')
    expect(html).toContain('Performance')
    expect(html).toMatch(/aria-current="page"[^>]+href="\/guides\/configure"/)
    expect(html).not.toMatch(/aria-current="page"[^>]+href="\/guides\/start"/)
    expect(html).toMatch(/clarify-navigation-section-indent[^>]*>\s*<svg[^>]*>.*?<\/svg>\s*<\/span>.*?Overview/)
    expect(html).toMatch(/clarify-navigation-section-indent[^>]*>\s*<svg[^>]*>.*?<\/svg>\s*<svg[^>]*>.*?<\/svg>\s*<\/span>.*?Details/)
  })
})

describe('deprecated operation navigation', () => {
  it.each([
    ['en-US', 'Deprecated'],
    ['zh-CN', '已弃用'],
  ])('marks only deprecated sections in %s and preserves anchor links', (locale, label) => {
    const html = renderToStaticMarkup(
      <LocaleContext.Provider value={locale}>
        <MemoryRouter initialEntries={['/api']}>
          <SectionProvider sections={[
            { id: 'old', title: 'Old operation', badge: 'GET', deprecated: true },
            { id: 'active', title: 'Active operation', badge: 'POST', deprecated: false },
            { id: 'unspecified', title: 'Unspecified operation', badge: 'GET' },
          ]}
          >
            <Navigation navigation={[{ path: '/api', title: 'API' }]} />
          </SectionProvider>
        </MemoryRouter>
      </LocaleContext.Provider>,
    )

    expect(html.split(label)).toHaveLength(2)
    expect(html).toMatch(new RegExp(`href="/api#old"[^>]*>[\\s\\S]*?${label}[\\s\\S]*?</a>`))
    expect(html).toContain('href="/api#active"')
    expect(html).toContain('href="/api#unspecified"')
    expect(html).toContain('POST')
  })
})


describe('deprecated OpenAPI page navigation', () => {
  const old = { id: 'old', title: 'Old', badge: 'GET', deprecated: true }

  it.each([
    ['all deprecated', [old, { ...old, id: 'second' }], true],
    ['mixed', [old, { ...old, id: 'active', deprecated: false }], false],
    ['unspecified', [old, { id: 'new', title: 'New', badge: 'POST' }], false],
    ['empty', [], false],
    ['missing or failed metadata', undefined, false],
    ['ordinary headings', [{ ...old, badge: undefined }], false],
  ] as const)('handles %s without opening the page', (_name, sections, expected) => {
    for (const [locale, label] of [['en-US', 'Deprecated'], ['zh-CN', '已弃用']]) {
      const html = renderToStaticMarkup(
        <LocaleContext.Provider value={locale}>
          <MemoryRouter initialEntries={['/other']}>
            <SectionProvider sections={[old]}>
              <Navigation navigation={[{ path: '/api', title: 'Assets', sections: sections ? [...sections] : undefined }]} />
            </SectionProvider>
          </MemoryRouter>
        </LocaleContext.Provider>,
      )
      expect(html.includes('clarify-deprecated-badge')).toBe(expected)
      expect(html.includes(label!)).toBe(expected)
      expect(html).toContain('href="/api"')
      expect(html).not.toContain('href="/api#old"')
    }
  })

  it('does not mark enclosing API branches or documentation headings', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/other']}>
        <SectionProvider sections={[]}>
          <Navigation navigation={[{ path: '/api', title: 'API', children: [
            { path: '/api', title: 'Nested', children: [{ path: '/api', title: 'Assets', sections: [old] }] },
          ] }]} />
        </SectionProvider>
      </MemoryRouter>,
    )
    expect(html.match(/clarify-deprecated-badge/g)).toHaveLength(1)
    expect(html).toMatch(/href="\/api"[^>]*>[\s\S]*?Assets[\s\S]*?clarify-deprecated-badge/)
    expect(html).toContain('aria-expanded="false"')
  })
})
