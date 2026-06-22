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
          newsletterSubheadline: 'Get product notes, release updates, and implementation tips from Taicode Labs.',
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
          badge: 'Open-source MDX and OpenAPI publishing for modern teams',
          badgeCta: 'View roadmap',
          headline: 'Publish polished developer docs without rebuilding your stack.',
          subheadline:
            'Clarify turns MDX, OpenAPI schemas, React components, and Vite builds into a fast static documentation site your team can own, theme, and deploy anywhere.',
          startBuilding: 'Start building',
          viewGithub: 'View GitHub',
        },
        stats: {
          eyebrow: 'Built for static publishing',
          headline: 'A documentation pipeline that stays simple.',
          subheadline: 'Clarify keeps authoring flexible while preserving static deployment as the production default.',
          items: [
            { stat: '100%', text: 'Static output for CDN, object storage, and edge hosting.' },
            { stat: 'MDX', text: 'Author guides with Markdown and reusable React components.' },
            { stat: 'OpenAPI', text: 'Generate reference pages from schemas without hand-maintained tables.' },
            { stat: 'Vite', text: 'Fast local iteration and production optimized builds.' },
          ],
        },
        features: {
          eyebrow: 'Powerful features',
          headline: 'Everything you need to publish polished developer documentation.',
          subheadline:
            "Keep the template's strongest visual module, but use it to show Clarify's MDX authoring, OpenAPI rendering, and static publishing workflow.",
          mdxHeadline: 'MDX content that feels like product UI',
          mdxSubheadline: 'Author guides as files, embed React components, and keep docs close to the code they explain.',
          mdxCta: 'Explore authoring',
          openApiHeadline: 'OpenAPI references and static deployment',
          openApiSubheadline:
            'Generate readable endpoint pages from schemas, then ship pure static HTML, CSS, and JavaScript with Vite SSG.',
          openApiCta: 'View API docs',
        },
        workflow: {
          eyebrow: 'Workflow',
          headline: 'From source files to deployable static output.',
          subheadline: 'Clarify keeps the authoring flow understandable: write, configure, build, and ship.',
          items: [
            {
              label: '01',
              title: 'Bring your content',
              text: 'Import existing Markdown, write new MDX pages, and connect one or more OpenAPI files.',
            },
            {
              label: '02',
              title: 'Shape the experience',
              text: 'Configure navigation, theme tokens, landing pages, API references, and reusable sections.',
            },
            {
              label: '03',
              title: 'Deploy statically',
              text: 'Generate a pure static output folder and host it on any CDN or static hosting provider.',
            },
          ],
        },
        testimonials: {
          headline: 'What our customers are saying',
          subheadline: 'Teams use Clarify to move quickly from raw docs content to a polished, static documentation site.',
          items: [
            ['Clarify helped us turn scattered Markdown and OpenAPI files into a documentation site that finally feels intentional.', 'Maya Chen', 'Developer Experience Lead'],
            ['The static output model made deployment boring in the best way. We pushed it to our CDN and stopped worrying about runtime infrastructure.', 'Ethan Brooks', 'Platform Engineer'],
            ['Taicode Labs kept the migration pragmatic: preserve what worked, clean up the navigation, and ship the first version quickly.', 'JiaYi Xia', 'Development Lead'],
            ['The renderer components gave our docs the polish of a product surface without forcing the engineering team into a full redesign.', 'Leo Martin', 'Engineering Manager'],
            ['OpenAPI pages no longer feel bolted on. They sit next to guides, examples, and release notes in one coherent experience.', 'Ava Patel', 'API Program Manager'],
            ['We started free, then brought in Delivery Partner support when deadlines got tight. That path made adoption much easier.', 'Sam Rivera', 'Founder'],
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
          freeFeatures: ['AGPL-licensed core', 'MDX pages', 'OpenAPI reference', 'Vite SSG static export', 'Community support'],
          freeCta: 'Get the source',
          partnerName: 'Delivery Partner',
          partnerPrice: 'Custom',
          partnerPeriod: 'project',
          partnerBadge: 'Commercial service',
          partnerSubheadline:
            'For organizations that want Taicode Labs to design, migrate, customize, and launch the docs site.',
          partnerFeatures: ['Everything in Free', 'Content migration', 'Custom components', 'OpenAPI modeling', 'SSG deployment pipeline', 'Team enablement'],
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
          subheadline: 'Clarify is designed to start simple and scale into a complete developer documentation workflow.',
          items: [
            {
              question: 'Is Clarify free to use?',
              answer:
                'Yes. The core project is open source under AGPL-3.0-only. Commercial services are optional for teams that want private support or delivery help.',
            },
            {
              question: 'Can the marketing site and docs be deployed as static files?',
              answer:
                'Yes. The www app uses Vite and is configured to generate static HTML for supported routes, so it can be hosted on any static platform.',
            },
            {
              question: 'Do we need to rewrite our existing docs?',
              answer:
                'No. Clarify is designed around file-based MDX and OpenAPI inputs, so existing Markdown and schemas can be migrated incrementally.',
            },
            {
              question: 'What does Delivery Partner include?',
              answer:
                'Scoped implementation guidance, migration planning, deployment review, and optional done-for-you customization by Taicode Labs.',
            },
          ],
        },
        finalCta: {
          headline: 'Launch clearer docs without starting from a blank page.',
          subheadline:
            'Start with the open-source tool or ask Taicode Labs to migrate and launch your production documentation site.',
          docs: 'Read the docs',
          services: 'Commercial services',
        },
        about: {
          eyebrow: 'About Clarify',
          headline: 'An open-source documentation publishing tool from Taicode Labs.',
          subheadline:
            'Clarify exists to make developer documentation easier to own: static by default, content-driven, API-aware, and friendly to React teams.',
          docs: 'Read the docs',
          source: 'Explore source',
          statsHeadline: 'What we optimize for',
          statsSubheadline: 'Practical documentation infrastructure for small teams that need credible output quickly.',
          stats: [
            { stat: 'Open', text: 'Transparent source, clear licensing, and a community-friendly starting point.' },
            { stat: 'Static', text: 'No runtime server requirement for public documentation deployments.' },
            { stat: 'Typed', text: 'TypeScript packages for CLI, renderer, and app integration.' },
            { stat: 'Service', text: 'Commercial help is available when timelines are tight.' },
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
          newsletterSubheadline: '获取 Taicode Labs 的产品笔记、版本更新和实施建议。',
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
          badge: '面向现代团队的开源 MDX 与 OpenAPI 发布工具',
          badgeCta: '查看路线图',
          headline: '无需重建技术栈，也能发布精致的开发者文档。',
          subheadline:
            'Clarify 将 MDX、OpenAPI Schema、React 组件和 Vite 构建串联成快速的静态文档站点，团队可自行拥有、定制主题并部署到任意平台。',
          startBuilding: '开始构建',
          viewGithub: '查看 GitHub',
        },
        stats: {
          eyebrow: '为静态发布而生',
          headline: '保持简单的文档发布流水线。',
          subheadline: 'Clarify 保留灵活的创作体验，同时将静态部署作为生产默认路径。',
          items: [
            { stat: '100%', text: '为 CDN、对象存储和边缘托管输出静态文件。' },
            { stat: 'MDX', text: '使用 Markdown 和可复用 React 组件编写指南。' },
            { stat: 'OpenAPI', text: '从 Schema 生成参考页面，无需手动维护表格。' },
            { stat: 'Vite', text: '快速本地迭代，并生成生产优化构建。' },
          ],
        },
        features: {
          eyebrow: '强大功能',
          headline: '发布精致开发者文档所需的一切。',
          subheadline: '保留模板中最强的视觉模块，用它展示 Clarify 的 MDX 创作、OpenAPI 渲染和静态发布流程。',
          mdxHeadline: '像产品 UI 一样自然的 MDX 内容',
          mdxSubheadline: '以文件形式编写指南，嵌入 React 组件，并让文档贴近它所解释的代码。',
          mdxCta: '探索创作方式',
          openApiHeadline: 'OpenAPI 参考与静态部署',
          openApiSubheadline: '从 Schema 生成易读的接口页面，再用 Vite SSG 交付纯静态 HTML、CSS 和 JavaScript。',
          openApiCta: '查看 API 文档',
        },
        workflow: {
          eyebrow: '工作流',
          headline: '从源文件到可部署的静态输出。',
          subheadline: 'Clarify 让创作流程清晰可控：编写、配置、构建、发布。',
          items: [
            {
              label: '01',
              title: '带入你的内容',
              text: '导入现有 Markdown，编写新的 MDX 页面，并连接一个或多个 OpenAPI 文件。',
            },
            {
              label: '02',
              title: '塑造体验',
              text: '配置导航、主题令牌、落地页、API 参考和可复用区块。',
            },
            {
              label: '03',
              title: '静态部署',
              text: '生成纯静态输出目录，并部署到任意 CDN 或静态托管平台。',
            },
          ],
        },
        testimonials: {
          headline: '客户评价',
          subheadline: '团队使用 Clarify 将原始文档内容快速变成精致的静态文档站点。',
          items: [
            ['Clarify 帮我们把零散的 Markdown 和 OpenAPI 文件变成了真正有设计感的文档站点。', 'Maya Chen', '开发者体验负责人'],
            ['静态输出模型让部署变得稳定省心。推到 CDN 后，我们不再担心运行时基础设施。', 'Ethan Brooks', '平台工程师'],
            ['Taicode Labs 的迁移方式很务实：保留有效内容、清理导航，并快速发布第一版。', 'JiaYi Xia', '开发负责人'],
            ['Renderer 组件让我们的文档拥有产品级质感，同时无需工程团队进行完整重设计。', 'Leo Martin', '工程经理'],
            ['OpenAPI 页面不再像外挂模块。它们与指南、示例和发布说明共同构成一致体验。', 'Ava Patel', 'API 项目经理'],
            ['我们从免费版本开始，在期限紧张时引入 Delivery Partner 支持，这让落地更容易。', 'Sam Rivera', '创始人'],
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
          freeFeatures: ['AGPL 许可核心', 'MDX 页面', 'OpenAPI 参考', 'Vite SSG 静态导出', '社区支持'],
          freeCta: '获取源码',
          partnerName: '交付伙伴',
          partnerPrice: '定制',
          partnerPeriod: '项目制',
          partnerBadge: '商业服务',
          partnerSubheadline: '适合希望 Taicode Labs 设计、迁移、定制并上线文档站点的组织。',
          partnerFeatures: ['包含免费版全部能力', '内容迁移', '自定义组件', 'OpenAPI 建模', 'SSG 部署流水线', '团队赋能'],
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
          subheadline: 'Clarify 设计为从简单开始，并逐步扩展为完整的开发者文档工作流。',
          items: [
            {
              question: 'Clarify 可以免费使用吗？',
              answer: '可以。核心项目基于 AGPL-3.0-only 开源。需要私有支持或交付协助的团队可选择商业服务。',
            },
            {
              question: '营销站和文档可以部署为静态文件吗？',
              answer: '可以。www 应用使用 Vite，并配置为为支持的路由生成静态 HTML，可托管在任意静态平台。',
            },
            {
              question: '需要重写现有文档吗？',
              answer: '不需要。Clarify 围绕基于文件的 MDX 和 OpenAPI 输入设计，现有 Markdown 和 Schema 可逐步迁移。',
            },
            {
              question: 'Delivery Partner 包含什么？',
              answer: '包含范围化实施指导、迁移规划、部署审查，以及 Taicode Labs 可选的代定制服务。',
            },
          ],
        },
        finalCta: {
          headline: '无需从空白页开始，也能发布更清晰的文档。',
          subheadline: '从开源工具开始，或让 Taicode Labs 帮你迁移并上线生产文档站点。',
          docs: '阅读文档',
          services: '商业服务',
        },
        about: {
          eyebrow: '关于 Clarify',
          headline: 'Taicode Labs 打造的开源文档发布工具。',
          subheadline: 'Clarify 让开发者文档更容易被团队掌控：默认静态、内容驱动、理解 API，并对 React 团队友好。',
          docs: '阅读文档',
          source: '查看源码',
          statsHeadline: '我们的优化方向',
          statsSubheadline: '面向小团队的实用文档基础设施，帮助快速产出可信内容。',
          stats: [
            { stat: '开放', text: '透明源码、清晰许可，以及友好的社区起点。' },
            { stat: '静态', text: '公开文档部署无需运行时服务器。' },
            { stat: '类型化', text: 'CLI、Renderer 和应用集成均使用 TypeScript 包。' },
            { stat: '服务', text: '当时间紧张时，可选择商业支持。' },
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
