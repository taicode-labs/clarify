# Renderer Reference Migration Plan

This document tracks the migration from `packages/renderer/.reference` into the Clarify renderer package.

## Goal

Adopt the high-quality reference documentation UI as the default Clarify renderer, while keeping Clarify's current architecture:

- Vite library package, not Next.js app runtime.
- React Router based routing supplied by `virtual:clarify-routes`.
- Clarify config supplied by `virtual:clarify-config`.
- MDX/OpenAPI content supplied by Clarify data and existing renderer APIs.
- Source directory remains `source/`.

## Reference inventory

Reference source shape:

- `src/components/`: UI shell, navigation, MDX primitives, code blocks, search, theme controls, marketing/resource cards.
- `src/styles/tailwind.css`: Tailwind v4 tokens, dark variant, typography plugin config hook, Shiki color variables.
- `typography.ts`: Tailwind typography plugin customization.
- `src/lib/remToPx.ts`: navigation layout utility.
- `src/app/`: Next.js app pages/layout/providers; useful as behavior/design reference, not copied directly.
- `src/mdx/`: Next/MDX build-time transforms; migrate later only if needed by Clarify's Vite plugin pipeline.
- `src/images/`: SDK/logo assets for reference sample content; not needed for core renderer.

## Source organization

The renderer source tree is organized by responsibility:

- `app/`: top-level app shell and route composition.
- `components/`: portable visual primitives and UI state providers migrated from the reference.
- `mdx/`: MDX component mapping and MDX-only adapters.
- `openapi/`: OpenAPI React views and OpenAPI data utilities.
- `runtime/`: browser hydration and SSR implementation entries.
- `shell/`: navigation and layout shell components.
- `utils/`: framework-independent helpers.
- root files: public package entry (`index.tsx`), compatibility SSR entry (`server.tsx`), shared contexts/types/styles.

## Migration strategy

### Phase 0 — Planning and safety rails

- [x] Inspect current renderer architecture.
- [x] Inspect reference structure and dependencies.
- [x] Create this migration tracker.
- [x] Keep every migration step buildable/typecheckable.
- [x] Avoid copying Next.js app-runtime assumptions into Clarify runtime.

### Phase 1 — Foundation configuration

- [x] Add runtime dependencies required by portable reference components.
- [x] Add Tailwind typography plugin support.
- [x] Port reference style tokens into `source/styles.css`.
- [x] Add renderer-local Tailwind typography config.
- [x] Verify Vite library build still externalizes React/router peers and builds renderer helpers safely.

Initial dependency candidates:

- Runtime: `clsx`, `framer-motion`, `zustand`, `@headlessui/react`.
- Styling: `@tailwindcss/typography`.
- Later/search/code only: `react-highlight-words`, `flexsearch`, `shiki`.

### Phase 2 — Portable primitives

- [x] Establish a responsibility-based `source/` directory structure for continued migration.
- [x] Copy/adapt low-risk primitives that do not require Next.js: `Button`, `Tag`, `Logo`, `Prose`.
- [x] Copy/adapt section primitives: `remToPx`, `SectionProvider`.
- [x] Copy/adapt heading primitive: `Heading`.
- [x] Copy/adapt remaining low-risk primitives: `GridPattern`, `HeroPattern`, `Feedback`.
- [ ] Copy/adapt shared icons as they become needed by migrated components.
- [x] Replace `next/link` with React Router or plain anchors for migrated primitives.
- [ ] Replace `next/navigation` with React Router hooks.
- [x] Replace `@/` aliases with relative imports for migrated primitives.
- [x] Export intended public primitives from `source/index.tsx`.

### Phase 3 — Shell integration

- [ ] Replace current `TopNav`/`Sidebar` shell with reference layout structure.
- [ ] Adapt navigation from static `navigation` groups to Clarify `NavigationNode[]`.
- [ ] Feed current route sections into `SectionProvider`.
- [ ] Preserve SSR behavior in `renderToHTML`.
- [ ] Add responsive mobile navigation.

### Phase 4 — MDX and content components

- [ ] Migrate reference `mdx.tsx` component mapping.
- [ ] Integrate `Prose`, `Heading`, `Code`, and API components with Clarify MDX pages.
- [ ] Ensure existing `DocShell`, `ApiEndpointCard`, `OpenApiPage` either adopt reference styling or remain as compatibility wrappers.
- [ ] Decide whether to port reference MDX build transforms into `packages/vite-plugin`.

### Phase 5 — Search, theme, and polish

- [ ] Add theme provider compatible with Vite/browser/SSR instead of `next-themes`.
- [ ] Add search index wiring from Clarify route/content data.
- [ ] Add code highlighting pipeline if needed.
- [ ] Validate light/dark mode, mobile, anchors, active section highlighting.

## Current progress

Status: Phase 1 complete, Phase 2 started.

Completed in the first pass:

- Added reference UI foundation dependencies to `@clarify/renderer`.
- Ported Tailwind v4 theme tokens, dark variant, Shiki color variables, and typography plugin wiring.
- Added renderer-local `typography.ts` based on the reference typography system.
- Migrated portable primitives: `Button`, `Tag`, `Logo`, `Prose`.
- Updated compatibility components `DocShell` and `ApiEndpointCard` to use the reference visual language.
- Verified `pnpm --filter @clarify/renderer typecheck` and `pnpm --filter @clarify/renderer build`.

Next recommended step: migrate `GridPattern`, `HeroPattern`, `Feedback`, then replace the shell/navigation with React Router adaptations.

## Decisions

- Use the reference UI as the visual source of truth.
- Do not migrate `src/app` directly; treat it as a Next.js-specific example.
- Prefer incremental adaptation over a big-bang replacement.
- Keep `packages/renderer/.reference` untouched as the comparison source.
