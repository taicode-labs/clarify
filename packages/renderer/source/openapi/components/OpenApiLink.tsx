import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { LocalizedLink } from '../../components/LocalizedLink'
import { useConfig, useLocale } from '../../core/context'
import { useBuiltInText } from '../../core/i18n'
import { localizeHref, prefixHref } from '../../utils/href'
import { useOpenApiSpec } from '../lib/spec-path'
import { getOpenApiOperationEntryById, getOpenApiOperationSectionId } from '../lib/utils'

import { EndpointMethodBadge } from './EndpointMethodBadge'

export type OpenApiLinkProps = {
  specPath: string
  operationId: string
  href?: string
  inline?: boolean
  className?: string
}

type OpenApiLinkViewProps = {
  href: string
  method: string
  path: string
  label: string
  className?: string
}

export function OpenApiLink(arg0: OpenApiLinkProps): ReactNode {
  const { specPath, operationId, href: hrefOverride, inline = false, className } = arg0
  const config = useConfig()
  const locale = useLocale()
  const t = useBuiltInText()
  const { spec, loading } = useOpenApiSpec(undefined, specPath)

  if (loading) return <span className={className}>{t('openapi.loading')}</span>

  const entry = spec ? getOpenApiOperationEntryById(spec, operationId) : undefined
  if (!entry) return <span className={className}>{t('openapi.endpointNotFound', { endpoint: operationId })}</span>

  const sectionId = getOpenApiOperationSectionId(entry.operation) || operationId
  const targetPath = hrefOverride ?? specPath
  const href = `${prefixHref(localizeHref(targetPath, config, locale), config.routePrefix)}#${sectionId}`
  const method = entry.method.toUpperCase()
  const title = entry.operation.summary?.trim() || ''

  if (inline) return <OpenApiLinkInline href={href} method={method} path={entry.path} label={title || entry.path} className={className} />
  return <OpenApiLinkBlock href={href} method={method} path={entry.path} label={title} className={className} />
}

function OpenApiLinkInline(arg0: OpenApiLinkViewProps): ReactNode {
  const { href, method, label, className } = arg0

  return (
    <LocalizedLink
      href={href}
      className={clsx(
        'clarify-openapi-link clarify-openapi-link-inline not-prose inline-flex max-w-full items-center gap-1.5 rounded-md bg-(--clarify-ui-active-background) py-px pr-1.5 pl-px align-[0.125em] text-(--clarify-theme-tokens-colors-foreground) no-underline transition-colors hover:bg-(--clarify-ui-accent-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`${method}: ${label}`}
    >
      <EndpointMethodBadge method={method} compact />
      <span className="truncate text-[0.8125rem]/5 font-medium">{label}</span>
    </LocalizedLink>
  )
}

function OpenApiLinkBlock(arg0: OpenApiLinkViewProps): ReactNode {
  const { href, method, path, label, className } = arg0

  return (
    <LocalizedLink
      href={href}
      className={clsx(
        'clarify-openapi-link not-prose group flex w-full items-center gap-3 rounded-lg border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 py-3 no-underline transition-colors hover:border-(--clarify-ui-accent-border) hover:bg-(--clarify-ui-hover-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2',
        className,
      )}
    >
      <EndpointMethodBadge method={method} />
      <span className="min-w-0 flex-1">
        <code className="block truncate bg-transparent p-0 font-mono text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{path}</code>
        {label ? <span className="mt-0.5 block truncate text-xs/5 text-(--clarify-ui-text-faint)">{label}</span> : null}
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-(--clarify-ui-text-faint) transition-colors group-hover:bg-(--clarify-theme-tokens-colors-surface) group-hover:text-(--clarify-ui-accent-text)">
        <ArrowRight aria-hidden="true" className="size-4" />
      </span>
    </LocalizedLink>
  )
}
