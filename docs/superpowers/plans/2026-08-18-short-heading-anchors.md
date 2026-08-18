# Stable Short Heading Anchors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support `## 推荐：自动配置 {#auto-config}` in both Markdown and MDX so every generated link uses the stable ASCII ID while existing Chinese fragment links continue to work.

**Architecture:** A shared CLI heading analyzer parses all H1-H6 headings in document order, computes the legacy GitHub slug and canonical ID, validates the document-wide ID namespace, and safely normalizes the author syntax before MDX parsing. Route metadata carries canonical H2/H3 sections plus a full legacy-to-canonical alias map; the renderer resolves every incoming fragment through that map, replaces legacy fragments in-place, and coordinates with scroll-driven hash sync through a shared navigation epoch.

**Tech Stack:** TypeScript, unified/remark, MDX 3, `github-slugger`, Vite, React 19, React Router 7, Vitest.

**Spec:** https://github.com/taicode-labs/clarify/issues/32

## Global Constraints

- The author syntax is a trailing heading marker: `## Visible title {#canonical-id}`.
- Explicit IDs must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` exactly.
- All Markdown headings H1-H6 share one document-order slug and collision namespace; only H2/H3 become navigation sections.
- A heading without an explicit ID keeps the existing GitHub slug behavior.
- An explicit heading keeps its old generated slug as an alias when it differs from the canonical ID.
- DOM IDs, navigation, quick search, heading permalinks, and scroll sync expose only canonical IDs; aliases are input compatibility data and never duplicate DOM IDs.
- Invalid IDs and cross-heading canonical/alias collisions produce a content diagnostic containing the relative file path and line/column locations.
- `.md` and `.mdx` use the same analyzer and compiler transformer.
- The original author source remains available to content artifacts and search; compiler-only normalization must not leak an internal marker into exported Markdown.
- Legacy normalization uses `history.replaceState`, preserves `history.state`, pathname, and query, and never adds a Back-stack entry.
- Unknown or malformed fragments are neither rewritten nor allowed to crash rendering.
- No new dependency is required: use the existing `remark`, `github-slugger`, `mdast-util-to-string`, and `unist-util-visit` packages.

---

### Task 1: Shared heading analyzer and compiler IDs

**Files:**

- Create: `packages/cli/source/parsers/markdown/headings.ts`
- Create: `packages/cli/source/parsers/markdown/headings.test.ts`
- Modify: `packages/cli/source/parsers/markdown/mdx.ts`
- Modify: `packages/cli/source/parsers/markdown/mdx.test.ts`
- Modify: `packages/cli/source/parsers/markdown/markdown.test.ts`
- Modify: `packages/cli/source/core/adapters.ts`
- Test: `packages/cli/source/parsers/markdown/headings.test.ts`
- Test: `packages/cli/source/parsers/markdown/mdx.test.ts`
- Test: `packages/cli/source/parsers/markdown/markdown.test.ts`

**Interfaces:**

- Consumes: author Markdown/MDX after frontmatter/content transforms and before MDX compilation.
- Produces:

```ts
export const HEADING_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type AnalyzedHeading = {
  level: 1 | 2 | 3 | 4 | 5 | 6
  title: string
  canonicalId: string
  legacyIds: string[]
  position: { line: number; column: number }
}

export type AnalyzeHeadingsOptions = {
  kind: 'markdown' | 'markdown+jsx'
  filePath?: string
  projectRoot?: string
}

export type HeadingAnalysis = {
  headings: AnalyzedHeading[]
  normalizedContent: string
  diagnostic?: ContentDiagnostic
}

export function analyzeHeadings(content: string, options: AnalyzeHeadingsOptions): HeadingAnalysis
export function remarkApplyHeadingIds(): (tree: unknown) => void
```

- The compiler-only normalized syntax is an empty internal link at the end of every heading, for example `[](clarify-internal-heading-id:auto-config)`. `remarkApplyHeadingIds` removes that node and trailing spacer, then sets `node.data.hProperties.id`. This syntax is valid in both MD and MDX before the MDX expression parser runs.

- [ ] **Step 1: Write analyzer tests that name the regressions**

Add literal expectations covering:

```ts
const result = analyzeHeadings([
  '# 页面',
  '## 推荐：自动配置 {#auto-config}',
  '### 推荐：自动配置',
].join('\n'), { kind: 'markdown+jsx' })

