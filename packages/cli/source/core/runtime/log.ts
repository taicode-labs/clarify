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

type LogEntryReader = (logPath: string) => Promise<string> | string
type LogEntryWriter = (logPath: string, content: string) => Promise<void> | void

function collectLogEntries(entries: string[], entry: string, max: number): string[] {
  const next = [...entries, entry]
  return next.length > max ? next.slice(-max) : next
}

function readExistingEntries(content: string): string[] {
  return content
    .split(ENTRY_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function writeLogEntry(root: string, error: unknown, maxEntries: number | undefined, read: LogEntryReader, write: LogEntryWriter): Promise<void> {
  const logPath = join(root, LOG_FILE_NAME)
  const entry = formatLogEntry(root, error)
  const max = maxEntries ?? getMaxLogEntries()

  let entries: string[] = []
  if (existsSync(logPath)) {
    try {
      entries = readExistingEntries(await read(logPath))
    } catch {
      entries = []
    }
  }

  entries = collectLogEntries(entries, entry, max)

  mkdirSync(dirname(logPath), { recursive: true })
  await write(logPath, entries.join(ENTRY_SEPARATOR) + '\n')
}

export async function logBuildError(root: string, error: unknown, maxEntries?: number): Promise<void> {
  await writeLogEntry(root, error, maxEntries, (path) => readFile(path, 'utf8'), (path, content) => writeFile(path, content, 'utf8'))
}

export function logBuildErrorSync(root: string, error: unknown, maxEntries?: number): void {
  void writeLogEntry(root, error, maxEntries, (path) => readFileSync(path, 'utf8'), (path, content) => writeFileSync(path, content, 'utf8'))
}
