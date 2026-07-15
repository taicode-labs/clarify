import { describe, expect, it } from 'vitest'

import { getOpenApiCredentialScope, useOpenApiStore } from './store'

describe('OpenAPI credential store', () => {
  it('isolates credentials by specification and clears one or all values', () => {
    const firstScope = getOpenApiCredentialScope({})
    const secondScope = getOpenApiCredentialScope({})
    const store = useOpenApiStore.getState()

    store.setCredential(firstScope, 'bearerAuth', 'first-token')
    store.setCredential(firstScope, 'apiKey', 'first-key')
    store.setCredential(secondScope, 'bearerAuth', 'second-token')
    expect(useOpenApiStore.getState().credentials).toEqual({
      [firstScope]: { bearerAuth: 'first-token', apiKey: 'first-key' },
      [secondScope]: { bearerAuth: 'second-token' },
    })

    store.clearCredential(firstScope, 'apiKey')
    expect(useOpenApiStore.getState().credentials[firstScope]).toEqual({ bearerAuth: 'first-token' })

    store.clearCredentials(firstScope)
    expect(useOpenApiStore.getState().credentials).toEqual({
      [secondScope]: { bearerAuth: 'second-token' },
    })
    store.clearCredentials(secondScope)
  })
})
