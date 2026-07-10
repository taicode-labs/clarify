# Clarify CLI Core 架构设计

> 版本：v1.0-draft  
> 目标：让 core 成为独立、可测试、可扩展的核心工作流引擎，Vite 只是承接模块图、Dev Server 与产物写入的宿主运行时。

---

## 1. 核心原则

```
Core owns the workflow.
Plugins own the features.
Adapters bridge host runtimes.
```

- **Core** 定义项目的生命周期、阶段调度、状态管理和插件编排。
- **Plugins** 通过 Hooks 扩展功能，所有功能都应该基于 Core 的 Hook 机制实现。
- **Adapters / Bridges**（如 Vite bridge）负责把宿主运行时的生命周期事件转交给 Core，并把 Core 生成的虚拟模块、资源和刷新信号接入宿主。

---

## 2. 职责边界

### 2.1 Core 的职责（必须有）

| 职责 | 说明 |
|------|------|
| 配置加载与校验 | 发现、加载、校验 `clarify.ts/js/json`，合并默认值。 |
| 项目上下文管理 | 维护 `projectRoot`、`contentRoot`、`config`、`routes`、`navigation` 等核心状态。 |
| 插件生命周期 | 加载内置插件 + 用户插件，按优先级排序，执行 Hooks。 |
| 阶段调度 | 定义 `build` / `dev` 的完整阶段流水线，控制执行顺序。 |
| 路由发现 | 扫描内容目录，生成 `ContentRoute[]`，处理 i18n、fallback、alias。 |
| 虚拟模块管理 | 生成 `virtual:clarify/*` 模块的内容，但不负责 Vite 的 resolve/load。 |
| 状态读写 API | 提供安全的上下文状态读写，支持插件间共享数据。 |

### 2.2 Core 不负责的事情（必须避免）

| 职责 | 当前问题 | 正确归属 |
|------|----------|----------|
| MDX 编译 | 不应在 core 中编译 MDX。 | `renderer/server` |
| Shiki 高亮 | 不应在 core 中执行代码高亮。 | `renderer/server` |
| React 组件生成 | 不应在 core 中构造页面组件。 | `renderer/server` |
| Vite 生命周期实现 | 不应把核心状态和阶段决策耦合在 Vite 插件中。 | Vite bridge 调用 `core/engine` |
| Chunk 路径推导 | 不应猜测打包产物的最终路径。 | Vite / Bundler |
| HMR 模块图传播 | 不应由 Core 直接维护宿主模块图。 | Vite bridge / Vite module graph |

### 2.3 与 Renderer 的分工

参考 [renderer-pipeline.md](../../renderer-pipeline.md) 的"包边界"定义：

```
CLI / Core          Renderer
─────────────────    ─────────────────────
发现文件              编译 route module
加载配置              生成 heading slug
执行插件              执行 Shiki 高亮
管理 Vite             生成 OpenAPI 页面
注册虚拟模块          SSR HTML 渲染
HMR 失效              产出 renderer manifest
写入输出目录
```

Core 只负责"编排"，Renderer 只负责"渲染"。

---

## 3. 核心工作流

### 3.1 Build 工作流

> CLI 入口：`build.ts` 创建 Engine，调用 `engine.prepare(env)` 统一执行 Phase 1-5（initialize + discoverSite + buildModules + logStartupHints），然后把 prepared Engine 交给 `createViteConfig` 驱动 Vite 构建。Adapter 不参与初始化。

