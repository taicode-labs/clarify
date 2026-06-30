# Clarify

直接从你的代码仓库发布现代文档站点。

Clarify 把 MDX、OpenAPI 和项目内容组织成一个快速、多语言、可自托管，而且真正归你团队所有的文档体验。

[English Version](./README.md)

---

![Clarify banner](./design/x-promo.png)

## 为什么团队会选择 Clarify

Clarify 面向那些想要现代文档体验，但不想把内容迁进托管黑盒的团队。

| 亮点 | 你能获得什么 |
|------|--------------|
| **文档和代码天然同仓** | 产品文档、接口规范、导航和品牌配置可以跟代码一起 review、一起发布。 |
| **指南与 API 文档一站式交付** | 教程、接入指南、变更记录和 OpenAPI Reference 都能放进同一个文档站点。 |
| **体验归你控制** | 输出可自托管，渲染器可定制，部署方式不受平台限制。 |
| **天生适合多语言团队** | 按 locale 组织内容，让导航、搜索和原始内容在不同语言下保持一致。 |
| **搜索和 AI 可读默认内置** | 无需额外系统就能生成 Pagefind 索引、原始内容产物和 `llms.txt`。 |
| **可以从简单开始，按需扩展** | 先用本地 CLI 起步，再逐步接入类型化配置、主题 token 和插件能力。 |

## Clarify 能帮你发布什么

用 Clarify，你可以发布：

- 跟产品代码一起演进的产品文档
- 基于 OpenAPI 3.0 / 3.1 自动生成的 API Reference
- 内部工程指南和团队手册
- 多语言帮助中心和开发者门户
- 面向 AI Agent 和内部工具的可读知识库

Clarify 是一个开源文档发布工具，会把 MDX 内容、OpenAPI 规范和类型化的 `clarify.ts` 配置转换为可直接部署的静态文档站点。

## 适合重视控制权的团队

很多文档工具优先优化“托管式便利”。Clarify 优先优化“长期控制权”。

- 内容保留在 Git 中
- 文档可以在本地构建
- 输出是可迁移的静态站点
- 渲染器就在代码库里
- 团队可以按自己的节奏定制，而不是等待平台路线图

如果你喜欢 Mintlify 这类现代文档体验，但又希望源码、渲染层和部署目标都掌握在自己手里，Clarify 会更合适。

## 快速开始

创建一个新的 Clarify 项目：

```bash
npx @clarify-labs/cli init my-docs
cd my-docs
```

然后安装依赖，并优先通过项目脚本启动本地站点：

```bash
npm install
npm run dev
```

如果团队使用 pnpm 或 yarn，也可以直接运行生成好的 `pnpm dev` 或 `yarn dev`。

## 创建你的第一个文档站点

生成的模板包含类型化的 `clarify.ts` 配置、MDX 页面、public 资源，以及本地预览和生产构建脚本。

在生成的内容目录中添加或编辑页面：

```text
source/
├── index.mdx
├── guides/
│   └── writing-content.mdx
└── api.openapi.json
```

然后构建静态输出：

```bash
npm run build
```

生成的 `output/` 目录可以部署到任意静态托管服务。

## 核心工作流

在文档内容所在项目中使用 Clarify：

```bash
npx clarify dev
npx clarify build
```

在 `clarify.ts` 中配置导航、OpenAPI 参考、主题 token、locale 行为和元数据。

## 开箱即用的能力

- **MDX 优先的写作体验** — 使用 Markdown 写文档，嵌入 React 组件，使用内置 Callout、Card 和代码块，并让教程、示例和参考页共享同一套内容工作流。
- **OpenAPI 文档生成** — 将 OpenAPI 3.0/3.1 规范渲染为可导航的 API 参考页面，也能在 MDX 指南中嵌入单个接口。
- **项目变量** — 在一个地方定义项目级固定内容，并在多个页面和规范中复用。
- **静态站点生成** — 为每个路由输出独立 HTML，支持客户端导航、public 资源复制和部署子路径。
- **内置国际化** — 通过 locale 目录组织多语言内容，并在 `clarify.ts` 中配置缺失翻译 fallback、导航和页脚本地化。
- **内置全文搜索** — 在 `clarify dev` 和 `clarify build` 中生成并提供 Pagefind 索引，支持当前语言结果和摘要高亮。
- **类型化配置** — 用 TypeScript 定义 Tabs、侧边栏、顶部导航、页脚链接、主题 token、部署子路径、favicon/logo 变体和元数据。
- **可主题化 React 渲染器** — 基于 Tailwind CSS 4 + React 19 的文档外壳支持主题预设、颜色 token、圆角 token 和布局宽度配置。
- **AI-ready 输出** — 生成原始 `.md` / `.openapi.*` 产物、页面复制操作、稳定原始内容链接和 `llms.txt`。
- **插件化构建管线** — 可扩展路由解析、虚拟模块和构建完成 Hook，用于内容治理、翻译流水线或自定义产物。
- **本地优先工作流** — 在文档所在仓库直接使用 `clarify dev` 与 `clarify build`。

## 如果你希望做到这些，Clarify 会很合适

- 把零散的 Markdown 目录升级成完整文档站点
- 在同一个仓库里同时发布产品文档和 API 文档
- 让文档评审进入日常 Pull Request 流程
- 自托管文档，同时保留现代体验
- 同时面向人类读者和 AI Agent 输出文档

## 为什么选择 Clarify，而不是 Mintlify？

Mintlify 是成熟的托管式文档平台。Clarify 选择了另一条路线：它是开源、代码库自有的发布引擎，让渲染层、配置和部署目标都掌握在团队自己手里。

| 维度 | Clarify | Mintlify |
|------|---------|----------|
| 所有权 | 开源，可审计、可修改、可自托管 | 托管平台，使用平台提供的产品抽象 |
| 工作流 | 本地优先 CLI：`clarify dev` 与 `clarify build` | 围绕 Mintlify 约定和平台能力组织 |
| 定制能力 | React 渲染器、Tailwind 样式和类型化配置都在代码库中 | 默认体验更开箱即用，深度定制取决于平台支持 |
| 部署方式 | 静态输出，可部署到自有基础设施 | 通常围绕 Mintlify 托管与集成展开 |
| OpenAPI | 文档引擎内置，可本地渲染与构建 | 通过托管平台提供成熟 API 文档能力 |
| 国际化 | 原生 locale 目录与 fallback 行为 | 取决于平台能力和具体配置 |
| 更适合 | 需要开源控制权、自托管、代码级定制的团队 | 偏好托管服务和一站式文档产品的团队 |

Clarify 并不是要复制 Mintlify。它面向的是喜欢现代文档体验，但希望拥有源码、渲染层和部署目标控制权的团队。

## 许可

AGPL-3.0-only © 2026 Taicode Labs
