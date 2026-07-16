import { defineConfig } from '@clarify-labs/cli'

export default defineConfig({
  title: 'Clarify Docs',
  description: 'A documentation starter powered by Clarify.',
  logo: '/logo.svg',
  favicon: '/favicon.svg',
  theme: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#047857',
        accent: '#0D9488',
      },
    },
  },
  navigation: {
    links: [
      { label: 'Guides', href: '/guides/writing-content' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'GitHub', href: 'https://github.com/taicode-labs/clarify', external: true },
    ],
    tabs: [
      {
        tab: 'Docs',
        icon: 'BookOpen',
        pages: [
          {
            group: 'Start here',
            icon: 'Rocket',
            pages: [
              { page: 'index', title: 'Overview', icon: 'Sparkles' },
              { page: 'guides/writing-content', title: 'Writing content', icon: 'PenLine' },
              { page: 'guides/navigation', title: 'Navigation', icon: 'PanelLeft' },
              { page: 'changelog', title: 'Changelog', icon: 'History' },
            ],
          },
        ],
      },
    ],
  },
  banner: {
    content: 'Edit this starter in {{contentDir}} and ship your docs with Clarify.',
    dismissible: true,
  },
  footer: {
    copyright: '© 2026 Your Company. Built with Clarify.',
    links: [
      { label: 'Get started', href: '/' },
      { label: 'Writing content', href: '/guides/writing-content' },
      { label: 'Changelog', href: '/changelog' },
    ],
    socials: {
      GitHub: 'https://github.com/taicode-labs/clarify',
    },
  },
})
