# Clarify

<p align="center">
  <strong>An open-source documentation publishing tool built for MDX and OpenAPI.</strong>
</p>

<p align="center">
  Seamlessly combine Markdown, interactive React components, and API specifications to create modern, developer-friendly documentation.
</p>

<p align="center">
  <a href="./README.zh-CN.md">🇨🇳 中文版</a>
</p>

---

## ✨ Features

- **MDX Native** — Write docs with Markdown and embed interactive React components anywhere.
- **OpenAPI Integration** — Auto-generate beautiful API reference pages from OpenAPI specs.
- **Vite-Powered** — Fast development server and optimized production builds out of the box.
- **Composable UI** — Build pages with reusable, themeable content blocks from `@clarify-labs/renderer`.
- **Monorepo Architecture** — Clean separation between core libraries, plugins, and applications.

## 🏗 Monorepo Structure

```
├── apps/
│   ├── docs/          # Documentation playground & local dev site
│   └── www/           # Marketing website & landing page
├── packages/
│   ├── renderer/      # Shared React components & UI primitives
│   └── cli/           # Clarify CLI and docs engine
```

## 🛠 Tech Stack

- React 19 + TypeScript 5
- Tailwind CSS 4
- Vite-powered internals wrapped by the Clarify CLI
- pnpm (monorepo package manager)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start the documentation playground
pnpm dev:docs

# Start the marketing website
pnpm dev:www

# Build all workspaces
pnpm build

# Type-check all workspaces
pnpm typecheck
```

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@clarify-labs/docs` | 0.2.0 | Documentation playground app |
| `@clarify-labs/www` | 0.2.0 | Marketing website app |
| `@clarify-labs/renderer` | 0.2.0 | Shared React rendering primitives |
| `@clarify-labs/cli` | 0.2.0 | User-facing Clarify CLI and docs engine |

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) (coming soon) to get started.

## 📄 License

AGPL-3.0-only © 2026 Taicode Labs
