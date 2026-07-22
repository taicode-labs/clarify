import { afterEach, describe, expect, it, vi } from 'vitest'

import { scrollToHash } from './AppShell'

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
