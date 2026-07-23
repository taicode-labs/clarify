import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', () => ({ existsSync: vi.fn() }))

import { existsSync } from 'node:fs'
import type { ProjectInfo } from '../server/projectInfo'
import { BOOTSTRAP_CONVENTIONS, conventionsFromProjectInfo } from './conventions'
import { findClarifyProjectRoot, isContentFile, resolveClarifyContentFile } from './projectLocator'

const mockExists = vi.mocked(existsSync)

afterEach(() => {
  vi.resetAllMocks()
})

describe('isContentFile', () => {
  it('recognizes supported content extensions case-insensitively', () => {
    expect(isContentFile('/project/source/index.md')).toBe(true)
    expect(isContentFile('/project/source/guide.MDX')).toBe(true)
    expect(isContentFile('/project/source/api.openapi.yaml')).toBe(true)
    expect(isContentFile('/project/source/main.ts')).toBe(false)
  })

  it('respects custom conventions', () => {
    const conventions = { ...BOOTSTRAP_CONVENTIONS, contentFileExtensions: ['.txt'] as const }
    expect(isContentFile('/project/doc.txt', conventions)).toBe(true)
    expect(isContentFile('/project/doc.md', conventions)).toBe(false)
  })
})

describe('findClarifyProjectRoot', () => {
  it('walks up to a configured project root', () => {
    mockExists.mockImplementation(path => String(path) === '/workspace/clarify.ts')
    expect(findClarifyProjectRoot('/workspace/docs/source/guide.md')).toBe('/workspace')
  })

  it('returns undefined when no config exists', () => {
    mockExists.mockReturnValue(false)
    expect(findClarifyProjectRoot('/project/source/index.md')).toBeUndefined()
  })

  it('respects custom config filenames', () => {
    mockExists.mockImplementation(path => String(path) === '/project/my-config.json')
    const conventions = { ...BOOTSTRAP_CONVENTIONS, configFilenames: ['my-config.json'] as const }
    expect(findClarifyProjectRoot('/project/source/index.md', conventions)).toBe('/project')
  })
})

describe('resolveClarifyContentFile', () => {
  it('returns the project root for content inside the configured root', () => {
    mockExists.mockImplementation(path => String(path) === '/project/clarify.ts')
    expect(resolveClarifyContentFile('/project/source/guides/intro.md')).toEqual({
      projectRoot: '/project',
    })
  })

  it('rejects unsupported or out-of-root files', () => {
    mockExists.mockImplementation(path => String(path) === '/project/clarify.ts')
    expect(resolveClarifyContentFile('/project/source/main.ts')).toBeUndefined()
    expect(resolveClarifyContentFile('/project/index.md')).toBeUndefined()
  })
})

describe('conventionsFromProjectInfo', () => {
  it('maps server metadata to workspace conventions', () => {
    const info: ProjectInfo = {
      configFilenames: ['clarify.ts'],
      contentFileExtensions: ['.md', '.mdx'],
      contentRoot: 'docs',
      projectRoot: '/project',
    }
    expect(conventionsFromProjectInfo(info)).toEqual({
      configFilenames: ['clarify.ts'],
      contentFileExtensions: ['.md', '.mdx'],
      contentRoot: 'docs',
    })
  })
})
