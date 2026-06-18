import { resolve } from 'node:path'

export type CliOptions = {
  root?: string
  content?: string
  output?: string
  host?: string | boolean
  port?: string | number
  open?: boolean | string
}

export type ResolvedCliOptions = {
  root: string
  content: string
  output: string
  host?: string | boolean
  port?: number
  open?: boolean | string
}

export function resolveCliOptions(options: CliOptions): ResolvedCliOptions {
  return {
    root: resolve(options.root ?? process.cwd()),
    content: options.content ?? 'source',
    output: options.output ?? 'output',
    host: options.host,
    port: typeof options.port === 'string' ? Number.parseInt(options.port, 10) : options.port,
    open: options.open,
  }
}
