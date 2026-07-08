import { describe, expect, it } from 'vitest'

import { createBuiltinPlugins } from '../../../../builtin.js'

describe('createBuiltinPlugins', () => {
  it('runs project variables before OpenAPI processing', () => {
    const pluginNames = createBuiltinPlugins({ htmlShell: false }).map(plugin => plugin.name)

    expect(pluginNames.indexOf('clarify:variables')).toBeGreaterThanOrEqual(0)
    expect(pluginNames.indexOf('clarify:variables')).toBeLessThan(pluginNames.indexOf('clarify:openapi'))
  })
})