```
build(options)
  │
  ├─ Phase 1: 初始化
  │   ├─ hook: before:config:load
  │   ├─ loadConfig()          → 加载 clarify.ts/js/json
  │   ├─ hook: after:config:load
  │   ├─ hook: before:config:resolve
  │   ├─ validateConfig()      → Zod 校验
  │   ├─ resolveConfig()       → 合并默认值
  │   └─ hook: after:config:resolve
  │
  ├─ Phase 2: 插件
  │   ├─ loadPlugins()         → 内置插件 + 用户插件
  │   ├─ hook: before:plugins:load
  │   ├─ hook: after:plugins:load
  │   └─ sortPlugins()         → 按 enforce / priority / dependsOn 排序
  │
  ├─ Phase 3: 站点发现（Site Discovery）
  │   ├─ hook: before:site:discover
  │   ├─ Engine 直接扫描内容目录（含 i18n/fallback/bare alias），通过 ctx.plugins 自建 content processor，触发 content:transform
  │   ├─ hook: routes:discover -> 用户插件可扩展发现的路由
  │   ├─ hook: routes:discovered -> openapi 插件读取 OpenAPI spec（同样触发 content:transform）
  │   └─ hook: after:site:discover
  │
  ├─ Phase 4: 内容处理
  │   ├─ hook: before:content:process
  │   ├─ hook: pages:resolved  -> 页面级 frontmatter/content 回写到 routes
  │   └─ hook: after:content:process
  │
  ├─ 路由收尾（content:process 之后）
  │   └─ hook: routes:resolved -> navigation 插件构建导航树 + applyConfiguredPageRoutePaths
  │
  ├─ Phase 5: 模块构建
  │   ├─ hook: before:modules:build
  │   ├─ buildVirtualModules() → 生成 virtual:clarify/* 代码
  │   ├─ hook: modules:before
  │   └─ hook: after:modules:build
  │
  ├─ Phase 6: 构建执行（Host Build Phase）
  │   ├─ hook: build:shouldRun → 可跳过 Core 管理的 build 子流程
  │   ├─ hook: before:build
  │   ├─ vite.build()          → Vite 执行模块图构建，Core 不接管 bundler
  │   ├─ hook: build:assets    → 插件产出静态资源
  │   └─ hook: after:build
  │
  ├─ Phase 7: 静态生成（SSG Phase）
  │   ├─ hook: before:ssg
  │   ├─ renderSSG()           → SSR Bundle + 渲染 HTML
  │   ├─ writeOutput()         → 写入输出目录
  │   └─ hook: after:ssg
  │
  └─ Phase 8: 完成
      ├─ hook: build:done
      └─ cleanup()
```

### 3.2 Dev 工作流

```
dev(options)
  │
  ├─ Phase 1-5: 同 Build（初始化 → 模块构建）
  │
  ├─ Phase 6: 开发服务器
  │   ├─ vite.createServer()   → Vite 启动 dev server
  │   ├─ setupWatcher()        → 监听内容目录和配置文件
  │   ├─ hook: dev:configureServer(server, ctx)
  │   └─ setupHMR()            → 路由变更时刷新
  │
  └─ Phase 7: 运行中
      └─ onFileChange() → 重新执行 Phase 3-5 → 通知 Builder 更新
```

### 3.3 阶段（Phase）定义

每个 Phase 都有统一的生命周期：

```ts
type PhaseName =
  // 初始化
  | 'config:load' | 'config:resolve'
  // 插件
  | 'plugins:load'
  // 站点发现
  | 'site:discover'
  // 内容处理
  | 'content:process'
  // 模块构建
  | 'modules:build'
  // 构建执行
  | 'build'
  // 静态生成
  | 'ssg'
  // 开发
  | 'dev:server'

// 每个 Phase 自动触发前缀 Tap hook：
//   before:<phase>  -> task()  -> after:<phase>
type TapPhaseName = `before:${PhaseName}` | `after:${PhaseName}`
```

`build:done` 是独立的 Tap hook（不属于任何 Phase，在构建完成后由 Engine 直接触发）。

阶段边界必须包含该阶段声明的业务 Pipeline hook：`routes:discovered` 属于 `site:discover` phase，必须在 `after:site:discover` 之前完成。`build:done` 必须在 `after:ssg` 之后触发，确保依赖最终输出目录的插件（如搜索索引）看到完整 SSG 结果。

---

## 4. 插件机制

### 4.1 Hook 类型

Core 提供三种 Hook 执行模式：

| 类型 | 函数签名 | 用途 |
|------|----------|------|
| **Pipeline** | `(input, ctx) => output` | 管道式，前一个插件的输出作为下一个插件的输入。用于修改数据。 |
| **Tap** | `(ctx) => void` | 事件式，只接收通知，不修改数据。用于监听和触发副作用。 |
| **Intercept** | `(ctx) => boolean \| Promise<boolean>` | 拦截式，返回 `false` 可阻止后续执行。用于权限检查、条件跳过。 |

少数 Hook 需要宿主对象参与，例如 `dev:configureServer(server, ctx)`。这类 Hook 仍归插件系统管理，但它们不改变 Core 对阶段和状态的所有权。

### 4.2 Hook 清单

