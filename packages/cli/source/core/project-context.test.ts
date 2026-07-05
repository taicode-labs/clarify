import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveProjectContext } from './project-context.js'

describe('resolveProjectContext', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-project-context-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('loads config from the project root and resolves build options', async () => {
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify({ title: 'JSON Docs', description: 'Hello' }), 'utf-8')

    const context = await resolveProjectContext({
      projectRoot: tempDir,
      rootDirectory: 'custom-source',
      outputDirectory: 'public',
    }, { command: 'build', mode: 'production' })

    expect(context.projectConfig.title).toBe('JSON Docs')
    expect(context.projectConfig.description).toBe('Hello')
    expect(context.buildOptions.rootDirectory).toBe('custom-source')
    expect(context.buildOptions.outputDirectory).toBe('public')
    expect(context.contentRoot).toBe(join(tempDir, 'custom-source'))
    expect(context.configFilePath).toBe(join(tempDir, 'clarify.json'))
  })
})
