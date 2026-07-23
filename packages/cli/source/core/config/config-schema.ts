import { z } from 'zod'

import type { ClarifyVariableValue, ClarifyProjectConfig } from '../../types.js'

const clarifyLogoConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }).strict(),
])

const clarifyFaviconConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }).strict(),
])

const clarifyLocalizedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
])

const clarifyLocaleConfigSchema = z.object({
  code: z.string(),
  label: z.string(),
  dir: z.union([z.literal('ltr'), z.literal('rtl')]).optional(),
}).strict()

const clarifyLocalesConfigSchema = z.object({
  default: z.string().optional(),
  missing: z.union([z.literal('fallback'), z.literal('404'), z.literal('hide')]).optional(),
  locales: z.array(clarifyLocaleConfigSchema).min(1),
}).strict().superRefine((config, ctx) => {
  const localeCodes = new Set<string>()
  for (const [index, locale] of config.locales.entries()) {
    if (localeCodes.has(locale.code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate locale code "${locale.code}"`,
        path: ['locales', index, 'code'],
      })
    }
    localeCodes.add(locale.code)
  }

  if (config.default && !localeCodes.has(config.default)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'default must be one of locales.locales',
      path: ['default'],
    })
  }
})

const clarifyNavbarLinkSchema = z.object({
  label: clarifyLocalizedTextSchema,
  href: z.string(),
  external: z.boolean().optional(),
}).strict()

const clarifyBannerConfigOptionsSchema = z.object({
  content: clarifyLocalizedTextSchema,
  dismissible: z.boolean().optional(),
  link: clarifyNavbarLinkSchema.optional(),
}).strict()

const clarifyFooterConfigSchema = z.object({
  links: z.array(clarifyNavbarLinkSchema).optional(),
  socials: z.record(z.string(), z.string()).optional(),
  copyright: clarifyLocalizedTextSchema.optional(),
}).strict()

const clarifyVariableValueSchema: z.ZodType<ClarifyVariableValue> = z.lazy(() => z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.string(), clarifyVariableValueSchema),
]))

const clarifyVariablesConfigSchema = z.record(z.string(), clarifyVariableValueSchema)

const clarifySiteUrlSchema = z.string().superRefine((value, ctx) => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be an absolute HTTP(S) origin' })
    return
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be an HTTP(S) origin without a path, query, or hash; configure deployment subpaths with routePrefix' })
  }
})

const clarifyRepositoryConfigSchema = z.object({
  url: z.string().optional(),
  branch: z.string().optional(),
  directory: z.string().optional(),
}).strict()

const clarifyPagesItemSchema: z.ZodType<
  import('../../types.js').ClarifyPagesItem,
  import('../../types.js').ClarifyPagesItem
> = z.lazy(() => z.union([
  z.string(),
  clarifyPagesGroupSchema,
  z.object({
    page: z.string(),
    path: z.string().optional(),
    title: clarifyLocalizedTextSchema.optional(),
    icon: z.string().optional(),
    redirect: z.string().optional(),
  }).strict(),
  z.object({
    openapi: z.string(),
    path: z.string().optional(),
    icon: z.string().optional(),
    title: clarifyLocalizedTextSchema.optional(),
    filter: z.object({
      tags: z.array(z.string()).optional(),
    }).strict().optional(),
  }).strict(),
]))

const clarifyPagesGroupSchema: z.ZodType<
  import('../../types.js').ClarifyPagesGroup,
  import('../../types.js').ClarifyPagesGroup
> = z.lazy(() => z.object({
  group: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: z.array(clarifyPagesItemSchema),
}).strict())

const clarifyPagesConfigSchema = z.union([
  z.array(clarifyPagesGroupSchema),
  z.literal('FileTree'),
])

const clarifyTabItemSchema = z.object({
  tab: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: clarifyPagesConfigSchema.optional(),
}).strict()

const clarifyTabsConfigSchema = z.array(clarifyTabItemSchema)

const clarifyThemePresetSchema = z.enum(['default', 'base'])

const clarifyThemeModeColorValueSchema = z.object({
  light: z.string().optional(),
  dark: z.string().optional(),
}).strict()

const clarifyThemeColorValueSchema = z.union([z.string(), clarifyThemeModeColorValueSchema])

const clarifyThemeColorTokensConfigSchema = z.object({
  primary: clarifyThemeColorValueSchema.optional(),
  accent: clarifyThemeColorValueSchema.optional(),
  background: clarifyThemeColorValueSchema.optional(),
  foreground: clarifyThemeColorValueSchema.optional(),
  surface: clarifyThemeColorValueSchema.optional(),
  muted: clarifyThemeColorValueSchema.optional(),
  border: clarifyThemeColorValueSchema.optional(),
  codeBackground: clarifyThemeColorValueSchema.optional(),
}).strict()

const clarifyThemeRadiusTokensConfigSchema = z.object({
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
  xl: z.string().optional(),
}).strict()

const clarifyThemeTokensConfigSchema = z.object({
  colors: clarifyThemeColorTokensConfigSchema.optional(),
  radius: clarifyThemeRadiusTokensConfigSchema.optional(),
}).strict()

const clarifyThemeLayoutConfigSchema = z.object({
  maxWidth: z.string().optional(),
}).strict()

const clarifyThemeConfigSchema = z.object({
  preset: clarifyThemePresetSchema.optional(),
  tokens: clarifyThemeTokensConfigSchema.optional(),
  layout: clarifyThemeLayoutConfigSchema.optional(),
}).strict()

function featureSchema<Schema extends z.ZodRawShape>(shape: Schema, defaults: Record<string, unknown>, enabledByDefault = true) {
  const resolvedDefaults = { enabled: enabledByDefault, ...defaults }
  const objectSchema = z.object({ enabled: z.boolean().default(enabledByDefault), ...shape }).strict().default(resolvedDefaults as never)
  return z.union([
    z.boolean(),
    objectSchema,
  ]).default(resolvedDefaults as never).transform((value) => typeof value === 'boolean'
    ? { enabled: value, ...defaults }
    : value)
}

export const clarifyFeaturesConfigSchema = z.object({
  search: featureSchema({ mcp: z.boolean().default(true) }, { mcp: true }),
  repository: featureSchema(clarifyRepositoryConfigSchema.shape, {}),
  themeEditor: featureSchema({}, {}, false),
  openapi: featureSchema({
    playground: z.boolean().default(true),
  }, { playground: true }),
}).strict()

export const clarifyProjectConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  siteUrl: clarifySiteUrlSchema.optional(),
  routePrefix: z.string().default('/'),
  assetPrefix: z.string().optional(),
  logo: clarifyLogoConfigSchema.optional(),
  homeUrl: z.string().optional(),
  favicon: clarifyFaviconConfigSchema.optional(),
  theme: clarifyThemeConfigSchema.optional(),
  navigation: z.object({
    links: z.array(clarifyNavbarLinkSchema).optional(),
    tabs: clarifyTabsConfigSchema.optional(),
  }).strict().optional(),
  banner: clarifyBannerConfigOptionsSchema.optional(),
  footer: clarifyFooterConfigSchema.optional(),
  locales: clarifyLocalesConfigSchema.optional(),
  variables: clarifyVariablesConfigSchema.optional(),
  features: clarifyFeaturesConfigSchema.optional(),
}).strict() satisfies z.ZodType<ClarifyProjectConfig>

export type ClarifyProjectConfigInput = z.input<typeof clarifyProjectConfigSchema>
