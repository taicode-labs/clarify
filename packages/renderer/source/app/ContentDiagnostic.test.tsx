import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ConfigContext } from '../core/context.js'
import type { Config } from '../core/types.js'

import { createContentDiagnosticComponent } from './ContentDiagnostic.js'
import { RenderErrorPanel } from './RenderErrorPanel.js'

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

  it('renders the refresh action and version from the runtime config', () => {
    const config = {
      title: 'Test docs',
      description: 'A test site',
      rootDirectory: '.',
      routePrefix: '/',
      assetPrefix: '/',
      outputDirectory: 'dist',
      theme: {
        preset: 'default',
        tokens: {
          colors: {
            primary: '#2563eb',
            accent: '#7c3aed',
            background: '#ffffff',
            foreground: '#111827',
            surface: '#ffffff',
            muted: '#6b7280',
            border: '#e5e7eb',
            codeBackground: '#f3f4f6',
          },
          radius: {
            sm: '0.25rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
          },
        },
        layout: { maxWidth: '80rem' },
        editor: false,
      },
      version: '1.2.3',
    } as unknown as Config

    const html = renderToStaticMarkup(
      <ConfigContext.Provider value={config}>
        <RenderErrorPanel
          title="Render failed"
          description="Something went wrong"
          detailsLabel="Runtime diagnostics"
          detailsContent={<p>Trace</p>}
          refreshLabel="Reload route"
        />
      </ConfigContext.Provider>,
    )

    expect(html).toContain('Reload route')
    expect(html).toContain('Clarify version')
    expect(html).toContain('1.2.3')
  })
})
