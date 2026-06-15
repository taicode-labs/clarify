# Clarify Renderer — 渲染架构

## 概述

**Renderer** 是 Clarify 的客户端运行时。它消费 `@clarify/vite-plugin` 生成的已处理内容（路由、MDX 组件、API 数据），并将其渲染为交互式文档站点。

## 渲染理念

- **客户端优先 SPA**：作为 Vite 驱动的单页应用程序运行。无 SSR 水合复杂度。
- **静态构建时数据**：插件在构建时生成路由清单并预编译 MDX 页面。渲染器在运行时消费这些静态产物。
- **组件驱动 UI**：每个 MDX 元素都映射到 `@clarify/renderer` 原语。整个视觉层可组合且可主题化。
- **零运行时配置**：所有配置在构建时解析并烘焙到虚拟模块中。无运行时配置解析。

---

## 1. 运行时架构

### 1.1 入口

```tsx
// apps/docs/source/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClarifyProvider } from '@clarify/renderer';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClarifyProvider>
        <App />
      </ClarifyProvider>
    </BrowserRouter>
  </StrictMode>
);
```

### 1.2 应用壳

```tsx
// apps/docs/source/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Layout, MDXProvider } from '@clarify/renderer';
import { routes } from 'virtual:clarify-routes';

export default function App() {
  return (
    <Layout>
      <MDXProvider>
        <Routes>
          {routes.map(route => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Routes>
      </MDXProvider>
    </Layout>
  );
}
```

### 1.3 布局组件

`Layout` 是 `@clarify/renderer` 提供的顶级壳：

```tsx
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="clarify-layout">
      <Header />
      <div className="clarify-body">
        <Sidebar />
        <main className="clarify-main">{children}</main>
        <TableOfContents />
      </div>
    </div>
  );
}
```

**布局区域**：
| 区域 | 职责 | 固定? |
|------|------|--------|
| `Header` | Logo、搜索触发器、主题切换、版本切换器 | 是（顶部） |
| `Sidebar` | 来自 `navTree` 的层级导航树 | 是（左侧） |
| `Main` | 渲染的页面内容（MDX 或 API 页面） | 可滚动 |
| `ToC` | 当前页面的标题锚点 | 是（右侧，仅桌面端） |

---

## 2. 虚拟模块系统

渲染器依赖构建时由插件生成的**虚拟模块**。它们是插件和渲染器之间唯一的桥梁。

### 2.1 `virtual:clarify-routes`

路由清单和导航树。

```typescript
export interface RouteManifest {
  routes: Array<{
    path: string;
    component: React.ComponentType;
    meta: PageMeta;
  }>;
  navTree: NavNode[];
}

export const routes: RouteManifest['routes'];
export const navTree: RouteManifest['navTree'];
```

### 2.2 `virtual:clarify-api`

API 参考页面的解析 OpenAPI 数据。

```typescript
export interface ApiManifest {
  operations: ApiOperation[];
  tags: ApiTag[];
  spec: OpenAPIObject;
}

export const apiOperations: ApiOperation[];
export const apiTags: ApiTag[];
export const apiSpec: OpenAPIObject;
```

### 2.3 `virtual:clarify-config`

解析后的插件选项（主题令牌、base 路径等）。

```typescript
export const config: ResolvedClarifyOptions;
```

### 2.4 `virtual:clarify-page/*`

每个 MDX 页面是一个独立的虚拟模块：

```typescript
// virtual:clarify-page/getting-started
export { default } from '/absolute/path/to/content/getting-started.mdx';
export const meta: PageMeta;
```

---

## 3. 组件映射 (MDXProvider)

MDX 组件通过 `@mdx-js/react` 的 `MDXProvider` 映射到 `@clarify/renderer` 原语：

| MDX 元素 | 渲染器组件 | 用途 |
|----------|-----------|---------|
| `h1`–`h6` | `Heading` | 带自动生成锚点 ID 的样式标题 |
| `p` | `Paragraph` | 具有适当间距和最大宽度的排版 |
| `pre > code` | `CodeBlock` | 语法高亮 + 复制按钮 + 语言标签 |
| `code`（内联） | `InlineCode` | 样式化内联代码片段 |
| `table` | `DataTable` | 响应式、样式化表格，带水平滚动 |
| `a` | `SmartLink` | 内部路由（客户端）vs 外部（新标签页） |
| `img` | `Image` | 懒加载、响应式尺寸、标题支持 |
| `blockquote` | `Callout` | 样式化提示框（信息、警告、危险、提示） |
| `hr` | `Divider` | 主题分隔线 |
| `<OpenAPI>` | `OpenAPI` | 嵌入式 API 参考（见 §7） |
| 自定义 JSX | 用户定义 | 通过插件 `components` 选项注册 |

