import type { ReactNode } from 'react'

type RenderErrorPanelMetadataItem = {
  label: string
  value: string
}

type RenderErrorPanelProps = {
  title: string
  description: string
  eyebrowLabel?: string
  action?: ReactNode
  metadata?: RenderErrorPanelMetadataItem[]
  detailsLabel: string
  detailsHeaderAction?: ReactNode
  detailsContent: ReactNode
  titleId?: string
}

export function RenderErrorPanel(props: RenderErrorPanelProps) {
  const {
    title,
    description,
    eyebrowLabel = 'Render error',
    action,
    metadata = [],
    detailsLabel,
    detailsHeaderAction,
    detailsContent,
    titleId = 'clarify-render-error-title',
  } = props

  return (
    <section className="mx-auto flex min-h-(--clarify-error-page-min-height) w-full max-w-4xl flex-col justify-center py-16 text-(--clarify-theme-tokens-colors-foreground)" aria-labelledby={titleId} role="alert">
      <div className="border-t-2 border-(--clarify-error-accent-text) pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-error-accent-text)">{eyebrowLabel}</p>
            <h1 id={titleId} className="mt-3 text-3xl/9 font-semibold tracking-tight text-(--clarify-theme-tokens-colors-foreground)">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm/6 text-(--clarify-theme-tokens-colors-muted)">{description}</p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {metadata.length > 0 ? (
          <dl className="mt-8 grid gap-px overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-border) sm:grid-cols-3">
            {metadata.map(({ label, value }) => (
              <div key={label} className="min-w-0 bg-(--clarify-theme-tokens-colors-surface) px-4 py-3">
                <dt className="text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{label}</dt>
                <dd className="mt-1 truncate font-mono text-sm/6 text-(--clarify-ui-text-strong)" title={value}>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background)">
          <div className="flex items-center justify-between gap-3 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3">
            <p className="text-sm/6 font-semibold text-(--clarify-ui-text-strong)">{detailsLabel}</p>
            {detailsHeaderAction ? <div className="shrink-0">{detailsHeaderAction}</div> : null}
          </div>
          <div className="px-4 py-4 text-xs/5 text-(--clarify-ui-text)">{detailsContent}</div>
        </div>
      </div>
    </section>
  )
}
