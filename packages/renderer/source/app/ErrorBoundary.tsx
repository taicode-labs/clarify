import { Component, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { copyTextToClipboard } from '../utils/clipboard'

type PageErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
  reloadLabel: string;
  detailsLabel: string;
  pathLabel: string;
  typeLabel: string;
  messageLabel: string;
  stackLabel: string;
  componentStackLabel: string;
  timestampLabel: string;
  copyLabel: string;
  copiedLabel: string;
  path: string;
}

type PageErrorBoundaryState = {
  error?: Error;
  errorInfo?: ErrorInfo;
  occurredAt?: string;
}

type PageErrorPanelProps = {
  title: string;
  description: string;
  reloadLabel: string;
  detailsLabel: string;
  pathLabel: string;
  typeLabel: string;
  messageLabel: string;
  stackLabel: string;
  componentStackLabel: string;
  timestampLabel: string;
  copyLabel: string;
  copiedLabel: string;
  path: string;
  error: Error;
  errorInfo?: ErrorInfo;
  occurredAt?: string;
}

function PageErrorPanel(props: PageErrorPanelProps) {
  const {
    title,
    description,
    reloadLabel,
    detailsLabel,
    pathLabel,
    typeLabel,
    messageLabel,
    stackLabel,
    componentStackLabel,
    timestampLabel,
    copyLabel,
    copiedLabel,
    path,
    error,
    errorInfo,
    occurredAt,
  } = props
  const [copiedStack, setCopiedStack] = useState(false)
  const stack = error.stack ?? error.message
  const componentStack = errorInfo?.componentStack?.trim()
  const stackText = componentStack ? `${stack}\n\n${componentStackLabel}\n${componentStack}` : stack
  const capturedAt = occurredAt ?? new Date().toISOString()

  async function copyStack() {
    if (!(await copyTextToClipboard(stackText))) return
    setCopiedStack(true)
    window.setTimeout(() => setCopiedStack(false), 1600)
  }

  return (
    <section className="mx-auto flex min-h-(--clarify-error-page-min-height) w-full max-w-4xl flex-col justify-center py-16 text-(--clarify-theme-tokens-colors-foreground)" aria-labelledby="clarify-render-error-title" role="alert">
      <div className="border-t-2 border-(--clarify-error-accent-text) pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-error-accent-text)">Render error</p>
            <h1 id="clarify-render-error-title" className="mt-3 text-3xl/9 font-semibold tracking-tight text-(--clarify-theme-tokens-colors-foreground)">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm/6 text-(--clarify-theme-tokens-colors-muted)">{description}</p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-4 py-2 text-sm/5 font-semibold text-white shadow-xs transition hover:opacity-90"
            onClick={() => window.location.reload()}
          >
            {reloadLabel}
          </button>
        </div>

        <dl className="mt-8 grid gap-px overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-border) sm:grid-cols-3">
          {[
            [pathLabel, path],
            [typeLabel, error.name],
            [timestampLabel, capturedAt],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-(--clarify-theme-tokens-colors-surface) px-4 py-3">
              <dt className="text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{label}</dt>
              <dd className="mt-1 truncate font-mono text-sm/6 text-(--clarify-ui-text-strong)" title={value}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background)">
          <div className="flex items-center justify-between gap-3 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3">
            <p className="text-sm/6 font-semibold text-(--clarify-ui-text-strong)">{detailsLabel}</p>
            <button
              type="button"
              className="rounded-(--clarify-theme-tokens-radius-sm) px-2 py-1 text-xs/5 font-semibold text-(--clarify-ui-text-soft) ring-1 ring-(--clarify-theme-tokens-colors-border) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
              onClick={copyStack}
            >
              {copiedStack ? copiedLabel : copyLabel}
            </button>
          </div>
          <div className="px-4 py-4 text-xs/5 text-(--clarify-ui-text)">
            <p className="font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{messageLabel}</p>
            <p className="mt-2 break-words font-mono text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{error.message}</p>
            <p className="mt-6 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{stackLabel}</p>
            <pre className="mt-2 max-h-(--clarify-error-details-max-height) overflow-auto whitespace-pre-wrap break-words font-mono">
              {stack}
            </pre>
            {componentStack ? (
              <>
                <p className="mt-6 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{componentStackLabel}</p>
                <pre className="mt-2 max-h-(--clarify-error-component-stack-max-height) overflow-auto whitespace-pre-wrap break-words font-mono">
                  {componentStack}
                </pre>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error, occurredAt: new Date().toISOString() }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[clarify] Failed to render page:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    const { error, errorInfo, occurredAt } = this.state
    if (!error) return this.props.children

    return (
      <PageErrorPanel
        title={this.props.title}
        description={this.props.description}
        reloadLabel={this.props.reloadLabel}
        detailsLabel={this.props.detailsLabel}
        pathLabel={this.props.pathLabel}
        typeLabel={this.props.typeLabel}
        messageLabel={this.props.messageLabel}
        stackLabel={this.props.stackLabel}
        componentStackLabel={this.props.componentStackLabel}
        timestampLabel={this.props.timestampLabel}
        copyLabel={this.props.copyLabel}
        copiedLabel={this.props.copiedLabel}
        path={this.props.path}
        error={error}
        errorInfo={errorInfo}
        occurredAt={occurredAt}
      />
    )
  }
}
