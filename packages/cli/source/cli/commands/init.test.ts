import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runInit } from './init.js'

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>
}

describe('runInit', () => {
  let tempDir: string
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-init-'))
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    logSpy.mockRestore()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates the minimal Clarify project scaffold', () => {
    runInit({
      root: tempDir,
      content: 'source/content',
      output: 'output',
    }, false)

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toContain('defineConfig')
    expect(readFileSync(join(tempDir, 'source/content/index.mdx'), 'utf-8')).toContain('# Welcome to Clarify')

    const packageJson = readJson(join(tempDir, 'package.json'))
    expect(packageJson.scripts).toEqual({
      dev: 'clarify dev',
      build: 'clarify build',
    })
    expect(packageJson.devDependencies).toEqual({
      '@clarify-labs/cli': '^0.1.0',
    })
  })

  it('preserves existing files and scripts unless forced', () => {
    writeFileSync(join(tempDir, 'clarify.ts'), 'export default {}\n', 'utf-8')
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      scripts: { dev: 'custom dev' },
      devDependencies: { typescript: '^5.0.0' },
    }), 'utf-8')

    runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, false)

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toBe('export default {}\n')

    const packageJson = readJson(join(tempDir, 'package.json'))
    expect(packageJson.scripts).toEqual({
      dev: 'custom dev',
      build: 'clarify build',
    })
    expect(packageJson.devDependencies).toEqual({
      typescript: '^5.0.0',
      '@clarify-labs/cli': '^0.1.0',
    })
  })
})