```ts
type ClarifyHooks = {
  // ── Pipeline Hooks ──
  'content:transform'?: PipelineHook<ClarifyContentTransformInput>
  'pages:resolved'?: PipelineHook<ClarifyPage[]>
  'routes:discover'?: PipelineHook<ClarifyRouteDiscoveryInput>
  'routes:discovered'?: PipelineHook<ContentRoute[]>
  'routes:resolved'?: PipelineHook<{ routes: ContentRoute[]; navigation: NavigationTree }>
  'modules:before'?: PipelineHook<Map<string, string>>
  'html:transform'?: PipelineHook<ClarifyHtmlTransformInput>

  // ── Collector Hooks ──
  'build:assets'?: CollectorHook<ClarifyEmitAsset[]>

  // ── Tap Hooks ──
  'before:site:discover'?: TapHook
  'after:site:discover'?: TapHook
  'before:content:process'?: TapHook
  'after:content:process'?: TapHook
  'before:modules:build'?: TapHook
  'after:modules:build'?: TapHook
  'before:build'?: TapHook
  'after:build'?: TapHook
  'before:ssg'?: TapHook
  'after:ssg'?: TapHook
  'before:dev:server'?: TapHook
  'after:dev:server'?: TapHook
  'build:done'?: TapHook
  'dev:configureServer'?: (server: ViteDevServer, ctx: ClarifyContext) => void | Promise<void>

  // ── Intercept Hooks ──
  'build:shouldRun'?: InterceptHook
  'ssg:shouldRun'?: InterceptHook
}
```

### 4.3 内置插件

内置插件通过 `createBuiltinPlugins()` 注册，按固定顺序执行。顺序定义了依赖关系：

```
1. clarify:variables      → 变量替换（必须在 openapi 之前）
2. clarify:openapi        → OpenAPI 文档生成
3. clarify:source-links   → "编辑此页"链接
4. clarify:content-artifacts → 内容产物处理
5. clarify:seo            → SEO 增强
6. clarify:search-index   → 搜索索引（Pagefind，必须在内容最终确定后）
7. clarify:html-shell     → HTML 外壳注入（可通过配置关闭）
```

插件集合通过 `core/plugin/manager.ts` 统一加载。manager 负责合并内置插件和用户插件、按 `enforce` / `priority` / `dependsOn` 稳定排序，并在初始化和 Site Discovery 路径中触发 `plugins:load` phase。`config:*` phase 只能由初始化前已知的插件监听，例如直接通过 build options 传入的插件；配置文件内声明的插件会在配置加载完成后进入后续 phase。

### 4.4 Slot 机制（UI 扩展）

插件可通过 `slots` 向渲染器注入 UI 组件：

```ts
type ClarifyPlugin = {
  name: string
  hooks?: Partial<ClarifyHooks>
  slots?: UISlotRegistration[]
}

type UISlotRegistration = {
  name: string
  component: string  // 绝对路径，/ 开头
}
```

- `.replace` 后缀表示替换默认组件。
- 多个插件注册同一 replace slot 时发出警告。
- Slot 组件在 `virtual:clarify/slots` 模块中懒加载注册。

---

## 5. 状态管理

### 5.1 Context 设计

Core 使用统一的 `ClarifyContext` 管理状态，替代目前分散的 `ClarifyProjectContext` + `ClarifyHookContext`。

```ts
class ClarifyContext {
  // ── 受控更新属性（初始化后只能由 Engine 更新）──
  projectRoot: string
  contentRoot: string
  projectConfig: ResolvedProjectConfig
  buildOptions: ResolvedBuildOptions
  version: string

  // ── 可变状态（通过 API 安全读写）──
  private _state: Map<string, unknown>

  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  has(key: string): boolean
  delete(key: string): boolean

  // ── 核心对象（setter 触发更新通知）──
  get routes(): ContentRoute[]
  set routes(routes: ContentRoute[])

  get navigation(): NavigationTree
  set navigation(navigation: NavigationTree)

  get plugins(): ClarifyPlugin[]
  set plugins(plugins: ClarifyPlugin[])

  updateProjectState(update: ProjectStateUpdate): void

  // ── 派生属性 ──
  get isI18n(): boolean
  get defaultLocale(): string | undefined
}
```

### 5.2 状态更新通知

当核心对象（routes、navigation）被修改时，Context 自动通知注册的监听器：

```ts
ctx.onRoutesChange(() => {
  // 重新构建虚拟模块
})
```

