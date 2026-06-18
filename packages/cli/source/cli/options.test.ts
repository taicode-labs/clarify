import { describe, expect, it } from 'vitest'

import { resolveCliOptions } from './options.js'

describe('resolveCliOptions', () => {
  it('resolves defaults from the current working directory', () => {
    expect(resolveCliOptions({})).toEqual({
      root: process.cwd(),
      content: 'source',
      output: 'output',
      host: undefined,
      port: undefined,
      open: undefined,
    })
  })

  it('normalizes paths and numeric port values', () => {
    expect(resolveCliOptions({
      root: '.',
      content: 'docs',
      output: 'dist',
      host: '0.0.0.0',
      port: '4173',
      open: '/guide',
    })).toEqual({
      root: process.cwd(),
      content: 'docs',
      output: 'dist',
      host: '0.0.0.0',
      port: 4173,
      open: '/guide',
    })
  })
})
