import { createServer } from 'vite'

import { createViteConfig } from '../../core/vite-config.js'
import type { ResolvedCliOptions } from '../options.js'

export async function runDev(options: ResolvedCliOptions): Promise<void> {
  const server = await createServer(await createViteConfig(options, { command: 'serve', mode: 'development' }))
  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}