这在 Dev 模式下用于自动触发 HMR 刷新。Adapter 不应在同一次 `engine.refresh()` 后再手动发送第二次 full reload；routes/navigation 的 Context 通知是路由状态变更的唯一刷新来源。

---

## 6. 模块边界

### 6.1 模块类型

| 模块类型 | 例子 | 进入 Vite client | 进入 Vite server | 说明 |
|----------|------|------------------|------------------|------|
| 用户源码 | 页面、slot 组件、theme | ✅ | ✅ | 用户项目源码 |
| Core 虚拟模块 | `virtual:clarify/*` | ✅ | 部分 | Core 生成，Vite 执行 |
| Route 虚拟模块 | `virtual:clarify/route/*` | ✅ | ✅ | renderer/server 编译后的浏览器安全模块 |
| Renderer client | `@clarify-labs/renderer/client` | ✅ | ✅ | browser-safe，可 hydrate |
| Renderer server | `@clarify-labs/renderer/server` | ❌ | ✅ | Node-only，不能进入浏览器 |
| Core 编排模块 | config、扫描、插件 | ❌ | ❌ | CLI 进程本身，不进入 Vite graph |
| 构建产物 | manifest、HTML、Pagefind | ❌ | ❌ | 输出产物，不反向 import |

### 6.2 禁止的 import 方向

```
❌ route virtual modules -> renderer/server
❌ renderer/client -> renderer/server
❌ browser project source -> renderer/server
❌ Vite graph -> Core orchestration
❌ build artifacts -> runtime modules
```

### 6.3 最小可执行规则

```
1. Core only orchestrates; it never becomes a Vite runtime module.
2. renderer/server is Node-only; it never appears in client imports.
3. route virtual modules are the only compile-to-runtime bridge.
4. route virtual modules may import renderer/client, but never renderer/server.
5. Vite manifests own final asset resolution; Core owns route semantics only.
```

---

## 7. Vite Bridge / Adapter 设计

### 7.1 职责

Bridge 负责把 Vite 生命周期转接到 Core Engine。它不是第二套构建编排器，也不重新定义 build/dev 的阶段。以 Vite bridge 为例：

**初始化职责在 CLI 层，不在 adapter。** CLI 命令（`build.ts` / `dev.ts`）创建 Engine 并调用 `engine.prepare(env)`（= initialize + discoverSite + buildModules + logStartupHints），然后把已 prepared 的 Engine 传给 `createViteConfig` / adapter。Adapter 的 `config` hook 只贡献从 prepared engine 派生的 Vite 配置（base / outDir / manifest），不调用 `initialize` / `discoverSite`。

`build:shouldRun` 只拦截 Core 管理的 build 子流程，例如 virtual modules、插件 assets、SSG、`build:done`。Vite 本身仍是 host runtime，adapter 不尝试阻止宿主的 Rollup/Vite 生命周期。

| Core 抽象 | ViteAdapter 实现 |
|-----------|------------------|
| `engine.prepare()` | CLI 层调用（adapter 之前），adapter 不参与 |
| `engine.beginBuild()` | Vite `buildStart` 时调用，并执行 `build:shouldRun` / `before:build` |
| `engine.buildModules()` | CLI `prepare()` 阶段调用（adapter 之前） |
| `engine.collectBuildAssets()` | Rollup `generateBundle` 中 `emitFile` |
| `engine.endBuild()` | Rollup `generateBundle` 后调用 `after:build` |
| `engine.runSSG()` | Vite `closeBundle` 后调用 |
| 虚拟模块注册 | Vite 插件的 `resolveId` + `load` |
| HMR 失效 | Vite 的 `moduleGraph.invalidateModule` |
| HTML 转换 | Vite 的 `transformIndexHtml` 委托 `engine.transformHtml()` |
| Dev server 扩展 | Vite `configureServer` + `before:dev:server` / `dev:configureServer(server, ctx)` / `after:dev:server` |
| 配置文件热重载 | Vite `handleHotUpdate` 检测配置变更 -> `engine.prepare(env, options, true)` 强制重新 prepare |

### 7.2 接口

```ts
interface ViteBridge {
  name: string
  createPlugin(engine: ClarifyEngine): Plugin[]
}
```

CLI 命令可以继续调用 Vite 的 `build()` / `createServer()`；核心要求是这些 Vite 回调内部只能委托给 Engine，不能重新持有项目状态。

---

## 8. 目录结构（目标态）

