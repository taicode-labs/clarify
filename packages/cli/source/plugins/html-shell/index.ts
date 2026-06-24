import type { HtmlTagDescriptor } from 'vite'

import { clarifyThemePresets } from '../../core/theme.js'
import type { ClarifyFaviconConfig, ClarifyPlugin, ClarifyThemeColorValue, ResolvedClarifyThemeConfig } from '../../types.js'

const THEME_COOKIE_NAME = 'clarify-theme'
const REL_ICON_RE = /<link\s+[^>]*rel=["'][^"']*\bicon\b[^"']*["'][^>]*>/i

function inferIconType(href: string): string | undefined {
  const path = href.split(/[?#]/, 1)[0]?.toLowerCase() ?? href.toLowerCase()

  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.ico')) return 'image/x-icon'
  if (path.endsWith('.webp')) return 'image/webp'

  return undefined
}

function createIconTag(href: string, media?: string): HtmlTagDescriptor {
  return {
    tag: 'link',
    attrs: {
      rel: 'icon',
      ...(inferIconType(href) ? { type: inferIconType(href) } : {}),
      href,
      ...(media ? { media } : {}),
    },
    injectTo: 'head',
  }
}

function createIconTags(icon?: ClarifyFaviconConfig): HtmlTagDescriptor[] {
  if (!icon) return []

  if (typeof icon === 'string') return [createIconTag(icon)]

  const lightIcon = icon.light ?? icon.dark
  const darkIcon = icon.dark ?? icon.light

  if (!lightIcon || !darkIcon) return []
  if (lightIcon === darkIcon) return [createIconTag(lightIcon)]

  return [
    createIconTag(lightIcon, '(prefers-color-scheme: light)'),
    createIconTag(darkIcon, '(prefers-color-scheme: dark)'),
  ]
}

function matchesPresetTheme(theme: ResolvedClarifyThemeConfig): boolean {
  const preset = clarifyThemePresets[theme.preset]

  return JSON.stringify({ tokens: theme.tokens, layout: theme.layout }) === JSON.stringify({ tokens: preset.tokens, layout: preset.layout })
}

function effectiveTheme(theme: ResolvedClarifyThemeConfig, resolvedTheme: 'light' | 'dark'): ResolvedClarifyThemeConfig {
  if (resolvedTheme !== 'dark' || !matchesPresetTheme(theme)) return theme

  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      colors: {
        ...theme.tokens.colors,
        background: '#09090b',
        foreground: '#ffffff',
        surface: '#18181b',
        muted: '#a1a1aa',
        border: 'rgb(255 255 255 / 0.1)',
        codeBackground: '#18181b',
      },
    },
  }
}

function resolveThemeColorValue(value: ClarifyThemeColorValue, resolvedTheme: 'light' | 'dark'): string {
  return typeof value === 'string' ? value : value[resolvedTheme] ?? value.light ?? value.dark ?? ''
}

function themeToCssVariables(theme: ResolvedClarifyThemeConfig, resolvedTheme: 'light' | 'dark'): Record<string, string> {
  const resolved = effectiveTheme(theme, resolvedTheme)
  const { colors } = resolved.tokens
  const { radius } = resolved.tokens

  return {
    '--clarify-theme-tokens-colors-primary': resolveThemeColorValue(colors.primary, resolvedTheme),
    '--clarify-theme-tokens-colors-accent': resolveThemeColorValue(colors.accent, resolvedTheme),
    '--clarify-theme-tokens-colors-background': resolveThemeColorValue(colors.background, resolvedTheme),
    '--clarify-theme-tokens-colors-foreground': resolveThemeColorValue(colors.foreground, resolvedTheme),
    '--clarify-theme-tokens-colors-surface': resolveThemeColorValue(colors.surface, resolvedTheme),
    '--clarify-theme-tokens-colors-muted': resolveThemeColorValue(colors.muted, resolvedTheme),
    '--clarify-theme-tokens-colors-border': resolveThemeColorValue(colors.border, resolvedTheme),
    '--clarify-theme-tokens-colors-code-background': resolveThemeColorValue(colors.codeBackground, resolvedTheme),
    '--clarify-theme-tokens-radius-sm': radius.sm,
    '--clarify-theme-tokens-radius-md': radius.md,
    '--clarify-theme-tokens-radius-lg': radius.lg,
    '--clarify-theme-tokens-radius-xl': radius.xl,
    '--clarify-theme-layout-max-width': resolved.layout.maxWidth,
  }
}

function themeBootstrapScript(theme: ResolvedClarifyThemeConfig): string {
  const darkVariables = themeToCssVariables(theme, 'dark')
  const lightVariables = themeToCssVariables(theme, 'light')

  return `(function(){try{var c=${JSON.stringify(THEME_COOKIE_NAME)};var m=document.cookie?document.cookie.split('; '):[];var e=null;for(var i=0;i<m.length;i++){var p=m[i].indexOf('=');var n=p===-1?m[i]:m[i].slice(0,p);if(decodeURIComponent(n)===c){e=p===-1?'':decodeURIComponent(m[i].slice(p+1));break}}var t=e==='dark'||e==='light'||e==='system'?e:'system';var r=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';var v=r?${JSON.stringify(darkVariables)}:${JSON.stringify(lightVariables)};var s=document.documentElement.style;for(var k in v)s.setProperty(k,v[k]);document.documentElement.classList.toggle('dark',r);document.documentElement.style.colorScheme=r?'dark':'light'}catch(e){}})();`
}

export function createHtmlShellPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:html-shell',
    hooks: {
      'html:transform': (input, ctx) => ({
        html: input.html,
        tags: [
          ...input.tags,
          ...(REL_ICON_RE.test(input.html) ? [] : createIconTags(ctx.projectConfig.favicon ?? ctx.projectConfig.logo)),
          {
            tag: 'script',
            children: themeBootstrapScript(ctx.projectConfig.theme),
            injectTo: 'head-prepend',
          },
          {
            tag: 'script',
            attrs: { type: 'module', src: input.clientEntryId },
            injectTo: 'body',
          },
        ],
        clientEntryId: input.clientEntryId,
        dev: input.dev,
      }),
    },
  }
}
