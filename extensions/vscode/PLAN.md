# Clarify VS Code Extension — 架构文档

> 在 VS Code 中为 Clarify 文档项目提供实时预览能力。

## 一、核心功能

| 功能 | 说明 |
|------|------|
| 后台自动启动 | 扩展激活时检测到 Clarify 项目即后台静默启动 `clarify dev` |
| 点击即预览 | 编辑器标题栏或状态栏点击，自动启动服务并打开当前文件对应的预览面板 |
| 自动跟随 | 切换到内容文件（`.md`/`.mdx`/OpenAPI）时，预览面板自动导航到对应路由 |
| CLI 自动管理 | 优先用工作区本地 CLI；无则通过扩展私有 npm 安装；最后回退到 npx |

---

## 二、目录结构

```
extensions/vscode/
├── package.json           # 扩展清单（commands, menus, configuration）
├── tsconfig.json
├── vite.config.ts         # 打包配置（输出 CJS bundle）
├── source/
│   ├── extension.ts       # 激活入口，统一管理生命周期
│   ├── devServer.ts       # DevServerManager：spawn / 健康检查 / 生命周期
│   ├── routeResolver.ts   # 查询 /dev/query-preview-route 端点
│   ├── previewPanel.ts    # Webview 预览面板（iframe 内嵌 dev server）
│   ├── dependencyManager.ts  # CLI 私有安装（globalStorage）
│   ├── projectInfo.ts     # 查询 /dev/project-info 端点
│   ├── utils.ts           # 项目检测、内容文件判断、本地 CLI 查找
│   └── utils.test.ts      # utils.ts 单元测试（vitest）
└── PLAN.md
```

---

## 三、架构与数据流

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                     │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │ DevServer    │   │ RouteResolver│  │ PreviewPanel │  │
│  │ Manager      │──▶│              │─▶│ (Webview)    │  │
│  │ (spawn CLI)  │   │ (HTTP 查询)  │  │ (iframe)     │  │
│  └──────────────┘   └──────────────┘  └──────────────┘  │
│         │                   ▲                  ▲         │
│         ▼                   │                  │         │
│   子进程: clarify dev   POST /dev/         iframe 指向   │
│         │              query-preview-route   dev server  │
│         ▼                                               │
│  ┌──────────────────────────────────┐                   │
│  │  Vite Dev Server (Clarify CLI)   │                   │
│  │  - GET /dev/project-info         │                   │
│  │  - POST /dev/query-preview-route │                   │
│  │  - 内容服务 + HMR                │                   │
│  └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### 预览流程（点击预览按钮）

```
用户点击预览
    │
    ▼
ensureServerReady(projectRoot)
    ├─ 若已运行且 routeResolver 就绪 → 直接返回 URL
    └─ 否则 → ensureCliAvailable() → devServer.start()
                                        │
                                        ├─ getFreePort()    OS 分配空闲端口
                                        ├─ spawn clarify dev --port <port>
                                        └─ pollUntilReady() HTTP HEAD 轮询
                                                            直到服务器响应
    │
    ▼
routeResolver = new RouteResolver(serverUrl)
fetchProjectInfo(serverUrl)    更新文件识别规则
    │
    ▼
navigateToRoute(filePath)
    └─ POST /dev/query-preview-route  { file: <absPath> }
    └─ previewPanel.show(previewUrl)
```

### 后台自动启动流程（扩展激活时）

```
activate()
    └─ backgroundStart()  [void, 静默失败]
            ├─ ensureCliAvailable()
            ├─ detectProjectRoot()  检测工作区或活动文件
            └─ ensureServerReady(root, withProgress: false)
```

---

## 四、关键模块说明

### `DevServerManager`

- `start(workspaceRoot)` — 返回共享 Promise；并发调用自动等同一个启动流程
- `pollUntilReady(url)` — HTTP HEAD 轮询，任意 HTTP 响应（含 404）视为就绪；超时 120 秒
- `getFreePort()` — 通过 `net.listen(0)` 让 OS 分配空闲端口，规避端口冲突
- `stop()` — SIGTERM，3 秒后强制 SIGKILL

### `DependencyManager`

