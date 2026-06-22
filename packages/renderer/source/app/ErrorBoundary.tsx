import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type PageErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
  reloadLabel: string;
  detailsLabel: string;
  pathLabel: string;
  path: string;
}

type PageErrorBoundaryState = {
  error?: Error;
  errorInfo?: ErrorInfo;
}

type PageErrorPanelProps = {
  title: string;
  description: string;
  reloadLabel: string;
  detailsLabel: string;
  pathLabel: string;
  path: string;
  error: Error;
  errorInfo?: ErrorInfo;
}

function PageErrorPanel(props: PageErrorPanelProps) {
  const { title, description, reloadLabel, detailsLabel, pathLabel, path, error, errorInfo } = props

  return (
    <section className="mx-auto flex min-h-(--clarify-error-page-min-height) max-w-2xl flex-col justify-center py-16 text-(--clarify-theme-tokens-colors-foreground)" aria-labelledby="clarify-render-error-title" role="alert">
      <div className="rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-6 shadow-sm shadow-zinc-900/5">
        <p className="text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-theme-tokens-colors-primary)">Render error</p>
        <h1 id="clarify-render-error-title" className="mt-2 text-2xl/8 font-semibold tracking-tight text-(--clarify-theme-tokens-colors-foreground)">{title}</h1>
        <p className="mt-3 text-sm/6 text-(--clarify-theme-tokens-colors-muted)">{description}</p>
        <p className="mt-4 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-3 py-2 font-mono text-xs/5 text-(--clarify-ui-text)">
          {pathLabel}: {path}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-3 py-2 text-sm/5 font-semibold text-white shadow-xs transition hover:opacity-90"
            onClick={() => window.location.reload()}
          >
            {reloadLabel}
          </button>
        </div>
        <details className="mt-5 rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background) p-3 text-xs/5 text-(--clarify-ui-text)">
          <summary className="cursor-pointer font-semibold text-(--clarify-ui-text-strong)">{detailsLabel}</summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono">
            {error.stack ?? error.message}
            {errorInfo?.componentStack ? `\n${errorInfo.componentStack}` : ''}
          </pre>
        </details>
      </div>
    </section>
  )
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[clarify] Failed to render page:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    const { error, errorInfo } = this.state
    if (!error) return this.props.children

    return (
      <PageErrorPanel
        title={this.props.title}
        description={this.props.description}
        reloadLabel={this.props.reloadLabel}
        detailsLabel={this.props.detailsLabel}
        pathLabel={this.props.pathLabel}
        path={this.props.path}
        error={error}
        errorInfo={errorInfo}
      />
    )
  }
}