```
packages/cli/source/
  core/
    engine/                 # 核心工作流引擎（新增）
      engine.ts             # build() / dev() 统一入口
      context.ts            # ClarifyContext 实现
      phases.ts             # 阶段定义与调度器
      types.ts              # 引擎内部类型

    plugin/                 # 插件系统
      manager.ts            # 插件生命周期 + 排序（从 hooks.ts 扩展）
      hooks.ts              # 三种 Hook 执行器
      builtin.ts            # 内置插件注册

    config/                 # 配置系统（不变）
      config-schema.ts
      config.ts
      options.ts
      user-config.ts

    runtime/                # 运行时支持
      virtual-modules.ts    # 虚拟模块生成
      html-template.ts      # SSG HTML 模板注入（title/meta/canonical/root div）
      ssg.ts                # SSG 引擎（保留，但由 engine 调用）
      vite-config.ts        # Vite 配置工厂（装配 Vite adapter）
      runtime-deps.ts
      env-types.ts
      log.ts
      startup.ts

    adapters.ts             # Vite bridge / adapter（单文件，无需子目录）

  plugins/                  # 内置业务插件（按功能/职责拆分）
    variables/              # 变量替换（content:transform）
    openapi/                # OpenAPI 路由发现与模块生成
    content-artifacts/      # 内容产物（content-artifacts）
    seo/                    # SEO 元数据
    search-index/           # 搜索索引
    source-links/           # 源码链接
    html-shell/             # HTML 外壳注入

  cli/                      # 命令行入口
    commands/
      build.ts              # 调用 Vite build；Vite bridge 委托 engine
      dev.ts                # 调用 Vite createServer；Vite bridge 委托 engine
    program.ts

  parsers/                  # 解析器（不变）
    routes/
    markdown/
    content/

  types.ts                  # 公共类型
```

---

## 8.1 代码质量约定

本节记录 Core 内部已落地的实现规范，避免回归到脆弱写法。

### 虚拟模块生成（`runtime/virtual-modules.ts`）

`generateRoutesModule` 生成运行时路由清单。约定：

- **不要用三元字符串拼接构造 route 对象。** 每个 route 有 ~10 个可选字段，逐字段 `${cond ? `key: ${JSON.stringify(v)},` : ''}` 拼接既难读又易漏字段。
- 使用 `routeToRuntimeObject(route, component, mode)` 返回普通对象，字段用条件赋值（`if (route.basePath) obj.basePath = route.basePath`）。
- `component` 是裸 JS 表达式（`Page{i}` 或懒加载箭头函数），不能被 `JSON.stringify`。用唯一占位符 `__COMPONENT_${i}__` 作为 component 值，`JSON.stringify` 后再 `replace` 回实际表达式。
- 序列化后用 `/("([A-Za-z_$][\w$]*)":)/g` 反引号键名、补冒号空格，输出符合 JS 对象字面量习惯的 `key: value` 格式。

### HTML 模板注入（`runtime/html-template.ts`）

SSG 阶段对 `index.html` 的所有字符串操作集中在 `html-template.ts`，包括：

- `<html lang/dir>` 注入（`injectHtmlLocaleAttributes`）
- `<meta name="description|keywords">` 设置/移除（`setNamedMeta`）
- `<link rel="canonical">` 注入（`injectCanonicalUrl`）
- `<title>` 与 `<div id="root">` 替换（`injectSSRIntoTemplate`）

`ssg.ts` 通过 re-export 暴露 `injectSSRIntoTemplate`，但实现不分散在 SSG 管线里。新增 HTML 注入点应加到 `html-template.ts`，不要在 `ssg.ts` 内联正则。

### 路由发现（`parsers/routes/routes.ts`）

- **裸路径别名生成只允许一处实现。** `generateBareAliases(routes, i18n)` 负责为默认语言的 locale-prefixed 路由生成无前缀别名并标记 `isBareAlias`。`findLocalizedContentRoutes` 与 `applyConfiguredPageRoutePaths` 都复用它，不要重新内联这段逻辑。
- **文件系统访问用 async API。** `findContentRoutes` 用 `node:fs/promises` 的 `readdir` / `readFile` / `stat`，不用同步的 `*Sync` 系列，避免在大量内容文件时阻塞事件循环。目录不存在时 `stat` 会 reject，捕获后返回空数组即可。

### Vite Adapter（`core/adapters.ts`）

