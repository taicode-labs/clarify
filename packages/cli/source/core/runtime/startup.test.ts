import { describe, expect, it, vi } from 'vitest'

import { getStartupHints, logStartupHints } from '../../../../startup.js'

describe('getStartupHints', () => {
  it('only reports content-directory issues when no content root exists', () => {
    const hints = getStartupHints({
      projectRoot: '/tmp/my-docs',
      contentRoot: '/tmp/my-docs/source',
      contentDirExists: false,
      hasRoutes: false,
    })

    expect(hints).toEqual([
      'Content directory "source" was not found. Create it or pass --content <dir> to point Clarify at a different directory.',
    ])
  })

  it('recommends adding an entry page when content exists but has no routes', () => {
    const hints = getStartupHints({
      projectRoot: '/tmp/my-docs',
      contentRoot: '/tmp/my-docs/docs',
      contentDirExists: true,
      hasRoutes: false,
    })

    expect(hints).toEqual([
      'No content pages were found yet. Add docs/index.mdx to get started.',
    ])
  })
})

describe('logStartupHints', () => {
  it('prints a warn line per startup hint', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logStartupHints({
      projectRoot: '/tmp/my-docs',
      contentRoot: '/tmp/my-docs/source',
      contentDirExists: false,
      hasRoutes: false,
    })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[clarify] Content directory'))
    warn.mockRestore()
  })
})