expect(result.headings).toEqual([
  expect.objectContaining({ level: 1, title: '页面', canonicalId: '页面', legacyIds: [] }),
  expect.objectContaining({ level: 2, title: '推荐：自动配置', canonicalId: 'auto-config', legacyIds: ['推荐自动配置'] }),
  expect.objectContaining({ level: 3, title: '推荐：自动配置', canonicalId: '推荐自动配置-1', legacyIds: [] }),
])
expect(result.normalizedContent).not.toContain('{#auto-config}')
expect(result.normalizedContent).toContain('clarify-internal-heading-id:auto-config')
```

Also cover ATX closing hashes, Setext headings, formatted heading text, and the unchanged duplicate slug sequence across H1-H6. For every test, the production break it catches is a wrong title, wrong document-order slug, visible marker, or non-compilable normalized source.

- [ ] **Step 2: Run the new analyzer tests and verify RED**

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/parsers/markdown/headings.test.ts
```

Expected: FAIL because `headings.ts` and its exports do not exist.

- [ ] **Step 3: Implement minimal analysis and safe preprocessing**

Parse with the existing `remark.parse`. For each `heading` in visit order:

1. Detect a final text-node suffix matching a whitespace-delimited `\{#([^{}]*)\}` marker.
2. Remove the marker from the display title before calling one shared `GithubSlugger.slug(title)` for that heading.
3. Use the explicit ID as `canonicalId` when valid; otherwise use the legacy slug for continued diagnostic rendering.
4. Record `[legacySlug]` only when the heading is explicit and `legacySlug !== canonicalId`.
5. Create source edits from mdast offsets, apply them from highest offset to lowest, and inject the internal link before ATX closing hashes or after the final inline child. Never stringify the complete document.
6. Build one namespace from every canonical ID and alias. If another heading already owns an ID, collect a diagnostic line with both `line:column` locations. Invalid explicit IDs get their own diagnostic line.
7. Return one `createContentDiagnostic` result titled `Heading ID error`, with kind/path from `AnalyzeHeadingsOptions` and all error lines in `details`.

`remarkApplyHeadingIds` must accept only an empty final `link` whose URL begins with the exact internal prefix, remove it, trim the preceding text node's injected space, and set the heading's `hProperties.id`.

- [ ] **Step 4: Verify the analyzer is GREEN**

Run the Step 2 command again. Expected: all analyzer tests pass with no diagnostic for valid fixtures.

- [ ] **Step 5: Write compiler pipeline tests and verify RED**

Extend `mdx.test.ts` to compile already-normalized `.mdx` and `.md` fixtures through `remarkPlugins` and assert:

```ts
expect(compiled).toContain('<_components.h2 id="auto-config">')
expect(compiled).not.toContain('clarify-internal-heading-id')
expect(compiled).not.toContain('{#auto-config}')
```

