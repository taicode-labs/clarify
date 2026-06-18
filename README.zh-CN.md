# Clarify

<p align="center">
  <strong>面向 MDX 与 OpenAPI 的开源文档发布工具。</strong>
</p>

<p align="center">
  将 Markdown、交互式 React 组件与 API 规范无缝结合，打造现代化、开发者友好的文档站点。
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English Version</a>
</p>

---

## ✨ 特性

- **原生 MDX 支持** — 使用 Markdown 编写文档，并在任意位置嵌入交互式 React 组件。
- **OpenAPI 集成** — 从 OpenAPI 规范自动生成美观的 API 参考页面。
- **Vite 驱动** — 开箱即用的快速开发服务器与优化的生产构建。
- **可组合 UI** — 通过 `@clarify-labs/renderer` 提供的可复用、可主题化的内容块构建页面。
- **Monorepo 架构** — 核心库、插件与应用之间的清晰分离。

## 🏗 仓库结构

```
├── apps/
│   ├── docs/          # 文档 playground 与本地开发站点
│   └── www/           # 营销网站与落地页
├── packages/
│   ├── renderer/      # 共享 React 组件与 UI 基础组件
│   └── cli/           # Clarify CLI 与文档引擎
```

## 🛠 技术栈

- React 19 + TypeScript 5
- Tailwind CSS 4
- Clarify CLI 封装的 Vite 内核
- pnpm（monorepo 包管理器）

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动文档 playground
pnpm dev:docs

# 启动营销网站
pnpm dev:www

# 构建所有工作区
pnpm build

# 对所有工作区进行类型检查
pnpm typecheck
```

## 📦 包

| 包 | 版本 | 说明 |
|---------|---------|-------------|
| `@clarify-labs/docs` | 0.1.0 | 文档 playground 应用 |
| `@clarify-labs/www` | 0.1.0 | 营销网站应用 |
| `@clarify-labs/renderer` | 0.1.0 | 共享 React 渲染基础组件 |
| `@clarify-labs/cli` | 0.1.0 | 面向用户的 Clarify CLI 与文档引擎 |

## 🤝 贡献

欢迎贡献！请阅读我们的 [贡献指南](./CONTRIBUTING.md)（即将推出）以开始。

## 📄 许可

AGPL-3.0-only © 2026 Taicode Labs
