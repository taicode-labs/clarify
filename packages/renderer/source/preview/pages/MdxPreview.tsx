import { Chrome } from '../chrome'
import { PreviewEnvironment } from '../environment'
import { embeddedEndpoint } from '../fixtures'
import { MethodBadge } from '../main-content'

export function MdxPreview() {
  return (
    <PreviewEnvironment>
      <Chrome title="source/started/index.mdx" status="Rendered by renderer">
        <div className="clarify-preview-body overflow-x-hidden overflow-y-auto bg-(--clarify-theme-tokens-colors-background) p-4 sm:p-5 dark:bg-zinc-950">
          <article className="max-w-3xl text-sm/7 text-(--clarify-ui-text-soft)">
            <div className="inline-flex rounded-full bg-(--clarify-ui-accent-background) px-3 py-1 text-xs/5 font-semibold text-(--clarify-ui-accent-text)">MDX page</div>
            <h2 className="mt-3 text-xl/7 font-semibold tracking-tight text-(--clarify-ui-text-strong) sm:text-2xl/8">Get Started</h2>
            <p className="mt-3">Write pages in source/. Clarify turns MDX, config, and OpenAPI files into routes.</p>
            <div className="mt-4 rounded-2xl border border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) p-4 text-sm/6 text-(--clarify-ui-text-strong) sm:mt-5">
              <div className="font-semibold text-(--clarify-ui-text-strong)">Static output ready</div>
              <p className="mt-1">output/ is plain static files.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                <h3 className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">MDX pages</h3>
                <p className="mt-2 text-sm/6">Guides live beside code.</p>
              </div>
              <div className="rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                <h3 className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">API embeds</h3>
                <p className="mt-2 text-sm/6">Specs render inline.</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <MethodBadge method={embeddedEndpoint.method} />
                <code className="text-sm font-medium text-(--clarify-ui-text)">{embeddedEndpoint.path}</code>
              </div>
              <p className="mt-3 text-sm/6">{embeddedEndpoint.description}</p>
            </div>
          </article>
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}
