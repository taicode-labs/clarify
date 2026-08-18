import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  coordinateHashNavigation,
  installNativeHashNavigationListener,
  navigationFromTabs,
  resolvePageLayout,
  scrollToHeadingId,
  visibleNavigation,
  type HashNavigationRefs,
} from './AppShell'
import { installHashSyncManualInputRelease, scheduleSectionHashUpdate } from './SectionHashSync'

function createHashNavigationRefs(): HashNavigationRefs {
  return {
    hashScrollSuppressedUntilRef: { current: 0 },
    hashNavigationEpochRef: { current: 0 },
    lastHandledLocationRef: { current: undefined },
    hashScrollCleanupRef: { current: undefined },
  }
}

function stubBrowser(pathname = '/guide', search = '?lang=zh', hash = '') {
  const listeners = new Map<string, EventListener>()
  const scrollIntoView = vi.fn()
  const getElementById = vi.fn<(id: string) => { scrollIntoView: typeof scrollIntoView } | null>(() => ({ scrollIntoView }))
  const historyState = { index: 3 }
  const replaceState = vi.fn()
  vi.stubGlobal('document', { getElementById })
  vi.stubGlobal('window', {
    location: { pathname, search, hash },
    history: { state: historyState, replaceState },
    addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
    removeEventListener: vi.fn(),
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => callback(0)),
    dispatchEvent: vi.fn(),
    scrollTo: vi.fn(),
  })
  return { getElementById, historyState, listeners, replaceState, scrollIntoView }
}

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

