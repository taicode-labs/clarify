import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createClarifyEngine } from './engine.js'

const tempRoots: string[] = []

function createSiteRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'clarify-site-'))
  tempRoots.push(root)
  return root
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop()
    if (root) rmSync(root, { recursive: true, force: true })
  }
})

describe('Engine.discoverSite', () => {
  it('runs plugin load phase before content processing', async () => {
    const root = createSiteRoot()
    const source = join(root, 'source')
    mkdirSync(source)
    writeFileSync(join(source, 'index.md'), '# Home\n', { flag: 'wx' })
    const calls: string[] = []

    const engine = createClarifyEngine({
      projectRoot: root,
      plugins: [
        {
          name: 'load-phase',
          hooks: {
            'before:plugins:load': () => {
              calls.push('before:plugins:load')
            },
            'after:plugins:load': () => {
              calls.push('after:plugins:load')
            },
            'before:content:process': () => {
              calls.push('before:content:process')
            },
          },
        },
      ],
    })
    await engine.prepare(undefined, undefined, { skipModules: true, skipHints: true })

    expect(calls).toEqual([
      'before:plugins:load',
      'after:plugins:load',
      'before:content:process',
    ])
  })

  it('wraps route discovery with content process phase hooks', async () => {
    const root = createSiteRoot()
    const source = join(root, 'source')
    mkdirSync(source)
    writeFileSync(join(source, 'index.md'), '# Home\n', { flag: 'wx' })
    const calls: string[] = []

    const engine = createClarifyEngine({
      projectRoot: root,
      plugins: [
        {
          name: 'content-phase',
          hooks: {
            'before:content:process': () => {
              calls.push('before:content:process')
            },
            'content:transform': input => {
              calls.push('content:transform')
              return input
            },
            'after:content:process': () => {
              calls.push('after:content:process')
            },
          },
        },
      ],
    })
    await engine.prepare(undefined, undefined, { skipModules: true, skipHints: true })

    expect(calls).toEqual([
      'content:transform',
      'before:content:process',
      'after:content:process',
    ])
  })

  it('runs routes:discovered before after:site:discover', async () => {
    const root = createSiteRoot()
    const source = join(root, 'source')
    mkdirSync(source)
    writeFileSync(join(source, 'index.md'), '# Home\n', { flag: 'wx' })
    const calls: string[] = []

    const engine = createClarifyEngine({
      projectRoot: root,
      plugins: [
        {
          name: 'site-discovery-order',
          hooks: {
            'before:site:discover': () => {
              calls.push('before:site:discover')
            },
            'routes:discovered': routes => {
              calls.push('routes:discovered')
              return routes
            },
            'after:site:discover': () => {
              calls.push('after:site:discover')
            },
          },
        },
      ],
    })
    await engine.prepare(undefined, undefined, { skipModules: true, skipHints: true })

    expect(calls).toEqual([
      'before:site:discover',
      'routes:discovered',
      'after:site:discover',
    ])
  })
})
