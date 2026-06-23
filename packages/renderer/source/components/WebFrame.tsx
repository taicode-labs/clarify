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
          'clarify-web-frame not-prose my-10 overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-(--clarify-ui-accent-glow)',
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
        'clarify-web-frame not-prose my-10 overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-(--clarify-ui-accent-glow)',
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background) px-4">
        <span className="size-3 rounded-full bg-red-400" aria-hidden="true" />
        <span className="size-3 rounded-full bg-yellow-400" aria-hidden="true" />
        <span className="size-3 rounded-full bg-green-400" aria-hidden="true" />
        <span className="sr-only">{title}</span>
      </div>
      {frame}
    </div>
  )
}
