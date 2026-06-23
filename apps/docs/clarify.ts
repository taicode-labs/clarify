import { defineConfig } from '@clarify-labs/cli'

export default defineConfig({
  title: 'Clarify',
  description: '开源文档发布工具，为 MDX 和 OpenAPI 而生。',
  siteUrl: 'https://docs.clarify.pub',
  source: {
    repository: 'https://github.com/taicode-labs/clarify',
    branch: 'main',
    directory: 'apps/docs/source',
  },
  logo: '/clarify.svg',
  favicon: '/clarify-icon.png',
  i18n: {
    defaultLocale: 'zh-CN',
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
  theme: {
    preset: 'default',
    editor: true,
  },
  navbar: {
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
            'zh-CN': '核心路径',
            'en-US': 'Core Path',
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
                'en-US': 'Get Started',
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
            {
              page: 'guides/writing-content',
              title: {
                'zh-CN': '写作文档',
                'en-US': 'Writing Docs',
              },
              icon: 'PenLine',
            },
            {
              page: 'guides/navigation',
              title: {
                'zh-CN': '配置站点',
                'en-US': 'Configure Site',
              },
              icon: 'SlidersHorizontal',
            },
            {
              page: 'features/openapi',
              title: {
                'zh-CN': 'API 文档',
                'en-US': 'API Documentation',
              },
              icon: 'Webhook',
            },
            {
              page: 'guides/deployment',
              title: {
                'zh-CN': '发布上线',
                'en-US': 'Ship to Production',
              },
              icon: 'UploadCloud',
            },
          ],
        },
        {
          group: {
            'zh-CN': '场景补充',
            'en-US': 'Scenarios',
          },
          icon: 'Sparkles',
          pages: [
            {
              page: 'guides/migrate-from-mintlify',
              title: {
                'zh-CN': '从 Mintlify 迁移',
                'en-US': 'Migrate from Mintlify',
              },
              icon: 'RefreshCcw',
            },
            {
              page: 'features/plugins',
              title: {
                'zh-CN': '插件机制',
                'en-US': 'Plugin System',
              },
              icon: 'Puzzle',
            },
            {
              page: 'showcase',
              title: {
                'zh-CN': '示例与演示',
                'en-US': 'Showcase',
              },
              icon: 'MonitorPlay',
            },
            {
              page: 'roadmap',
              title: {
                'zh-CN': '产品路线图',
                'en-US': 'Product Roadmap',
              },
              icon: 'Milestone',
            },
            {
              page: 'changelog',
              title: {
                'zh-CN': '更新日志',
                'en-US': 'Changelog',
              },
              icon: 'History',
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
        'zh-CN': '参考',
        'en-US': 'Reference',
      },
      icon: 'Library',
      pages: [
        {
          group: {
            'zh-CN': '参考手册',
            'en-US': 'Reference',
          },
          icon: 'Library',
          pages: [
            {
              page: 'reference',
              title: {
                'zh-CN': '参考资料总览',
                'en-US': 'Reference Overview',
              },
              icon: 'BookMarked',
            },
            {
              page: 'reference/clarify-config',
              title: {
                'zh-CN': '配置文件参考',
                'en-US': 'Configuration Reference',
              },
              icon: 'Settings2',
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
              page: 'reference/built-in-components',
              title: {
                'zh-CN': '内置公开组件',
                'en-US': 'Built-in Components',
              },
              icon: 'Component',
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
})
