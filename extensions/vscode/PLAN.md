# Clarify VS Code Extension — 实现规划

> 目标：在 VS Code 中为 Clarify 文档项目提供实时预览能力。

## 一、核心需求

| # | 需求 | 说明 |
|---|------|------|
| 1 | 后台启动 `clarify dev` | 扩展负责拉起 dev server 并管理其生命周期；支持通过配置指定 Clarify 版本（默认最新） |
| 2 | 编辑器 → 预览联动 | 用户当前编辑的文件若是内容文件（`.md`/`.mdx`/OpenAPI），自动定位对应路由（默认语言）并在预览面板打开 |
| 3 | 扩展位置 | 代码位于 `extensions/vscode/` |

## 二、架构调研结论（基于现有代码）

### 2.1 `clarify dev` 的工作方式
- 入口：`packages/cli/source/cli/commands/dev.ts` → `runDev()`
- 本质是 `vite createServer()` + Clarify 自定义插件（`clarifyPlugin`）
- dev server 监听内容目录变更，HMR 已内置（`handleHotUpdate` → `refreshDevServer`）

### 2.2 路由映射现状（关键）
- 路由数据存在于插件内存的 `routes: ContentRoute[]`（`packages/cli/source/core/plugin.ts`）
- `ContentRoute` 类型（`packages/cli/source/types.ts`）包含：
  - `filePath: string` — 内容文件绝对路径
  - `path: string` — 路由路径（如 `/getting-started`）
  - `basePath?: string` — 去除 locale 前缀的路径
  - `locale?: string` — 所属语言
- **问题：目前没有 HTTP 端点暴露「文件路径 → 路由」映射**，路由信息只在 Vite 虚拟模块里供前端消费。

### 2.3 路由生成规则（`packages/cli/source/parsers/routes.ts`）
```
source/en-US/getting-started.mdx  →  basePath=/getting-started, path=/en-US/getting-started
source/en-US/index.mdx            →  basePath=/,              path=/en-US
source/zh-CN/features.mdx         →  basePath=/features,      path=/zh-CN/features
```
- 无 i18n 时：`path === basePath`
- 有 i18n 时：`path = /{locale}{basePath}`，默认语言也会带前缀（除非配置 `routePrefix`）

### 2.4 结论
扩展要实现「编辑文件 → 预览对应路由」，**需要在 Clarify CLI 侧新增一个轻量 HTTP 端点**，把内存中的 `routes` 映射暴露出来。这是整个方案的前置依赖。

---

## 三、整体方案

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                     │
│  extensions/vscode/                                      │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │ DevServer    │   │ RouteResolver│  │ PreviewPanel │  │
│  │ Manager      │──▶│              │─▶│ (Webview)    │  │
│  │ (spawn CLI)  │   │ (HTTP 查询)  │  │              │  │
│  └──────────────┘   └──────────────┘  └──────────────┘  │
│         │                   ▲                  ▲         │
│         ▼                   │                  │         │
│   子进程: clarify dev   HTTP /__clarify/    iframe       │
│         │              routes?file=...       指向        │
│         ▼                                      │         │
│  ┌──────────────────────────────────┐         │         │
│  │  Vite Dev Server (Clarify CLI)   │         │         │
│  │  - 内容服务 (HMR)                │─────────┘         │
│  │  - 新增: /dev/query-preview-route  │                   │
│  └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### 数据流
1. 用户打开 `.mdx` 文件 → 扩展监听 `activeTextEditor` 变化
2. 扩展向 dev server 发起 `POST /dev/query-preview-route`（body: `{ file: <absPath> }`）查询
3. CLI 返回 `{ path: "/en-US/getting-started", locale: "en-US", ... }`；若文件未注册则返回推导路径（`inferred: true`）
4. 扩展用该 path 拼接 `http://localhost:<port><path>`，在 Webview 中加载
5. 用户编辑保存 → Vite HMR 自动刷新 → Webview 同步更新

---

## 四、分阶段实施计划

### 阶段 0：CLI 侧新增路由映射端点（前置依赖）

**改动位置**：`packages/cli/source/core/plugin.ts` 的 `configureServer`

**新增端点**（`POST /dev/query-preview-route`，JSON body）：
- 空 body → 返回全部路由列表（`filePath` + `path` + `locale` + `basePath`）
- `{ file: <absPath> }` → 返回单个文件对应的路由（默认语言优先）；若文件不在路由表中，则根据文件路径相对 contentRoot 推导出预览路径（`inferred: true`）

**为什么用 POST + body 而非 GET + query**：文件路径可能包含各种特殊字符，放在 body 里更安全，避免 URL 编码问题。

