# Clarify Core — 文档引擎设计

## 概述

**Clarify Core** 是 `packages/vite-plugin` 内部的引擎，负责将原始 MDX 和 OpenAPI 内容转换为可运行、可导航的文档站点。本文档描述核心子系统、各自的职责以及背后的设计决策。

---

## 1. 内容摄取流水线

引擎读取两种类型的源材料：

| 源类型 | 文件模式 | 解析工具 | 输出 |
|--------|---------|---------|------|
| MDX 页面 | `**/*.mdx` | `@mdx-js/rollup` + 自定义 frontmatter 解析器 | React 组件 + 元数据 |
| OpenAPI 规范 | `openapi.yaml` / `openapi.json` | `swagger-parser` 或 `openapi-types` | 类型安全的 API 参考数据 |

### 1.1 MDX 处理流程

```
MDX 文件 → Frontmatter 提取 → MDX 编译 → React 组件 → 路由注册
```

1. **Frontmatter 提取**：解析 YAML frontmatter 获取元数据（`title`、`description`、`nav_order`、`hidden`、`tags`）。
2. **OpenAPI 资源加载**：如果配置了 `openApi` 规范，插件会将其解析为内部模型，并以虚拟模块形式提供。
3. **MDX 编译**：使用 `@mdx-js/rollup` 将 MDX 编译为 React 组件。`<OpenAPI>` 组件在 MDX 作用域中注册，作者可以在任何位置嵌入它。
4. **组件包装**：使用 `@clarify/renderer` 的 `DocShell` 包装（提供布局、导航、目录）。
5. **路由注册**：将文件路径映射到 URL 路径（例如 `docs/getting-started.mdx` → `/getting-started`）。

### 1.2 OpenAPI 资源流程

当配置了 `openApi` 时，插件在构建时解析规范一次，并作为**虚拟模块**提供给 MDX 页面中的 `<OpenAPI>` 组件。

```
OpenAPI 规范 (yaml/json)
        │
        ▼
  模式验证
        │
        ▼
  转换为内部模型
        │
        ▼
  virtual:clarify-openapi (虚拟模块)
        │
        ▼
  MDX 页面内的 <OpenAPI path="/users/{id}" />
```

1. **模式验证**：针对 OpenAPI 3.0/3.1 进行验证。
2. **转换**：将操作扁平化为以 `operationId` 为键的 `OpenAPIResource` 模型。
3. **虚拟模块**：通过 `virtual:clarify-openapi` 暴露整个规范，使渲染器在运行时无需服务器即可访问。
4. **MDX 嵌入**：作者在任何 MDX 页面中使用 `<OpenAPI>` 组件来渲染任何操作、标签或完整规范。

---

## 2. 路由系统

### 2.1 基于文件的路由

引擎使用从文件系统派生的**约定式路由**：

```
content/
├── index.mdx           → /
├── getting-started.mdx → /getting-started
├── guides/
│   ├── installation.mdx → /guides/installation
│   └── theming.mdx      → /guides/theming
└── api/
    └── (generated)      → /api/*
```

- **索引文件**：`index.mdx` 映射到目录根路径（`/` 或 `/guides/`）。
- **动态段**：v1 不支持；仅支持扁平 + 嵌套静态路由。
- **隐藏页面**：Frontmatter 中设置 `hidden: true` 可从导航中排除，但保留路由可访问性。

### 2.2 路由清单

构建时，插件生成一个供客户端消费的**路由清单**（JSON 或内联 JS）：

```typescript
type RouteManifest = {
  routes: Array<{
    path: string;
    componentPath: string;   // 虚拟模块 ID
    meta: PageMeta;          // title、description 等
    navOrder?: number;
  }>;
  navTree: NavNode[];        // 层级侧边栏结构
};
```

此清单驱动：
- **客户端路由**（React Router 或类似方案）
- **侧边栏导航**（从 navTree 生成）
- **目录**（从 MDX 中的标题提取）

---

## 3. 渲染系统

### 3.1 页面生命周期

```mermaid
graph LR
    A[路由匹配] --> B[加载路由清单]
    B --> C[导入虚拟模块]
    C --> D[渲染 DocShell]
    D --> E[注入页面组件]
    E --> F[渲染侧边栏 + 目录]
```

### 3.2 虚拟模块

Vite 虚拟模块用于在构建时注入生成内容：

- `virtual:clarify-routes` — 导出路由清单和 `Routes` 组件。
- `virtual:clarify-api` — 以类型化 JSON 格式导出解析后的 OpenAPI 操作。
- `virtual:clarify-config` — 导出解析后的插件选项。

```typescript
// 应用内部
import { Routes } from 'virtual:clarify-routes';
import { apiOperations } from 'virtual:clarify-api';
```

### 3.3 组件映射

MDX 组件通过 `MDXProvider` 映射到 `@clarify/renderer` 原语：

| MDX 元素 | 渲染器组件 |
|----------|-----------|
| `h1`–`h6` | 带锚点 ID 的样式标题 |
| `pre > code` | `CodeBlock`（语法高亮） |
| `table` | `DataTable`（样式化、响应式） |
| `a` | `SmartLink`（内部 vs 外部路由） |
| `img` | `Image`（懒加载、标题） |
| `<OpenAPI>` | `OpenAPI`（嵌入式 API 参考，见 §1.2） |
| 自定义 JSX | 通过 `components` 选项由用户定义 |

