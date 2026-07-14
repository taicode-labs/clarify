import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { NavigationNode, RouteItem } from '../core/types'

import { PageNavigation } from './PageNavigation'

const navigation: NavigationNode[] = [
  { title: 'First', path: '/first' },
  { title: 'Middle', path: '/middle' },
  { title: 'Last', path: '/last' },
]

function render(path: string) {
  const currentRoute: RouteItem = {
    title: navigation.find(route => route.path === path)?.title ?? path,
    path,
    component: () => null,
  }

  return renderToStaticMarkup(
    <MemoryRouter>
      <PageNavigation navigation={navigation} currentRoute={currentRoute} />
    </MemoryRouter>,
  )
}

describe('PageNavigation', () => {
  it('uses two columns when both directions are available', () => {
    const markup = render('/middle')

    expect(markup).toContain('@3xl:grid-cols-2')
    expect(markup).toContain('First')
    expect(markup).toContain('Last')
  })

  it('renders a single next link without an empty placeholder or separator', () => {
    const markup = render('/first')

    expect(markup).not.toContain('@3xl:grid-cols-2')
    expect(markup).not.toContain('hidden @3xl:block')
    expect(markup).not.toContain('@3xl:border-l')
    expect(markup).toContain('Middle')
  })

  it('renders a single previous link without an empty placeholder', () => {
    const markup = render('/last')

    expect(markup).not.toContain('@3xl:grid-cols-2')
    expect(markup).not.toContain('hidden @3xl:block')
    expect(markup).toContain('Middle')
  })
})
