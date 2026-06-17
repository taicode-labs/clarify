import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const supportedLanguages = ['zh-CN', 'en-US'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage: SupportedLanguage = 'zh-CN'

export const languageLabels: Record<SupportedLanguage, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
}

const resources = {
  'zh-CN': {
    translation: {
      app: {
        title: 'Clarify',
      },
      nav: {
        ariaLabel: '主导航',
        features: '能力',
        workflow: '工作流',
        openapi: 'OpenAPI',
        docs: '文档',
        github: 'GitHub',
        getStarted: '开始使用',
      },
      language: {
        label: '语言',
      },
      theme: {
        switchTo: '切换到{{theme}}主题',
        light: '浅色',
        dark: '深色',
      },
      hero: {
        badge: '面向现代团队的开源文档发布工具',
        title: '用一套可组合系统发布 MDX 与 OpenAPI 文档。',
        description: 'Clarify 将 Markdown、React 组件、API Reference 和 Vite 构建整合到一个快速、类型安全且易于定制的文档工作流中。',
        ctaPrimary: '开始使用',
        ctaSecondary: '浏览文档',
        ctaGithub: '查看 GitHub',
        previewEndpointDescription: '从 OpenAPI Schema 获取项目并渲染 Reference 页面。',
        codeComment: '使用 Clarify 构建文档',
        codeNote: 'MDX、React 和 OpenAPI 共用同一个文档运行时。',
      },
      preview: {
        gettingStarted: '快速上手',
        guides: '指南',
        components: '组件',
        apiReference: 'API Reference',
      },
      tags: {
        mdx: 'MDX 原生',
        openapi: 'OpenAPI 就绪',
        react: 'React 驱动',
        vite: 'Vite 极速',
      },
      features: {
        eyebrow: '能力',
        title: '开发者文档所需能力一应俱全。',
        description: 'Clarify 将内容创作、API Reference、视觉组件和生产构建统一到专注的工具链中。',
        mdx: {
          title: 'MDX 原生',
          description: '使用 Markdown 编写文档，并在需要交互的位置嵌入 React 组件。',
        },
        openapi: {
          title: 'OpenAPI Reference',
          description: '直接从 OpenAPI 规范生成易读的 API 页面，并保持同步。',
        },
        ui: {
          title: '可组合 UI',
          description: '通过可复用渲染器组件构建说明、代码、导航和 API 区块。',
        },
        workflow: {
          title: '快速本地工作流',
          description: '借助 Vite 开发体验即时预览修改，并生成优化后的生产构建。',
        },
        typescript: {
          title: 'TypeScript 优先',
          description: '让配置、路由元数据和渲染行为保持显式且类型安全。',
        },
        i18n: {
          title: '多语言就绪',
          description: '以结构化方式组织本地化内容，而不拆散你的文档系统。',
        },
      },
      workflow: {
        eyebrow: '工作流',
        title: '从内容到发布文档，只需几分钟。',
        write: {
          title: '编写',
          description: '用 MDX 创作页面，并通过 React 内容区块进行组合。',
        },
        connect: {
          title: '连接',
          description: '通过轻量项目配置添加导航、多语言和 OpenAPI 数据源。',
        },
        publish: {
          title: '发布',
          description: '构建易于托管、版本管理和审阅的静态输出。',
        },
        terminal: '终端',
        ready: 'vite 已就绪',
      },
      openapi: {
        eyebrow: 'OpenAPI',
        title: '无需手动维护的 API Reference。',
        description: '导入 OpenAPI 文档，让 Clarify 将接口、参数、响应和示例转化为与其他文档体验一致的 Reference 页面。',
        ctaDocs: '查看 API 文档',
        ctaGuides: '阅读指南',
        parameters: '参数',
        response: '响应',
      },
      renderer: {
        eyebrow: '渲染器',
        title: '设计上贴合你的文档运行时。',
        description: '官网沿用 @clarify/renderer 的视觉语言：锌色表面、翠绿色强调、柔和边框、代码优先预览和面向文档的间距。',
        note: '说明',
        noteDescription: '使用共享组件，让内容在文档中保持原生体验。',
        navigation: '导航',
        codeGroup: '代码组',
      },
      iconPreview: {
        eyebrow: '图标草案',
        title: 'Clarify 图标预览',
        description: '为文档发布工具设计的简洁绿色 SVG 概念。',
        bookM: {
          name: '书本 M',
          description: '把 M 做成打开的书，两侧竖线更厚重。',
        },
        boldBookM: {
          name: '粗体书本 M',
          description: '强化两侧书脊，让 M 更像一本摊开的书。',
        },
        pageM: {
          name: '页面 M',
          description: '用书页轮廓承载 M，文档属性更直接。',
        },
        mLeaf: {
          name: '叶片 M',
          description: '在书本 M 上加入绿色叶片作为品牌点缀。',
        },
        clearLeaf: {
          name: '清晰叶片',
          description: '叶片加文档线条，柔和且自然。',
        },
        foldedDoc: {
          name: '折角文档',
          description: '极简文档形态，带有明确的清晰标记。',
        },
        clarifyC: {
          name: 'Clarify C',
          description: '由阅读线条塑造的干净 C 字母标识。',
        },
        sparkPage: {
          name: '闪光页面',
          description: '文档页面加上一枚代表清晰度的闪光。',
        },
        openBook: {
          name: '打开的书',
          description: '小型开放文档与一条高亮的清晰路径。',
        },
        focusRing: {
          name: '聚焦环',
          description: '聚焦点和扫描线，表达精准文档体验。',
        },
        terminalLeaf: {
          name: '终端叶片',
          description: 'CLI 提示符与一片小绿叶结合。',
        },
        docCompass: {
          name: '文档罗盘',
          description: '用于结构化文档导航的方向标记。',
        },
        layeredPages: {
          name: '叠层页面',
          description: '表达生成式文档的一组层叠页面。',
        },
        mdxMark: {
          name: 'MDX 标记',
          description: '用尖括号和文字线条表达 MDX 文档。',
        },
        apiNode: {
          name: 'API 节点',
          description: '紧凑的 OpenAPI 节点关系图。',
        },
        lightBeam: {
          name: '清晰光束',
          description: '穿过页面的一束简单清晰高亮。',
        },
        seedGlyph: {
          name: '种子符号',
          description: '象征文档持续生长的小型种子形态。',
        },
        checkPages: {
          name: '完成页面',
          description: '已发布文档与干净的成功信号。',
        },
        routeLine: {
          name: '路径线',
          description: '从源内容通向发布文档的清晰路径。',
        },
        bracketLeaf: {
          name: '括号叶片',
          description: '开发者文档与更轻盈的自然标记。',
        },
        prismDoc: {
          name: '棱镜文档',
          description: '用几何切面表达内容被整理得更清晰。',
        },
        flowC: {
          name: '流动 C',
          description: '更柔和的 C 字母与阅读线条组合。',
        },
        paperPlane: {
          name: '纸飞机',
          description: '把文档轻快发布出去的简洁符号。',
        },
        boltPage: {
          name: '闪电页面',
          description: '强调 Vite 驱动的快速文档工作流。',
        },
        searchDoc: {
          name: '搜索文档',
          description: '面向可发现、可检索文档体验的图标。',
        },
        gridLeaf: {
          name: '网格叶片',
          description: '模块化内容块与绿色品牌元素结合。',
        },
        bookSpark: {
          name: '闪光书页',
          description: '开放文档中出现的清晰灵感。',
        },
        apiBraces: {
          name: 'API 花括号',
          description: '用代码花括号表达开发者文档属性。',
        },
        clearStack: {
          name: '清晰层叠',
          description: '多层内容被统一整理成清晰结构。',
        },
        orbitDoc: {
          name: '轨道文档',
          description: '围绕文档运行的工具链与发布流程。',
        },
      },
      finalCta: {
        title: '开始发布更清晰的文档。',
        description: '构建一个可从 README 平滑成长为 API Reference 的文档站点，无需更换技术栈。',
        getStarted: '开始使用',
      },
      footer: {
        license: 'AGPL-3.0-only © 2026 Taicode Labs',
        docs: '文档',
        api: 'API',
        github: 'GitHub',
      },
    },
  },
  'en-US': {
    translation: {
      app: {
        title: 'Clarify',
      },
      nav: {
        ariaLabel: 'Primary navigation',
        features: 'Features',
        workflow: 'Workflow',
        openapi: 'OpenAPI',
        docs: 'Docs',
        github: 'GitHub',
        getStarted: 'Get started',
      },
      language: {
        label: 'Language',
      },
      theme: {
        switchTo: 'Switch to {{theme}} theme',
        light: 'light',
        dark: 'dark',
      },
      hero: {
        badge: 'Open-source docs publishing for modern teams',
        title: 'Publish MDX and OpenAPI docs with one composable system.',
        description: 'Clarify combines Markdown, React components, API references, and Vite-powered builds into a documentation workflow that stays fast, typed, and easy to customize.',
        ctaPrimary: 'Get started',
        ctaSecondary: 'Explore docs',
        ctaGithub: 'View GitHub',
        previewEndpointDescription: 'Fetch projects and render the reference page from your OpenAPI schema.',
        codeComment: 'Build docs with Clarify',
        codeNote: 'MDX, React, and OpenAPI share one docs runtime.',
      },
      preview: {
        gettingStarted: 'Getting started',
        guides: 'Guides',
        components: 'Components',
        apiReference: 'API Reference',
      },
      tags: {
        mdx: 'MDX-native',
        openapi: 'OpenAPI-ready',
        react: 'React-powered',
        vite: 'Vite-fast',
      },
      features: {
        eyebrow: 'Features',
        title: 'Everything needed for developer documentation.',
        description: 'Clarify keeps content authoring, API references, visual primitives, and production builds in one focused toolchain.',
        mdx: {
          title: 'MDX Native',
          description: 'Write documentation in Markdown and embed React components wherever interaction helps.',
        },
        openapi: {
          title: 'OpenAPI References',
          description: 'Generate readable API pages directly from OpenAPI specifications and keep them in sync.',
        },
        ui: {
          title: 'Composable UI',
          description: 'Build docs from reusable renderer primitives for notes, code, navigation, and API blocks.',
        },
        workflow: {
          title: 'Fast Local Workflow',
          description: 'Preview changes instantly with Vite-powered development and optimized production builds.',
        },
        typescript: {
          title: 'TypeScript-first',
          description: 'Keep configuration, route metadata, and rendering behavior explicit and type-safe.',
        },
        i18n: {
          title: 'Multilingual Ready',
          description: 'Structure localized content without splitting your documentation system apart.',
        },
      },
      workflow: {
        eyebrow: 'Workflow',
        title: 'From content to published docs in minutes.',
        write: {
          title: 'Write',
          description: 'Author pages in MDX and compose them with React-powered content blocks.',
        },
        connect: {
          title: 'Connect',
          description: 'Add navigation, locales, and OpenAPI sources through a small project config.',
        },
        publish: {
          title: 'Publish',
          description: 'Build static output that is fast to host, version, and review.',
        },
        terminal: 'terminal',
        ready: 'vite ready',
      },
      openapi: {
        eyebrow: 'OpenAPI',
        title: 'API references without the manual maintenance.',
        description: 'Import an OpenAPI document and let Clarify turn endpoints, parameters, responses, and examples into readable reference pages that match the rest of your docs.',
        ctaDocs: 'See API docs',
        ctaGuides: 'Read guides',
        parameters: 'Parameters',
        response: 'Response',
      },
      renderer: {
        eyebrow: 'Renderer',
        title: 'Designed to match your documentation runtime.',
        description: 'The marketing page follows the same visual language as @clarify/renderer: zinc surfaces, emerald accents, soft borders, code-first previews, and docs-oriented spacing.',
        note: 'Note',
        noteDescription: 'Use shared primitives for content that feels native inside your docs.',
        navigation: 'Navigation',
        codeGroup: 'CodeGroup',
      },
      iconPreview: {
        eyebrow: 'Icon drafts',
        title: 'Clarify icon preview',
        description: 'Simple green SVG concepts for a documentation publishing tool.',
        bookM: {
          name: 'Book M',
          description: 'Turns M into an open book with thicker side stems.',
        },
        boldBookM: {
          name: 'Bold Book M',
          description: 'Heavier outer spines make the M read like an open book.',
        },
        pageM: {
          name: 'Page M',
          description: 'A page silhouette carries the M for a direct docs signal.',
        },
        mLeaf: {
          name: 'M Leaf',
          description: 'Adds a green leaf accent to the book-shaped M.',
        },
        clearLeaf: {
          name: 'Clear Leaf',
          description: 'Leaf + document line, soft and organic.',
        },
        foldedDoc: {
          name: 'Folded Doc',
          description: 'Minimal document with a confident clarify mark.',
        },
        clarifyC: {
          name: 'Clarify C',
          description: 'A clean C monogram shaped by reading lines.',
        },
        sparkPage: {
          name: 'Spark Page',
          description: 'Documentation page plus a clarity spark.',
        },
        openBook: {
          name: 'Open Book',
          description: 'Tiny open docs with one highlighted clarity path.',
        },
        focusRing: {
          name: 'Focus Ring',
          description: 'A focused dot and scan line for precise docs.',
        },
        terminalLeaf: {
          name: 'Terminal Leaf',
          description: 'CLI prompt meets a small green leaf.',
        },
        docCompass: {
          name: 'Doc Compass',
          description: 'A navigation mark for structured docs.',
        },
        layeredPages: {
          name: 'Layered Pages',
          description: 'Stacked pages for generated documentation.',
        },
        mdxMark: {
          name: 'MDX Mark',
          description: 'Angle brackets and text line for MDX docs.',
        },
        apiNode: {
          name: 'API Node',
          description: 'OpenAPI node map in a compact symbol.',
        },
        lightBeam: {
          name: 'Light Beam',
          description: 'A simple clarity beam across a page.',
        },
        seedGlyph: {
          name: 'Seed Glyph',
          description: 'Small seed shape for growing documentation.',
        },
        checkPages: {
          name: 'Check Pages',
          description: 'Published docs with a clean success signal.',
        },
        routeLine: {
          name: 'Route Line',
          description: 'A clean path from source to published docs.',
        },
        bracketLeaf: {
          name: 'Bracket Leaf',
          description: 'Developer docs with a lighter natural mark.',
        },
        prismDoc: {
          name: 'Prism Doc',
          description: 'Geometric facets for content made clearer.',
        },
        flowC: {
          name: 'Flow C',
          description: 'A softer C monogram paired with reading lines.',
        },
        paperPlane: {
          name: 'Paper Plane',
          description: 'A simple mark for shipping docs quickly.',
        },
        boltPage: {
          name: 'Bolt Page',
          description: 'Highlights the fast Vite-powered docs workflow.',
        },
        searchDoc: {
          name: 'Search Doc',
          description: 'An icon for discoverable, searchable docs.',
        },
        gridLeaf: {
          name: 'Grid Leaf',
          description: 'Modular content blocks with a green brand mark.',
        },
        bookSpark: {
          name: 'Book Spark',
          description: 'A clarity spark inside open documentation.',
        },
        apiBraces: {
          name: 'API Braces',
          description: 'Code braces for developer documentation.',
        },
        clearStack: {
          name: 'Clear Stack',
          description: 'Layered content organized into a clear structure.',
        },
        orbitDoc: {
          name: 'Orbit Doc',
          description: 'Tooling and publishing flow orbiting docs.',
        },
      },
      finalCta: {
        title: 'Start publishing clearer documentation.',
        description: 'Build a docs site that grows from README to API reference without changing your stack.',
        getStarted: 'Get started',
      },
      footer: {
        license: 'AGPL-3.0-only © 2026 Taicode Labs',
        docs: 'Docs',
        api: 'API',
        github: 'GitHub',
      },
    },
  },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'clarify-www-language',
    },
  })

export function normalizeLanguage(language: string): SupportedLanguage {
  return language.toLowerCase().startsWith('en') ? 'en-US' : defaultLanguage
}

export default i18n
