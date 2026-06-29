import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const locales = ['en', 'zh-CN'] as const
export type AppLocale = (typeof locales)[number]

export const localeLabels: Record<AppLocale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

export function isAppLocale(locale: string): locale is AppLocale {
  return (locales as readonly string[]).includes(locale)
}

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        common: {
          github: 'GitHub',
          getStarted: 'Get started',
          email: 'Email',
          subscribe: 'Subscribe',
          included: 'Included',
          notIncluded: 'Not included',
          compareFeatures: 'Compare features',
          theme: {
            switchToDark: 'Switch to dark theme',
            switchToLight: 'Switch to light theme',
            switchToSystem: 'Follow system theme',
          },
          language: {
            switchTo: 'Switch language to {{language}}',
          },
        },
        nav: {
          features: 'Features',
          pricing: 'Pricing',
          about: 'About',
          docs: 'Docs',
        },
        footer: {
          newsletterHeadline: 'Stay close to Clarify',
          newsletterSubheadline: 'Product notes, release updates, and practical guidance for source-owned developer documentation.',
          product: 'Product',
          company: 'Company',
          resources: 'Resources',
          legal: 'Legal',
          documentation: 'Documentation',
          contact: 'Contact',
          gettingStarted: 'Getting started',
          guides: 'Guides',
          apiReference: 'API Reference',
          privacyPolicy: 'Privacy Policy',
          commercialServices: 'Commercial Services',
          fineprint: 'AGPL-3.0-only © 2026 Taicode Labs',
        },
        hero: {
          badge: 'Open-source documentation publishing for MDX and OpenAPI',
          badgeCta: 'See the workflow',
          headline: 'Own your developer docs from source to static output.',
          subheadline:
            'Clarify brings MDX, OpenAPI, typed TypeScript configuration, native internationalization, theme tokens, responsive layouts, and AI-readable output into one local-first publishing workflow.',
          startBuilding: 'Start building',
          viewGithub: 'View GitHub',
        },
        stats: {
          eyebrow: 'Local-first by design',
          headline: 'Polished docs without giving up source ownership.',
          subheadline: 'Keep content, configuration, OpenAPI specs, and theme settings in Git, then ship self-hostable static output anywhere.',
          items: [
            { stat: 'Git', text: 'Docs, configuration, OpenAPI specs, and theme settings stay in your repository.' },
            { stat: 'MDX', text: 'Write guides with Markdown, React components, and product-like documentation blocks.' },
            { stat: 'OpenAPI', text: 'Publish full API references or embed individual operations inside any MDX page.' },
            { stat: 'AI', text: 'Generate raw Markdown, OpenAPI artifacts, and llms.txt for assistants and search systems.' },
          ],
        },
        features: {
          eyebrow: 'Product capabilities',
          headline: 'One publishing layer for guides, API reference, localization, and AI-ready output.',
          subheadline:
            'Clarify combines the parts teams usually stitch together manually: MDX authoring, OpenAPI rendering, TypeScript configuration, theming, responsive navigation, and static exports.',
          mdxHeadline: 'MDX pages with reusable documentation components',
          mdxSubheadline: 'Keep tutorials, onboarding flows, SDK guides, and release notes as source files while using components for cards, buttons, API embeds, and richer product explanations.',
          mdxCta: 'Explore MDX authoring',
          openApiHeadline: 'OpenAPI that belongs inside the docs journey',
          openApiSubheadline:
            'Generate full API reference pages and embed exact operations beside the workflow step where readers need endpoints, parameters, examples, and request code.',
          openApiCta: 'View OpenAPI support',
        },
        workflow: {
          eyebrow: 'Workflow',
          headline: 'Write in Git, configure in TypeScript, publish static output.',
          subheadline: 'Clarify is built for teams that want hosted-platform polish while keeping the portability of an open-source project.',
          items: [
            {
              label: '01',
              title: 'Own the source',
              text: 'Keep MDX pages, localized content, OpenAPI specs, navigation, and theme settings versioned with your product code.',
            },
            {
              label: '02',
              title: 'Shape the reader experience',
              text: 'Configure locales, routes, navigation, theme tokens, dark mode, API panels, and responsive layouts in TypeScript.',
            },
            {
              label: '03',
              title: 'Ship static and AI-ready',
              text: 'Build self-hostable HTML plus raw Markdown, OpenAPI artifacts, and llms.txt for humans, agents, and internal knowledge systems.',
            },
          ],
        },
        testimonials: {
          headline: 'Built for the documentation teams Clarify serves.',
          subheadline: 'Clarify is especially useful when docs need to be source-owned, API-aware, multilingual, self-hostable, and readable by both people and AI tools.',
          items: [
            ['Open-source projects can publish credible docs without moving content out of Git or depending on a proprietary publishing runtime.', 'Open-source maintainers', 'Source-owned publishing'],
            ['API platform teams can place endpoint details directly inside tutorials, onboarding flows, and SDK guides instead of sending readers to a separate reference silo.', 'API platform teams', 'Integrated OpenAPI'],
            ['Developer tooling teams can self-host static output while still giving readers modern navigation, search, code blocks, and responsive layouts.', 'Developer tooling teams', 'Static and portable'],
            ['Technical writing teams can manage English and translated content side by side while sharing one navigation model and site structure.', 'Technical writing teams', 'Native localization'],
            ['Product teams can tune dark and light theme tokens so docs feel aligned with the brand without rebuilding the renderer.', 'Product teams', 'Theme control'],
            ['AI and knowledge teams can consume raw Markdown, OpenAPI artifacts, and llms.txt from the same source that powers the human-facing site.', 'AI knowledge teams', 'Agent-ready content'],
          ],
        },
        pricing: {
          eyebrow: 'Pricing',
          previewHeadline: 'Free core, optional delivery partnership.',
          previewSubheadline:
            'Use Clarify freely, then work with Taicode Labs when you need migration, customization, and launch support.',
          comparePlans: 'Compare plans',
          pageHeadline: 'Free when you self-host, custom when we deliver.',
          pageSubheadline:
            'Clarify has no fixed paid tier. The product stays free to use; commercial work is scoped as a Delivery Partner engagement.',
          ctaHeadline: 'Need a documentation partner?',
          ctaSubheadline:
            'Taicode Labs can help migrate content, tune the visual system, and prepare a static deployment pipeline.',
          ctaButton: 'Talk to Delivery Partner services',
          freeName: 'Free',
          freePrice: 'Free',
          freePeriod: 'forever',
          freeSubheadline: 'For individuals, open-source projects, and teams that want to run Clarify themselves.',
          freeFeatures: ['AGPL-licensed core', 'MDX pages', 'OpenAPI references and embeds', 'Native i18n', 'Theme tokens', 'Static and AI-ready output'],
          freeCta: 'Get the source',
          partnerName: 'Delivery Partner',
          partnerPrice: 'Custom',
          partnerPeriod: 'project',
          partnerBadge: 'Commercial service',
          partnerSubheadline:
            'For organizations that want Taicode Labs to migrate content, model API docs, customize themes, and launch the documentation site.',
          partnerFeatures: ['Everything in Free', 'Content migration', 'OpenAPI modeling', 'Theme customization', 'Static deployment pipeline', 'Team enablement'],
          partnerCta: 'Book a scope call',
          comparison: {
            publishing: 'Publishing',
            support: 'Support',
            customization: 'Customization',
            staticSiteGeneration: 'Static site generation',
            mdxPages: 'MDX documentation pages',
            openApiGeneration: 'OpenAPI reference generation',
            customDomainReview: 'Custom domain deployment review',
            communitySupport: 'Community issue support',
            privateSupport: 'Private implementation support',
            migrationPlanning: 'Migration planning',
            doneForYouDelivery: 'Done-for-you delivery',
            themeTokens: 'Theme tokens',
            rendererReuse: 'Renderer component reuse',
            customLandingSections: 'Custom landing sections',
            bespokeIntegrations: 'Bespoke integrations',
            selfServe: 'Self-serve',
          },
        },
        faqs: {
          headline: 'Questions teams ask before adopting Clarify.',
          subheadline: 'Clarify is designed to start as a local-first docs tool and scale into a complete developer documentation workflow.',
          items: [
            {
              question: 'Where does our documentation source live?',
              answer:
                'In your repository. MDX pages, translations, OpenAPI specs, navigation, theme settings, and TypeScript configuration can be reviewed and versioned with the product code.',
            },
            {
              question: 'Can Clarify publish both guides and API reference?',
              answer:
                'Yes. Clarify can generate full OpenAPI reference pages and embed individual operations inside MDX pages so endpoint details appear directly inside tutorials and onboarding flows.',
            },
            {
              question: 'Can we self-host the output?',
              answer:
                'Yes. Clarify builds static HTML, CSS, JavaScript, raw content files, OpenAPI artifacts, and llms.txt that can be deployed to any static hosting platform.',
            },
            {
              question: 'Does Clarify support multilingual docs and custom themes?',
              answer:
                'Yes. Locale-aware routes, navigation labels, fallback behavior, dark/light themes, and configurable theme tokens are built into the publishing workflow.',
            },
          ],
        },
        finalCta: {
          headline: 'Publish documentation that stays owned, portable, and ready for readers.',
          subheadline:
            'Start with the open-source project, connect MDX and OpenAPI, then ship static docs that work for humans, teams, and AI tools.',
          docs: 'Read the docs',
          services: 'Commercial services',
        },
        about: {
          eyebrow: 'About Clarify',
          headline: 'An open-source documentation publishing layer for MDX, OpenAPI, and AI-ready knowledge bases.',
          subheadline:
            'Clarify exists for teams that want hosted-platform polish without giving up source ownership, self-hosting, multilingual content, responsive layouts, or brand control.',
          docs: 'Read the docs',
          source: 'Explore source',
          statsHeadline: 'What we optimize for',
          statsSubheadline: 'Source-owned documentation infrastructure for teams that need credible developer docs across guides, APIs, and AI-readable output.',
          stats: [
            { stat: 'Open', text: 'Open-source by default, with docs and configuration kept in Git.' },
            { stat: 'API', text: 'OpenAPI references and embedded operations live beside guides and examples.' },
            { stat: 'Global', text: 'Native internationalization keeps localized content in one shared site structure.' },
            { stat: 'AI', text: 'Raw Markdown, OpenAPI artifacts, and llms.txt make the same source useful to agents.' },
          ],
        },
        privacy: {
          eyebrow: 'Privacy',
          headline: 'Privacy Policy',
          subheadline:
            "Clarify's marketing site is a static website. If you contact Taicode Labs, the information you provide is used to respond to your request and deliver the requested service.",
          contact: 'Contact us',
        },
        notFound: {
          headline: 'Page not found',
          subheadline: 'The page you are looking for does not exist or has moved.',
          home: 'Back home',
        },
      },
    },
    'zh-CN': {
      translation: {
        common: {
          github: 'GitHub',
          getStarted: '开始使用',
          email: '邮箱',
          subscribe: '订阅',
          included: '已包含',
          notIncluded: '不包含',
          compareFeatures: '功能对比',
          theme: {
            switchToDark: '切换到暗色主题',
            switchToLight: '切换到亮色主题',
            switchToSystem: '跟随系统主题',
          },
          language: {
            switchTo: '切换语言到{{language}}',
          },
        },
        nav: {
          features: '功能',
          pricing: '价格',
          about: '关于',
          docs: '文档',
        },
        footer: {
          newsletterHeadline: '关注 Clarify 动态',
          newsletterSubheadline: '获取关于源码归属型开发者文档的产品笔记、版本更新和实践建议。',
          product: '产品',
          company: '公司',
          resources: '资源',
          legal: '法律',
          documentation: '文档',
          contact: '联系',
          gettingStarted: '快速开始',
          guides: '指南',
          apiReference: 'API 参考',
          privacyPolicy: '隐私政策',
          commercialServices: '商业服务',
          fineprint: 'AGPL-3.0-only © 2026 Taicode Labs',
        },
        hero: {
          badge: '面向 MDX 与 OpenAPI 的开源文档发布工具',
          badgeCta: '查看工作流',
          headline: '从源码到静态输出，真正拥有你的开发者文档。',
          subheadline:
            'Clarify 将 MDX、OpenAPI、类型化 TypeScript 配置、原生国际化、主题令牌、响应式布局和 AI 可读输出放进一个本地优先的发布工作流。',
          startBuilding: '开始构建',
          viewGithub: '查看 GitHub',
        },
        stats: {
          eyebrow: '本地优先设计',
          headline: '不牺牲源码归属，也能拥有精致文档体验。',
          subheadline: '将内容、配置、OpenAPI 规范和主题设置保留在 Git 中，再将可自托管的静态输出部署到任意平台。',
          items: [
            { stat: 'Git', text: '文档、配置、OpenAPI 规范和主题设置都保存在你的仓库中。' },
            { stat: 'MDX', text: '用 Markdown、React 组件和产品化文档区块编写指南。' },
            { stat: 'OpenAPI', text: '发布完整 API 参考，也可在任意 MDX 页面内嵌单个接口。' },
            { stat: 'AI', text: '生成 raw Markdown、OpenAPI artifacts 和 llms.txt，服务助手与搜索系统。' },
          ],
        },
        features: {
          eyebrow: '产品能力',
          headline: '一个发布层，覆盖指南、API 参考、本地化和 AI-ready 输出。',
          subheadline: 'Clarify 把团队通常需要手动拼接的部分整合在一起：MDX 创作、OpenAPI 渲染、TypeScript 配置、主题、响应式导航和静态导出。',
          mdxHeadline: '带可复用文档组件的 MDX 页面',
          mdxSubheadline: '将教程、上手流程、SDK 指南和发布说明保留为源文件，同时用组件承载卡片、按钮、API 嵌入和更丰富的产品解释。',
          mdxCta: '探索 MDX 创作',
          openApiHeadline: '融入文档旅程的 OpenAPI',
          openApiSubheadline: '生成完整 API 参考页面，也能把具体接口放到读者需要的步骤旁边，包含端点、参数、示例和请求代码。',
          openApiCta: '查看 OpenAPI 支持',
        },
        workflow: {
          eyebrow: '工作流',
          headline: '在 Git 中编写，用 TypeScript 配置，发布静态输出。',
          subheadline: 'Clarify 面向那些既想要托管平台级质感，又想保留开源项目可移植性的团队。',
          items: [
            {
              label: '01',
              title: '拥有源码',
              text: '将 MDX 页面、本地化内容、OpenAPI 规范、导航和主题设置与产品代码一起版本化。',
            },
            {
              label: '02',
              title: '塑造阅读体验',
              text: '用 TypeScript 配置语言、路由、导航、主题令牌、暗色模式、API 面板和响应式布局。',
            },
            {
              label: '03',
              title: '静态且 AI-ready',
              text: '构建可自托管 HTML，以及 raw Markdown、OpenAPI artifacts 和 llms.txt，服务读者、智能体与内部知识系统。',
            },
          ],
        },
        testimonials: {
          headline: '为 Clarify 服务的文档团队而设计。',
          subheadline: '当文档需要源码归属、理解 API、多语言、自托管，并同时面向人和 AI 工具阅读时，Clarify 尤其适合。',
          items: [
            ['开源项目可以发布可信的文档体验，同时不把内容迁出 Git，也不依赖专有发布运行时。', '开源维护者', '源码归属发布'],
            ['API 平台团队可以把接口细节直接放进教程、上手流程和 SDK 指南，而不是让读者跳到孤立的参考页。', 'API 平台团队', '集成式 OpenAPI'],
            ['开发者工具团队可以自托管静态输出，同时保留现代导航、搜索、代码块和响应式布局。', '开发者工具团队', '静态且可移植'],
            ['技术写作团队可以并排维护英文与翻译内容，共享同一套导航模型和站点结构。', '技术写作团队', '原生本地化'],
            ['产品团队可以调整明暗主题令牌，让文档与品牌保持一致，而不必重建渲染器。', '产品团队', '主题控制'],
            ['AI 与知识团队可以从同一份来源消费 raw Markdown、OpenAPI artifacts 和 llms.txt。', 'AI 知识团队', '面向智能体的内容'],
          ],
        },
        pricing: {
          eyebrow: '价格',
          previewHeadline: '核心免费，可选交付合作。',
          previewSubheadline: '自由使用 Clarify；当需要迁移、定制和上线支持时，再与 Taicode Labs 合作。',
          comparePlans: '对比方案',
          pageHeadline: '自托管免费，交付服务按需定制。',
          pageSubheadline: 'Clarify 没有固定付费档位。产品保持免费使用，商业工作按 Delivery Partner 项目范围评估。',
          ctaHeadline: '需要文档交付伙伴？',
          ctaSubheadline: 'Taicode Labs 可以帮助迁移内容、调整视觉系统，并准备静态部署流水线。',
          ctaButton: '咨询交付服务',
          freeName: '免费版',
          freePrice: '免费',
          freePeriod: '永久',
          freeSubheadline: '适合希望自行运行 Clarify 的个人、开源项目和团队。',
          freeFeatures: ['AGPL 许可核心', 'MDX 页面', 'OpenAPI 参考与嵌入', '原生国际化', '主题令牌', '静态与 AI-ready 输出'],
          freeCta: '获取源码',
          partnerName: '交付伙伴',
          partnerPrice: '定制',
          partnerPeriod: '项目制',
          partnerBadge: '商业服务',
          partnerSubheadline: '适合希望 Taicode Labs 迁移内容、建模 API 文档、定制主题并上线文档站点的组织。',
          partnerFeatures: ['包含免费版全部能力', '内容迁移', 'OpenAPI 建模', '主题定制', '静态部署流水线', '团队赋能'],
          partnerCta: '预约范围沟通',
          comparison: {
            publishing: '发布',
            support: '支持',
            customization: '定制',
            staticSiteGeneration: '静态站点生成',
            mdxPages: 'MDX 文档页面',
            openApiGeneration: 'OpenAPI 参考生成',
            customDomainReview: '自定义域名部署审查',
            communitySupport: '社区 issue 支持',
            privateSupport: '私有实施支持',
            migrationPlanning: '迁移规划',
            doneForYouDelivery: '代交付服务',
            themeTokens: '主题令牌',
            rendererReuse: 'Renderer 组件复用',
            customLandingSections: '自定义落地区块',
            bespokeIntegrations: '专属集成',
            selfServe: '自助',
          },
        },
        faqs: {
          headline: '团队采用 Clarify 前常问的问题。',
          subheadline: 'Clarify 从本地优先的文档工具开始，并可扩展为完整的开发者文档工作流。',
          items: [
            {
              question: '我们的文档源码放在哪里？',
              answer: '放在你的仓库中。MDX 页面、翻译内容、OpenAPI 规范、导航、主题设置和 TypeScript 配置都可以与产品代码一起评审和版本化。',
            },
            {
              question: 'Clarify 能同时发布指南和 API 参考吗？',
              answer: '可以。Clarify 能生成完整 OpenAPI 参考页，也能在 MDX 页面中嵌入单个接口，让端点细节直接出现在教程和上手流程里。',
            },
            {
              question: '可以自托管输出结果吗？',
              answer: '可以。Clarify 会构建静态 HTML、CSS、JavaScript、raw content 文件、OpenAPI artifacts 和 llms.txt，可部署到任意静态托管平台。',
            },
            {
              question: '支持多语言文档和自定义主题吗？',
              answer: '支持。Clarify 内置 locale-aware 路由、导航标签、回退行为、明暗主题和可配置主题令牌。',
            },
          ],
        },
        finalCta: {
          headline: '发布归属清晰、可移植，并为读者准备好的文档。',
          subheadline: '从开源项目开始，连接 MDX 与 OpenAPI，然后发布同时服务用户、团队和 AI 工具的静态文档。',
          docs: '阅读文档',
          services: '商业服务',
        },
        about: {
          eyebrow: '关于 Clarify',
          headline: '面向 MDX、OpenAPI 和 AI-ready 知识库的开源文档发布层。',
          subheadline: 'Clarify 服务于那些想要托管平台级质感，同时不放弃源码归属、自托管、多语言内容、响应式布局和品牌控制的团队。',
          docs: '阅读文档',
          source: '查看源码',
          statsHeadline: '我们的优化方向',
          statsSubheadline: '面向需要同时覆盖指南、API 和 AI-readable 输出的团队，提供源码归属型文档基础设施。',
          stats: [
            { stat: '开放', text: '默认开源，文档和配置保留在 Git 中。' },
            { stat: 'API', text: 'OpenAPI 参考和内嵌接口与指南、示例共同存在。' },
            { stat: '全球化', text: '原生国际化让本地化内容共享同一站点结构。' },
            { stat: 'AI', text: 'raw Markdown、OpenAPI artifacts 和 llms.txt 让同一份来源可被智能体使用。' },
          ],
        },
        privacy: {
          eyebrow: '隐私',
          headline: '隐私政策',
          subheadline: 'Clarify 营销站是静态网站。如果你联系 Taicode Labs，你提供的信息将用于回复请求并交付所需服务。',
          contact: '联系我们',
        },
        notFound: {
          headline: '页面不存在',
          subheadline: '你访问的页面不存在或已移动。',
          home: '返回首页',
        },
      },
    },
  },
})

export default i18n
