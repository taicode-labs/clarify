import { describe, expect, it } from 'vitest'

import { cliPackageVersion, readPackageVersion } from './package.js'

describe('readPackageVersion', () => {
  it('reads the CLI package version in source and bundled layouts', () => {
    expect(readPackageVersion()).toBe(cliPackageVersion)
  })
})
