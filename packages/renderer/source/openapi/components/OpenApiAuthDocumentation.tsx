import { type ReactNode } from 'react'

import { Tabs } from '../../components'
import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'

import type { AuthOption } from './ExamplePanels'
import { OpenApiDocumentSection } from './OpenApiDocumentSection'

function authSchemeType(option: AuthOption['schemes'][number], apiKeyLabel: string): string {
  const { scheme } = option
  if (scheme.type === 'http') return scheme.scheme?.toUpperCase() || 'HTTP'
  if (scheme.type === 'apiKey') return apiKeyLabel
  if (scheme.type === 'oauth2') return 'OAUTH 2.0'
  if (scheme.type === 'openIdConnect') return 'OPENID CONNECT'
  return scheme.type?.toUpperCase() || 'AUTH'
}

type OpenApiAuthDocumentationProps = {
  options: AuthOption[]
}

export function OpenApiAuthDocumentation(props: OpenApiAuthDocumentationProps): ReactNode {
  const { options } = props
  const t = useBuiltInText()

  if (options.length === 0) return null

  const renderOption = (option: AuthOption) => option.schemes.length === 0 ? (
    <div className="border-b border-(--clarify-theme-tokens-colors-border) pt-2 pb-4 text-sm/6 font-medium text-(--clarify-theme-tokens-colors-foreground)">{t('openapi.authNoAuth')}</div>
  ) : (
    <div className="divide-y divide-(--clarify-theme-tokens-colors-border) border-b border-(--clarify-theme-tokens-colors-border)">
      {option.schemes.map((schemeOption, schemeIndex) => {
        const { scheme } = schemeOption
        const details = [
          scheme.type === 'apiKey' && scheme.in && scheme.name
            ? t('openapi.authLocation', { in: scheme.in, name: scheme.name })
            : undefined,
          scheme.type === 'http' && scheme.bearerFormat
            ? t('openapi.authBearerFormat', { format: scheme.bearerFormat })
            : undefined,
          scheme.type === 'openIdConnect' ? scheme.openIdConnectUrl : undefined,
          schemeOption.scopes.length > 0
            ? t('openapi.authScopes', { scopes: schemeOption.scopes.join(', ') })
            : undefined,
        ].filter((value): value is string => Boolean(value))

        return (
          <div key={schemeOption.name}>
            {schemeIndex > 0 ? (
              <div className="relative h-0">
                <span className="absolute top-0 left-4 -translate-y-1/2 bg-(--clarify-theme-tokens-colors-background) px-1.5 text-2xs font-semibold text-(--clarify-ui-text-faint)">{t('openapi.authAnd')}</span>
              </div>
            ) : null}
            <div className="py-4 first:pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{schemeOption.name}</span>
                <span className="rounded bg-(--clarify-ui-subtle-background) px-1.5 py-0.5 text-2xs font-semibold text-(--clarify-ui-text-soft)">{authSchemeType(schemeOption, t('openapi.authApiKey'))}</span>
              </div>
              {scheme.description ? <Markdown className="mt-2 text-sm/6 text-(--clarify-ui-text-soft) *:first:mt-0 *:last:mb-0">{scheme.description}</Markdown> : null}
              {details.length > 0 ? (
                <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs/5 text-(--clarify-ui-text-faint)">
                  {details.map((detail) => <span key={detail} className="min-w-0 break-all font-mono">{detail}</span>)}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <OpenApiDocumentSection title={t('openapi.authentication')} bodyClassName="not-prose">
      {options.length === 1 ? renderOption(options[0]) : (
        <Tabs
          items={options.map((option) => ({
            id: option.key,
            label: option.label || t('openapi.none'),
            panel: renderOption(option),
          }))}
          spacingClassName="m-0"
          panelsClassName="mt-2"
        />
      )}
    </OpenApiDocumentSection>
  )
}
