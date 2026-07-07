import { describe, expect, it } from 'vitest'

import { createBuiltinPlugins } from './builtin.js'

describe('createBuiltinPlugins', () => {
  it('keeps OpenAPI processing out of the builtin plugin list', () => {
    const pluginNames = createBuiltinPlugins({ htmlShell: false }).map(plugin => plugin.name)

    expect(pluginNames).toContain('clarify:variables')
    expect(pluginNames).not.toContain('clarify:openapi')
  })
})