**实现要点**：
```ts
// 在 configureServer(server) 内追加 middleware
server.middlewares.use('/dev/query-preview-route', (req, res) => {
  // 读取 JSON body: { file?: string }
  // 若 file 匹配路由表 → 返回该路由（locale 优先）
  // 若 file 不匹配但在 contentRoot 内 → 推导路径（inferred: true）
  // 否则 → null
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(result))
})
```

**为什么放在 CLI 而不是扩展里**：路由解析依赖 Clarify 的内容处理流水线（frontmatter、i18n、OpenAPI 解析），在扩展里重写一遍既不现实也容易和 CLI 版本脱节。复用 CLI 内存数据最准确。

**安全考虑**：端点仅 dev 模式生效（`configureServer` 只在 dev 调用），不影响 build 产物。

---

### 阶段 1：扩展骨架搭建

**目录结构**（`extensions/vscode/`）：
```
extensions/vscode/
├── package.json              # 扩展清单（activationEvents, commands, views）
├── tsconfig.json
├── webpack.config.js         # 打包（或 esbuild）
├── source/
│   ├── extension.ts          # 激活入口
│   ├── devServer.ts          # DevServerManager：spawn/管理 clarify dev
│   ├── routeResolver.ts      # 查询 /dev/query-preview-route 端点
│   ├── previewPanel.ts       # Webview 预览面板
│   ├── fileWatcher.ts        # 监听 activeTextEditor 变化
│   └── utils.ts              # 端口探测、版本检查等
└── README.md
```

**`package.json` 关键配置**：
```jsonc
{
  "name": "clarify",
  "displayName": "Clarify",
  "engines": { "vscode": "^1.90.0" },
  "activationEvents": ["onCommand:clarify.startPreview"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      { "command": "clarify.startPreview", "title": "Clarify: Start Preview" },
      { "command": "clarify.stopPreview", "title": "Clarify: Stop Preview" },
      { "command": "clarify.openPreview", "title": "Clarify: Open Preview to the Side" }
    ],
    "configuration": {
      "title": "Clarify",
      "properties": {
        "clarify.version": {
          "type": "string",
          "default": "latest",
          "description": "Clarify CLI 版本（latest 或具体版本号）"
        },
        "clarify.port": {
          "type": "number",
          "default": 5173,
          "description": "Dev server 端口（0 表示自动选择）"
        },
        "clarify.autoOpenPreview": {
          "type": "boolean",
          "default": true,
          "description": "打开内容文件时自动刷新预览"
        }
      }
    }
  }
}
```

---

### 阶段 2：DevServerManager — 后台启动 `clarify dev`

**职责**：
1. 检测当前工作区是否为 Clarify 项目（存在 `clarify.config.{ts,js,mjs}` 或 `source/` 目录）
2. 确认 Clarify CLI 可用：
   - 优先用工作区本地安装的 `@clarify-labs/cli`（`node_modules/.bin/clarify`）
   - 若无，按 `clarify.version` 配置用 `npx clarify@<version>` 拉起
3. spawn 子进程：`clarify dev --port <port> --no-open`
4. 解析子进程 stdout 获取实际监听地址（Vite 会打印 `Local: http://localhost:5173/`）
5. 暴露 `getServerUrl()` 供预览面板使用
6. 提供停止能力（`dispose` 时 kill 子进程）

**关键实现点**：
```ts
// devServer.ts 核心逻辑伪代码
class DevServerManager {
  private process?: ChildProcess
  private serverUrl?: string

  async start(workspaceRoot: string): Promise<string> {
    const port = getConfig('port') ?? 0
    const bin = resolveLocalClarifyBin(workspaceRoot) ?? `npx clarify@${getConfig('version')}`
    this.process = spawn(bin, ['dev', '--port', String(port), '--no-open'], {
      cwd: workspaceRoot,
      shell: true,
    })
    // 监听 stdout，正则匹配 http://localhost:PORT 提取 serverUrl
    return this.waitForServerUrl()
  }

  async stop() { this.process?.kill() }
  getServerUrl() { return this.serverUrl }
}
```

**版本指定策略**：
- 配置 `clarify.version: "latest"` → `npx clarify@latest`
- 配置具体版本如 `"0.2.0"` → `npx clarify@0.2.0`
- 工作区已装 `@clarify-labs/cli` → 直接用本地 bin，忽略 version 配置（本地优先，避免版本冲突）

---

### 阶段 3：RouteResolver — 文件路径 → 路由

**职责**：调用阶段 0 新增的 `/dev/query-preview-route` 端点，把当前编辑文件转成预览 URL。

```ts
// routeResolver.ts
class RouteResolver {
  constructor(private serverUrl: string) {}

  async resolveRoute(filePath: string): Promise<string | null> {
    const url = `${this.serverUrl}/dev/query-preview-route`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filePath }),
    })
    const data = await resp.json()
    if (!data) return null
    // data.path 已含 locale 前缀（默认语言），直接拼接
    return `${this.serverUrl}${data.path}`
  }
}
```