Keep the existing `overview`, Chinese duplicate, and raw `<h2 id="custom-id">` expectations. Extend `markdown.test.ts` so the lightweight Markdown diagnostic path accepts normalized stable-anchor input without invoking Shiki.

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/parsers/markdown/mdx.test.ts source/parsers/markdown/markdown.test.ts
```

Expected: at least the canonical ID assertion fails because the new remark transformer is not registered.

- [ ] **Step 6: Wire the transformer into every compiler path**

Prepend `remarkApplyHeadingIds` to the exported `remarkPlugins`, remove `rehype-slug`, and retain code-block/Shiki rehype plugins unchanged. In `createNormalizedContentPlugin`, call `analyzeHeadings(route.source.content, ...)` and return only `normalizedContent` to the MDX Vite transform. Do not overwrite `route.source.content`; content artifacts and indexes must continue to see the author's `{#id}` syntax.

The lightweight `compileMdxContent` and `compileMarkdownContent` functions receive normalized source from route discovery in Task 2, so they continue to skip the expensive rehype/Shiki pipeline.

- [ ] **Step 7: Run focused tests and typecheck**

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/parsers/markdown/headings.test.ts source/parsers/markdown/mdx.test.ts source/parsers/markdown/markdown.test.ts source/core/adapters.test.ts
pnpm --filter @clarify-labs/cli typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit Task 1**

```bash
git add packages/cli/source/parsers/markdown/headings.ts packages/cli/source/parsers/markdown/headings.test.ts packages/cli/source/parsers/markdown/mdx.ts packages/cli/source/parsers/markdown/mdx.test.ts packages/cli/source/parsers/markdown/markdown.test.ts packages/cli/source/core/adapters.ts
git commit -m "feat(cli): parse stable heading anchors"
```

---

### Task 2: Route metadata, diagnostics, and canonical links

**Files:**

- Modify: `packages/cli/source/types.ts`
- Modify: `packages/cli/source/parsers/routes/routes.ts`
- Modify: `packages/cli/source/parsers/routes/routes-discovery.test.ts`
- Modify: `packages/cli/source/core/runtime/virtual-modules.ts`
- Modify: `packages/cli/source/core/runtime/virtual-modules.test.ts`
- Modify: `packages/renderer/source/core/types.ts`
- Modify: `packages/renderer/source/shell/search/items.test.ts`

**Interfaces:**

- Consumes: `analyzeHeadings()` and `AnalyzedHeading[]` from Task 1.
- Produces:

```ts
export type ContentSection = {
  id: string
  title: string
  level: number
  aliases?: string[]
  badge?: string
  tags?: string[]
}

export type ContentRouteMeta = {
  // existing fields unchanged
  sections?: ContentSection[]
  headingAliases?: Record<string, string>
}
```

The renderer mirrors these as `RouteSection.aliases?: string[]` and `RouteItem.headingAliases?: Record<string, string>`.

- [ ] **Step 1: Write route discovery tests and verify RED**

Create `.md` and `.mdx` fixtures containing Chinese H1/H2/H3 headings, an explicit H2, and an explicit H1 or H3. Assert:

```ts
expect(route.meta.sections).toEqual([
  { id: 'auto-config', title: '推荐：自动配置', level: 2, aliases: ['推荐自动配置'] },
  { id: 'details', title: '详细说明', level: 3, aliases: ['详细说明'] },
])
expect(route.meta.headingAliases).toEqual({
  推荐自动配置: 'auto-config',
  详细说明: 'details',
})
```

Use distinct legacy IDs in the actual fixture. Add diagnostics for uppercase/Unicode/empty/leading-hyphen IDs, duplicate canonical IDs, canonical-to-alias collisions across H1/H2/H3, and assert `filePath`, both locations in `details`, and `title: 'Heading ID error'`. Confirm repeated automatic headings remain valid and receive suffixed canonical IDs.

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/parsers/routes/routes-discovery.test.ts
```

Expected: FAIL because routes still run their independent H2/H3 slugger and the new metadata fields are absent.

- [ ] **Step 2: Replace independent route slugging with the shared model**

In `findContentRoutes`, run `analyzeHeadings(page.content, { kind, filePath: fullPath, projectRoot: base })` once after content processing. Use its headings for the fallback H1 title and H2/H3 sections. Each section gets `id: canonicalId` and `aliases` only when non-empty. Build `headingAliases` from every H1-H6 `legacyIds` entry, mapping alias to canonical.

Compile `analysis.normalizedContent`, not raw author content, so `{#id}` never reaches MDX's expression parser. Set `diagnostic` to the heading diagnostic first; otherwise use the compile diagnostic. Keep `source.content: page.content` unchanged.

Delete the route-local `GithubSlugger`, `parseMdxTree`, and `extractMdxSections` logic. Update `navigationSections` so it exposes canonical IDs and visible labels only; it must not create navigation nodes for aliases.

- [ ] **Step 3: Verify route tests are GREEN**

Run the Step 1 command again. Expected: all route discovery tests pass.

- [ ] **Step 4: Write manifest and search tests and verify RED**

In `virtual-modules.test.ts`, generate both client and server modules from a route with section aliases and `headingAliases`; assert the parsed/serialized manifest contains both. In `items.test.ts`, provide a canonical section with a Chinese alias and assert the result URL is exactly `/guide#auto-config` while the searchable/display title remains Chinese.

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/core/runtime/virtual-modules.test.ts
pnpm --filter @clarify-labs/renderer exec vitest run source/shell/search/items.test.ts
```

Expected: manifest assertions fail because serialization drops aliases; the search expectation protects the existing canonical `section.id` consumer.

- [ ] **Step 5: Serialize metadata and mirror runtime types**

Add the optional fields to CLI and renderer types. In `routeToRuntimeManifestEntry`, copy `sections[].aliases` and copy `route.meta.headingAliases` only when it has keys. Do not add alias entries to navigation or search; their existing use of `section.id` now produces canonical URLs.

- [ ] **Step 6: Run focused tests and both typechecks**

Run:

```bash
pnpm --filter @clarify-labs/cli exec vitest run source/parsers/routes/routes-discovery.test.ts source/core/runtime/virtual-modules.test.ts
pnpm --filter @clarify-labs/renderer exec vitest run source/shell/search/items.test.ts
pnpm --filter @clarify-labs/cli typecheck
pnpm --filter @clarify-labs/renderer typecheck
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit Task 2**

```bash
git add packages/cli/source/types.ts packages/cli/source/parsers/routes/routes.ts packages/cli/source/parsers/routes/routes-discovery.test.ts packages/cli/source/core/runtime/virtual-modules.ts packages/cli/source/core/runtime/virtual-modules.test.ts packages/renderer/source/core/types.ts packages/renderer/source/shell/search/items.test.ts
git commit -m "feat(cli): expose canonical heading metadata"
```

---

### Task 3: Legacy hash canonicalization and scroll-sync coordination

**Files:**

- Create: `packages/renderer/source/app/heading-hash.ts`
- Create: `packages/renderer/source/app/heading-hash.test.ts`
- Modify: `packages/renderer/source/app/AppShell.tsx`
- Modify: `packages/renderer/source/app/AppShell.test.ts`
- Modify: `packages/renderer/source/app/SectionHashSync.tsx`
- Test: `packages/renderer/source/app/heading-hash.test.ts`
- Test: `packages/renderer/source/app/AppShell.test.ts`

**Interfaces:**

- Consumes: `RouteItem.headingAliases` and canonical `RouteSection.id` from Task 2.
- Produces:

```ts
export type ResolvedHeadingHash = {
  requestedId: string
  canonicalId: string
  wasAlias: boolean
}

export function resolveHeadingHash(
  hash: string,
  aliases?: Record<string, string>,
): ResolvedHeadingHash | undefined

export function canonicalHeadingUrl(
  location: Pick<Location, 'pathname' | 'search'>,
  canonicalId: string,
): string
```

`scrollToHeadingId(id: string)` replaces `scrollToHash(hash: string)` so decoding happens exactly once in the resolver. `SectionHashSync` receives both `hashScrollSuppressedUntilRef` and `hashNavigationEpochRef`.

- [ ] **Step 1: Write pure resolver tests and verify RED**

Use hand-derived fixtures for:

- `%E6%8E%A8%E8%8D%90%E8%87%AA%E5%8A%A8%E9%85%8D%E7%BD%AE` resolving through `{ 推荐自动配置: 'auto-config' }`.
- `#auto-config` remaining canonical without replacement.
- an unknown valid fragment remaining unchanged.
- malformed `%E0%A4%A` returning `undefined` without throwing.
- `/guide?lang=zh#auto-config` construction preserving path/query.

Run:

```bash
pnpm --filter @clarify-labs/renderer exec vitest run source/app/heading-hash.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the resolver and make it GREEN**

Decode with `decodeURIComponent` inside `try/catch`; do not use a helper that converts malformed encoding back into an apparently valid ID. Resolve `aliases?.[requestedId] ?? requestedId`, and set `wasAlias` only when the mapped value differs. Build the replacement URL with `encodeURIComponent(canonicalId)`.

Run the Step 1 command again. Expected: all resolver tests pass.

- [ ] **Step 3: Write navigation and debounce regression tests and verify RED**

Refactor the current AppShell hash side effect into exported, dependency-light helpers where necessary so Node-based Vitest can stub `window`, `document`, and timers. Preserve the existing five retry delays. Add behavior assertions that:

1. a legacy hash calls `replaceState` once with the existing history state and `/guide?lang=zh#auto-config`, then scrolls the `auto-config` DOM element;
2. a canonical hash scrolls without `replaceState`;
3. malformed and unknown missing-target fragments are not rewritten;
4. a native `hashchange` invokes the same coordinator used by React Router location changes;
5. a Back/Forward location change is handled once even if router and native events observe the same fragment;
6. a 120ms `SectionHashSync` callback captured before canonicalization cannot overwrite the canonical fragment;
7. manual wheel/touch/key/pointer input releases suppression and invalidates old timers so later visible-section sync still works.

Run:

```bash
pnpm --filter @clarify-labs/renderer exec vitest run source/app/AppShell.test.ts source/app/heading-hash.test.ts
```

Expected: the legacy replacement and epoch assertions fail against the existing direct hash lookup and enqueue-time-only suppression check.

- [ ] **Step 4: Implement one hash-navigation coordinator**

In `AppShell`:

1. Keep `hashNavigationEpochRef` and a last-handled location key next to `hashScrollSuppressedUntilRef`.
2. On every non-empty Router hash, native `hashchange`, or Back/Forward location update, increment the epoch, set suppression to `Infinity`, resolve against `currentRoute.headingAliases`, and cancel the previous retry cleanup.
3. If `wasAlias`, call `history.replaceState(history.state, '', canonicalHeadingUrl(window.location, canonicalId))` before scrolling. `replaceState` does not emit `hashchange`, so scroll immediately.
4. Scroll only with the resolved canonical ID. Keep the existing retry/cancel-on-manual-input behavior.
5. De-duplicate the router/native observation of the same `pathname + search + hash`; do not suppress a later genuine Back/Forward visit.
6. For an empty hash, increment the epoch, apply the existing finite top-scroll suppression, and scroll to the top.

In `SectionHashSync`, capture the epoch when scheduling the 120ms update. Inside the timeout, re-check both epoch equality and `Date.now() < hashScrollSuppressedUntilRef.current` before calling `replaceHash`. Cleanup still clears the timer. Manual input sets suppression to zero and increments the epoch, invalidating any stale callback.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm --filter @clarify-labs/renderer exec vitest run source/app/heading-hash.test.ts source/app/AppShell.test.ts
pnpm --filter @clarify-labs/renderer typecheck
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add packages/renderer/source/app/heading-hash.ts packages/renderer/source/app/heading-hash.test.ts packages/renderer/source/app/AppShell.tsx packages/renderer/source/app/AppShell.test.ts packages/renderer/source/app/SectionHashSync.tsx
git commit -m "feat(renderer): normalize legacy heading hashes"
```

---

### Task 4: Author documentation and integrated acceptance

**Files:**

- Modify: `packages/templates/standard/source/guides/writing-content.mdx`
- Modify: `packages/templates/complete/source/en-US/guides/writing-content.mdx`
- Modify: `packages/templates/complete/source/zh-CN/guides/writing-content.mdx`

**Interfaces:**

- Consumes: the shipped `{#canonical-id}` syntax and compatibility behavior from Tasks 1-3.
- Produces: copy-ready English and Chinese author guidance without changing the feature contract.

- [ ] **Step 1: Add stable-anchor author guidance**

Add a “Stable heading links” section after frontmatter in both English templates and “稳定的标题链接” in the Chinese template. Include this exact example:

````md
```mdx
## 推荐：自动配置 {#auto-config}
```
````

State that IDs use lowercase ASCII letters, numbers, and single hyphens; visible text can change without changing the URL; headings without a marker keep generated IDs; invalid/duplicate/conflicting IDs fail with a source location; and an old generated fragment is recognized then replaced in the address bar. Do not describe this as an HTTP redirect.

- [ ] **Step 2: Check the documentation diff**

Run:

```bash
git diff --check
pnpm --filter @clarify-labs/templates lint
```

If the templates package has no `lint` script, run the repository `pnpm lint` in Step 3 and record that the focused command was unavailable rather than inventing a passing check.

- [ ] **Step 3: Run fresh whole-repository verification**

Run exactly:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
git diff --check
```

Expected: every command exits 0. The already-known React unique-key warning may remain in baseline output, but no new warning is acceptable.

- [ ] **Step 4: Commit Task 4**

```bash
git add packages/templates/standard/source/guides/writing-content.mdx packages/templates/complete/source/en-US/guides/writing-content.mdx packages/templates/complete/source/zh-CN/guides/writing-content.mdx docs/superpowers/plans/2026-08-18-short-heading-anchors.md
git commit -m "docs: document stable heading anchors"
```

- [ ] **Step 5: Review the complete branch against Issue #32**

Verify every acceptance item against the branch diff and test evidence: short Chinese anchors, canonical DOM/navigation/search/permalink/scroll sync, unchanged implicit IDs, legacy fragment scrolling and replacement, diagnostics, `.md`/`.mdx`, duplicate and H1/H2/H3 collisions, native hash changes, and Back/Forward. Then request a whole-branch code review before publishing.
