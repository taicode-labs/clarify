import { z } from 'zod'

import type { ClarifyVariableValue, ClarifyProjectConfig } from '../../types.js'

export const clarifyLogoConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }).strict(),
])

export const clarifyFaviconConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }).strict(),
])

export const clarifyLocalizedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
])

export const clarifyLocaleConfigSchema = z.object({
  code: z.string(),
  label: z.string(),
  dir: z.union([z.literal('ltr'), z.literal('rtl')]).optional(),
}).strict()

export const clarifyLocalesConfigSchema = z.object({
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

export const clarifyNavbarLinkSchema = z.object({
  label: clarifyLocalizedTextSchema,
  href: z.string(),
  external: z.boolean().optional(),
}).strict()

export const clarifyBannerConfigOptionsSchema = z.object({
  content: clarifyLocalizedTextSchema,
  dismissible: z.boolean().optional(),
  link: clarifyNavbarLinkSchema.optional(),
}).strict()

export const clarifyFooterConfigSchema = z.object({
  links: z.array(clarifyNavbarLinkSchema).optional(),
  socials: z.record(z.string(), z.string()).optional(),
  copyright: clarifyLocalizedTextSchema.optional(),
}).strict()

export const clarifyVariableValueSchema: z.ZodType<ClarifyVariableValue> = z.lazy(() => z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.string(), clarifyVariableValueSchema),
]))

export const clarifyVariablesConfigSchema = z.record(z.string(), clarifyVariableValueSchema)

export const clarifyEditLinkConfigSchema = z.object({
  repository: z.string().optional(),
  branch: z.string().optional(),
  directory: z.string().optional(),
}).strict()

export const clarifyPagesItemSchema: z.ZodType<
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

export const clarifyPagesGroupSchema: z.ZodType<
  import('../../types.js').ClarifyPagesGroup,
  import('../../types.js').ClarifyPagesGroup
> = z.lazy(() => z.object({
  group: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: z.array(clarifyPagesItemSchema),
}).strict())

export const clarifyPagesConfigSchema = z.union([
  z.array(clarifyPagesGroupSchema),
  z.literal('FileTree'),
])

export const clarifyTabItemSchema = z.object({
  tab: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: clarifyPagesConfigSchema.optional(),
}).strict()

export const clarifyTabsConfigSchema = z.array(clarifyTabItemSchema)

export const clarifyThemePresetSchema = z.enum(['default', 'base'])

export const clarifyThemeModeColorValueSchema = z.object({
  light: z.string().optional(),
  dark: z.string().optional(),
}).strict()

export const clarifyThemeColorValueSchema = z.union([z.string(), clarifyThemeModeColorValueSchema])

export const clarifyThemeColorTokensConfigSchema = z.object({
  primary: clarifyThemeColorValueSchema.optional(),
  accent: clarifyThemeColorValueSchema.optional(),
  background: clarifyThemeColorValueSchema.optional(),
  foreground: clarifyThemeColorValueSchema.optional(),
  surface: clarifyThemeColorValueSchema.optional(),
  muted: clarifyThemeColorValueSchema.optional(),
  border: clarifyThemeColorValueSchema.optional(),
  codeBackground: clarifyThemeColorValueSchema.optional(),
}).strict()

export const clarifyThemeRadiusTokensConfigSchema = z.object({
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
  xl: z.string().optional(),
}).strict()

export const clarifyThemeTokensConfigSchema = z.object({
  colors: clarifyThemeColorTokensConfigSchema.optional(),
  radius: clarifyThemeRadiusTokensConfigSchema.optional(),
}).strict()

export const clarifyThemeLayoutConfigSchema = z.object({
  maxWidth: z.string().optional(),
}).strict()

export const clarifyThemeConfigSchema = z.object({
  preset: clarifyThemePresetSchema.optional(),
  tokens: clarifyThemeTokensConfigSchema.optional(),
  layout: clarifyThemeLayoutConfigSchema.optional(),
}).strict()

function featureSchema<Schema extends z.ZodRawShape>(shape: Schema, defaults: Record<string, unknown>) {
  const objectSchema = z.object({ enabled: z.boolean().default(true), ...shape }).strict().default({ enabled: true, ...defaults } as never)
  return z.union([
    z.boolean(),
    objectSchema,
  ]).default({ enabled: true, ...defaults } as never).transform((value) => typeof value === 'boolean'
    ? { enabled: value, ...defaults }
    : value)
}

export const clarifyFeaturesConfigSchema = z.object({
  search: featureSchema({ provider: z.literal('pagefind').default('pagefind') }, { provider: 'pagefind' }),
  editLink: featureSchema(clarifyEditLinkConfigSchema.shape, {}),
  themeEditor: featureSchema({}, {}),
  openapi: featureSchema({
    playground: z.boolean().default(true),
    responsePreview: z.boolean().default(true),
    responseDownload: z.boolean().default(true),
  }, { playground: true, responsePreview: true, responseDownload: true }),
}).strict()

export const clarifyProjectConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  siteUrl: z.string().optional(),
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
