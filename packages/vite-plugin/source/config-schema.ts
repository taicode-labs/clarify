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

export const clarifyNavbarLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
})

export const clarifyBannerConfigSchema = z.object({
  content: z.string(),
  dismissible: z.boolean().optional(),
})

export const clarifyFooterConfigSchema = z.object({
  socials: z.record(z.string(), z.string()).optional(),
  copyright: z.string().optional(),
})

export const clarifyPagesItemSchema = z.union([
  z.string(),
  z.object({
    page: z.string(),
    redirect: z.string().optional(),
  }),
  z.object({
    openapi: z.string(),
    title: z.string().optional(),
  }),
])

export const clarifyPagesGroupSchema = z.object({
  group: z.string(),
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
  pages: clarifyPagesConfigSchema.optional(),
}) satisfies z.ZodType<ClarifyProjectConfig>

export type ClarifyProjectConfigInput = z.input<typeof clarifyProjectConfigSchema>
