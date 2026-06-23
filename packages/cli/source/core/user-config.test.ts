import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { defineConfig, findClarifyConfigFile, loadClarifyConfig } from './user-config.js'

describe('defineConfig', () => {
  it('returns the provided config', () => {
    const config = { title: 'Docs', ssg: { failOnError: false } }
    expect(defineConfig(config)).toBe(config)
  })

  it('rejects mixed footer component and built-in config', () => {
    expect(() => defineConfig({
      footer: {
        component: './source/Footer.tsx',
        copyright: '© 2026',
      } as never,
    })).toThrow('[clarify] config field "footer" is invalid')
  })
})

describe('findClarifyConfigFile', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-config-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('uses ts before js before json', () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 'JSON' }), 'utf-8')
    writeFileSync(join(tempDir, 'clarify.js'), 'export default { title: "JS" }', 'utf-8')
    writeFileSync(join(tempDir, 'clarify.ts'), 'export default { title: "TS" }', 'utf-8')

    expect(findClarifyConfigFile(tempDir)).toBe(join(tempDir, 'clarify.ts'))
  })

  it('falls back to js before json', () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 'JSON' }), 'utf-8')
    writeFileSync(join(tempDir, 'clarify.js'), 'export default { title: "JS" }', 'utf-8')

    expect(findClarifyConfigFile(tempDir)).toBe(join(tempDir, 'clarify.js'))
  })
})

describe('loadClarifyConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-config-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('loads and validates clarify.json', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 'JSON Docs' }), 'utf-8')

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).resolves.toEqual({ title: 'JSON Docs' })
  })

  it('rejects invalid clarify.json project fields', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 123 }), 'utf-8')

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).rejects.toThrow('[clarify] config field "title" is invalid')
  })
})
