import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { BuiltWithClarify } from './BuiltWithClarify'

describe('BuiltWithClarify', () => {
  it('renders in an SSR environment', () => {
    const markup = renderToStaticMarkup(<BuiltWithClarify version="1.2.3" />)

    expect(markup).toContain('https://clarify.pub')
  })
})
