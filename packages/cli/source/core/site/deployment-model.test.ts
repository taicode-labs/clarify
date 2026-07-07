import { describe, expect, it } from 'vitest'

import { STATIC_PAGE_ENTRY_CODE, isBuildTimeStaticPageEntry } from './page-builder.js'
import { createClientEntryModule } from './virtual-modules.js'

describe('Clarify deployment model', () => {
  it('keeps the client entry on static-hosted hydration', () => {
    const code = createClientEntryModule()

    expect(code).toContain("import { render } from '@clarify-labs/renderer';")
    expect(code).toContain("import { routes, navigation } from 'virtual:clarify/routes';")
    expect(code).toContain("import { config } from 'virtual:clarify/config';")
    expect(code).toContain('render({ config, routes, navigation, openApis, runtimeSlots, themeEditor: false });')
    expect(code).not.toContain("import { renderToHTML } from '@clarify-labs/renderer';")
  })

  it('marks the SSR entry as build-time only', () => {
    expect(isBuildTimeStaticPageEntry(STATIC_PAGE_ENTRY_CODE)).toBe(true)
  })
})
