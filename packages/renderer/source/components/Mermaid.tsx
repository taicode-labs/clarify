import clsx from 'clsx'
import { lazy, Suspense, useEffect, useId, useState, type ReactNode } from 'react'

import { useBuiltInText } from '../core/i18n'
import { useTheme } from '../theme/ThemeProvider'

const MermaidViewer = lazy(() => import('./MermaidViewer'))

type MermaidProps = {
  chart: string
  className?: string
}

// A single shared promise so the (fairly large) mermaid bundle is only loaded
// once and only on the client, the first time a diagram becomes visible.
let mermaidModulePromise: Promise<typeof import('mermaid').default> | undefined

async function loadMermaid() {
  mermaidModulePromise = mermaidModulePromise ?? import('mermaid').then((module) => module.default)
  return mermaidModulePromise
}

export function Mermaid(arg0: MermaidProps): ReactNode {
  const { chart, className } = arg0

  const t = useBuiltInText()
  const { resolvedTheme } = useTheme()
  const reactId = useId()
  const renderId = `clarify-mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function renderChart() {
      const source = chart.trim()
      if (!source) {
        setSvg('')
        setError(undefined)
        return
      }

      try {
        const mermaid = await loadMermaid()
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          fontFamily: 'inherit',
        })
        const { svg: renderedSvg } = await mermaid.render(renderId, source)
        if (!cancelled) {
          setSvg(renderedSvg)
          setError(undefined)
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg('')
          setError(renderError instanceof Error ? renderError.message : String(renderError))
        }
      }
    }

    void renderChart()

    return () => {
      cancelled = true
    }
  }, [chart, renderId, resolvedTheme])

  if (error) {
    return (
      <div className={clsx('clarify-mermaid clarify-mermaid-error my-6 overflow-x-auto rounded-2xl border border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) p-4', className)}>
        <p className="text-sm font-semibold text-(--clarify-error-accent-text)">{t('mermaid.renderError')}</p>
        <pre className="mt-2 text-xs whitespace-pre-wrap text-(--clarify-ui-text-soft)">{error}</pre>
        <pre className="mt-2 text-xs whitespace-pre-wrap text-(--clarify-ui-text-faint)">{chart.trim()}</pre>
      </div>
    )
  }

  if (!svg) {
    // Before hydration / while loading, keep the raw source visible so the
    // diagram still conveys information and the layout does not jump abruptly.
    return (
      <div className={clsx('clarify-mermaid clarify-mermaid-loading not-prose my-6 overflow-x-auto rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-4', className)}>
        <pre className="text-xs text-(--clarify-ui-text-soft)">{chart.trim()}</pre>
      </div>
    )
  }

  return (
    <Suspense fallback={<MermaidStaticSvg svg={svg} className={className} />}>
      <MermaidViewer svg={svg} className={className} />
    </Suspense>
  )
}

type MermaidStaticSvgProps = { svg: string; className?: string }

function MermaidStaticSvg(arg0: MermaidStaticSvgProps): ReactNode {
  const { svg, className } = arg0

  return (
    <div className={clsx('clarify-mermaid not-prose my-6 overflow-x-auto rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-4', className)}>
      <div className="flex w-full justify-center [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