- CLI 安装在 `globalStorageUri/cli/` 下，跨工作区持久复用
- 并发安装同一版本时共享同一个 npm install 进程
- `isVersionInstalled('latest')` — 有任意安装即视为满足

### CLI 二进制解析优先级

```
1. clarify.cliPath 配置（显式指定绝对路径）
2. resolveLocalClarifyBin()  从 workspaceRoot 向上查找：
   a. packages/cli/bin/clarify.js       ← monorepo 开发模式
   b. node_modules/.bin/clarify         ← 本地安装
   c. node_modules/@clarify-labs/cli/bin/clarify.js
3. DependencyManager 管理的私有安装
4. npx @clarify-labs/cli@<version>      ← 兜底
```

### `ProjectInfo` 端点

`GET /dev/project-info` 返回权威的文件识别规则（`configFilenames`、`contentFileExtensions`、`contentRoot`），在 CLI 启动后替换扩展内置的 bootstrap 默认值，保证扩展与 CLI 版本同步。

### `RouteResolver`

`POST /dev/query-preview-route { file: <absPath> }` — CLI 侧会：
1. 精确匹配路由表，locale 感知
2. 路由表无匹配时，根据文件路径相对 contentRoot 推导路径（`inferred: true`）
3. 文件在 contentRoot 之外或非内容类型时返回 `null`

---

## 五、配置项

| 配置键 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `clarify.version` | string | `"latest"` | 无本地 CLI 时从 npm 安装的版本 |
| `clarify.cliPath` | string | `""` | 显式指定 clarify 二进制路径，覆盖所有自动解析 |
| `clarify.autoStartServer` | boolean | `true` | 激活时自动后台启动 dev server |
| `clarify.autoOpenPreview` | boolean | `true` | 切换到内容文件时自动刷新预览 |
| `clarify.openToSide` | boolean | `true` | 预览面板在侧边打开 |

---

## 六、命令

| 命令 | 触发方式 | 说明 |
|------|----------|------|
| `clarify.openPreview` | 编辑器标题栏图标 / 状态栏 | 启动服务（如未启动）并打开当前文件的预览 |
| `clarify.stopPreview` | 命令面板 | 停止 dev server 并关闭预览面板 |
| `clarify.refreshPreview` | 命令面板 | 强制刷新预览 iframe |

---

## 七、CLI 侧改动

以下端点在 `packages/cli/source/core/plugin.ts` 的 `configureServer` 中通过 `server.middlewares.use()` 挂载，仅在 dev 模式生效：

| 端点 | 方法 | 实现 |
|------|------|------|
| `/dev/query-preview-route` | POST | `packages/cli/source/core/dev-routes.ts` |
| `/dev/project-info` | GET | `packages/cli/source/core/project-info.ts` |

> **安全**：两个端点均通过中间件精确匹配 URL + 方法，非精确匹配的请求会 `next()` 进入下一个中间件，不影响正常页面路由。

---

## 八、测试

```bash
pnpm test          # 运行一次
pnpm test:watch    # 监听模式
```

`source/utils.test.ts` 覆盖 `utils.ts` 中的所有纯函数（23 个用例），包括：
- `isContentFile` — 扩展名匹配、大小写、自定义 conventions
- `findClarifyProjectRoot` — 同级/向上遍历、找不到、自定义配置文件名
- `resolveClarifyContentFile` — 完整判断链
- `resolveLocalClarifyBin` — monorepo 优先级、向上查找
- `conventionsFromProjectInfo` — ProjectInfo → ProjectConventions 映射

> `DevServerManager`、`DependencyManager` 等涉及进程/网络 I/O 的类暂无单元测试，通过集成测试（F5 调试）覆盖。

---

## 九、已知限制

1. **多工作区**：当前每个 VS Code 窗口只管理一个 dev server 实例；多根工作区（multi-root workspace）只会对第一个检测到的 Clarify 项目启动服务
2. **端口释放窗口**：`getFreePort()` 与 Vite 实际 `listen()` 之间有微小的竞争窗口，极低概率下端口可能被其他进程抢占
3. **HMR WebSocket**：Webview 内 iframe 的 Vite HMR WebSocket 依赖浏览器环境，在受限的 WebviewPanel 中通常可正常工作，但部分企业防火墙可能阻断
