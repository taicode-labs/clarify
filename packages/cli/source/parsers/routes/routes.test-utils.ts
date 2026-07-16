import type { ContentRoute, ResolvedClarifyLocalesConfig } from '../../types.js'

type ContentRouteFixture = Partial<Omit<ContentRoute, 'kind' | 'meta' | 'module' | 'source'>> & {
  kind?: ContentRoute['kind']
  title?: string
  description?: string
  keywords?: ContentRoute['meta']['keywords']
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  frontmatter?: ContentRoute['source']['frontmatter']
  content?: string
  sourceEditUrl?: string
  virtualModuleId?: string
  meta?: Partial<ContentRoute['meta']>
  module?: Partial<ContentRoute['module']>
  source?: Partial<ContentRoute['source']>
}

export function contentRoute(route: ContentRouteFixture = {}): ContentRoute {
  const {
    title,
    description,
    keywords,
    sections,
    filePath,
    frontmatter,
    content,
    sourceEditUrl,
    virtualModuleId,
    meta,
    module,
    source,
    kind = 'mdx',
    ...rest
  } = route

  return {
    path: '/',
    kind,
    meta: {
      title: title ?? meta?.title ?? 'Home',
      description: description ?? meta?.description,
      keywords: keywords ?? meta?.keywords,
      sections: sections ?? meta?.sections,
    },
    module: {
      virtualModuleId: virtualModuleId ?? module?.virtualModuleId ?? 'virtual:clarify-page/index',
    },
    source: {
      filePath: filePath ?? source?.filePath ?? 'index.mdx',
      frontmatter: frontmatter ?? source?.frontmatter,
      content: content ?? source?.content,
      sourceEditUrl: sourceEditUrl ?? source?.sourceEditUrl,
    },
    ...rest,
  }
}

export function mdxRoute(route: ContentRouteFixture = {}): ContentRoute {
  return contentRoute({ ...route, kind: 'mdx' })
}

export const testI18n: ResolvedClarifyLocalesConfig = {
  default: 'zh-CN',
  missing: 'fallback',
  locales: [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'en-US', label: 'English' },
  ],
}
