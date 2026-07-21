import clsx from 'clsx'
import { type ReactNode } from 'react'

type OpenApiDocumentSectionProps = {
  title: ReactNode
  children: ReactNode
  action?: ReactNode
  className?: string
  bodyClassName?: string
  level?: 3 | 4
}

export function OpenApiDocumentSection(props: OpenApiDocumentSectionProps): ReactNode {
  const { title, children, action, className, bodyClassName, level = 3 } = props
  const heading = level === 3
    ? <h3 className="!m-0 text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{title}</h3>
    : <h4 className="!m-0 text-xs/5 font-semibold text-(--clarify-ui-text-soft)">{title}</h4>

  return (
    <section className={clsx('clarify-openapi-document-section', className)}>
      {action ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          {heading}
          {action}
        </div>
      ) : heading}
      <div className={clsx('mt-2', bodyClassName)}>{children}</div>
    </section>
  )
}