**默认语言处理**：
- 端点侧已实现「单文件查询时默认语言优先」逻辑
- 若用户编辑的是 `source/zh-CN/x.mdx`，端点返回 `path: /zh-CN/x`，预览即显示中文版
- 若用户编辑的是 `source/en-US/x.mdx`，返回 `path: /en-US/x`

**未注册文件处理**：
- 即使文件不在路由配置里（如草稿、新建文件），端点也会根据文件路径相对 contentRoot 推导出预览路径
- 返回结果带 `inferred: true` 标记，扩展可据此决定是否在导航中显示
- 文件在 contentRoot 之外或非内容文件类型时返回 null

---

### 阶段 4：PreviewPanel — Webview 预览

**职责**：
1. 创建 WebviewPanel（侧边或分组打开）
2. 内嵌 `<iframe src={previewUrl}>` 加载 dev server 页面
3. 监听文件保存事件，触发 iframe 刷新（Vite HMR 会自动更新内容，但保险起见可手动 reload）
4. 支持前进/后退/刷新按钮（可选，后续迭代）

**关键点**：
- Webview 需设置 `enableScripts: true`、`enableForms` 等
- iframe 直接指向 dev server URL，无需在扩展里重新实现渲染
- CSP 策略允许加载 dev server 的资源

```ts
// previewPanel.ts 伪代码
class PreviewPanel {
  private panel: vscode.WebviewPanel

  show(previewUrl: string) {
    this.panel.webview.html = `<!DOCTYPE html>
      <html><body style="margin:0">
        <iframe src="${previewUrl}" style="width:100%;height:100vh;border:0"></iframe>
      </body></html>`
  }

  reload() { /* 发消息给 iframe 或重新 setHTML */ }
}
```

---

### 阶段 5：文件监听与联动

**触发时机**：
- `vscode.window.onDidChangeActiveTextEditor` — 切换标签页时
- `vscode.workspace.onDidSaveTextDocument` — 保存时（可选，HMR 已自动刷新）

**联动逻辑**：
```ts
context.subscriptions.push(
  vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor || !autoOpenPreview) return
    const filePath = editor.document.uri.fsPath
    if (!await routeResolver.isContentFile(filePath)) return
    const previewUrl = await routeResolver.resolveRoute(filePath)
    if (previewUrl) previewPanel.show(previewUrl)
  })
)
```

---

## 五、配置项汇总

| 配置键 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `clarify.version` | string | `"latest"` | CLI 版本（仅当工作区未本地安装时生效） |
| `clarify.port` | number | `5173` | dev server 端口，`0` 表示自动 |
| `clarify.autoOpenPreview` | boolean | `true` | 切换到内容文件时自动刷新预览 |
| `clarify.openToSide` | boolean | `true` | 预览面板在侧边打开而非覆盖当前编辑器 |

---

## 六、实施顺序与里程碑

| 里程碑 | 内容 | 依赖 |
|--------|------|------|
| **M1** | CLI 新增 `/dev/query-preview-route` 端点 + 测试 | 无 |
| **M2** | 扩展骨架：`package.json`、`extension.ts`、DevServerManager | M1 |
| **M3** | RouteResolver + PreviewPanel 基础版（手动触发预览） | M1, M2 |
| **M4** | 文件监听联动（自动跟随编辑器） | M3 |
| **M5** | 版本指定、端口冲突处理、错误提示完善 | M4 |
| **M6** | 打包发布（vsce）、README、动画演示 | M5 |

---

## 七、风险与待确认问题

1. **端点路径命名**：`/dev/query-preview-route` 明确表达「查询预览路由」语义，且 `/dev/` 前缀表明是开发工具接口，不会与用户内容路由冲突。
2. **Webview 与 Vite HMR 的 WebSocket 连接**：iframe 内的页面会尝试连 Vite 的 HMR ws，需确认 Webview 环境下 ws 能正常建立（通常可以，因为 iframe 是完整浏览器上下文）。
3. **多工作区**：若用户开了多个 Clarify 项目，DevServerManager 需按 workspace folder 隔离，每个项目一个 dev server 实例。
4. **版本兼容**：`/dev/query-preview-route` 端点是新加的，旧版 CLI 没有。扩展启动时应探测端点是否存在，不存在则提示用户升级 CLI。

---

## 八、下一步行动

建议先从 **M1（CLI 端点）** 开始，因为它是整个方案的地基，且改动小、可独立测试。完成后扩展侧就有了可靠的数据源，后续 M2–M4 顺势推进。

确认本规划后，我可以立即开始实现 M1。
