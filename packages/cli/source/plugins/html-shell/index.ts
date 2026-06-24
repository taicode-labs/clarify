import type { HtmlTagDescriptor } from 'vite'

import { themeBootstrapScript } from '@clarify-labs/renderer'
import type { ClarifyFaviconConfig, ClarifyPlugin } from '../../types.js'

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
