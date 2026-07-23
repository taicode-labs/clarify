import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', () => ({ existsSync: vi.fn() }))

import { existsSync } from 'node:fs'
import { resolveLocalClarifyBin } from './localCli'

const mockExists = vi.mocked(existsSync)

afterEach(() => {
  vi.resetAllMocks()
})

describe('resolveLocalClarifyBin', () => {
  it('finds the monorepo CLI source binary', () => {
    const expected = '/workspace/packages/cli/bin/clarify.js'
    mockExists.mockImplementation(path => String(path) === expected)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(expected)
  })

  it('finds a workspace node_modules binary', () => {
    const expected = '/project/node_modules/.bin/clarify'
    mockExists.mockImplementation(path => String(path) === expected)
    expect(resolveLocalClarifyBin('/project')).toBe(expected)
  })

  it('walks through ancestor directories', () => {
    const expected = '/workspace/node_modules/.bin/clarify'
    mockExists.mockImplementation(path => String(path) === expected)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(expected)
  })

  it('returns undefined when no local binary exists', () => {
    mockExists.mockReturnValue(false)
    expect(resolveLocalClarifyBin('/project')).toBeUndefined()
  })

  it('prefers monorepo source over node_modules', () => {
    const monorepo = join('/workspace', 'packages/cli/bin/clarify.js')
    const nodeModules = join('/workspace', 'node_modules/.bin/clarify')
    mockExists.mockImplementation(path => path === monorepo || path === nodeModules)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(monorepo)
  })
})
