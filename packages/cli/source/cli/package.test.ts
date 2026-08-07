import { afterEach, describe, expect, it, vi } from 'vitest'

import { cliPackageVersion, printCliVersion, readPackageVersion } from './package.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readPackageVersion', () => {
  it('reads the CLI package version in source and bundled layouts', () => {
    expect(readPackageVersion()).toBe(cliPackageVersion)
  })

  it('prints the CLI version to stderr', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    printCliVersion()

    expect(errorSpy).toHaveBeenCalledWith(`[clarify] v${cliPackageVersion}`)
  })
})
