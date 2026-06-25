import type { ClarifyPlugin } from '@clarify-labs/cli'

const plugin: ClarifyPlugin = {
  name: 'demo-slots-plugin',
  hooks: {},
  slots: [
    { 
      name: 'page.banner.replace', 
      component: './custom-banner.tsx' 
    },
    { 
      name: 'page.footer.before', 
      component: './footer-extra.tsx' 
    },
    { 
      name: 'page.footer.replace', 
      component: './custom-footer.tsx' 
    },
  ],
}

export default plugin
