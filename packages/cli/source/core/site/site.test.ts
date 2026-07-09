import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { resolveClarifySite } from './site.js'

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

describe('resolveClarifySite', () => {
  it('runs plugin load phase before content processing', async () => {
    const root = createSiteRoot()
    const source = join(root, 'source')
    mkdirSync(source)
    writeFileSync(join(source, 'index.md'), '# Home\n', { flag: 'wx' })
    const calls: string[] = []

    await resolveClarifySite({
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

    await resolveClarifySite({
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

    expect(calls).toEqual([
      'before:content:process',
      'content:transform',
      'after:content:process',
    ])
  })
})
