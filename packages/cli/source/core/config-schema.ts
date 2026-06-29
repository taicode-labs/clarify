import { z } from 'zod'

import type { ClarifyProjectConfig } from '../types.js'

export const clarifyLogoConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }),
])

export const clarifyFaviconConfigSchema = z.union([
  z.string(),
  z.object({
    light: z.string().optional(),
    dark: z.string().optional(),
  }),
])

export const clarifyLocalizedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
])

export const clarifyLocaleConfigSchema = z.object({
  code: z.string(),
  label: z.string(),
  dir: z.union([z.literal('ltr'), z.literal('rtl')]).optional(),
})

export const clarifyI18nConfigSchema = z.object({
  defaultLocale: z.string().optional(),
  missing: z.union([z.literal('fallback'), z.literal('404'), z.literal('hide')]).optional(),
  locales: z.array(clarifyLocaleConfigSchema).min(1),
}).superRefine((config, ctx) => {
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

  if (config.defaultLocale && !localeCodes.has(config.defaultLocale)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'defaultLocale must be one of i18n.locales',
      path: ['defaultLocale'],
    })
  }
})

export const clarifyNavbarLinkSchema = z.object({
  label: clarifyLocalizedTextSchema,
  href: z.string(),
  external: z.boolean().optional(),
})

export const clarifyBannerConfigOptionsSchema = z.object({
  content: clarifyLocalizedTextSchema,
  dismissible: z.boolean().optional(),
  link: clarifyNavbarLinkSchema.optional(),
}).strict()

export const clarifyBannerConfigSchema = clarifyBannerConfigOptionsSchema

export const clarifyFooterConfigSchema = z.object({
  links: z.array(clarifyNavbarLinkSchema).optional(),
  socials: z.record(z.string(), z.string()).optional(),
  copyright: clarifyLocalizedTextSchema.optional(),
}).strict()

export const clarifySourceConfigSchema = z.object({
  repository: z.string(),
  branch: z.string().optional(),
  directory: z.string().optional(),
})

export const clarifyPagesItemSchema = z.union([
  z.string(),
  z.object({
    page: z.string(),
    path: z.string().optional(),
    title: clarifyLocalizedTextSchema.optional(),
    icon: z.string().optional(),
    redirect: z.string().optional(),
  }),
  z.object({
    openapi: z.string(),
    path: z.string().optional(),
    icon: z.string().optional(),
    title: clarifyLocalizedTextSchema.optional(),
    filter: z.object({
      tags: z.array(z.string()).optional(),
    }).optional(),
  }),
])

export const clarifyPagesGroupSchema = z.object({
  group: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: z.array(clarifyPagesItemSchema),
})

export const clarifyPagesConfigSchema = z.union([
  z.array(clarifyPagesGroupSchema),
  z.literal('FileTree'),
])

export const clarifyTabItemSchema = z.object({
  tab: clarifyLocalizedTextSchema,
  icon: z.string().optional(),
  pages: clarifyPagesConfigSchema.optional(),
})

export const clarifyTabsConfigSchema = z.array(clarifyTabItemSchema)

export const clarifyThemePresetSchema = z.enum(['default', 'base'])

export const clarifyThemeModeColorValueSchema = z.object({
  light: z.string().optional(),
  dark: z.string().optional(),
})

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
})

export const clarifyThemeRadiusTokensConfigSchema = z.object({
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
  xl: z.string().optional(),
})

export const clarifyThemeTokensConfigSchema = z.object({
  colors: clarifyThemeColorTokensConfigSchema.optional(),
  radius: clarifyThemeRadiusTokensConfigSchema.optional(),
})

export const clarifyThemeLayoutConfigSchema = z.object({
  maxWidth: z.string().optional(),
})

export const clarifyThemeConfigSchema = z.object({
  preset: clarifyThemePresetSchema.optional(),
  tokens: clarifyThemeTokensConfigSchema.optional(),
  layout: clarifyThemeLayoutConfigSchema.optional(),
  editor: z.boolean().optional(),
})

export const clarifyProjectConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  siteUrl: z.string().optional(),
  source: clarifySourceConfigSchema.optional(),
  logo: clarifyLogoConfigSchema.optional(),
  homeUrl: z.string().optional(),
  favicon: clarifyFaviconConfigSchema.optional(),
  theme: clarifyThemeConfigSchema.optional(),
  routePrefix: z.string().optional(),
  assetPrefix: z.string().optional(),
  navbar: z.object({
    links: z.array(clarifyNavbarLinkSchema).optional(),
  }).optional(),
  banner: clarifyBannerConfigSchema.optional(),
  footer: clarifyFooterConfigSchema.optional(),
  i18n: clarifyI18nConfigSchema.optional(),
  tabs: clarifyTabsConfigSchema.optional(),
}) satisfies z.ZodType<ClarifyProjectConfig>

export type ClarifyProjectConfigInput = z.input<typeof clarifyProjectConfigSchema>
