import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { createRouteComponent } from './factory'

describe('createRouteComponent', () => {
  it('wraps a renderer function into a route component', () => {
    const Component = createRouteComponent(() => createElement('div', null, 'ok'))

    expect(createElement(Component)).toBeTruthy()
  })
})