---

## 4. 主题与样式架构

### 4.1 设计令牌

Clarify 使用**CSS 自定义属性**进行主题设置，由插件注入的全局样式表定义：

```css
:root {
  --cl-bg: #ffffff;
  --cl-bg-muted: #f8fafc;
  --cl-text: #0f172a;
  --cl-text-muted: #64748b;
  --cl-border: #e2e8f0;
  --cl-primary: #0ea5e9;
  --cl-primary-muted: #e0f2fe;
  --cl-radius: 0.75rem;
  --cl-font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --cl-font-mono: "JetBrains Mono", monospace;
}
```

### 4.2 深色模式

- 通过 `<html>` 上的 `data-theme="dark"` 切换。
- 渲染器组件使用 Tailwind CSS `dark:` 变体。
- 偏好设置持久化到 `localStorage`，并尊重 `prefers-color-scheme`。

### 4.3 自定义主题

用户可以通过插件选项覆盖令牌：

```typescript
// vite.config.ts
clarifyPlugin({
  theme: {
    primary: '#8b5cf6',
    fontSans: '"Inter", sans-serif'
  }
});
```

---

## 5. 搜索系统

### 5.1 设计目标

- **快速**：即时结果，无需服务器。
- **准确**：跨 MDX 内容和 OpenAPI 描述的全文搜索。
- **轻量**：在构建时生成搜索索引，按需加载。

### 5.2 实现策略

1. **索引生成**：在构建时，从所有 MDX 页面和 OpenAPI 操作中提取文本。构建压缩的倒排索引（例如使用 `minisearch` 或 `flexsearch`）。
2. **客户端搜索**：将索引作为 JSON 资源加载。使用轻量级搜索库完全在浏览器中执行查询。
3. **UI**：命令面板式模态框（`Cmd+K`），带分组结果（页面、API、标题）。

### 5.3 搜索索引格式

```typescript
type SearchDoc = {
  id: string;
  title: string;
  excerpt: string;
  path: string;
  category: 'page' | 'api' | 'heading';
  headings?: string[];  // 用于标题级搜索
};
```

---

## 6. 开发者体验 (DX)

### 6.1 热模块替换 (HMR)

| 变更类型 | 行为 |
|----------|------|
| MDX 内容编辑 | 完整页面 HMR，保留滚动位置 |
| Frontmatter 编辑 | 重建路由清单，更新导航/目录 |
| OpenAPI 规范编辑 | 重新生成 API 页面，更新类型定义 |
| 渲染器组件编辑 | 通过 Vite 进行组件级 HMR |
| 插件配置编辑 | 需要重启开发服务器（预期行为） |

### 6.2 错误处理

- **MDX 语法错误**：通过 Vite 的错误覆盖层显示友好的覆盖层，包含行号。
- **无效的 OpenAPI**：在控制台中显示警告 + 列出验证错误的回退页面。
- **缺少 frontmatter**：使用合理的默认值（标题取自第一个 `# 标题`，自动生成描述）。

### 6.3 构建优化

- **代码分割**：每个 MDX 页面成为独立的 chunk，以实现最佳缓存。
- **资源内联**：小图像内联为 data URI；大图像输出到 `assets/`。
- **Tree shaking**：渲染器组件支持 tree shaking（ESM 导出，无副作用）。
- **预取**：预加载导航树中的相邻路由以实现即时导航。

---

## 7. 配置 API

插件接受单个选项对象：

```typescript
type ClarifyPluginOptions = {
  /** MDX 内容的根目录。默认: 'source/content' */
  docsRoot?: string;

  /** OpenAPI 规范路径。解析一次并作为 virtual:clarify-openapi 暴露。默认: undefined */
  openApi?: string;

  /** 文档站点的 base 路径。默认: '/' */
  base?: string;

  /** 主题覆盖。默认: {} */
  theme?: Partial<ThemeTokens>;

  /** i18n 的语言。默认: ['en'] */
  locales?: string[];

  /** 要注入到 MDX 作用域的自定义组件。默认: {} */
  components?: Record<string, React.ComponentType>;

  /** 在处理前转换 frontmatter。 */
  transformFrontmatter?: (frontmatter: Record<string, unknown>, path: string) => Record<string, unknown>;
};
```

---

## 8. 插件钩子 API

Clarify 公开了一组**生命周期钩子**，允许扩展（例如翻译、搜索索引、版本控制）参与构建时的内容处理流水线。钩子通过 `vite.config.ts` 中的 `clarifyPlugin` 选项注册，而非通过原生 Vite 插件系统。

### 8.1 设计原则

| 原则 | 描述 |
|------|------|
| **优先纯函数** | 钩子接收上下文对象并返回修改后的对象，而不改变输入。 |
| **支持异步** | 所有钩子都是 `async` 的，以允许 I/O（例如读取翻译文件）。 |
| **可组合** | 多个插件按注册顺序执行，将输出从一个链接到下一个。 |
| **快速失败** | 单个钩子失败会中止构建，并显示命名违规插件的错误。 |

