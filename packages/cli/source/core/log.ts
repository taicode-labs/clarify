import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const LOG_FILE_NAME = '.clarify.log'
const DEFAULT_LOG_ENTRIES = 50
const ENTRY_SEPARATOR = '\n\n---\n\n'

function getMaxLogEntries(): number {
  const envValue = process.env.CLARIFY_LOG_MAX_ENTRIES
  if (!envValue) return DEFAULT_LOG_ENTRIES
  const parsed = Number(envValue)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_LOG_ENTRIES
}

function normalizeErrorMessage(error: unknown): string {
  if (error === undefined) return 'undefined'
  if (error === null) return 'null'
  if (error instanceof Error) return error.message
  if (typeof error === 'object') {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

function normalizeErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack
  }
  return undefined
}

function formatLogEntry(root: string, error: unknown): string {
  const timestamp = new Date().toISOString()
  const message = normalizeErrorMessage(error)
  const stack = normalizeErrorStack(error)

  return [`=== Clarify build error ===`, `Timestamp: ${timestamp}`, `Project root: ${root}`, `Error: ${message}`, stack ? `Stack:\n${stack}` : undefined]
    .filter(Boolean)
    .join('\n')
}

export async function logBuildError(root: string, error: unknown, maxEntries?: number): Promise<void> {
  const logPath = join(root, LOG_FILE_NAME)
  const entry = formatLogEntry(root, error)
  const max = maxEntries ?? getMaxLogEntries()

  let entries: string[] = []
  if (existsSync(logPath)) {
    try {
      const content = await readFile(logPath, 'utf8')
      entries = content
        .split(ENTRY_SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean)
    } catch {
      entries = []
    }
  }

  entries.push(entry)
  if (entries.length > max) {
    entries = entries.slice(-max)
  }

  mkdirSync(dirname(logPath), { recursive: true })
  await writeFile(logPath, entries.join(ENTRY_SEPARATOR) + '\n', 'utf8')
}

export function logBuildErrorSync(root: string, error: unknown, maxEntries?: number): void {
  const logPath = join(root, LOG_FILE_NAME)
  const entry = formatLogEntry(root, error)
  const max = maxEntries ?? getMaxLogEntries()

  let entries: string[] = []
  if (existsSync(logPath)) {
    try {
      const content = readFileSync(logPath, 'utf8')
      entries = content
        .split(ENTRY_SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean)
    } catch {
      entries = []
    }
  }

  entries.push(entry)
  if (entries.length > max) {
    entries = entries.slice(-max)
  }

  mkdirSync(dirname(logPath), { recursive: true })
  writeFileSync(logPath, entries.join(ENTRY_SEPARATOR) + '\n', 'utf8')
}
