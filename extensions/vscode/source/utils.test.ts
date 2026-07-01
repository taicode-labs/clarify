import { join } from 'node:path'

import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  isContentFile,
  findClarifyProjectRoot,
  resolveClarifyContentFile,
  resolveLocalClarifyBin,
  BOOTSTRAP_CONVENTIONS,
  conventionsFromProjectInfo,
} from './utils'
import type { ProjectInfo } from './projectInfo'

// Mock existsSync so tests don't touch the real filesystem
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

import { existsSync } from 'node:fs'
const mockExists = vi.mocked(existsSync)

afterEach(() => {
  vi.resetAllMocks()
})

// ---------------------------------------------------------------------------
// isContentFile
// ---------------------------------------------------------------------------

describe('isContentFile', () => {
  it('returns true for .md files', () => {
    expect(isContentFile('/project/source/index.md')).toBe(true)
  })

  it('returns true for .mdx files', () => {
    expect(isContentFile('/project/source/guide.mdx')).toBe(true)
  })

  it('returns true for .openapi.json files', () => {
    expect(isContentFile('/project/source/api.openapi.json')).toBe(true)
  })

  it('returns true for .openapi.yaml and .openapi.yml files', () => {
    expect(isContentFile('/project/source/api.openapi.yaml')).toBe(true)
    expect(isContentFile('/project/source/api.openapi.yml')).toBe(true)
  })

  it('returns false for non-content files', () => {
    expect(isContentFile('/project/source/index.ts')).toBe(false)
    expect(isContentFile('/project/source/styles.css')).toBe(false)
    expect(isContentFile('/project/package.json')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isContentFile('/project/source/README.MD')).toBe(true)
    expect(isContentFile('/project/source/guide.MDX')).toBe(true)
  })

  it('respects custom conventions', () => {
    const conventions = { ...BOOTSTRAP_CONVENTIONS, contentFileExtensions: ['.txt'] as const }
    expect(isContentFile('/project/doc.txt', conventions)).toBe(true)
    expect(isContentFile('/project/doc.md', conventions)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// findClarifyProjectRoot
// ---------------------------------------------------------------------------

describe('findClarifyProjectRoot', () => {
  it('finds project root when config file is in the same directory', () => {
    mockExists.mockImplementation((p) => String(p) === '/project/clarify.ts')
    expect(findClarifyProjectRoot('/project/source/index.md')).toBe('/project')
  })

  it('walks up to find project root in an ancestor directory', () => {
    mockExists.mockImplementation((p) => String(p) === '/workspace/clarify.ts')
    expect(findClarifyProjectRoot('/workspace/docs/source/en-US/guide.md')).toBe('/workspace')
  })

  it('returns undefined when no config file is found', () => {
    mockExists.mockReturnValue(false)
    expect(findClarifyProjectRoot('/some/random/path/file.md')).toBeUndefined()
  })

  it('respects custom config filenames', () => {
    mockExists.mockImplementation((p) => String(p) === '/project/my-config.json')
    const conventions = { ...BOOTSTRAP_CONVENTIONS, configFilenames: ['my-config.json'] as const }
    expect(findClarifyProjectRoot('/project/source/index.md', conventions)).toBe('/project')
  })

  it('checks all default config filenames', () => {
    // Only clarify.json present
    mockExists.mockImplementation((p) => String(p) === '/project/clarify.json')
    expect(findClarifyProjectRoot('/project/source/index.md')).toBe('/project')
  })
})

// ---------------------------------------------------------------------------
// resolveClarifyContentFile
// ---------------------------------------------------------------------------

describe('resolveClarifyContentFile', () => {
  it('returns projectRoot when file is a content file inside the content root', () => {
    mockExists.mockImplementation((p) => String(p) === '/project/clarify.ts')
    const result = resolveClarifyContentFile('/project/source/index.md')
    expect(result).toEqual({ projectRoot: '/project' })
  })

  it('returns undefined for non-content file extensions', () => {
    mockExists.mockReturnValue(true) // even if config exists
    const result = resolveClarifyContentFile('/project/source/main.ts')
    expect(result).toBeUndefined()
  })

  it('returns undefined when no project root is found', () => {
    mockExists.mockReturnValue(false)
    const result = resolveClarifyContentFile('/project/source/index.md')
    expect(result).toBeUndefined()
  })

  it('returns undefined when file is outside the content root', () => {
    mockExists.mockImplementation((p) => String(p) === '/project/clarify.ts')
    // File is in /project directly, not in /project/source
    const result = resolveClarifyContentFile('/project/index.md')
    expect(result).toBeUndefined()
  })

  it('handles nested content files', () => {
    mockExists.mockImplementation((p) => String(p) === '/project/clarify.ts')
    const result = resolveClarifyContentFile('/project/source/en-US/guides/intro.md')
    expect(result).toEqual({ projectRoot: '/project' })
  })
})

// ---------------------------------------------------------------------------
// resolveLocalClarifyBin
// ---------------------------------------------------------------------------

describe('resolveLocalClarifyBin', () => {
  it('finds bin at packages/cli/bin/clarify.js (monorepo)', () => {
    const expected = '/workspace/packages/cli/bin/clarify.js'
    mockExists.mockImplementation((p) => String(p) === expected)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(expected)
  })

  it('finds bin at node_modules/.bin/clarify', () => {
    const expected = '/project/node_modules/.bin/clarify'
    mockExists.mockImplementation((p) => String(p) === expected)
    expect(resolveLocalClarifyBin('/project')).toBe(expected)
  })

  it('walks up from projectRoot to find the bin', () => {
    const expected = '/workspace/node_modules/.bin/clarify'
    mockExists.mockImplementation((p) => String(p) === expected)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(expected)
  })

  it('returns undefined when no local bin is found', () => {
    mockExists.mockReturnValue(false)
    expect(resolveLocalClarifyBin('/project')).toBeUndefined()
  })

  it('prefers monorepo source over node_modules', () => {
    // Both exist — monorepo source should win (first candidate wins)
    const monorepo = join('/workspace', 'packages/cli/bin/clarify.js')
    const nodeModules = join('/workspace', 'node_modules/.bin/clarify')
    mockExists.mockImplementation((p) => p === monorepo || p === nodeModules)
    expect(resolveLocalClarifyBin('/workspace/apps/docs')).toBe(monorepo)
  })
})

// ---------------------------------------------------------------------------
// conventionsFromProjectInfo
// ---------------------------------------------------------------------------

describe('conventionsFromProjectInfo', () => {
  it('maps ProjectInfo fields to ProjectConventions', () => {
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
