import { createServer } from 'vite'

import { createClarifyEngine } from '../../core/engine/engine.js'
import { createViteConfig } from '../../core/runtime/vite-config.js'
import type { ResolvedCliOptions } from '../options.js'

export async function runDev(options: ResolvedCliOptions): Promise<void> {
  const env = { command: 'serve' as const, mode: 'development' }
  const engine = createClarifyEngine({
    projectRoot: options.root,
    rootDirectory: options.content,
    outputDirectory: options.output,
  })
  await engine.prepare(env)
  const server = await createServer(await createViteConfig(options, env, engine))
  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}
