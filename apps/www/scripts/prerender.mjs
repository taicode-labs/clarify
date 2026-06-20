import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { render } from '../output-server/entry-server.js'

const root = dirname(fileURLToPath(import.meta.url))
const appRoot = join(root, '..')
const outputDir = join(appRoot, 'output')
const serverDir = join(appRoot, 'output-server')
const template = await readFile(join(outputDir, 'index.html'), 'utf8')
const routes = ['/', '/pricing/', '/about/', '/privacy-policy/', '/404.html']

for (const route of routes) {
  const appHtml = render(route)
  const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  const filePath = route === '/' ? join(outputDir, 'index.html') : join(outputDir, route, 'index.html')

  if (route === '/404.html') {
    await writeFile(join(outputDir, '404.html'), html)
    continue
  }

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, html)
}

await rm(serverDir, { recursive: true, force: true })
