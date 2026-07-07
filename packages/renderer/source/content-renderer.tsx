import type { ComponentType, ReactNode } from 'react'
import { Fragment } from 'react'

import { SectionProvider, type Section } from './app/SectionProvider'
import { Prose } from './components/Prose'
import type { ContentBlock, ContentDocument, ContentRenderers, MarkdownContentBlock, OpenAPIContentBlock } from './content'
import { MdxMarkdown } from './mdx/Markdown'
import { createRouteComponent } from './route-factory'

function defaultMarkdownRenderer(block: MarkdownContentBlock): ReactNode {
  return (
    <MdxMarkdown>
      {block.value}
    </MdxMarkdown>
  )
}

function renderBlock(block: ContentBlock, renderers?: ContentRenderers): ReactNode {
  if (block.kind === 'markdown') {
    return renderers?.markdown ? renderers.markdown(block) : defaultMarkdownRenderer(block)
  }

  if (block.kind === 'openapi') {
    return renderers?.openapi ? renderers.openapi(block) : defaultOpenApiRenderer(block)
  }

  return null
}

type ContentDocumentShellProps = {
  children: ReactNode
}

function ContentDocumentShell(arg0: ContentDocumentShellProps) {
  const { children } = arg0

  return (
    <article className="clarify-mdx-page flex h-full min-w-0 flex-col pt-14 pb-10">
      <Prose className="flex-auto">{children}</Prose>
    </article>
  )
}

function defaultOpenApiRenderer(_block: OpenAPIContentBlock): ReactNode {
  return null
}

export type DocumentRouteData = {
  contentDocument?: ContentDocument
  renderers?: ContentRenderers
}

export type ComponentRouteData = {
  component: ComponentType
}

export type ContentRouteData = DocumentRouteData | ComponentRouteData

export function createComponentRouteComponent(data: ComponentRouteData) {
  return createRouteComponent(() => {
    const Component = data.component
    return <Component />
  })
}

export function createDocumentRouteComponent(data: DocumentRouteData) {
  return createContentRouteComponent(data)
}

export function createContentRouteComponent(data: ContentRouteData) {
  return createRouteComponent(() => {
    if ('component' in data) {
      const Component = data.component
      return <Component />
    }

    if (data.contentDocument?.content?.length) {
      return renderContentDocument(data.contentDocument, data.renderers)
    }

    return null
  })
}

export function renderContentDocument(document: ContentDocument | undefined, renderers?: ContentRenderers): ReactNode {
  if (!document?.content?.length) return null

  const sections = (document.metadata.sections ?? []).map(section => ({
    id: section.id,
    title: section.title,
    level: section.level,
    badge: section.badge,
    tags: section.tags,
  })) satisfies Section[]

  return (
    <SectionProvider sections={sections}>
      <ContentDocumentShell>
        {document.content.map((block, index) => (
          <Fragment key={`${block.kind}-${index}`}>
            {renderBlock(block, renderers)}
          </Fragment>
        ))}
      </ContentDocumentShell>
    </SectionProvider>
  )
}
