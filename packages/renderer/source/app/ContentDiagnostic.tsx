import type { ComponentType } from 'react'

import { RenderErrorPanel } from './RenderErrorPanel'

export type ContentDiagnosticKind = 'markdown' | 'markdown+jsx' | 'openapi' | 'route-load'

export type ContentDiagnostic = {
  kind: ContentDiagnosticKind
  title: string
  message: string
  details?: string
  filePath?: string
}

type ContentDiagnosticPanelProps = {
  data: ContentDiagnostic
}

function ContentDiagnosticPanel(params: ContentDiagnosticPanelProps) {
  const { data } = params
  const typeLabels: Record<ContentDiagnosticKind, string> = {
    markdown: 'Markdown',
    'markdown+jsx': 'MDX',
    openapi: 'OpenAPI',
    'route-load': 'Route',
  }
  const typeLabel = typeLabels[data.kind]
  const detailsLabel = data.kind === 'markdown+jsx' || data.kind === 'markdown' ? 'Why it happened' : 'Details'
  const pathLabel = 'File'

  return (
    <RenderErrorPanel
      title={data.title}
      description={data.message}
      titleId="clarify-content-diagnostic-title"
      metadata={[
        { label: pathLabel, value: data.filePath ?? 'Unknown' },
        { label: 'Type', value: typeLabel },
      ]}
      detailsLabel={detailsLabel}
      detailsContent={data.details ? (
        <pre className="max-h-(--clarify-error-details-max-height) overflow-auto whitespace-pre-wrap wrap-break-word font-mono">
          {data.details}
        </pre>
      ) : null}
    />
  )
}

export function createContentDiagnosticComponent(data: ContentDiagnostic): ComponentType {
  return function ContentDiagnosticComponent() {
    return <ContentDiagnosticPanel data={data} />
  }
}
