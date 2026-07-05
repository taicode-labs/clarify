import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createContentDiagnosticComponent } from './ContentDiagnostic.js'

describe('ContentDiagnostic', () => {
  it('renders content diagnostics with the shared render-error layout', () => {
    const Component = createContentDiagnosticComponent({
      kind: 'mdx',
      title: 'MDX compile error',
      message: 'This page could not be compiled.',
      details: 'Expected a closing tag for <BrokenComponent>.',
      filePath: '/content/broken.mdx',
    })

    const html = renderToStaticMarkup(<Component />)

    expect(html).toContain('Render error')
    expect(html).toContain('MDX compile error')
    expect(html).toContain('Expected a closing tag for &lt;BrokenComponent&gt;.')
    expect(html).toContain('/content/broken.mdx')
  })
})
