import { compile, type CompileOptions } from '@mdx-js/mdx'

import type { ContentDiagnostic } from '../../types.js'

import { createContentCompileDiagnostic, remarkPlugins } from './mdx.js'

type CompileMarkdownContentOptions = {
  filePath?: string
  projectRoot?: string
}

/**
 * Validate Markdown content for diagnostics WITHOUT running the build-time
 * rehype pipeline (Shiki highlighting, slug injection, code-block parsing).
 *
 * `rehypePlugins` includes `rehypeShiki`, which loads grammar/WASM assets and
 * is expensive. The real highlighting happens at Vite build time via the
 * `@mdx-js/rollup` plugin (see `createContentCompilerPlugin` in
 * `core/adapters.ts`), which runs the full remark + rehype pipeline.
 * Re-running it here, during route discovery (Phase 3), would compile every
 * `.md` file twice and invoke Shiki once per file per `engine.refresh()` -
 * see ARCHITECTURE.md §2.2 which states "不应在 core 中执行代码高亮".
 *
 * `format: 'md'` mirrors the adapter's markdown compiler semantics (no JSX,
 * raw HTML allowed via `remarkRehypeOptions`), so the same class of syntax
 * errors that would break the Vite build is surfaced as a diagnostic here
 * instead of leaking out as an opaque
 * `Failed to fetch dynamically imported module` at runtime.
 *
 * MDX files are handled by `compileMdxContent` in `mdx.ts`. Keep the two
 * compilers separate so each format can evolve its own diagnostic rules
 * without contaminating the other.
 */
export async function compileMarkdownContent(content: string, options: CompileMarkdownContentOptions = {}): Promise<{ ok: true } | { ok: false; diagnostic: ContentDiagnostic }> {
  const { filePath, projectRoot } = options
  try {
    await compile(content, {
      format: 'md',
      jsx: true,
      providerImportSource: '@clarify-labs/renderer',
      remarkPlugins: remarkPlugins as CompileOptions['remarkPlugins'],
      remarkRehypeOptions: { allowDangerousHtml: true },
      // NOTE: `rehypePlugins` intentionally omitted. See JSDoc above.
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      diagnostic: createContentCompileDiagnostic({ format: 'markdown', phase: 'syntax', error, filePath, projectRoot }),
    }
  }
}