### 8.2 钩子定义

```typescript
export type ClarifyHookContext = {
  /** 解析后的项目配置 */
  config: ResolvedClarifyOptions;
  /** 本次构建的 Vite 配置 */
  viteConfig?: ResolvedConfig;
};

export type ClarifyPage = {
  path: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  content: string;
};

export type ClarifyHooks = {
  /**
   * 在所有 MDX 文件扫描完成后调用。
   * 允许修改页面列表（添加/删除/重新排序）、注入虚拟页面或重新排序路由。
   */
  'pages:resolved'?: (
    pages: ClarifyPage[],
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage[]> | ClarifyPage[];

  /**
   * 在单个 MDX 文件编译前调用。
   * 允许修改 frontmatter 或原始内容（例如注入翻译文本）。
   */
  'page:transform'?: (
    page: ClarifyPage,
    ctx: ClarifyHookContext
  ) => Promise<ClarifyPage> | ClarifyPage;

  /**
   * 在路由清单生成后调用。
   * 允许修改 navTree、添加重定向或注入外部链接。
   */
  'routes:resolved'?: (
    routes: RouteItem[],
    navTree: NavNode[],
    ctx: ClarifyHookContext
  ) => Promise<{ routes: RouteItem[]; navTree: NavNode[] }> | { routes: RouteItem[]; navTree: NavNode[] };

  /**
   * 在生成虚拟模块前调用。
   * 允许为 MDX 页面或渲染器注入额外的虚拟模块。
   */
  'modules:before'?: (
    modules: Map<string, string>,
    ctx: ClarifyHookContext
  ) => Promise<Map<string, string>> | Map<string, string>;

  /**
   * 在开发服务器启动 / 构建完成后调用。
   * 适合生成搜索索引或翻译映射等副作用。
   */
  'build:done'?: (ctx: ClarifyHookContext) => Promise<void> | void;
};

export type ClarifyPlugin = {
  /** 插件名称，用于错误追踪 */
  name: string;
  /** 要注册的钩子 */
  hooks: Partial<ClarifyHooks>;
};
```

### 8.3 注册

```typescript
// vite.config.ts
import { clarifyPlugin } from '@clarify/vite-plugin';
import { i18nPlugin } from '@clarify/plugin-i18n';
import { searchPlugin } from '@clarify/plugin-search';

export default defineConfig({
  plugins: [
    clarifyPlugin({
      docsRoot: 'source/content',
      plugins: [
        i18nPlugin({ defaultLocale: 'zh-CN' }),
        searchPlugin(),
      ],
    }),
  ],
});
```

### 8.4 示例：文档翻译插件

```typescript
// @clarify/plugin-i18n
export function i18nPlugin(options: { defaultLocale: string }): ClarifyPlugin {
  return {
    name: 'clarify:i18n',
    hooks: {
      async 'pages:resolved'(pages, ctx) {
        // 为每个页面生成本地化副本
        const translated: ClarifyPage[] = [];
        for (const page of pages) {
          const locale = page.frontmatter.locale ?? options.defaultLocale;
          const t = await loadTranslations(locale, page.filePath);
          translated.push({
            ...page,
            path: `/${locale}${page.path}`,
            content: applyTranslations(page.content, t),
          });
        }
        return [...pages, ...translated];
      },
    },
  };
}
```

### 8.5 示例：搜索索引插件

```typescript
// @clarify/plugin-search
export function searchPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:search',
    hooks: {
      async 'build:done'(ctx) {
        const index = await buildSearchIndex(ctx.config.docRoot);
        await writeFile('dist/search-index.json', JSON.stringify(index));
      },
    },
  };
}
```

---

## 9. 未来路线图

| 功能 | 优先级 | 备注 |
|------|--------|------|
| 全文搜索 | 高 | 构建时索引 + 客户端搜索 |
| 版本化文档 | 高 | 多文档版本，切换器 UI |
| i18n (i18next) | 中 | 多语言内容，区域切换器 |
| 插件 API | 中 | 第三方自定义内容类型插件 |
| React 服务器组件 | 低 | 为静态生成阶段调研 |
| AI 驱动搜索 | 低 | 大型文档的可选增强 |

---

## 9. 依赖与集成点

### 运行时依赖

| 包 | 用途 |
|---------|------|
| `vite` | 插件 API、开发服务器、构建流水线 |
| `@mdx-js/rollup` | MDX 编译 |
| `react` / `react-dom` | UI 框架 |
| `react-router-dom` | 客户端路由（或 TanStack Router） |

### 构建时依赖

| 包 | 用途 |
|---------|------|
| `gray-matter` | Frontmatter 解析 |
| `swagger-parser` | OpenAPI 验证 |
| `minisearch` / `flexsearch` | 搜索索引生成 |
| `tsup` | 包构建 |

### Peer 依赖

| 包 | 备注 |
|---------|------|
| `react` | ^19.0.0（渲染器仅支持 React） |
| `vite` | ^7.0.0（插件需要 Vite） |
