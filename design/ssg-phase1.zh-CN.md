# Clarify 第一阶段 — 静态站点生成（SSG）设计

> **范围**：仅支持 MDX，每个路由输出独立 HTML 文件 + 客户端注水（hydration），Vite 7，零中间构建产物。
> **本期不做**：OpenAPI、搜索、国际化、服务端运行时。

---

## 1. 目标

| # | 需求 | 实现方式 |
|---|------|----------|
| 1 | 静态部署：每个页面有独立的 HTML 文件 | 构建时 SSR，为每条路由写入 `dist/<route>/index.html` |
| 2 | 首屏后提供流畅的客户端体验 | 注入 `<script>` 将静态标记注水（hydrate）为 React Router SPA |
| 3 | 第一期仅支持 MDX 渲染 | Vite 插件扫描 `docsRoot` 下的 `*.mdx`，通过 `@mdx-js/rollup` 编译 |
| 4 | 使用 Vite 7（稳定版），后续评估 Rolldown | 仅使用 Vite 7 公开 API，不依赖 Rolldown 专有特性 |
| 5 | 零中间构建产物 | 所有生成逻辑通过 Vite 虚拟模块在内存中完成，配合 `ssrLoadModule` 执行 |
| 6 | 通过 Vite 插件使用 Tailwind CSS | 保留用户 `vite.config.ts` 中已有的 `@tailwindcss/vite` |

---

## 2. 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│  构建阶段（vite build）                                      │
│                                                             │
│  1. Vite 打包客户端入口（main.tsx）→ dist/assets/            │
│                                                             │
│  2. clarifyPlugin buildEnd()：                              │
│       a. 扫描 docsRoot 下的 MDX 文件                         │
│       b. 构建路由清单（virtual:clarify-routes）               │
│       c. 启动临时 Vite 开发服务器                            │
│       d. ssrLoadModule('@clarify/renderer/server')          │
│       e. 为每条路由：renderToHTML(url) → 写入 HTML           │
│       f. 关闭临时服务器                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  运行时（浏览器）                                             │
│                                                             │
│  1. 浏览器接收到静态 HTML（SEO 友好）                         │
│  2. `<script>` 加载客户端打包产物                              │
│  3. hydrateRoot 在已有标记上挂载 React Router                 │
│  4. 后续跳转 → 客户端 SPA 无刷新导航                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 关键设计决策

### 3.1 两阶段构建（客户端 + SSR）无磁盘中间产物

Holocron 使用 Spiceflow（RSC 框架），需要持久化的服务端运行时。Clarify 第一阶段刻意避免服务端运行时，仅在**构建时**生成 HTML。

为了在构建时将 React 组件渲染为 HTML 字符串，我们需要服务端 `renderToString`。与输出独立 SSR bundle 到磁盘不同，我们直接利用 Vite 自身的 SSR 模块加载能力：

- **客户端产物**：正常 Vite `build()` 输出 JS/CSS 到 `dist/`。
- **SSR 执行**：在 `buildEnd` 中创建短生命周期的 Vite 服务器（或复用构建的 `ssrLoadModule` 能力），直接执行 `packages/renderer/source/server.tsx`。Vite 在内存中完成 JSX/TSX 转译。

优点：
- ✅ 磁盘上无中间 `.js` 文件
- ✅ 无需独立的 SSR 构建步骤
- ✅ 类型安全、支持 JSX 的执行环境

### 3.2 虚拟模块（受 Holocron 启发）

Holocron 大量使用虚拟模块（`virtual:holocron-config`、`virtual:holocron-navigation`、`virtual:holocron-mdx`）。Clarify 采用相同模式以保持清晰分离：

| 虚拟模块 | 用途 |
|----------|------|
| `virtual:clarify-config` | 合并后的 `clarify.json` + 插件选项，作为运行时配置暴露 |
| `virtual:clarify-routes` | 路由清单：路径 → MDX 组件导入映射 |
| `virtual:clarify-pages/*` | 逐页编译后的 MDX 内容（懒加载） |

