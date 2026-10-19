import clsx from 'clsx'

type SkeletonBlockProps = {
  className?: string;
}

const paragraphLines = ['w-full', 'w-11/12', 'w-4/5']
const codeLines = ['w-5/6', 'w-2/3', 'w-3/4', 'w-1/2']

function SkeletonBlock(props: SkeletonBlockProps) {
  return <div aria-hidden="true" className={clsx('rounded-(--clarify-skeleton-radius) bg-(--clarify-skeleton-background)', props.className)} />
}

function SkeletonParagraph() {
  return (
    <div className="space-y-3">
      {paragraphLines.map((width) => (
        <SkeletonBlock key={width} className={clsx('h-3', width)} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <section className="clarify-page-skeleton animate-pulse space-y-10 py-8" aria-label="Loading page">
      <div className="space-y-5">
        <SkeletonBlock className="h-3 w-24 rounded-full bg-(--clarify-skeleton-accent-background)" />
        <SkeletonBlock className="h-11 w-full max-w-(--clarify-skeleton-title-width) rounded-(--clarify-theme-tokens-radius-lg)" />
        <div className="max-w-3xl space-y-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-(--clarify-skeleton-card-radius) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-(--clarify-ui-shadow-raised) shadow-zinc-900/5">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-10 w-10 shrink-0 bg-(--clarify-skeleton-accent-background)" />
              <div className="min-w-0 flex-1 space-y-4">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonParagraph />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <article className="space-y-5">
          <SkeletonBlock className="h-7 w-full max-w-(--clarify-skeleton-heading-width) rounded-(--clarify-theme-tokens-radius-lg)" />
          <SkeletonParagraph />
          <div className="rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-ui-border) bg-(--clarify-ui-subtle-background) p-4">
            <SkeletonBlock className="h-4 w-full max-w-(--clarify-skeleton-line-width) bg-(--clarify-skeleton-accent-background)" />
          </div>
        </article>

        <div className="overflow-hidden rounded-(--clarify-skeleton-block-radius) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-surface-elevated)">
          <div className="flex items-center gap-2 border-b border-(--clarify-ui-border) bg-(--clarify-ui-subtle-background) px-4 py-3">
            <SkeletonBlock className="h-3 w-3 rounded-full" />
            <SkeletonBlock className="h-3 w-3 rounded-full" />
            <SkeletonBlock className="h-3 w-3 rounded-full" />
            <SkeletonBlock className="ml-3 h-3 w-32" />
          </div>
          <div className="space-y-3 p-4">
            {codeLines.map((width) => (
              <SkeletonBlock key={width} className={clsx('h-3', width)} />
            ))}
          </div>
        </div>

        <article className="space-y-5">
          <SkeletonBlock className="h-7 w-full max-w-(--clarify-skeleton-heading-short-width) rounded-(--clarify-theme-tokens-radius-lg)" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) p-4">
                <SkeletonBlock className="mb-3 h-4 w-1/2" />
                <SkeletonBlock className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
