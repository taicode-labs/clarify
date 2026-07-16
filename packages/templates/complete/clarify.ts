import { defineConfig } from '@clarify-labs/cli'
import demoSlotsPlugin from './source/plugins/index.js'

export default defineConfig({
  plugins: [demoSlotsPlugin],
  title: 'Clarify Docs',
  description: 'A full-featured documentation starter powered by Clarify.',
  logo: '/logo.svg',
  favicon: '/favicon.svg',
  banner: {
    content: {
      'en-US': 'Edit this starter in {{contentDir}} and ship your docs with Clarify.',
      'zh-CN': '在 {{contentDir}} 中编辑这个多语言模板，并使用 Clarify 发布文档。',
    },
    dismissible: true,
  },
  locales: {
    default: 'en-US',
    missing: 'fallback',
    options: [
      { code: 'en-US', label: 'English' },
      { code: 'zh-CN', label: '简体中文' },
    ],
  },
  theme: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#7c3aed',
      },
      radius: {
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  navigation: {
    links: [
      { label: { 'en-US': 'Guides', 'zh-CN': '指南' }, href: '/guides/writing-content' },
      { label: { 'en-US': 'API', 'zh-CN': '接口' }, href: '/api' },
      { label: 'GitHub', href: 'https://github.com/taicode-labs/clarify', external: true },
    ],
  },
  footer: {
    copyright: '© 2026 Your Company. Built with Clarify.',
    links: [
      { label: { 'en-US': 'Get started', 'zh-CN': '开始使用' }, href: '/' },
      { label: { 'en-US': 'Configuration', 'zh-CN': '配置' }, href: '/reference/configuration' },
      { label: { 'en-US': 'API reference', 'zh-CN': 'API 参考' }, href: '/api' },
    ],
    socials: {
      GitHub: 'https://github.com/taicode-labs/clarify',
    },
  },
    tabs: [
    {
      tab: { 'en-US': 'Docs', 'zh-CN': '文档' },
      icon: 'BookOpen',
      pages: [
        {
          group: { 'en-US': 'Start here', 'zh-CN': '从这里开始' },
          icon: 'Rocket',
          pages: [
            { page: 'index', title: { 'en-US': 'Overview', 'zh-CN': '概览' }, icon: 'Sparkles' },
            { page: 'guides/writing-content', title: { 'en-US': 'Writing content', 'zh-CN': '编写内容' }, icon: 'PenLine' },
            { page: 'guides/navigation', title: { 'en-US': 'Navigation', 'zh-CN': '导航' }, icon: 'PanelLeft' },
          ],
        },
        {
          group: { 'en-US': 'Reference', 'zh-CN': '参考' },
          icon: 'Library',
          pages: [
            { page: 'reference/configuration', title: { 'en-US': 'Configuration', 'zh-CN': '配置' }, icon: 'Settings2' },
            { page: 'reference/components', title: { 'en-US': 'MDX components', 'zh-CN': 'MDX 组件' }, icon: 'Component' },
            { page: 'changelog', title: { 'en-US': 'Changelog', 'zh-CN': '更新日志' }, icon: 'History' },
          ],
        },
      ],
    },
    {
      tab: { 'en-US': 'API', 'zh-CN': '接口' },
      icon: 'Webhook',
      pages: [
        {
          group: { 'en-US': 'API reference', 'zh-CN': 'API 参考' },
          icon: 'FileJson2',
          pages: [
            { openapi: 'api.openapi.json', title: { 'en-US': 'OpenAPI reference', 'zh-CN': 'OpenAPI 参考' }, icon: 'FileJson2' },
            { page: 'api/embedding', title: { 'en-US': 'Embed API endpoints', 'zh-CN': '嵌入 API 端点' }, icon: 'CodeXml' },
          ],
        },
      ],
    },
    ],
  },
})