这些模块由 `clarifyPlugin.resolveId()` 解析，由 `clarifyPlugin.load()` 生成。

### 3.3 路由发现

Holocron 从 `docs.json` 导航树中读取页面。Clarify 第一阶段采用**基于文件系统的路由**，并支持 frontmatter 覆盖：

```
docsRoot/
├── index.mdx           → /
├── getting-started.mdx → /getting-started
├── guides/
│   ├── index.mdx       → /guides
│   └── theming.mdx     → /guides/theming
```

- 路由根据相对于 `docsRoot` 的文件路径推导。
- frontmatter 中的 `slug` 可覆盖生成的路径。
- frontmatter `hidden: true` 将页面从导航中移除，但保留路由可访问。

### 3.4 HTML 模板

每个生成的 HTML 文件遵循以下结构：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{pageTitle} | {siteTitle}</title>
    <!-- Vite 在构建时注入 CSS 链接 -->
  </head>
  <body>
    <div id="root">
      <!-- SSR：renderToString 输出 -->
    </div>
    <script type="module" src="/assets/main-{hash}.js"></script>
  </body>
</html>
```

`<script>` 指向 Vite 正常构建产出的**客户端打包产物**。CSS 通过客户端入口中的 `import` 语句由 Vite 自动注入。

---

## 4. 详细构建流程

### 步骤 1：客户端打包

Vite 执行常规构建：
- 入口：`apps/docs/source/main.tsx`
- 输出：`dist/assets/main-{hash}.js`、`dist/assets/index-{hash}.css` 等
- 客户端入口导入 `virtual:clarify-routes` 并对应用进行注水。

### 步骤 2：路由清单生成

在 `clarifyPlugin.buildEnd()` 内部：

1. 扫描 `docsRoot` 下的 `**/*.mdx`。
2. 对每个文件提取 frontmatter（title、description、hidden、slug）。
3. 构建路由清单：
   ```typescript
   interface RouteManifest {
     routes: Array<{
       path: string;           // URL 路径
       slug: string;           // 唯一标识
       pageModule: string;     // virtual:clarify-pages/<slug>
       meta: { title: string; description?: string };
     }>;
   }
   ```
4. 注册虚拟模块，使 `virtual:clarify-routes` 可提供此清单。

### 步骤 3：SSR HTML 生成

仍在 `buildEnd()` 内部：

1. 以中间件模式创建临时 Vite 服务器（或复用现有插件的模块图）：
   ```typescript
   const ssrServer = await createServer({
     root: viteConfig.root,
     plugins: [clarifyPlugin], // 复用同一插件实例
     ssr: { noExternal: true },
   });
   ```
2. 加载服务端渲染器：
   ```typescript
   const { renderToHTML } = await ssrServer.ssrLoadModule(
     '@clarify/renderer/server'
   );
   ```
3. 对清单中的每条路由：
   ```typescript
   for (const route of manifest.routes) {
     const html = renderToHTML({
       config: resolvedConfig,
       routes: manifest.routes,
       url: route.path,
     });
     // 写入磁盘
     const outFile = path.join(outDir, route.path, 'index.html');
     await fs.mkdir(path.dirname(outFile), { recursive: true });
     await fs.writeFile(outFile, html, 'utf-8');
   }
   ```
4. 关闭 SSR 服务器。

> **为什么要临时服务器？** `ssrLoadModule` 自动处理 JSX/TSX 转译、别名解析和虚拟模块解析，无需预编译。

### 步骤 4：资源链接

生成的 HTML 必须引用正确的客户端打包产物路径。Vite 的构建清单（`dist/.vite/manifest.json`）将逻辑入口名映射为带哈希的文件名。

`buildEnd` 读取 `manifest.json` 以确定：
- `main.tsx` → `assets/main-abc123.js`
- `index.css` → `assets/index-def456.css`

这些路径被注入到 HTML 的 `<head>` 和 `<body>` 中。

---

## 5. 客户端注水流程

浏览器接收到完全渲染好的 HTML。客户端打包产物（通过 `<script>` 加载）执行：

```typescript
// apps/docs/source/main.tsx
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from '@clarify/renderer';
import { config, routes } from 'virtual:clarify-config';

hydrateRoot(
  document.getElementById('root')!,
  <BrowserRouter basename={config.routeBase}>
    <AppShell config={config} routes={routes} />
  </BrowserRouter>
);
```

- `AppShell` 渲染包含所有发现路由的 `<Routes>`。
- React Router 匹配当前 URL，并对已有的服务端渲染 DOM 进行注水。
- 后续链接点击触发客户端导航，无需整页刷新。

---

## 6. Renderer 职责

`packages/renderer` 已经具备正确的结构（在上次会话中发现）：

| 文件 | 角色 | 状态 |
|------|------|------|
| `App.tsx` | `AppShell` — 渲染 `<Routes>` | ✅ 已存在，导出 `AppShell` |
| `render.tsx` | 客户端注水入口（`hydrateRoot`） | ✅ 已存在 |
| `server.tsx` | SSR 入口（`StaticRouter` 的 `renderToHTML`） | ✅ 已存在 |
| `types.ts` | 共享类型（`ServerRenderOptions` 等） | ✅ 已存在 |

**第一阶段无需修改 renderer。**

---

## 7. Vite Plugin 变更

`packages/vite-plugin/source/index.ts` 需要以下新增内容：

### 7.1 新钩子

```typescript
// 已有钩子：resolveId、load（用于虚拟模块）

// 新增：configResolved — 存储解析后的路径
configResolved(resolvedConfig) {
  this.distDir = resolvedConfig.build.outDir;
  this.manifestPath = path.join(this.distDir, '.vite', 'manifest.json');
}

// 新增：buildEnd — 编排 SSG
async buildEnd() {
  if (process.env.SKIP_CLARIFY_SSG) return;

  // 1. 根据 MDX 发现生成路由清单
  const manifest = await this.generateRouteManifest();

  // 2. 创建临时 SSR 服务器
  const ssrServer = await createServer({ /* ... */ });

  // 3. 加载服务端渲染器
  const { renderToHTML } = await ssrServer.ssrLoadModule(
    path.resolve(__dirname, '../renderer/source/server.tsx')
  );

  // 4. 读取构建清单获取资源路径
  const buildManifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf-8'));

  // 5. 渲染每条路由
  for (const route of manifest.routes) {
    const appHtml = renderToHTML({ config: this.resolvedConfig, routes: manifest.routes, url: route.path });
    const html = this.wrapHtml(appHtml, { buildManifest, route });
    const outPath = path.join(this.distDir, route.path, 'index.html');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, 'utf-8');
  }

  // 6. 清理
  await ssrServer.close();
}
```

### 7.2 MDX 发现与虚拟模块

```typescript
// 在 load() 或独立方法中：
async generateRouteManifest() {
  const mdxFiles = await glob('**/*.mdx', { cwd: this.docsRoot });
  return {
    routes: mdxFiles.map(file => {
      const slug = fileToSlug(file);
      const frontmatter = parseFrontmatter(fs.readFileSync(path.join(this.docsRoot, file), 'utf-8'));
      return {
        path: frontmatter.slug ?? slugToPath(slug),
        slug,
        pageModule: `virtual:clarify-pages/${slug}`,
        meta: { title: frontmatter.title ?? 'Untitled', description: frontmatter.description },
      };
    }),
  };
}
```

### 7.3 第一阶段的 OpenAPI 处理

`virtual:clarify-openapi` 模块和 `<OpenAPI>` 组件引用已存在于设计文档中，但**不会在第一期实现**。

- 插件选项 `openApi` 被接受但发出警告：*"OpenAPI 支持计划在第二期实现。"*
- 在 MDX 中使用 `<OpenAPI>` 的作者将看到一个渲染占位消息的降级组件。
- `design/core.md` §1.2（OpenAPI 资源流）对第二期规划仍然有效。

---

## 8. 与 Holocron 的对比

| 维度 | Holocron | Clarify 第一阶段 |
|------|----------|-----------------|
| **框架** | Spiceflow（RSC） | React Router + 纯 React SSR |
| **运行时** | 需要 Node.js / Worker 服务器 | 仅静态文件（可部署到 CDN） |
| **构建输出** | `dist/` 含服务端 bundle | `dist/` 含 HTML + JS/CSS 资源 |
| **MDX 编译** | 自定义管道中的 `@mdx-js/rollup` | `@mdx-js/rollup`（相同） |
| **虚拟模块** | 大量（`holocron-*`） | 精简（`clarify-*`） |
| **配置来源** | `docs.json` / `holocron.jsonc` | `clarify.json` |
| **路由方式** | 配置驱动（`docs.json` 导航树） | 基于文件系统 + frontmatter 覆盖 |
| **注水方式** | 完整 RSC 注水 | 标准 React `hydrateRoot` |
| **插件自动注入** | React、Tailwind、Spiceflow | 仅 Tailwind（React 由用户显式配置） |
| **AI 导出** | `/llms.txt`、`/docs.zip`、`.md` 路由 | 第二期 |

**从 Holocron 吸取的经验：**
1. 虚拟模块是将构建时数据传递到运行时的优雅方式。
2. 逐页代码拆分（每页 MDX 独立 chunk）可提升缓存效率。
3. 自动注入常用插件可减少用户摩擦，但可能与用户配置冲突 — Clarify 保持 React 插件显式配置。

---

## 9. 部署模型

输出目录 `dist/` 是标准静态站点：

```
dist/
├── index.html              ← /
├── getting-started/
│   └── index.html          ← /getting-started
├── guides/
│   ├── index.html          ← /guides
│   └── theming/
│       └── index.html      ← /guides/theming
├── assets/
│   ├── main-abc123.js
│   ├── index-def456.css
│   └── ...
└── .vite/
    └── manifest.json
