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
- [x] Copy/adapt shared icons as they become needed by migrated components.
- [x] Replace `next/link` with React Router or plain anchors for migrated primitives.
- [x] Replace `next/navigation` with React Router hooks.
- [x] Replace `@/` aliases with relative imports for migrated primitives.
- [x] Export intended public primitives from `source/index.tsx`.

### Phase 3 — Shell integration

- [x] Replace current `TopNav`/`Sidebar` shell with reference layout structure.
- [x] Adapt navigation from static `navigation` groups to Clarify `NavigationNode[]`.
- [x] Feed current route sections into `SectionProvider`.
- [x] Preserve SSR behavior in `renderToHTML`.
- [x] Add responsive mobile navigation.

### Phase 4 — MDX and content components

- [x] Migrate reference `mdx.tsx` component mapping.
- [x] Integrate `Prose`, `Heading`, `Code`, and API components with Clarify MDX pages.
- [x] Ensure existing `DocShell`, `ApiEndpointCard`, `OpenApiPage` either adopt reference styling or remain as compatibility wrappers.
- [x] Decide whether to port reference MDX build transforms into the Clarify engine now located in `packages/cli`.

### Phase 5 — Search, theme, and polish

- [x] Add theme provider compatible with Vite/browser/SSR instead of `next-themes`.
- [x] Add search index wiring from Clarify route/content data.
- [x] Add code highlighting pipeline if needed.
- [x] Validate light/dark mode, mobile, anchors, active section highlighting.

### Phase 6 — OpenAPI reference rendering

- [x] Audit the reference API pages and confirm their endpoint UX is MDX-driven rather than a standalone OpenAPI component.
- [x] Upgrade Clarify's automatic OpenAPI pages from simple endpoint cards to reference-style endpoint sections.
- [x] Reuse the reference `Row`, `Col`, `Properties`, `Property`, `Heading`, and `CodeGroup` primitives for generated API documentation.
- [x] Render operation parameters, request body schemas, response summaries, cURL examples, and JSON response examples where OpenAPI data is available.
- [x] Preserve the existing `OpenApiPage`, `ApiEndpoint`, and `OpenApiEndpoint` public APIs.

### Phase 7 — OpenAPI multi-example rendering

- [x] Add a complex docs fixture endpoint covering multiple request media types, multiple examples, multiple response statuses, and multiple response media types.
- [x] Normalize OpenAPI media type and example entries instead of choosing only one primary content branch.
- [x] Use dropdown selectors for request media type, response status code, and response media type.
- [x] Render example choices as visible flat buttons, not a dropdown, while showing only the currently selected example body.
- [x] Keep generated schema examples as a fallback when explicit OpenAPI examples are unavailable.

## Current progress

Status: Reference UI migration complete, including OpenAPI reference rendering and multi-example selectors.

Completed in the first pass:

- Added reference UI foundation dependencies to `@clarify/renderer`.
- Ported Tailwind v4 theme tokens, dark variant, Shiki color variables, and typography plugin wiring.
- Added renderer-local `typography.ts` based on the reference typography system.
- Migrated portable primitives: `Button`, `Tag`, `Logo`, `Prose`.
- Updated compatibility components `DocShell` and `ApiEndpointCard` to use the reference visual language.
- Upgraded automatic OpenAPI rendering to generate reference-style endpoint detail sections.
- Added OpenAPI selectors for media types, response statuses, and flat visible example choices.
- Verified `pnpm --filter @clarify/renderer typecheck` and `pnpm --filter @clarify/renderer build`.

Final validation completed with `pnpm typecheck && pnpm test && pnpm build`.

## Decisions

- Use the reference UI as the visual source of truth.
- Do not migrate `src/app` directly; treat it as a Next.js-specific example.
- Prefer incremental adaptation over a big-bang replacement.
- Keep `packages/renderer/.reference` untouched as the comparison source.
