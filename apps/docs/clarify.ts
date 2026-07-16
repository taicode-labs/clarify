import { defineConfig } from '@clarify-labs/cli'
import docsFooterPlugin from './plugin/index.js'

export default defineConfig({
  title: 'Clarify',
  description: '开源文档发布工具，为 MDX 和 OpenAPI 而生。',
  siteUrl: 'https://docs.clarify.pub',
  logo: '/clarify.svg',
  homeUrl: 'https://clarify.pub',
  favicon: '/clarify-icon.png',
  theme: {
    preset: 'default',
  },
  navigation: {
    links: [
      {
        label: {
          'zh-CN': '文档',
          'en-US': 'Docs',
        },
        href: '/getting-started',
      },
      {
        label: {
          'zh-CN': 'API',
          'en-US': 'API',
        },
        href: '/features/openapi',
      },
      {
        label: 'GitHub',
        href: 'https://github.com/taicode-labs/clarify',
        external: true,
      },
    ],
    tabs: [
      {
        tab: {
          'zh-CN': '文档',
          'en-US': 'Docs',
        },
        icon: 'BookOpen',
        pages: [
          {
            group: {
              'zh-CN': '快速开始',
              'en-US': 'Get Started',
            },
            icon: 'Compass',
            pages: [
              {
                page: 'what-is-clarify',
                title: {
                  'zh-CN': '什么是 Clarify',
                  'en-US': 'What is Clarify',
                },
                icon: 'Sparkles',
              },
              {
                page: 'getting-started',
                title: {
                  'zh-CN': '快速开始',
                  'en-US': 'Quickstart',
                },
                icon: 'Rocket',
              },
              {
                page: 'features',
                title: {
                  'zh-CN': '能力概览',
                  'en-US': 'Feature Overview',
                },
                icon: 'LayoutGrid',
              },
            ],
          },
          {
            group: {
              'zh-CN': '写作文档',
              'en-US': 'Writing Content',
            },
            icon: 'PenLine',
            pages: [
              {
                group: {
                  'zh-CN': '组织内容',
                  'en-US': 'Structure Content',
                },
                icon: 'ListTree',
                pages: [
                  {
                    page: 'guides/writing-content',
                    title: {
                      'zh-CN': 'MDX 与内容',
                      'en-US': 'MDX Guide',
                    },
                    icon: 'PenLine',
                  },
                  {
                    page: 'guides/navigation',
                    title: {
                      'zh-CN': '导航与配置',
                      'en-US': 'Navigation & Config',
                    },
                    icon: 'SlidersHorizontal',
                  },
                ],
              },
              {
                group: {
                  'zh-CN': '内置组件',
                  'en-US': 'Built-in Components',
                },
                icon: 'Component',
                pages: [
                  {
                    page: 'reference/built-in-components',
                    title: {
                      'zh-CN': '组件总览',
                      'en-US': 'Overview',
                    },
                    icon: 'LayoutGrid',
                  },
                  { page: 'reference/components/steps', title: 'Steps / Step', icon: 'ListOrdered' },
                  { page: 'reference/components/tabs', title: 'Tabs / Tab', icon: 'PanelTop' },
                  { page: 'reference/components/image-token-calculator', title: 'ImageTokenCalculator', icon: 'Calculator' },
                  { page: 'reference/components/callout', title: 'Callout', icon: 'MessageSquareWarning' },
                  { page: 'reference/components/note', title: 'Note', icon: 'StickyNote' },
                  { page: 'reference/components/card', title: 'CardGroup / Card', icon: 'PanelsTopLeft' },
                  { page: 'reference/components/collapse', title: 'Collapse', icon: 'ListCollapse' },
                  { page: 'reference/components/accordion-group', title: 'AccordionGroup', icon: 'ListCollapse' },
                  { page: 'reference/components/file-tree', title: 'FileTree', icon: 'FolderTree' },
                  { page: 'reference/components/tooltip', title: 'Tooltip', icon: 'MessageCircleQuestion' },
                  { page: 'reference/components/button', title: 'Button', icon: 'MousePointerClick' },
                  { page: 'reference/components/web-frame', title: 'WebFrame', icon: 'Monitor' },
                  { page: 'reference/components/code-group', title: 'CodeGroup', icon: 'Braces' },
                  { page: 'reference/components/mermaid', title: 'Mermaid', icon: 'Workflow' },
                  { page: 'reference/components/row-col', title: 'Row / Col', icon: 'Columns2' },
                  { page: 'reference/components/properties', title: 'Properties / Property', icon: 'ListTree' },
                  { page: 'reference/components/markdown', title: 'Markdown', icon: 'FileText' },
                  { page: 'reference/components/openapi', title: 'OpenAPI', icon: 'FileJson2' },
                ],
              },
              {
                page: 'openapi/embedding',
                title: {
                  'zh-CN': '在 MDX 中嵌入 OpenAPI',
                  'en-US': 'Embed OpenAPI in MDX',
                },
                icon: 'CodeXml',
              },
            ],
          },
          {
            group: {
              'zh-CN': '平台特性',
              'en-US': 'Platform Features',
            },
            icon: 'Webhook',
            pages: [
              {
                page: 'features/openapi',
                title: {
                  'zh-CN': 'OpenAPI 文档',
                  'en-US': 'OpenAPI Documentation',
                },
                icon: 'FileJson2',
              },
              {
                page: 'features/variables',
                title: {
                  'zh-CN': '项目变量',
                  'en-US': 'Project Variables',
                },
                icon: 'Braces',
              },
              {
                page: 'features/vscode-extension',
                title: {
                  'zh-CN': 'VS Code 扩展',
                  'en-US': 'VS Code Extension',
                },
                icon: 'Package',
              },
              {
                page: 'features/plugins',
                title: {
                  'zh-CN': '插件系统',
                  'en-US': 'Plugin System',
                },
                icon: 'Puzzle',
              },
            ],
          },
          {
            group: {
              'zh-CN': '参考手册',
              'en-US': 'Reference',
            },
            icon: 'BookMarked',
            pages: [
              {
                page: 'reference',
                title: {
                  'zh-CN': '参考总览',
                  'en-US': 'Reference Overview',
                },
                icon: 'BookMarked',
              },
              {
                page: 'reference/cli-commands',
                title: {
                  'zh-CN': 'CLI 命令参考',
                  'en-US': 'CLI Reference',
                },
                icon: 'Terminal',
              },
              {
                page: 'reference/clarify-config',
                title: {
                  'zh-CN': '配置参考',
                  'en-US': 'Configuration Reference',
                },
                icon: 'Settings2',
              },
              {
                page: 'reference/plugin-api',
                title: {
                  'zh-CN': '插件 API 参考',
                  'en-US': 'Plugin API Reference',
                },
                icon: 'Puzzle',
              },
            ],
          },
          {
            group: {
              'zh-CN': '部署与维护',
              'en-US': 'Deploy & Maintain',
            },
            icon: 'UploadCloud',
            pages: [
              {
                page: 'guides/deployment',
                title: {
                  'zh-CN': '部署上线',
                  'en-US': 'Deployment',
                },
                icon: 'Rocket',
              },
              {
                page: 'guides/migrate-from-mintlify',
                title: {
                  'zh-CN': '从 Mintlify 迁移',
                  'en-US': 'Migrate from Mintlify',
                },
                icon: 'RefreshCcw',
              },
              {
                page: 'changelog',
                title: {
                  'zh-CN': '更新日志',
                  'en-US': 'Changelog',
                },
                icon: 'History',
              },
              {
                page: 'roadmap',
                title: {
                  'zh-CN': '产品路线图',
                  'en-US': 'Roadmap',
                },
                icon: 'Milestone',
              },
            ],
          },
        ],
      },
      {
        tab: {
          'zh-CN': 'OpenAPI',
          'en-US': 'OpenAPI',
        },
        icon: 'FileJson2',
        pages: [
          {
            group: {
              'zh-CN': 'OpenAPI 能力',
              'en-US': 'OpenAPI Capabilities',
            },
            icon: 'FileJson2',
            pages: [
              {
                openapi: 'api.openapi.json',
                title: {
                  'zh-CN': 'OpenAPI 完整示例',
                  'en-US': 'OpenAPI Example',
                },
                icon: 'FileJson2',
              },
              {
                openapi: 'api.openapi.json',
                path: 'openapi/pages',
                title: {
                  'zh-CN': '示例：Pages API',
                  'en-US': 'Example: Pages API',
                },
                icon: 'BookOpenCheck',
                filter: {
                  tags: ['Pages'],
                },
              },
              {
                openapi: 'api.openapi.json',
                path: 'openapi/assets',
                title: {
                  'zh-CN': '示例：Assets API',
                  'en-US': 'Example: Assets API',
                },
                icon: 'ImageUp',
                filter: {
                  tags: ['Assets'],
                },
              },
              {
                page: 'openapi/embedding',
                title: {
                  'zh-CN': '局部嵌入使用说明',
                  'en-US': 'Embedding OpenAPI in MDX',
                },
                icon: 'CodeXml',
              },
            ],
          },
        ],
      },
      {
        tab: {
          'zh-CN': '开发',
          'en-US': 'Development',
        },
        icon: 'Code2',
        pages: [
          {
            group: {
              'zh-CN': '项目开发',
              'en-US': 'Project Development',
            },
            icon: 'Code2',
            pages: [
              {
                page: 'development',
                title: {
                  'zh-CN': '开发者入口',
                  'en-US': 'Developer Guide',
                },
                icon: 'SquareTerminal',
              },
              {
                page: 'development/architecture',
                title: {
                  'zh-CN': '整体架构',
                  'en-US': 'Architecture',
                },
                icon: 'Network',
              },
              {
                page: 'development/cli',
                title: {
                  'zh-CN': 'CLI 与引擎',
                  'en-US': 'CLI and Engine',
                },
                icon: 'Terminal',
              },
              {
                page: 'development/vscode-extension',
                title: {
                  'zh-CN': 'VS Code 扩展',
                  'en-US': 'VS Code Extension',
                },
                icon: 'Package',
              },
              {
                page: 'development/renderer',
                title: {
                  'zh-CN': '渲染器架构',
                  'en-US': 'Renderer Architecture',
                },
                icon: 'MonitorCog',
              },
              {
                page: 'development/error-states',
                title: {
                  'zh-CN': '错误状态',
                  'en-US': 'Error States',
                },
                icon: 'Bug',
              },
              {
                page: 'development/ssg',
                title: {
                  'zh-CN': '静态生成流程',
                  'en-US': 'SSG Pipeline',
                },
                icon: 'Blocks',
              },
              {
                page: 'development/plugin-api',
                title: {
                  'zh-CN': '插件扩展接口',
                  'en-US': 'Plugin API',
                },
                icon: 'PanelsTopLeft',
              },
              {
                page: 'development/contributing',
                title: {
                  'zh-CN': '参与贡献',
                  'en-US': 'Contributing',
                },
                icon: 'GitPullRequestArrow',
              },
            ],
          },
        ],
      },
    ],
  },
  banner: {
    content: {
      'zh-CN': 'Clarify 现在支持全局公告配置。',
      'en-US': 'Clarify now supports global announcement banners.',
    },
    link: {
      label: {
        'zh-CN': '查看路线图',
        'en-US': 'View roadmap',
      },
      href: '/roadmap',
    },
    dismissible: true,
  },
  footer: {
    copyright: {
      'zh-CN': '© 2026 Clarify Labs. 开源文档发布工具。',
      'en-US': '© 2026 Clarify Labs. Open-source documentation publishing.',
    },
    links: [
      {
        label: {
          'zh-CN': '快速开始',
          'en-US': 'Get Started',
        },
        href: '/getting-started',
      },
      {
        label: {
          'zh-CN': '配置参考',
          'en-US': 'Config Reference',
        },
        href: '/reference/clarify-config',
      },
      {
        label: {
          'zh-CN': '参与贡献',
          'en-US': 'Contributing',
        },
        href: '/development/contributing',
      },
    ],
    socials: {
      GitHub: 'https://github.com/taicode-labs/clarify',
    },
  },
  locales: {
    default: 'zh-CN',
    missing: 'fallback',
    locales: [
      {
        code: 'zh-CN',
        label: '简体中文',
        dir: 'ltr',
      },
      {
        code: 'en-US',
        label: 'English',
        dir: 'ltr',
      },
    ],
  },
  features: {
    themeEditor: true,
    repository: {
      url: 'https://github.com/taicode-labs/clarify',
      branch: 'main',
      directory: 'apps/docs/source',
    },
  },
  plugins: [docsFooterPlugin],
})