```

可部署到任意静态托管：Vercel、Netlify、GitHub Pages、Cloudflare Pages、AWS S3。

对于 `routeBase !== '/'`（如 GitHub Pages 项目站点），HTML `<base>` 标签和 React Router 的 `basename` 会相应设置。

---

## 10. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| `buildEnd` 中 `ssrLoadModule` 在路由过多时变慢 | 缓存转译后的模块；并行渲染多条路由 |
| MDX frontmatter 解析增加构建时间 | 使用 `gray-matter`（快速且成熟）；如需可像 Holocron 一样按 git SHA 缓存 |
| 开发 HMR 中虚拟模块失效 | 在插件中实现 `handleHotUpdate`（第一期后续迭代） |
| 客户端打包产物路径解析失败 | 可靠读取 Vite 的 `manifest.json`；回退到已知入口模式 |
| 大型站点导致临时 SSR 服务器内存压力 | 渲染完成后关闭服务器；流式写入 HTML |

---

## 11. 实现顺序

1. **虚拟模块**：在 `vite-plugin` 中实现 `virtual:clarify-config`、`virtual:clarify-routes`、`virtual:clarify-pages/*`。
2. **路由发现**：扫描 `docsRoot` 下的 `.mdx`，构建清单并通过虚拟模块暴露。
3. **Renderer 接入**：确保 `AppShell` 能消费清单格式。
4. **buildEnd SSR**：添加 `buildEnd` 钩子，包含临时服务器 + `ssrLoadModule` + HTML 生成。
5. **资源注入**：读取 `manifest.json`，将正确的 script/link 标签注入 HTML。
6. **测试**：构建 `apps/docs`，验证 `dist/` 中每条路由都有 HTML，在浏览器中验证注水效果。
7. **清理**：移除/存根 OpenAPI 引用；更新设计文档。
