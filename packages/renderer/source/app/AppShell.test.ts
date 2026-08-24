import { afterEach, describe, expect, it, vi } from 'vitest'

import { navigationFromTabs, resolvePageLayout, scrollToHash, visibleNavigation } from './AppShell'

describe('visibleNavigation', () => {
  const navigation = [
    { path: '/guide', title: 'Guide', children: [{ path: '/guide/start', title: 'Start' }] },
    { path: '/partner', title: 'Partner', visible: 'active' as const, children: [
      { path: '/partner/overview', title: 'Overview' },
      { path: '/partner/auth', title: 'Authentication' },
    ] },
    { path: '/legacy', title: 'Legacy', visible: 'never' as const, children: [{ path: '/legacy/api', title: 'API' }] },
  ]

  it('shows active groups only while visiting one of their pages', () => {
    expect(visibleNavigation(navigation, '/guide/start').map(node => node.title)).toEqual(['Guide'])
    expect(visibleNavigation(navigation, '/partner/auth')).toEqual([
      expect.objectContaining({ title: 'Guide' }),
      expect.objectContaining({ title: 'Partner', children: navigation[1]?.children }),
    ])
  })

  it('keeps the matching tab and full group for direct links', () => {
    const tabs = [
      { type: 'tab' as const, path: '/guide', title: 'Docs', children: [navigation[0]!] },
      { type: 'tab' as const, path: '/partner', title: 'Partners', children: [navigation[1]!] },
    ]

    expect(navigationFromTabs(tabs, '/guide/start').tabs?.map(tab => tab.title)).toEqual(['Docs'])
    expect(navigationFromTabs(tabs, '/partner/auth')).toMatchObject({
      items: [expect.objectContaining({ title: 'Partner' })],
      tabs: [expect.objectContaining({ title: 'Docs' }), expect.objectContaining({ title: 'Partners' })],
    })
  })
})

describe('resolvePageLayout', () => {
  const navigation = [
    {
      path: '/blog',
      title: 'Blog',
      layout: 'blog' as const,
      children: [
        { title: 'First post', path: '/blog/first' },
        { title: 'Second post', path: '/blog/second' },
      ],
    },
  ]

  it('inherits the group layout for pages without an explicit layout', () => {
    expect(resolvePageLayout(undefined, navigation, '/blog/second')).toBe('blog')
  })

  it('prefers an explicit page layout over the group layout', () => {
    expect(resolvePageLayout({ path: '/blog/first', title: 'First post', component: () => null, layout: 'documentation' }, navigation, '/blog/first')).toBe('documentation')
  })

  it('uses the documentation layout when no layout is configured', () => {
    expect(resolvePageLayout(undefined, [], '/guide')).toBe('documentation')
  })
})

describe('scrollToHash', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('decodes a Chinese hash and corrects the scroll after async layout changes', () => {
    vi.useFakeTimers()
    const scrollIntoView = vi.fn()
    const getElementById = vi.fn(() => ({ scrollIntoView }))
    const listeners = new Map<string, EventListener>()
    vi.stubGlobal('document', { getElementById })
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
      removeEventListener: vi.fn(),
      requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => callback(0)),
      dispatchEvent: vi.fn(),
    })

    const cleanup = scrollToHash('#%E5%B8%B8%E8%A7%81%E9%94%99%E8%AF%AF%E6%8E%92%E6%9F%A5')
    vi.runAllTimers()

    expect(getElementById).toHaveBeenCalledWith('常见错误排查')
    expect(scrollIntoView).toHaveBeenCalledTimes(5)
    expect(scrollIntoView).toHaveBeenNthCalledWith(1, { behavior: 'smooth', block: 'start' })
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' })

    cleanup()
  })

  it('stops correcting the scroll after manual input', () => {
    vi.useFakeTimers()
    const scrollIntoView = vi.fn()
    const listeners = new Map<string, EventListener>()
    vi.stubGlobal('document', { getElementById: vi.fn(() => ({ scrollIntoView })) })
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
      removeEventListener: vi.fn(),
      requestAnimationFrame: vi.fn(),
      dispatchEvent: vi.fn(),
    })

    scrollToHash('#%E4%B8%AD%E6%96%87')
    vi.advanceTimersByTime(0)
    listeners.get('wheel')?.(new Event('wheel'))
    vi.runAllTimers()

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
