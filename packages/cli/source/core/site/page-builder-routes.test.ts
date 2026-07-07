import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { buildStaticPages } from './page-builder.js'

describe('buildStaticPages', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-ssg-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('renders each route independently into static html files', async () => {
    const outputDirectory = join(tempDir, 'output')
    const bundlePath = join(tempDir, 'ssr-bundle.mjs')
    const config: ResolvedProjectConfig = {
      title: 'Test Docs',
      description: 'A test site',
      routePrefix: '/',
      assetPrefix: '/',
      theme: {
        preset: 'default',
        tokens: {
          colors: {
            primary: '#000000',
            accent: '#111111',
            background: '#ffffff',
            foreground: '#222222',
            surface: '#f5f5f5',
            muted: '#666666',
            border: '#dddddd',
            codeBackground: '#f0f0f0',
          },
          radius: {
            sm: '4px',
            md: '8px',
            lg: '12px',
            xl: '16px',
          },
        },
        layout: {
          maxWidth: '80rem',
        },
        editor: false,
      },
      variables: {},
    }
    const routes: ContentRoute[] = [
      {
        path: '/guide',
        title: 'Guide',
        filePath: '/content/guide.mdx',
        kind: 'mdx',
        virtualModuleId: 'virtual:guide',
      },
      {
        path: '/api',
        title: 'API',
        filePath: '/content/api.openapi.json',
        kind: 'openapi',
        virtualModuleId: 'virtual:api',
      },
    ]

    mkdirSync(outputDirectory, { recursive: true })
    writeFileSync(join(outputDirectory, 'index.html'), '<!doctype html><html><head><title>Default</title></head><body><div id="root"></div></body></html>', 'utf-8')
    writeFileSync(bundlePath, `export async function render(url) { return '<main data-route="' + url + '">' + url + '</main>' }`, 'utf-8')

    await buildStaticPages(routes, config, outputDirectory, bundlePath)

    const guideHtml = readFileSync(join(outputDirectory, 'guide', 'index.html'), 'utf-8')
    const apiHtml = readFileSync(join(outputDirectory, 'api', 'index.html'), 'utf-8')

    expect(guideHtml).toContain('<main data-route="/guide">/guide</main>')
    expect(apiHtml).toContain('<main data-route="/api">/api</main>')
    expect(guideHtml).toContain('<title>Guide - Test Docs</title>')
    expect(apiHtml).toContain('<title>API - Test Docs</title>')
  })
})
