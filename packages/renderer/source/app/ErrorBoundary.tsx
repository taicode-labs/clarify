import { Component, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { copyTextToClipboard } from '../utils/clipboard'

import { RenderErrorPanel } from './RenderErrorPanel'

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
    <RenderErrorPanel
      title={title}
      description={description}
      action={(
        <button
          type="button"
          className="inline-flex shrink-0 items-center rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-4 py-2 text-sm/5 font-semibold text-white shadow-xs transition hover:opacity-90"
          onClick={() => window.location.reload()}
        >
          {reloadLabel}
        </button>
      )}
      metadata={[
        [pathLabel, path],
        [typeLabel, error.name],
        [timestampLabel, capturedAt],
      ].map(([label, value]) => ({ label, value: String(value) }))}
      detailsLabel={detailsLabel}
      detailsHeaderAction={(
        <button
          type="button"
          className="rounded-(--clarify-theme-tokens-radius-sm) px-2 py-1 text-xs/5 font-semibold text-(--clarify-ui-text-soft) ring-1 ring-(--clarify-theme-tokens-colors-border) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
          onClick={copyStack}
        >
          {copiedStack ? copiedLabel : copyLabel}
        </button>
      )}
      detailsContent={(
        <>
          <p className="font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{messageLabel}</p>
          <p className="mt-2 wrap-break-word font-mono text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{error.message}</p>
          <p className="mt-6 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{stackLabel}</p>
          <pre className="mt-2 max-h-(--clarify-error-details-max-height) overflow-auto whitespace-pre-wrap wrap-break-word font-mono">
            {stack}
          </pre>
          {componentStack ? (
            <>
              <p className="mt-6 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">{componentStackLabel}</p>
              <pre className="mt-2 max-h-(--clarify-error-component-stack-max-height) overflow-auto whitespace-pre-wrap wrap-break-word font-mono">
                {componentStack}
              </pre>
            </>
          ) : null}
        </>
      )}
    />
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
