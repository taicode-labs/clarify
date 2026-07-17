import type { Config } from '@react-router/dev/config'
import { readdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'

export default {
  appDirectory: 'source',
  buildDirectory: 'output',
  async buildEnd({ reactRouterConfig }) {
    const outputDirectory = reactRouterConfig.buildDirectory
    const clientDirectory = path.join(outputDirectory, 'client')

    for (const entry of await readdir(outputDirectory)) {
      if (entry !== 'client' && entry !== 'server') {
        await rm(path.join(outputDirectory, entry), { force: true, recursive: true })
      }
    }

    await rm(path.join(outputDirectory, 'server'), { force: true, recursive: true })

    for (const entry of await readdir(clientDirectory)) {
      await rename(path.join(clientDirectory, entry), path.join(outputDirectory, entry))
    }

    await rm(clientDirectory, { recursive: true })
  },
  prerender: ['/', '/about/', '/pricing/', '/privacy-policy/'],
  ssr: false,
} satisfies Config
