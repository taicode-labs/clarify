import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SectionProvider } from '../app/SectionProvider'
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
    expect(html).toMatch(/aria-current="page"[^>]+href="\/guides\/configure"/)
    expect(html).not.toMatch(/aria-current="page"[^>]+href="\/guides\/start"/)
    expect(html).not.toContain('clarify-navigation-tree-line')
    expect(html).not.toContain('clarify-navigation-branch-count')
    expect(html).not.toContain('padding-left:')
    expect(html).toMatch(/clarify-navigation-section-indent[^>]*>\s*<svg[^>]*>.*?<\/svg>\s*<\/span>.*?Overview/)
    expect(html).toMatch(/clarify-navigation-section-indent[^>]*>\s*<svg[^>]*>.*?<\/svg>\s*<svg[^>]*>.*?<\/svg>\s*<\/span>.*?Details/)
  })
})
