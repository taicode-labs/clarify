import type { ClarifyPlugin } from '@clarify-labs/cli'

/**
 * Plugin: docs-footer
 * Replaces the default footer with a custom site-specific design.
 */
const docsFooterPlugin: ClarifyPlugin = {
  name: 'docs-footer',
  slots: [
    {
      name: 'page.footer.replace',
      component: '/plugin/footer.tsx',
    },
  ],
}

export default docsFooterPlugin
