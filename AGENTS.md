# AGENTS.md

## Project Overview

Clarify is an open-source documentation publishing tool built for MDX and OpenAPI. It is a monorepo using pnpm workspaces, React + Tailwind CSS + TypeScript + Vite.

## Architecture

```
apps/
  docs/          — Documentation playground and dev site (port 5173)
  www/           — Marketing / landing page (port 5174)
packages/
  renderer/      — Shared React components (DocShell, ApiEndpointCard, etc.)
  vite-plugin/   — Vite plugin entry for Clarify docs engine
```

## Key Conventions

| Convention | Value | Rationale |
|------------|-------|-----------|
| Package manager | pnpm | Deterministic, fast, workspace-native |
| Source directory | `source/` | Team preference over `src/` |
| Primary docs language | English | Chinese translations in `.zh-CN.md` |
| React version | 19 | Latest stable |
| Tailwind version | 4 | `@tailwindcss/vite` integration |
| Build tool for apps | Vite 7 | Fast HMR, production-optimized |
| Build tool for packages | tsup | Fast ESM/CJS + DTS builds |

## Development Guidelines

### Adding a new workspace

1. Create a new directory under `apps/` or `packages/`.
2. Use `source/` as the code directory.
3. Add `package.json` with `type: "module"`.
4. For packages, set up `tsup` for build + type declarations.
5. For apps, set up `vite` + `@tailwindcss/vite` + `@vitejs/plugin-react`.

### Cross-package dependencies

- In `apps/docs`, depend on `@clarify/renderer`.
- In `package.json` dependencies, use `workspace:*` or the local version (e.g., `0.1.0`).
- In `tsconfig.json`, map the package path to the `source/` directory for type-checking.
- In `vite.config.ts`, add a `resolve.alias` pointing to the package source entry to avoid pre-build requirements during development.

### Styling

- Use Tailwind CSS utility classes.
- Keep component styles in the component file (or co-located CSS) rather than global stylesheets.
- Use CSS variables for theme tokens when needed.

### Testing & Quality

- All code should be TypeScript with `strict: true`.
- Prefer explicit types over `any`.
- Keep packages tree-shakeable (avoid side-effectful imports).

## Common Pitfalls

- **Do not use `npm` or `yarn`**. All commands are `pnpm`.
- **Do not use `src/`**. The project convention is `source/`.
- **Build order**: When building an app that depends on a local package, ensure the package is built first, or use a Vite alias to the source to bypass the build dependency.

## Resources

- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [tsup](https://tsup.egoist.dev/)