### 3.1 CodeBlock 架构

```tsx
interface CodeBlockProps {
  children: string;
  className?: string; // language-xxx
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const language = className?.replace('language-', '') || 'text';
  return (
    <div className="clarify-codeblock">
      <div className="clarify-codeblock-header">
        <span className="clarify-codeblock-lang">{language}</span>
        <CopyButton text={children} />
      </div>
      <pre className="clarify-codeblock-pre">
        <code>{children}</code>
      </pre>
    </div>
  );
}
```

**语法高亮策略**：构建时通过 Shiki（零运行时成本的首选）或运行时通过 PrismJS（动态内容的回退）。

### 3.2 SmartLink

区分内部与外部链接：

```tsx
function SmartLink({ href, children }: LinkProps) {
  const isExternal = href?.startsWith('http') || href?.startsWith('//');
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link to={href}>{children}</Link>;
}
```

---

## 4. 导航系统

### 4.1 侧边栏

从路由清单中的 `navTree` 生成：

```tsx
function Sidebar() {
  const { navTree } = useClarifyRoutes();
  const currentPath = useLocation().pathname;

  return (
    <nav className="clarify-sidebar" aria-label="Documentation navigation">
      <div className="clarify-sidebar-header">
        <SearchTrigger />
      </div>
      <NavTree nodes={navTree} currentPath={currentPath} />
    </nav>
  );
}
```

### 4.2 NavTree

带激活状态和展开/折叠的递归组件：

```tsx
interface NavNode {
  title: string;
  path: string;
  children?: NavNode[];
  navOrder?: number;
}

function NavTree({ nodes, currentPath, depth = 0 }: NavTreeProps) {
  return (
    <ul className={depth === 0 ? 'clarify-nav-root' : 'clarify-nav-nested'}>
      {nodes.map(node => (
        <li key={node.path} className={isActive(node.path, currentPath) ? 'active' : ''}>
          <NavLink to={node.path}>{node.title}</NavLink>
          {node.children && <NavTree nodes={node.children} currentPath={currentPath} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}
```

### 4.3 目录 (ToC)

使用 `IntersectionObserver` 从当前页面中的标题元素提取，用于滚动监听：

```tsx
function TableOfContents() {
  const headings = usePageHeadings(); // 从 DOM 提取 h2、h3
  const activeId = useActiveHeading(headings); // 交叉观察器

  return (
    <nav className="clarify-toc" aria-label="Table of contents">
      <p className="clarify-toc-title">On this page</p>
      {headings.map(h => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`clarify-toc-link toc-${h.level} ${activeId === h.id ? 'active' : ''}`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
```

---

## 5. 状态管理

Clarify 使用 **React Context** 进行轻量级全局状态。无需外部状态库。

### 5.1 Contexts

| Context | 提供者 | 数据 | 消费者 |
|---------|-------------|------|-----------|
| `RouteManifestContext` | `ClarifyProvider` | `routes`、`navTree` | App、Sidebar、Search |
| `ThemeContext` | `ClarifyProvider` | `theme`、`toggleTheme` | 所有组件、Layout |
| `SearchContext` | `ClarifyProvider` | `isOpen`、`query`、`results`、`open`、`close` | SearchTrigger、SearchModal |
| `PageContext` | `PageShell` | `meta`、`headings` | ToC、PageShell、SEO meta |

### 5.2 ClarifyProvider

组合所有 Context 的单一提供者：

```tsx
function ClarifyProvider({ children }: { children: React.ReactNode }) {
  return (
    <RouteManifestProvider>
      <ThemeProvider>
        <SearchProvider>
          {children}
        </SearchProvider>
      </ThemeProvider>
    </RouteManifestProvider>
  );
}
```