describe('heading hash navigation', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('corrects the scroll after async layout changes', () => {
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

    const cleanup = scrollToHeadingId('常见错误排查')
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

    scrollToHeadingId('中文')
    vi.advanceTimersByTime(0)
    listeners.get('wheel')?.(new Event('wheel'))
    vi.runAllTimers()

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('canonicalizes a legacy hash before scrolling its canonical target', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '?lang=zh', '#%E6%8E%A8%E8%8D%90%E8%87%AA%E5%8A%A8%E9%85%8D%E7%BD%AE')
    const refs = createHashNavigationRefs()

    coordinateHashNavigation({
      ...refs,
      location: window.location,
      aliases: { 推荐自动配置: 'auto-config' },
      source: 'router',
    })
    vi.runAllTimers()

    expect(browser.replaceState).toHaveBeenCalledOnce()
    expect(browser.replaceState).toHaveBeenCalledWith(browser.historyState, '', '/guide?lang=zh#auto-config')
    expect(browser.getElementById).toHaveBeenCalledWith('auto-config')
    expect(browser.scrollIntoView).toHaveBeenCalledTimes(5)
  })

  it('scrolls a canonical hash without rewriting it', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '?lang=zh', '#auto-config')

    coordinateHashNavigation({
      ...createHashNavigationRefs(),
      location: window.location,
      aliases: { 推荐自动配置: 'auto-config' },
      source: 'router',
    })
    vi.runAllTimers()

    expect(browser.replaceState).not.toHaveBeenCalled()
    expect(browser.getElementById).toHaveBeenCalledWith('auto-config')
  })

  it('does not rewrite malformed or unknown missing-target fragments', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '?lang=zh', '#%E0%A4%A')
    browser.getElementById.mockReturnValue(null)
    const refs = createHashNavigationRefs()

    coordinateHashNavigation({
      ...refs,
      location: window.location,
      aliases: { 推荐自动配置: 'auto-config' },
      source: 'router',
    })
    coordinateHashNavigation({
      ...refs,
      location: { pathname: '/guide', search: '?lang=zh', hash: '#unknown-heading' },
      aliases: { 推荐自动配置: 'auto-config' },
      source: 'router',
    })
    vi.runAllTimers()

    expect(browser.replaceState).not.toHaveBeenCalled()
    expect(browser.getElementById).toHaveBeenCalledWith('unknown-heading')
  })

  it('uses the hash-navigation coordinator for native hashchange events', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '?lang=zh', '#auto-config')
    const refs = createHashNavigationRefs()
    const cleanup = installNativeHashNavigationListener(refs, () => ({ 推荐自动配置: 'auto-config' }))

    browser.listeners.get('hashchange')?.(new Event('hashchange'))
    vi.runAllTimers()

    expect(refs.hashNavigationEpochRef.current).toBe(1)
    expect(browser.getElementById).toHaveBeenCalledWith('auto-config')
    cleanup()
  })

  it('resolves native hash aliases from the observed pathname during cross-route history navigation', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/new-guide', '', '#legacy-heading')
    const refs = createHashNavigationRefs()
    const aliasesByPath: Record<string, Record<string, string>> = {
      '/old-guide': { 'legacy-heading': 'old-canonical' },
      '/new-guide': { 'legacy-heading': 'new-canonical' },
    }
    const cleanup = installNativeHashNavigationListener(refs, pathname => aliasesByPath[pathname])

    browser.listeners.get('hashchange')?.(new Event('hashchange'))
    vi.runAllTimers()

    expect(browser.replaceState).toHaveBeenCalledWith(browser.historyState, '', '/new-guide#new-canonical')
    expect(browser.getElementById).toHaveBeenCalledWith('new-canonical')
    cleanup()
  })

  it('resolves native hash aliases beneath the configured route prefix', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/docs/new-guide', '', '#legacy-heading')
    const refs = createHashNavigationRefs()
    const aliasesByRoutePath: Record<string, Record<string, string>> = {
      '/new-guide': { 'legacy-heading': 'new-canonical' },
    }
    const cleanup = installNativeHashNavigationListener(
      refs,
      pathname => aliasesByRoutePath[pathname],
      '/docs/',
    )

    browser.listeners.get('hashchange')?.(new Event('hashchange'))
    coordinateHashNavigation({
      ...refs,
      location: { pathname: '/new-guide', search: '', hash: '#legacy-heading', key: 'history-visit' },
      aliases: aliasesByRoutePath['/new-guide'],
      source: 'router',
    })
    vi.runAllTimers()

    expect(refs.hashNavigationEpochRef.current).toBe(1)
    expect(browser.replaceState).toHaveBeenCalledOnce()
    expect(browser.replaceState).toHaveBeenCalledWith(browser.historyState, '', '/docs/new-guide#new-canonical')
    expect(browser.getElementById).toHaveBeenCalledWith('new-canonical')
    cleanup()
  })

  it('deduplicates StrictMode replay of the same router location key', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '', '#legacy-heading')
    const refs = createHashNavigationRefs()
    const location = { pathname: '/guide', search: '', hash: '#legacy-heading', key: 'default' }

    coordinateHashNavigation({ ...refs, location, aliases: { 'legacy-heading': 'canonical-heading' }, source: 'router' })
    refs.hashScrollCleanupRef.current?.()
    refs.hashScrollCleanupRef.current = undefined
    coordinateHashNavigation({ ...refs, location, aliases: { 'legacy-heading': 'canonical-heading' }, source: 'router' })
    vi.runAllTimers()

    expect(refs.hashNavigationEpochRef.current).toBe(1)
    expect(browser.replaceState).toHaveBeenCalledOnce()
    expect(browser.getElementById).toHaveBeenCalledTimes(5)
  })

  it('handles a genuine same-URL router navigation with a new location key', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '', '#canonical-heading')
    const refs = createHashNavigationRefs()

    coordinateHashNavigation({
      ...refs,
      location: { pathname: '/guide', search: '', hash: '#canonical-heading', key: 'first-visit' },
      source: 'router',
    })
    vi.runAllTimers()
    coordinateHashNavigation({
      ...refs,
      location: { pathname: '/guide', search: '', hash: '#canonical-heading', key: 'second-visit' },
      source: 'router',
    })
    vi.runAllTimers()

    expect(refs.hashNavigationEpochRef.current).toBe(2)
    expect(browser.getElementById).toHaveBeenCalledTimes(10)
  })

  it('handles a repeated native legacy hash after section sync silently changes the URL', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '', '#legacy-heading')
    const refs = createHashNavigationRefs()
    const cleanup = installNativeHashNavigationListener(refs, () => ({ 'legacy-heading': 'canonical-heading' }))

    browser.listeners.get('hashchange')?.(new Event('hashchange'))
    vi.runAllTimers()

    window.location.hash = '#canonical-heading'
    refs.hashScrollSuppressedUntilRef.current = 0
    scheduleSectionHashUpdate(
      'other-section',
      refs.hashScrollSuppressedUntilRef,
      refs.hashNavigationEpochRef,
      refs.lastHandledLocationRef,
    )
    vi.advanceTimersByTime(120)

    window.location.hash = '#other-section'
    window.location.hash = '#legacy-heading'
    browser.listeners.get('hashchange')?.(new Event('hashchange'))
    vi.runAllTimers()

    expect(refs.hashNavigationEpochRef.current).toBe(2)
    expect(browser.replaceState).toHaveBeenNthCalledWith(1, browser.historyState, '', '/guide#canonical-heading')
    expect(browser.replaceState).toHaveBeenNthCalledWith(2, browser.historyState, '', '/guide#other-section')
    expect(browser.replaceState).toHaveBeenNthCalledWith(3, browser.historyState, '', '/guide#canonical-heading')
    expect(browser.getElementById.mock.calls.filter(([id]) => id === 'canonical-heading')).toHaveLength(10)
    cleanup()
  })

  it('handles each Back or Forward location once across router and native observations', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '', '#first')
    const refs = createHashNavigationRefs()
    const visit = (hash: string, firstSource: 'router' | 'native') => {
      const location = { pathname: '/guide', search: '', hash }
      coordinateHashNavigation({ ...refs, location, source: firstSource })
      coordinateHashNavigation({ ...refs, location, source: firstSource === 'router' ? 'native' : 'router' })
      vi.runAllTimers()
    }

    visit('#first', 'native')
    visit('#second', 'router')
    visit('#first', 'native')

    expect(refs.hashNavigationEpochRef.current).toBe(3)
    expect(browser.getElementById.mock.calls.filter(([id]) => id === 'first')).toHaveLength(10)
    expect(browser.getElementById.mock.calls.filter(([id]) => id === 'second')).toHaveLength(5)
  })

  it('prevents a queued section update from overwriting a canonicalized fragment', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '?lang=zh', '#%E6%8E%A8%E8%8D%90%E8%87%AA%E5%8A%A8%E9%85%8D%E7%BD%AE')
    const refs = createHashNavigationRefs()
    scheduleSectionHashUpdate(
      'previous-section',
      refs.hashScrollSuppressedUntilRef,
      refs.hashNavigationEpochRef,
      refs.lastHandledLocationRef,
    )

    coordinateHashNavigation({
      ...refs,
      location: window.location,
      aliases: { 推荐自动配置: 'auto-config' },
      source: 'router',
    })
    refs.hashScrollSuppressedUntilRef.current = 0
    vi.advanceTimersByTime(120)

    expect(browser.replaceState).toHaveBeenCalledOnce()
    expect(browser.replaceState).toHaveBeenLastCalledWith(browser.historyState, '', '/guide?lang=zh#auto-config')
  })

  it('manual input invalidates stale section updates and allows later visible-section sync', () => {
    vi.useFakeTimers()
    const browser = stubBrowser('/guide', '', '#old-section')
    const suppressedUntilRef = { current: Number.POSITIVE_INFINITY }
    const epochRef = { current: 4 }
    const lastHandledLocationRef = { current: undefined }
    scheduleSectionHashUpdate('stale-section', suppressedUntilRef, epochRef, lastHandledLocationRef)
    const cleanup = installHashSyncManualInputRelease(suppressedUntilRef, epochRef)

    browser.listeners.get('wheel')?.(new Event('wheel'))
    browser.listeners.get('touchmove')?.(new Event('touchmove'))
    browser.listeners.get('pointerdown')?.(new Event('pointerdown'))
    browser.listeners.get('keydown')?.({ key: 'PageDown' } as KeyboardEvent)
    vi.advanceTimersByTime(120)

    expect(suppressedUntilRef.current).toBe(0)
    expect(epochRef.current).toBe(8)
    expect(browser.replaceState).not.toHaveBeenCalled()

    scheduleSectionHashUpdate('current-section', suppressedUntilRef, epochRef, lastHandledLocationRef)
    vi.advanceTimersByTime(120)
    expect(browser.replaceState).toHaveBeenCalledWith(browser.historyState, '', '/guide#current-section')
    cleanup()
  })
})
