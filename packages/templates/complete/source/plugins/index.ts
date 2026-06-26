import type { ClarifyPlugin } from '@clarify-labs/cli'

const plugin: ClarifyPlugin = {
  name: 'demo-slots-plugin',
  hooks: {},
  slots: [
    { 
      name: 'page.banner.replace', 
      component: '/source/plugins/custom-banner.tsx' 
    },
    { 
      name: 'page.footer.before', 
      component: '/source/plugins/footer-extra.tsx' 
    },
    { 
      name: 'page.footer.replace', 
      component: '/source/plugins/custom-footer.tsx' 
    },
  ],
}

export default plugin