### 5.3 ThemeContext

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('clarify-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clarify-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## 6. 搜索系统

### 6.1 设计目标

- **快速**：即时结果，无需服务器往返。
- **准确**：跨 MDX 内容、标题和 OpenAPI 描述的全文搜索。
- **轻量**：搜索索引是在构建时生成的压缩 JSON 资源。

### 6.2 架构

```
构建时: 从所有 MDX + API 文档提取文本 → 构建倒排索引 (miniSearch) → 输出 /search-index.json
运行时:   按需加载索引 → 在浏览器中执行查询 → 在模态框中渲染结果
```

### 6.3 SearchModal

由 `Cmd+K` 触发的命令面板式 UI：

```tsx
function SearchModal() {
  const { isOpen, close } = useSearch();
  const [query, setQuery] = useState('');
  const index = useSearchIndex(); // 懒加载 /search-index.json
  const results = useMemo(() => index?.search(query) ?? [], [query, index]);

  if (!isOpen) return null;

  return (
    <Modal onClose={close}>
      <input
        autoFocus
        placeholder="Search documentation..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <SearchResults results={results} onSelect={close} />
    </Modal>
  );
}
```

### 6.4 搜索索引格式

```typescript
interface SearchDoc {
  id: string;
  title: string;
  excerpt: string;
  path: string;
  category: 'page' | 'api' | 'heading';
}
```

---

## 7. OpenAPI 渲染（嵌入式）

### 7.1 理念：OpenAPI 作为一等公民

OpenAPI **不是**独立的路由系统。它是一个嵌入式组件（`<OpenAPI>`），在任何 MDX 页面中都可用。作者决定 API 参考在其文档流程中出现的位置和方式。

### 7.2 `<OpenAPI>` 组件

```tsx
import { OpenAPI } from '@clarify/renderer';

// 在任何 MDX 页面中：

// 渲染单个操作
<OpenAPI operationId="getUser" />

// 渲染标签下的所有操作
<OpenAPI tag="Users" />

// 渲染完整规范（概览页面）
<OpenAPI />
```

#### Props

```typescript
interface OpenAPIProps {
  /** 按 operationId 渲染特定操作 */
  operationId?: string;

  /** 渲染标签下的所有操作 */
  tag?: string;

  /** 为 true 时，渲染完整规范概览 */
  full?: boolean;

  /** 自定义标题覆盖 */
  title?: string;

  /** 隐藏方法/路径徽章 */
  hideEndpoint?: boolean;

  /** 默认折叠请求/响应部分 */
  collapsed?: boolean;
}
```

### 7.3 数据流

```
vite-plugin (构建时)
  │
  ├─ 解析 openapi.yaml → OpenAPIResource 模型
  │
  └─ 输出 virtual:clarify-openapi
        │
        ▼
@clarify/renderer (运行时)
  │
  ├─ 从 virtual:clarify-openapi 导入规范
  │
  └─ <OpenAPI operationId="..."> → 查找操作 → 渲染
```

### 7.4 OpenAPI 组件集

| 组件 | 用途 | 使用者 |
|-----------|---------|---------|
| `OpenAPI` | 主容器，处理 props 分发 | `<OpenAPI />` |
| `ApiEndpointCard` | 方法徽章 + 路径 + 描述 | `OpenAPI`（单个操作） |
| `ParametersTable` | 查询/路径/头部参数 | `ApiEndpointCard` |
| `RequestBodySection` | 请求体的模式 + 示例 | `ApiEndpointCard` |
| `ResponsesSection` | 状态码 + 响应模式 | `ApiEndpointCard` |
| `SchemaViewer` | 递归 JSON 模式渲染 | `RequestBodySection`、`ResponsesSection` |
| `CodeExample` | Curl + 语言 SDK 示例 | `ApiEndpointCard` |
| `TagGroup` | 渲染标签下的所有操作 | `OpenAPI`（标签模式） |
| `SpecOverview` | 完整规范摘要（标签、版本、服务器） | `OpenAPI`（完整模式） |

### 7.5 MDX 中的使用示例

```mdx
---
title: User API Guide
---

# User API Guide

## Authentication

All user endpoints require a Bearer token.

## Get User by ID

<OpenAPI operationId="getUser" />

## List All Users

<OpenAPI operationId="listUsers" collapsed />

## User Management Overview

For a complete reference, see all user endpoints:

<OpenAPI tag="Users" />
```

### 7.6 搜索集成

OpenAPI 操作与 MDX 内容一起索引。API 操作的搜索结果直接链接到嵌入 `<OpenAPI>` 组件的 MDX 页面 + 锚点。

```typescript
interface SearchDoc {
  id: string;
  title: string;
  excerpt: string;
  path: string;          // 例如，"/user-guide#get-user-by-id"
  category: 'page' | 'api' | 'heading';
}
```

---

## 8. 性能优化

### 8.1 代码分割

每个 MDX 页面通过动态导入成为独立的 chunk：

```tsx
const GettingStartedPage = lazy(() => import('virtual:clarify-page/getting-started'));
```

### 8.2 预取

导航树中的相邻路由在悬停/聚焦时预取：

```tsx
function NavLink({ to, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      onMouseEnter={() => prefetchRoute(to)}
      onFocus={() => prefetchRoute(to)}
    >
      {children}
    </Link>
  );
}
```

### 8.3 资源优化

| 资源类型 | 策略 |
|------------|----------|
| 图像 | `<img loading="lazy" />`；小图像内联为 data URI |
| 字体 | 关键字体使用 `<link rel="preload" />` |
| CSS | Tailwind CSS v4 配合 `@tailwindcss/vite` 实现最小 CSS 输出 |
| 搜索索引 | 压缩 JSON，仅在首次搜索触发时加载 |

### 8.4 React 优化

- 纯渲染器组件使用 `React.memo`（Heading、CodeBlock 等）。
- 昂贵计算使用 `useMemo`（导航树过滤、目录提取）。
- 传递给子组件的事件处理程序使用 `useCallback`。

---

## 9. 样式架构

### 9.1 设计令牌 (CSS 自定义属性)

```css
:root {
  --cl-bg: #ffffff;
  --cl-bg-elevated: #ffffff;
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

[data-theme="dark"] {
  --cl-bg: #0f172a;
  --cl-bg-elevated: #1e293b;
  --cl-bg-muted: #1e293b;
  --cl-text: #f8fafc;
  --cl-text-muted: #94a3b8;
  --cl-border: #334155;
  --cl-primary: #38bdf8;
  --cl-primary-muted: #0c4a6e;
}
```

### 9.2 Tailwind CSS 集成

渲染器组件使用 Tailwind 工具类 + CSS 变量：

```tsx
function Heading({ level, children, id }: HeadingProps) {
  const sizeClass = {
    1: 'text-4xl font-bold tracking-tight',
    2: 'text-3xl font-semibold tracking-tight',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-medium',
    5: 'text-lg font-medium',
    6: 'text-base font-medium',
  }[level];

  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={`${sizeClass} text-[var(--cl-text)] scroll-mt-24`}>
      {children}
      <a href={`#${id}`} className="anchor" aria-hidden="true">#</a>
    </Tag>
  );
}
```

---

## 10. 错误处理

### 10.1 错误边界

```tsx
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="clarify-error">
          <h2>Failed to render this page</h2>
          <p>Try refreshing the page or navigating back.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 10.2 404 页面