- `createViteAdapter` 返回 `Plugin[]`。`react()` 返回 `Plugin[]`、`tailwindcss()` 返回 `Plugin | Plugin[]`，用 `Array.isArray` 收敛后展开，**不要用 `.flat().filter(Boolean) as Plugin[]`** 这种类型逃生舱。

### 项目上下文（`core/project/project-context.ts`）

- `ResolvedProjectContext` 不持有 `hookContext`。Hook 执行用的 `ClarifyHookContext` 由 `core/engine/context.ts` 的 `ClarifyContext` 实现，`ResolvedProjectContext` 只负责解析配置/路径/options。不要在 `resolveProjectContext` 里重建 hook 状态容器。

### 配置 Schema（`core/config/config-schema.ts`）

- 不要为 schema 创建无消费者的别名（如 `clarifyBannerConfigSchema = clarifyBannerConfigOptionsSchema`）。直接使用带 `Options` 后缀的规范名，与文件内其它 schema 命名一致。

---

## 9. 演进路线

### Phase 1：提取 Engine（P0）✅

目标：让核心状态和阶段可独立测试，不再被 Vite 插件闭包持有。

- 新建 `core/engine/engine.ts`，提取 `resolveRoutesAndSpecs` / `rebuildVirtualModules` / `refreshDevServer`。
- 新建 `core/engine/context.ts`，统一 `ClarifyContext`。
- Vite 生命周期桥接在 `core/adapters.ts` 中委托给 `ClarifyEngine`。

### Phase 2：分离 Vite Adapter（P0）✅

目标：降低 Vite 耦合，adapter 只负责桥接。

- `core/adapters.ts` 承接 Vite hook 实现。
- `createViteAdapter()` 直接作为 Vite 桥接入口，通过 `index.ts` 公共导出。

### Phase 3：增强 Hook 系统（P1）

目标：插件可干预更多节点。

- 扩展 Hook 类型：增加 `before:*` / `after:*` 前缀。
- 增加 `tap()` 和 `intercept()` 执行器。

### Phase 4：统一 Context（P1）

目标：插件间可协作。

- 实现 `ClarifyContext` 的 `get/set` 状态 API。
- 状态变更自动通知监听器。

### Phase 5：目录重组（P2）✅

目标：代码结构更清晰。

- `core/engine/` 负责工作流调度。
- `core/adapters.ts` 负责 Vite 桥接（单文件，无需子目录）。
- 业务逻辑（变量替换、OpenAPI 解析、主题解析等）移入 `plugins/` 或 `parsers/`。

---

## 10. 与 renderer-pipeline 的关系

本文档是 [renderer-pipeline.md](../../renderer-pipeline.md) 在 CLI Core 侧的落地补充。

| renderer-pipeline 定义 | 本文档落地位置 |
|------------------------|----------------|
| CLI owns the project pipeline | `core/engine/` 负责工作流调度 |
| CLI 负责发现文件、加载配置、执行插件 | `core/config/` + `core/plugin/` |
| CLI 负责管理 Vite | `core/adapters.ts`（通过 `index.ts` 导出 `createViteAdapter`） |
| CLI 负责注册虚拟模块 | `core/runtime/virtual-modules.ts`（由 engine 调用） |
| renderer/server 负责编译 route module | Core 通过 Hook 调用 renderer/server API |
| route virtual module 是编译边界 | `core/engine/` 生成 route payload，renderer/server 编译为 module |

---

## 附录：术语表

| 术语 | 定义 |
|------|------|
| **Core** | CLI 的核心工作流引擎，负责项目生命周期管理。 |
| **Engine** | Core 中的工作流调度器，定义 build/dev 的阶段和执行顺序。 |
| **Plugin** | 通过 Hooks 扩展 Core 功能的模块。 |
| **Adapter / Bridge** | 将宿主运行时生命周期映射到 Engine 调用的模块，不拥有核心状态。 |
| **Phase** | 工作流中的一个阶段，如 `site:discover`、`build` 等。 |
| **Hook** | 插件介入 Core 工作流的机制，有 Pipeline/Tap/Intercept 三种类型。 |
| **Context** | 贯穿整个工作流的上下文对象，包含配置、状态、路由等。 |
| **Virtual Module** | 由 Core 生成、通过 Vite 暴露的虚拟模块，如 `virtual:clarify/routes`。 |
| **Route Module** | 由 renderer/server 编译后的浏览器安全模块，是 compile-to-runtime 的边界。 |
