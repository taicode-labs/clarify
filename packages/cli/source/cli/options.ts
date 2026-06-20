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

function resolvePort(port: CliOptions['port']): number | undefined {
  if (port === undefined) return undefined

  const parsedPort = typeof port === 'string' ? Number(port) : port
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('[clarify] --port must be an integer between 1 and 65535')
  }

  return parsedPort
}

export function resolveCliOptions(options: CliOptions): ResolvedCliOptions {
  return {
    root: resolve(options.root ?? process.cwd()),
    content: options.content ?? 'source',
    output: options.output ?? 'output',
    host: options.host,
    port: resolvePort(options.port),
    open: options.open,
  }
}