```tsx
function NotFoundPage() {
  return (
    <DocShell title="Page Not Found">
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go to homepage</Link>
    </DocShell>
  );
}
```

---

## 11. 依赖

### 运行时依赖

| 包 | 用途 | 类型 |
|---------|---------|------|
| `react` | UI 框架 | peer |
| `react-dom` | DOM 渲染器 | peer |
| `react-router-dom` | 客户端路由 | dependency |
| `@mdx-js/react` | MDX 组件提供者 | dependency |

### 构建时依赖（插件端）

| 包 | 用途 |
|---------|---------|
| `vite` | 插件 API、虚拟模块、构建流水线 |
| `@mdx-js/rollup` | MDX 编译 |
| `gray-matter` | Frontmatter 解析 |
| `shiki` | 语法高亮（构建时） |

---

## 12. 未来考虑

| 功能 | 方案 | 优先级 |
|---------|----------|----------|
| SSR / SSG | React 19 服务器组件用于静态生成 | 中 |
| React Native 渲染器 | 独立的 `@clarify/renderer-native` 包 | 低 |
| 插件 API | 通过 `components` 选项注册第三方组件 | 中 |
| 版本化文档 | 路由前缀（`/v1/`、`/v2/`）+ 版本切换器 | 高 |
| AI 可读文档 | 自动生成 `/llms.txt` 和结构化 markdown 导出 | 中 |
