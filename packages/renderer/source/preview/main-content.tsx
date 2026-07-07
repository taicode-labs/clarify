import type { ReactNode } from 'react'

import { embeddedEndpoint, embeddedGuide, methodStyleVars } from './fixtures'
import { OpenApiExamplesPreview } from './openapi'
import type { PreviewEndpoint } from './openapi'
import type { PreviewGuide, PreviewMetric } from './types'

type MethodBadgeProps = { method: string }

export function MethodBadge(arg0: MethodBadgeProps) {
  const method = arg0.method.toUpperCase()

  return (
    <span className={`rounded-md px-2.5 py-0.5 text-xs/6 font-black tracking-wide ${methodStyleVars[method] ?? 'bg-(--clarify-http-method-default-background) text-(--clarify-http-method-default-text)'}`}>
      {method}
    </span>
  )
}

type PreviewMetricGridProps = { metrics: PreviewMetric[] }

function PreviewMetricGrid(arg0: PreviewMetricGridProps) {
  const { metrics } = arg0

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-2.5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
          <div className="text-xs/5 text-(--clarify-ui-text-faint)">{metric.label}</div>
          <div className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">{metric.value}</div>
          {metric.hint ? <div className="text-xs/5 text-(--clarify-ui-text-faint)">{metric.hint}</div> : null}
        </div>
      ))}
    </div>
  )
}

type PreviewLabelProps = { children: ReactNode }

function PreviewLabel(arg0: PreviewLabelProps) {
  return <div className="text-xs/5 font-semibold uppercase tracking-wider text-(--clarify-ui-text-faint)">{arg0.children}</div>
}

type GuideSummaryPreviewProps = { guide: PreviewGuide }

function GuideSummaryPreview(arg0: GuideSummaryPreviewProps) {
  const { guide } = arg0

  return (
    <header className="border-b border-(--clarify-theme-tokens-colors-border) pb-4 dark:border-white/10">
      <PreviewLabel>{guide.label}</PreviewLabel>
      <h2 className="mt-1 text-xl/7 font-semibold tracking-tight text-(--clarify-ui-text-strong)">{guide.title}</h2>
      <p className="mt-2 max-w-2xl text-sm/6 text-(--clarify-ui-text-soft)">{guide.body}</p>
      <pre className="mt-3 overflow-hidden rounded-xl bg-zinc-950 px-3 py-2 text-xs/5 whitespace-pre-wrap text-zinc-300">{guide.embed}</pre>
    </header>
  )
}

type EndpointSummaryPreviewProps = { endpoint: PreviewEndpoint }

function EndpointSummaryPreview(arg0: EndpointSummaryPreviewProps) {
  const { endpoint } = arg0

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-medium text-(--clarify-ui-text)">{endpoint.path}</code>
      </div>
      <h3 className="mt-3 text-lg/7 font-semibold tracking-tight text-(--clarify-ui-text-strong)">{endpoint.summary}</h3>
      <p className="mt-1 text-sm/6 text-(--clarify-ui-text-soft)">{endpoint.description}</p>
    </div>
  )
}

type EmbeddedApiPreviewProps = { endpoint: PreviewEndpoint }

function EmbeddedApiPreview(arg0: EmbeddedApiPreviewProps) {
  const { endpoint } = arg0

  return (
    <div className="clarify-preview-api-frame min-w-0 overflow-hidden border-t border-(--clarify-theme-tokens-colors-border) pt-4 dark:border-white/10">
      <div className="clarify-preview-api-content clarify-preview-api-content-embedded">
        <OpenApiExamplesPreview endpoint={endpoint} />
      </div>
    </div>
  )
}

type OutputListPreviewProps = { outputs: string[] }

function OutputListPreview(arg0: OutputListPreviewProps) {
  const { outputs } = arg0

  return (
    <div className="border-t border-(--clarify-theme-tokens-colors-border) pt-4 dark:border-white/10">
      <PreviewLabel>Static output</PreviewLabel>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {outputs.map((output) => (
          <div key={output} className="flex items-center gap-2 rounded-lg bg-(--clarify-ui-subtle-background) px-3 py-2 text-xs/5 text-(--clarify-ui-text-soft) dark:bg-white/5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="truncate font-mono">{output}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MainContentPreview() {
  return (
    <section className="min-w-0 bg-(--clarify-theme-tokens-colors-background) px-5 py-4 dark:bg-zinc-950">
      <div className="clarify-preview-content-window overflow-hidden">
        <div className="space-y-4">
          <GuideSummaryPreview guide={embeddedGuide} />
          <PreviewMetricGrid metrics={[
            { label: 'MDX', value: 'Guide', hint: 'context' },
            { label: 'Spec', value: 'OpenAPI', hint: 'source' },
            { label: 'Out', value: 'Static', hint: 'CDN' },
          ]} />
          <div className="clarify-preview-endpoint-grid grid gap-4">
            <EndpointSummaryPreview endpoint={embeddedEndpoint} />
            <EmbeddedApiPreview endpoint={embeddedEndpoint} />
          </div>
          <OutputListPreview outputs={embeddedGuide.outputs ?? []} />
        </div>
      </div>
    </section>
  )
}
