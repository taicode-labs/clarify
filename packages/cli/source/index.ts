export { clarifyPlugin } from './core/plugin.js'
export { defineConfig } from './core/user-config.js'
export type { Plugin } from 'vite'

export * from './types.js'
export type { ClarifyConfig } from './core/user-config.js'
export {
  clarifyProjectConfigSchema,
  clarifyLogoConfigSchema,
  clarifyFaviconConfigSchema,
  clarifyNavbarLinkSchema,
  clarifyBannerConfigSchema,
  clarifyFooterConfigSchema,
  clarifyLocalizedTextSchema,
  clarifyLocaleConfigSchema,
  clarifyI18nConfigSchema,
  clarifyPagesItemSchema,
  clarifyPagesGroupSchema,
  clarifyPagesConfigSchema,
} from './core/config-schema.js'
export type { ClarifyProjectConfigInput } from './core/config-schema.js'
