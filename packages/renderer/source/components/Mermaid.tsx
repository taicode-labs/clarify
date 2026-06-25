import clsx from 'clsx'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch'

import { useBuiltInText } from '../core/i18n'
import { useTheme } from '../theme/ThemeProvider'

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

function ZoomControls(): ReactNode {
  const { zoomIn, zoomOut, resetTransform } = useControls()
  const t = useBuiltInText()

  const buttonClassName = 'flex h-7 w-7 items-center justify-center rounded-md bg-(--clarify-theme-tokens-colors-surface) text-(--clarify-ui-text-soft) shadow-xs ring-1 ring-(--clarify-theme-tokens-colors-border) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)'

  return (
    <div className="clarify-mermaid-controls absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
      <button type="button" aria-label={t('mermaid.zoomIn')} title={t('mermaid.zoomIn')} onClick={() => zoomIn()} className={buttonClassName}>
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={t('mermaid.zoomOut')} title={t('mermaid.zoomOut')} onClick={() => zoomOut()} className={buttonClassName}>
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={t('mermaid.resetZoom')} title={t('mermaid.resetZoom')} onClick={() => resetTransform()} className={buttonClassName}>
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function Mermaid(arg0: MermaidProps): ReactNode {
  const { chart, className } = arg0

  const t = useBuiltInText()
  const { resolvedTheme } = useTheme()
  const reactId = useId()
  const renderId = `clarify-mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [focused, setFocused] = useState(false)

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
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      onPointerDown={() => containerRef.current?.focus()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={clsx('clarify-mermaid group not-prose relative my-6 overflow-hidden rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)', className)}
    >
      <TransformWrapper
        minScale={0.5}
        maxScale={8}
        initialScale={1}
        centerOnInit
        smooth
        wheel={{ step: 0.05, wheelDisabled: !focused, touchPadDisabled: !focused }}
        doubleClick={{ mode: 'reset' }}
      >
        <ZoomControls />
        <TransformComponent
          wrapperClass="!w-full !cursor-grab active:!cursor-grabbing"
          contentClass="!w-full justify-center [&_svg]:h-auto [&_svg]:max-w-full"
          wrapperStyle={{ height: 'min(70vh, 32rem)' }}
        >
          <div className="flex h-full w-full items-center justify-center p-4" dangerouslySetInnerHTML={{ __html: svg }} />
        </TransformComponent>
        <p
          className={clsx(
            'clarify-mermaid-hint pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-(--clarify-theme-tokens-colors-surface)/90 px-2.5 py-1 text-2xs text-(--clarify-ui-text-soft) shadow-xs ring-1 ring-(--clarify-theme-tokens-colors-border) backdrop-blur-sm transition',
            focused ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          {t('mermaid.scrollHint')}
        </p>
      </TransformWrapper>
    </div>
  )
}
