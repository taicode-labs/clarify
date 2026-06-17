import { z } from 'zod'

import type { ClarifyProjectConfig } from './types.js'

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
  sourceLocale: z.string().optional(),
  defaultLocale: z.string().optional(),
  strategy: z.union([z.literal('prefix_except_default'), z.literal('prefix_always')]).optional(),
  missing: z.union([z.literal('fallback'), z.literal('404'), z.literal('hide')]).optional(),
  locales: z.array(clarifyLocaleConfigSchema).min(1),
})

export const clarifyNavbarLinkSchema = z.object({
  label: clarifyLocalizedTextSchema,
  href: z.string(),
  external: z.boolean().optional(),
})

export const clarifyBannerConfigSchema = z.object({
  content: clarifyLocalizedTextSchema,
  dismissible: z.boolean().optional(),
})

export const clarifyFooterConfigSchema = z.object({
  socials: z.record(z.string(), z.string()).optional(),
  copyright: clarifyLocalizedTextSchema.optional(),
})

export const clarifyPagesItemSchema = z.union([
  z.string(),
  z.object({
    page: z.string(),
    title: clarifyLocalizedTextSchema.optional(),
    icon: z.string().optional(),
    redirect: z.string().optional(),
  }),
  z.object({
    openapi: z.string(),
    icon: z.string().optional(),
    title: clarifyLocalizedTextSchema.optional(),
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

export const clarifyProjectConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  logo: clarifyLogoConfigSchema.optional(),
  favicon: clarifyFaviconConfigSchema.optional(),
  theme: z.object({
    primary: z.string().optional(),
  }).optional(),
  routePrefix: z.string().optional(),
  navbar: z.object({
    links: z.array(clarifyNavbarLinkSchema).optional(),
  }).optional(),
  banner: clarifyBannerConfigSchema.optional(),
  footer: clarifyFooterConfigSchema.optional(),
  i18n: clarifyI18nConfigSchema.optional(),
  pages: clarifyPagesConfigSchema.optional(),
}) satisfies z.ZodType<ClarifyProjectConfig>

export type ClarifyProjectConfigInput = z.input<typeof clarifyProjectConfigSchema>
