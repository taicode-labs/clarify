import clsx from 'clsx'
import type { ReactNode } from 'react'

const endpointMethodStyleVars: Record<string, string> = {
  GET: 'bg-(--clarify-http-method-get-background) text-(--clarify-http-method-get-text)',
  POST: 'bg-(--clarify-http-method-post-background) text-(--clarify-http-method-post-text)',
  PUT: 'bg-(--clarify-http-method-put-background) text-(--clarify-http-method-put-text)',
  PATCH: 'bg-(--clarify-http-method-patch-background) text-(--clarify-http-method-patch-text)',
  DELETE: 'bg-(--clarify-http-method-delete-background) text-(--clarify-http-method-delete-text)',
  WEBHOOK: 'bg-(--clarify-http-method-webhook-background) text-(--clarify-http-method-webhook-text)',
}

type EndpointMethodBadgeProps = { method: string }

export function EndpointMethodBadge(arg0: EndpointMethodBadgeProps): ReactNode {
  const { method } = arg0

  return (
    <span
      className={clsx(
        'rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-0.5 text-xs/6 font-black tracking-wide',
        endpointMethodStyleVars[method] ?? 'bg-(--clarify-http-method-default-background) text-(--clarify-http-method-default-text)',
      )}
    >
      {method}
    </span>
  )
}
