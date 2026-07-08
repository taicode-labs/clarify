import { describe, expect, it } from 'vitest'

import { generateClarifyEnvDts } from '../../../../env-types.js'

describe('generateClarifyEnvDts', () => {
  it('only exposes the public slot hook module', () => {
    const dts = generateClarifyEnvDts([])

    expect(dts).toContain("declare module 'virtual:clarify/slot'")
    expect(dts).toContain('export function useSlot(): SlotContext')
    expect(dts).not.toContain("declare module 'virtual:clarify/slots'")
  })
})
