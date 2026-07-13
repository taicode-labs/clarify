import clsx from 'clsx'
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from 'react'

export type WebFrameProps = {
  src?: string
  title?: string
  children?: ReactNode
  showWindow?: boolean
  className?: string
  iframeClassName?: string
  height?: CSSProperties['height']
} & Omit<ComponentPropsWithoutRef<'iframe'>, 'children' | 'className' | 'height' | 'src' | 'title'>

export function WebFrame(arg0: WebFrameProps) {
  const {
    src,
    title = 'Embedded content',
    children,
    showWindow = true,
    className,
    iframeClassName,
    height = 420,
    style,
    ...props
  } = arg0

  const frame = src ? (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      className={clsx('block w-full flex-1 border-0 bg-white', iframeClassName)}
      style={{ height, ...style }}
      {...props}
    />
  ) : (
    <div className={clsx('min-h-0 flex-1 overflow-auto bg-white text-zinc-950', iframeClassName)} style={{ height, ...style }}>
      {children}
    </div>
  )

  if (!showWindow) {
    return (
      <div
        className={clsx(
          'clarify-web-frame not-prose my-10 overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-lg shadow-zinc-900/5 dark:shadow-none',
          className,
        )}
      >
        {frame}
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'clarify-web-frame not-prose my-10 overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-lg shadow-zinc-900/5 dark:shadow-none',
        className,
      )}
    >
      <div className="grid h-10 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-3 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background) px-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="truncate rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 py-1 text-center text-xs text-(--clarify-ui-text-faint)">{title}</div>
        <span aria-hidden="true" />
      </div>
      {frame}
    </div>
  )
}
