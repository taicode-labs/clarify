import { describe, expect, it } from 'vitest'

import { resolveLucideIconName } from './lucide'

describe('resolveLucideIconName', () => {
  it('returns undefined for undefined input', () => {
    expect(resolveLucideIconName(undefined)).toBeUndefined()
  })

  it('returns exact name for valid PascalCase icon', () => {
    expect(resolveLucideIconName('ArrowRight')).toBe('ArrowRight')
  })

  it('resolves kebab-case to PascalCase', () => {
    expect(resolveLucideIconName('arrow-right')).toBe('ArrowRight')
  })

  it('resolves space-separated to PascalCase', () => {
    expect(resolveLucideIconName('arrow right')).toBe('ArrowRight')
  })

  it('returns undefined for non-existent icon', () => {
    expect(resolveLucideIconName('NonExistentIcon')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(resolveLucideIconName('')).toBeUndefined()
  })
})
