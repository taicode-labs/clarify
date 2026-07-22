import clsx from 'clsx'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch'

import { useBuiltInText } from '../core/i18n'

type MermaidViewerProps = {
  svg: string
  className?: string
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

export function MermaidViewer(arg0: MermaidViewerProps): ReactNode {
  const { svg, className } = arg0

  const t = useBuiltInText()
  const containerRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      onPointerDown={() => containerRef.current?.focus()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={clsx('clarify-mermaid group not-prose relative my-6 resize-y overflow-hidden rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)', className)}
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
          wrapperClass="!h-full !w-full !cursor-grab active:!cursor-grabbing"
          contentClass="!h-full !w-full justify-center [&_svg]:h-auto [&_svg]:max-w-full"
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

export default MermaidViewer
