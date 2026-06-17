import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { loadProjectConfig, resolveProjectConfig, resolveGenerateOptions } from './config.js'
import { clarifyProjectConfigSchema } from './config-schema.js'

describe('loadProjectConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns empty object when clarify.json does not exist', () => {
    const result = loadProjectConfig(tempDir)
    expect(result).toEqual({})
  })

  it('parses clarify.json correctly', () => {
    const config = { title: 'My Docs', description: 'Test docs', routePrefix: '/docs' }
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify(config), 'utf-8')
    const result = loadProjectConfig(tempDir)
    expect(result).toEqual(config)
  })

  it('throws when clarify.json is invalid JSON', () => {
    writeFileSync(join(tempDir, 'clarify.json'), 'not json', 'utf-8')
    expect(() => loadProjectConfig(tempDir)).toThrow()
  })

  it('throws when clarify.json has invalid field types', () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 123 }), 'utf-8')
    expect(() => loadProjectConfig(tempDir)).toThrow('[clarify] clarify.json field "title" is invalid')
  })

  it('exposes a zod project config schema', () => {
    expect(clarifyProjectConfigSchema.parse({
      title: 'Docs',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      pages: [{ group: 'Guide', pages: ['index', { openapi: 'api', title: 'API' }] }],
    })).toEqual({
      title: 'Docs',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      pages: [{ group: 'Guide', pages: ['index', { openapi: 'api', title: 'API' }] }],
    })
  })
})

describe('resolveProjectConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('uses defaults when no config provided', () => {
    const result = resolveProjectConfig(tempDir)
    expect(result).toEqual({
      title: 'Clarify Docs',
      description: '',
      logo: undefined,
      favicon: undefined,
      routePrefix: '/',
      theme: {},
      navbar: undefined,
      banner: undefined,
      footer: undefined,
      pages: undefined,
    })
  })

  it('merges project config with defaults', () => {
    const config = {
      title: 'Project Docs',
      description: 'Desc',
      theme: { primary: '#333' },
      favicon: '/favicon.svg',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com' }] },
      banner: { content: 'v2 is out', dismissible: true },
      footer: { copyright: '© 2026' },
      pages: [
        { group: 'Getting Started', pages: ['index', 'quickstart'] },
        { group: 'Advanced', pages: ['advanced/ssg'] },
      ] as const,
    }
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify(config), 'utf-8')
    const result = resolveProjectConfig(tempDir)
    expect(result.title).toBe('Project Docs')
    expect(result.description).toBe('Desc')
    expect(result.theme).toEqual({ primary: '#333' })
    expect(result.favicon).toBe('/favicon.svg')
    expect(result.navbar).toEqual({ links: [{ label: 'GitHub', href: 'https://github.com' }] })
    expect(result.banner).toEqual({ content: 'v2 is out', dismissible: true })
    expect(result.footer).toEqual({ copyright: '© 2026' })
    expect(result.pages).toEqual([
      { group: 'Getting Started', pages: ['index', 'quickstart'] },
      { group: 'Advanced', pages: ['advanced/ssg'] },
    ])
  })
})

describe('resolveGenerateOptions', () => {
  it('uses defaults when no options provided', () => {
    const result = resolveGenerateOptions()
    expect(result).toEqual({
      rootDirectory: 'source/content',
      outputDirectory: undefined,
      ssg: { failOnError: true },
    })
  })

  it('applies provided options', () => {
    const result = resolveGenerateOptions({ rootDirectory: 'docs', outputDirectory: 'build' })
    expect(result).toEqual({
      rootDirectory: 'docs',
      outputDirectory: 'build',
      ssg: { failOnError: true },
    })
  })

  it('applies provided ssg options', () => {
    const result = resolveGenerateOptions({ ssg: { failOnError: false } })
    expect(result).toEqual({
      rootDirectory: 'source/content',
      outputDirectory: undefined,
      ssg: { failOnError: false },
    })
  })
})
