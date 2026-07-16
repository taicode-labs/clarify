import { describe, expect, it } from 'vitest'

import { createClarifyRuntimeAliases } from './runtime-deps.js'

describe('createClarifyRuntimeAliases', () => {
  it('resolves React runtime peer dependencies from the CLI package', () => {
    const aliases = createClarifyRuntimeAliases()
    expect(Array.isArray(aliases)).toBe(true)
    if (!Array.isArray(aliases)) return

    const aliasPatterns = aliases.map((alias) => alias.find?.toString())

    expect(aliasPatterns).toContain('/^react-dom\\/client$/')
    expect(aliasPatterns).toContain('/^react-dom\\/server$/')
    expect(aliasPatterns).toContain('/^react-dom$/')
    expect(aliasPatterns).toContain('/^react-router-dom$/')
    expect(aliasPatterns).toContain('/^react-router$/')
    expect(aliasPatterns).toContain('/^mermaid$/')
    expect(aliasPatterns).toContain('/^react-zoom-pan-pinch$/')
  })
})
