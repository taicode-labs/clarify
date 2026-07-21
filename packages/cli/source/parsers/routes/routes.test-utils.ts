import type { ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedClarifyLocalesConfig } from '../../types.js'

type ContentRouteFixture = Partial<Omit<ContentRoute, 'kind' | 'meta' | 'module' | 'source' | 'openapi'>> & {
  kind?: ContentRoute['kind']
  title?: string
  description?: string
  keywords?: ContentRoute['meta']['keywords']
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  frontmatter?: ContentRoute['source']['frontmatter']
  content?: string
  sourceEditUrl?: string
  pageVirtualModuleId?: string
  contentVirtualModuleId?: string
  openapi?: OpenAPIContentRoute['openapi']
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
    pageVirtualModuleId: fixturePageVirtualModuleId,
    contentVirtualModuleId: fixtureContentVirtualModuleId,
    meta,
    module,
    source,
    openapi,
    kind = 'markdown+jsx',
    ...rest
  } = route

  const common = {
    path: '/',
    meta: {
      title: title ?? meta?.title ?? 'Home',
      description: description ?? meta?.description,
      keywords: keywords ?? meta?.keywords,
      sections: sections ?? meta?.sections,
    },
    source: {
      filePath: filePath ?? source?.filePath ?? 'index.mdx',
      frontmatter: frontmatter ?? source?.frontmatter,
      content: content ?? source?.content,
      sourceEditUrl: sourceEditUrl ?? source?.sourceEditUrl,
    },
    ...rest,
  }

  const pageVirtualModuleId = fixturePageVirtualModuleId ?? module?.pageVirtualModuleId ?? 'virtual:clarify-page/index'
  if (kind === 'openapi') {
    return {
      ...common,
      kind,
      module: { pageVirtualModuleId },
      openapi,
    } satisfies OpenAPIContentRoute
  }

  return {
    ...common,
    kind,
    module: {
      pageVirtualModuleId,
      contentVirtualModuleId: fixtureContentVirtualModuleId ?? module?.contentVirtualModuleId ?? 'virtual:clarify-content/index.mdx',
    },
  } satisfies MarkdownContentRoute
}

export function mdxRoute(route: ContentRouteFixture = {}): ContentRoute {
  return contentRoute({ ...route, kind: 'markdown+jsx' })
}

export const testI18n: ResolvedClarifyLocalesConfig = {
  default: 'zh-CN',
  missing: 'fallback',
  locales: [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'en-US', label: 'English' },
  ],
}
