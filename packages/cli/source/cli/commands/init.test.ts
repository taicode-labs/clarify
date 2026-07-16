import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cliPackageVersionWithCaret } from '../package.js'
import * as spawnModule from '../spawn.js'

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

  it('creates the standard Clarify project template by default', () => {
    runInit({
      root: tempDir,
      content: 'source',
      output: 'output',
    }, false)

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toContain('tabs')
    expect(readFileSync(join(tempDir, 'source/index.mdx'), 'utf-8')).toContain('# Build documentation with Clarify')
    expect(readFileSync(join(tempDir, 'source/guides/writing-content.mdx'), 'utf-8')).toContain('# Writing content')
    expect(readFileSync(join(tempDir, 'source/guides/navigation.mdx'), 'utf-8')).toContain('# Navigation')
    expect(readFileSync(join(tempDir, 'source/changelog.mdx'), 'utf-8')).toContain('# Changelog')
    expect(existsSync(join(tempDir, 'source/api.openapi.json'))).toBe(false)
    expect(existsSync(join(tempDir, 'source/reference/components.mdx'))).toBe(false)
    expect(readFileSync(join(tempDir, 'public/logo.svg'), 'utf-8')).toContain('clarify')
    expect(readFileSync(join(tempDir, 'public/favicon.svg'), 'utf-8')).toContain('clarify')

    const packageJson = readJson(join(tempDir, 'package.json'))
    expect(packageJson.scripts).toEqual({
      dev: 'clarify dev',
      build: 'clarify build',
    })
    expect(packageJson.devDependencies).toEqual({
      '@clarify-labs/cli': cliPackageVersionWithCaret,
    })
  })

  it('creates the minimal Clarify project template when selected', () => {
    runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, false, 'minimal')

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toContain('Documentation powered by Clarify')
    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toContain("logo: '/logo.svg'")
    expect(readFileSync(join(tempDir, 'docs/index.mdx'), 'utf-8')).toContain('Start writing your documentation in `docs`.')
    expect(readFileSync(join(tempDir, 'public/logo.svg'), 'utf-8')).toContain('clarify')
    expect(existsSync(join(tempDir, 'docs/api.openapi.json'))).toBe(false)
  })

  it('creates the complete Clarify project template when selected', () => {
    runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, false, 'complete')

    const config = readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')
    expect(config).toContain('locales')
    expect(config).toContain("default: 'en-US'")
    expect(readFileSync(join(tempDir, 'docs/en-US/reference/configuration.mdx'), 'utf-8')).toContain('# Configuration')
    expect(readFileSync(join(tempDir, 'docs/en-US/changelog.mdx'), 'utf-8')).toContain('# Changelog')
    expect(readJson(join(tempDir, 'docs/en-US/api.openapi.json')).openapi).toBe('3.1.0')
    expect(readFileSync(join(tempDir, 'docs/zh-CN/index.mdx'), 'utf-8')).toContain('# 使用 Clarify 构建多语言文档')
    expect(readFileSync(join(tempDir, 'docs/zh-CN/guides/writing-content.mdx'), 'utf-8')).toContain('# 编写内容')
  })

  it('rejects unknown templates', () => {
    expect(() => runInit({
      root: tempDir,
      content: 'source',
      output: 'output',
    }, false, 'default')).toThrow('Available templates: minimal, standard, complete')
  })

  it('fails before writing files when template files conflict', () => {
    writeFileSync(join(tempDir, 'clarify.ts'), 'export default {}\n', 'utf-8')
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      scripts: { dev: 'custom dev' },
      devDependencies: { typescript: '^5.0.0' },
    }), 'utf-8')

    expect(() => runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, false)).toThrow('Init target has conflicting files')

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toBe('export default {}\n')
    expect(existsSync(join(tempDir, 'docs/index.mdx'))).toBe(false)

    const packageJson = readJson(join(tempDir, 'package.json'))
    expect(packageJson.scripts).toEqual({ dev: 'custom dev' })
    expect(packageJson.devDependencies).toEqual({ typescript: '^5.0.0' })
  })

  it('overwrites conflicting files and scripts when forced', () => {
    writeFileSync(join(tempDir, 'clarify.ts'), 'export default {}\n', 'utf-8')
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      scripts: { dev: 'custom dev' },
      devDependencies: { typescript: '^5.0.0' },
    }), 'utf-8')

    runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, true)

    expect(readFileSync(join(tempDir, 'clarify.ts'), 'utf-8')).toContain('Clarify Docs')
    expect(readFileSync(join(tempDir, 'docs/index.mdx'), 'utf-8')).toContain('# Build documentation with Clarify')

    const packageJson = readJson(join(tempDir, 'package.json'))
    expect(packageJson.scripts).toEqual({
      dev: 'clarify dev',
      build: 'clarify build',
    })
    expect(packageJson.devDependencies).toEqual({
      typescript: '^5.0.0',
      '@clarify-labs/cli': cliPackageVersionWithCaret,
    })
  })

  it('installs dependencies when the install flag is enabled', () => {
    const spawnSpy = vi.spyOn(spawnModule, 'spawnSync').mockImplementation(() => ({ status: 0 } as unknown as ReturnType<typeof spawnModule.spawnSync>))

    runInit({
      root: tempDir,
      content: 'docs',
      output: 'dist',
    }, false, undefined, true)

    expect(spawnSpy).toHaveBeenCalledWith('pnpm', ['--version'], { stdio: 'ignore' })
    expect(spawnSpy).toHaveBeenCalledWith('pnpm', ['install'], expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }))
    expect(logSpy).toHaveBeenCalledWith('[clarify] Dependencies installed successfully.')
    expect(logSpy).toHaveBeenCalledWith('[clarify] You can now run `pnpm dev` to start the local documentation server.')

    spawnSpy.mockRestore()
  })
})
