import { rmSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { logBuildError } from './log.js'

const tempDir = join(process.cwd(), '.tmp-log-test')
const logFile = join(tempDir, '.clarify.log')

beforeEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

describe('logBuildError', () => {
  it('writes a log entry to .clarify.log', async () => {
    await logBuildError(tempDir, new Error('test error'))

    expect(existsSync(logFile)).toBe(true)
    const content = readFileSync(logFile, 'utf8')
    expect(content).toContain('Clarify build error')
    expect(content).toContain('Error: test error')
  })

  it('keeps only the last n entries when maxEntries is exceeded', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await logBuildError(tempDir, new Error(`error ${i}`), 2)
    }

    const content = readFileSync(logFile, 'utf8')
    expect(content).not.toContain('error 1')
    expect(content).toContain('error 2')
    expect(content).toContain('error 3')
  })
})
