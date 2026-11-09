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
    menus: [
      {
        label: {
          'zh-CN': '资源',
          'en-US': 'Resources',
        },
        icon: 'Library',
        description: {
          'zh-CN': '了解项目动态、版本变化和后续计划',
          'en-US': 'Follow project updates, releases, and what comes next',
        },
        items: [
          {
            label: {
              'zh-CN': '博客',
              'en-US': 'Blog',
            },
            icon: 'NotebookTabs',
            page: 'blog',
          },
          {
            label: {
              'zh-CN': '版本列表',
              'en-US': 'Releases',
            },
            icon: 'Tag',
            page: 'changelog',
          },
          {
            label: {
              'zh-CN': '路线图',
              'en-US': 'Roadmap',
            },
            icon: 'Milestone',
            page: 'roadmap',
          },
        ],
      },
      {
        label: {
          'zh-CN': '开发者',
          'en-US': 'Developers',
        },
        icon: 'CodeXml',
        description: {
          'zh-CN': '构建 API、集成和自动化工作流',
          'en-US': 'Build APIs, integrations, and automation workflows',
        },
        items: [
          {
            label: {
              'zh-CN': 'API',
              'en-US': 'API',
            },
            icon: 'Braces',
            description: {
              'zh-CN': '查看接口能力和嵌入方式',
              'en-US': 'Explore API capabilities and embedding options',
            },
            items: [
              {
                label: {
                  'zh-CN': 'OpenAPI',
                  'en-US': 'OpenAPI',
                },
                icon: 'FileJson2',
                page: 'features/openapi',
              },
              {
                label: {
                  'zh-CN': '嵌入 OpenAPI',
                  'en-US': 'Embed OpenAPI',
                },
                icon: 'CodeXml',
                page: 'openapi/embedding',
              },
            ],
          },
          {
            label: {
              'zh-CN': '集成能力',
              'en-US': 'Integrations',
            },
            icon: 'Workflow',
            items: [
              {
                label: {
                  'zh-CN': 'MCP',
                  'en-US': 'MCP',
                },
                icon: 'Bot',
                page: 'features/mcp',
              },
              {
                label: {
                  'zh-CN': '插件',
                  'en-US': 'Plugins',
                },
                icon: 'Puzzle',
                page: 'features/plugins',
              },
              {
                label: {
                  'zh-CN': 'VS Code 扩展',
                  'en-US': 'VS Code Extension',
                },
                icon: 'PanelsTopLeft',
                page: 'features/vscode-extension',
              },
            ],
          },
        ],
      },
      {
        label: 'GitHub',
        href: 'https://github.com/taicode-labs/clarify',
        icon: 'ExternalLink',
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
                icon: 'Sparkles',
              },
              {
                page: 'getting-started',
                icon: 'Rocket',
              },
              {
                page: 'features',
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
                    icon: 'PenLine',
                  },
                  {
                    page: 'guides/custom-mdx-components',
                    icon: 'Blocks',
                  },
                  {
                    page: 'guides/navigation',
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
                    icon: 'LayoutGrid',
                  },
                  { page: 'reference/components/steps', icon: 'ListOrdered' },
                  { page: 'reference/components/tabs', icon: 'PanelTop' },
                  { page: 'reference/components/callout', icon: 'MessageSquareWarning' },
                  { page: 'reference/components/note', icon: 'StickyNote' },
                  { page: 'reference/components/card', icon: 'PanelsTopLeft' },
                  { page: 'reference/components/collapse', icon: 'ListCollapse' },
                  { page: 'reference/components/accordion-group', icon: 'ListCollapse' },
                  { page: 'reference/components/file-tree', icon: 'FolderTree' },
                  { page: 'reference/components/tooltip', icon: 'MessageCircleQuestion' },
                  { page: 'reference/components/button', icon: 'MousePointerClick' },
                  { page: 'reference/components/web-frame', icon: 'Monitor' },
                  { page: 'reference/components/code-group', icon: 'Braces' },
                  { page: 'reference/components/mermaid', icon: 'Workflow' },
                  { page: 'reference/components/row-col', icon: 'Columns2' },
                  { page: 'reference/components/properties', icon: 'ListTree' },
                  { page: 'reference/components/openapi', icon: 'FileJson2' },
                ],
              },
              {
                page: 'openapi/embedding',
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
                icon: 'FileJson2',
              },
              {
                page: 'features/variables',
                icon: 'Braces',
              },
              {
                page: 'features/mcp',
                icon: 'Bot',
              },
              {
                page: 'features/vscode-extension',
                icon: 'Package',
              },
              {
                page: 'features/plugins',
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
                icon: 'BookMarked',
              },
              {
                page: 'reference/cli-commands',
                icon: 'Terminal',
              },
              {
                page: 'reference/clarify-config',
                icon: 'Settings2',
              },
              {
                page: 'reference/plugin-api',
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
                icon: 'Rocket',
              },
              {
                page: 'guides/migrate-from-mintlify',
                icon: 'RefreshCcw',
              },
              {
                page: 'roadmap',
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
              'zh-CN': '完整参考',
              'en-US': 'Complete Reference',
            },
            icon: 'BookMarked',
            pages: [
              {
                openapi: 'api.openapi.json',
                title: {
                  'zh-CN': '完整 API 参考',
                  'en-US': 'Complete API Reference',
                },
                icon: 'BookMarked',
              },
            ],
          },
          {
            group: {
              'zh-CN': '按业务域浏览',
              'en-US': 'Browse by Domain',
            },
            icon: 'LayoutList',
            pages: [
              {
                openapi: 'api.openapi.json',
                path: 'openapi/pages',
                title: {
                  'zh-CN': '页面接口',
                  'en-US': 'Pages API',
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
                  'zh-CN': '资源接口',
                  'en-US': 'Assets API',
                },
                icon: 'ImageUp',
                filter: {
                  tags: ['Assets'],
                },
              },
              {
                openapi: 'api.openapi.json',
                path: 'openapi/search',
                title: {
                  'zh-CN': '搜索接口',
                  'en-US': 'Search API',
                },
                icon: 'Search',
                filter: {
                  tags: ['Search'],
                },
              },
              {
                openapi: 'api.openapi.json',
                path: 'openapi/system',
                title: {
                  'zh-CN': '系统接口',
                  'en-US': 'System API',
                },
                icon: 'Server',
                filter: {
                  tags: ['System'],
                },
              },
            ],
          },
          {
            group: {
              'zh-CN': '渲染能力演示',
              'en-US': 'Rendering Demos',
            },
            icon: 'FlaskConical',
            pages: [
              {
                openapi: 'request-body-types.openapi.json',
                title: {
                  'zh-CN': '请求体类型',
                  'en-US': 'Request Body Types',
                },
                icon: 'FileInput',
              },
              {
                openapi: 'response-body-types.openapi.json',
                title: {
                  'zh-CN': '响应体类型',
                  'en-US': 'Response Body Types',
                },
                icon: 'FileOutput',
              },
            ],
          },
          {
            group: {
              'zh-CN': '使用指南',
              'en-US': 'Guides',
            },
            icon: 'CodeXml',
            pages: [
              {
                page: 'openapi/embedding',
                title: {
                  'zh-CN': '在 MDX 中嵌入接口',
                  'en-US': 'Embedding Operations in MDX',
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
                icon: 'SquareTerminal',
              },
              {
                page: 'development/architecture',
                icon: 'Network',
              },
              {
                page: 'development/cli',
                icon: 'Terminal',
              },
              {
                page: 'development/vscode-extension',
                icon: 'Package',
              },
              {
                page: 'development/renderer',
                icon: 'MonitorCog',
              },
              {
                page: 'development/error-states',
                icon: 'Bug',
              },
              {
                page: 'development/ssg',
                icon: 'Blocks',
              },
              {
                page: 'development/plugin-api',
                icon: 'PanelsTopLeft',
              },
              {
                page: 'development/contributing',
                icon: 'GitPullRequestArrow',
              },
            ],
          },
        ],
      },
      {
        tab: {
          'zh-CN': '博客',
          'en-US': 'Blog',
        },
        icon: 'Newspaper',
        pages: [
          {
            group: {
              'zh-CN': '博客',
              'en-US': 'Blog',
            },
            icon: 'Newspaper',
            layout: 'blog',
            pages: [
              {
                page: 'blog',
                icon: 'Newspaper',
              },
              {
                page: 'blog/release-as-documentation',
                icon: 'PenLine',
              },
              {
                page: 'blog/clarify-vs-mintlify',
                icon: 'Scale',
              },
              {
                page: 'blog/clarify-vs-docusaurus',
                icon: 'Scale',
              },
              {
                page: 'blog/clarify-vs-vitepress',
                icon: 'Scale',
              },
              {
                page: 'blog/clarify-vs-fern',
                icon: 'Scale',
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
