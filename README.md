# Clarify

<p align="center">
  <img src="./apps/docs/public/clarify.svg" alt="Clarify logo" width="112" />
</p>

<p align="center">
  <strong>Open-source documentation publishing for MDX, OpenAPI, and AI-ready knowledge bases.</strong>
</p>

<p align="center">
  Build fast, multilingual, developer-friendly documentation sites with a local-first CLI and a fully composable React renderer.
</p>

<p align="center">
  <a href="./README.zh-CN.md">🇨🇳 中文版</a>
</p>

---

## What is Clarify?

Clarify is an open-source documentation publishing tool for teams that want their docs to stay close to the codebase. It turns MDX content, OpenAPI specifications, and a typed `clarify.ts` configuration into a production-ready static documentation site.

The project is designed for product docs, API references, engineering handbooks, and AI-readable documentation portals that should be easy to version, customize, and self-host.

## Core Features

- **MDX-first authoring** — Write Markdown, embed React components, and keep examples, guides, and reference pages in the same content workflow.
- **OpenAPI documentation** — Render OpenAPI specs as navigable API reference pages without moving API docs into a separate hosted product.
- **Static site generation** — Build deployable static output for any platform that can serve HTML, CSS, and JavaScript.
- **Built-in internationalization** — Organize localized content by locale folders and configure locale fallback behavior in `clarify.ts`.
- **Typed configuration** — Define navigation, tabs, theme tokens, navbar links, footer links, and metadata with TypeScript.
- **Themeable React renderer** — Customize a Tailwind CSS 4 + React 19 documentation shell instead of being locked into a fixed SaaS theme.
- **AI-ready output** — Generate documentation artifacts such as `llms.txt` for AI agents and developer tools.
- **Local-first workflow** — Use `clarify dev` and `clarify build` in the repository where the docs live.

## Why Clarify instead of Mintlify?

Mintlify is a polished hosted documentation platform. Clarify takes a different path: it is an open-source, codebase-owned publishing engine that keeps rendering, configuration, and deployment under your control.

| Area | Clarify | Mintlify |
|------|---------|----------|
| Ownership | Open-source project you can inspect, modify, and self-host | Hosted platform with product-level abstractions |
| Workflow | Local-first CLI: `clarify dev` and `clarify build` | Platform-oriented workflow around Mintlify conventions |
| Customization | React renderer, Tailwind styles, and typed config are part of the codebase | Easier defaults, but deeper customization depends on platform support |
| Deployment | Static output deployable to your own infrastructure | Typically centered on Mintlify hosting and integrations |
| OpenAPI | Built into the docs engine for local rendering and builds | Strong API docs support through the hosted platform |
| Internationalization | Native locale folders and fallback behavior | Depends on platform capabilities and configuration |
| Best fit | Teams that want open-source control, self-hosting, and code-level customization | Teams that prefer managed hosting and a turnkey docs product |

Clarify is not trying to clone Mintlify. It is for teams that like the modern docs experience Mintlify popularized, but want more ownership over the source, rendering layer, and deployment target.

## Monorepo Structure

```
├── apps/
│   ├── docs/          # Documentation playground and local dev site
│   └── www/           # Marketing website and landing page
├── packages/
│   ├── renderer/      # Shared React components and UI primitives
│   └── cli/           # Clarify CLI and docs engine
```

## Tech Stack

- React 19 + TypeScript 5
- Tailwind CSS 4
- Vite-powered internals wrapped by the Clarify CLI
- pnpm workspaces

## Quick Start

```bash
pnpm install
pnpm dev:docs
```

Useful workspace commands:

```bash
pnpm dev:www
pnpm build
pnpm typecheck
pnpm lint
```

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@clarify-labs/docs` | 0.4.0 | Documentation playground app |
| `@clarify-labs/www` | 0.4.0 | Marketing website app |
| `@clarify-labs/renderer` | 0.4.0 | Shared React rendering primitives |
| `@clarify-labs/cli` | 0.4.0 | User-facing Clarify CLI and docs engine |

## License

AGPL-3.0-only © 2026 Taicode Labs
