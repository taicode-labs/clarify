import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { defineConfig, findClarifyConfigFile, loadClarifyConfig } from './user-config.js'

describe('defineConfig', () => {
  it('returns the validated config with defaults', () => {
    const config = { title: 'Docs' }
    expect(defineConfig(config)).toMatchObject({
      title: 'Docs',
      routePrefix: '/',
    })
  })

  it('rejects build directories', () => {
    expect(() => defineConfig({ contentDir: 'docs' } as never)).toThrow(/contentDir/)
    expect(() => defineConfig({ outputDir: 'dist' } as never)).toThrow(/outputDir/)
  })

  it('rejects ssg configuration', () => {
    expect(() => defineConfig({
      features: { ssg: { failOnError: false } },
    } as never)).toThrow('[clarify] config field "features" is invalid: Unrecognized key: "ssg"')
  })

  it('rejects imported footer components', () => {
    function Footer() {
      return null
    }

    expect(() => defineConfig({
      footer: Footer,
    } as never)).toThrow('[clarify] config field "footer" is invalid')
  })

  it('rejects invalid plugins', () => {
    expect(() => defineConfig({ plugins: 'legacy-plugin' } as never)).toThrow('[clarify] config field "plugins" is invalid')
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

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).resolves.toEqual({
      title: 'JSON Docs',
      routePrefix: '/',
    })
  })

  it('rejects build directories in clarify.json', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ contentDir: 'docs' }), 'utf-8')

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).rejects.toThrow(/contentDir/)
  })

  it('rejects plugins in clarify.json', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ plugins: [] }), 'utf-8')

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).rejects.toThrow('clarify.json does not support plugins')
  })

  it('rejects invalid clarify.json project fields', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 123 }), 'utf-8')

    await expect(loadClarifyConfig(tempDir, { command: 'build', mode: 'production' })).rejects.toThrow('[clarify] config field "title" is invalid')
  })
})
