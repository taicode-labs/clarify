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

<p align="center">
  <img src="./design/banner.png" alt="Clarify banner" />
</p>

## Core Highlights

Clarify is built for teams that want modern documentation without giving up source ownership, local workflows, or deployment control.

| Highlight | What you get |
|-----------|--------------|
| **Docs live with code** | Version MDX pages, OpenAPI specs, navigation, and theme config in the same repository. |
| **MDX + OpenAPI in one site** | Combine tutorials, product guides, and generated API reference pages without a separate docs product. |
| **Built-in full-text search** | Generate static Pagefind indexes in dev and production, with multilingual isolation and highlighted excerpts. |
| **Static, self-hostable output** | Build standalone HTML, assets, copied public files, raw Markdown/OpenAPI artifacts, search indexes, and `llms.txt`. |
| **AI-readable by default** | Expose raw page content, raw specs, and discovery metadata so agents and internal tools can read your docs. |
| **Typed, extensible publishing** | Configure navigation, i18n, theme tokens, footer, route prefixes, and build plugins in TypeScript. |

## What is Clarify?

Clarify is an open-source documentation publishing tool for teams that want their docs to stay close to the codebase. It turns MDX content, OpenAPI specifications, and a typed `clarify.ts` configuration into a production-ready static documentation site.

The project is designed for product docs, API references, engineering handbooks, and AI-readable documentation portals that should be easy to version, customize, and self-host.

## Core Features

- **MDX-first authoring** — Write Markdown, embed React components, use built-in callouts/cards/code blocks, and keep examples, guides, and reference pages in one content workflow.
- **OpenAPI documentation** — Render OpenAPI 3.0/3.1 specs as navigable API reference pages and embed individual operations inside MDX guides.
- **Static site generation** — Build deployable static output with one HTML file per route, client-side navigation, copied public assets, and route-prefix support.
- **Built-in internationalization** — Organize localized content by locale folders, configure locale fallback behavior, and localize navigation/footer labels in `clarify.ts`.
- **Built-in full-text search** — Generate and serve Pagefind indexes in both `clarify dev` and `clarify build`, with current-language results and highlighted excerpts.
- **Typed configuration** — Define tabs, sidebars, navbar links, footer links, theme tokens, route prefixes, favicon/logo variants, and metadata with TypeScript.
- **Themeable React renderer** — Customize a Tailwind CSS 4 + React 19 documentation shell with presets, color tokens, radius tokens, and layout width settings.
- **AI-ready output** — Generate raw `.md` / `.openapi.*` artifacts, page copy actions, stable raw-content links, and `llms.txt` for AI agents and developer tools.
- **Plugin-ready pipeline** — Extend route resolution, virtual modules, and build completion hooks for governance, translation workflows, or custom artifacts.
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

## License

AGPL-3.0-only © 2026 Taicode Labs
