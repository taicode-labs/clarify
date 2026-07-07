import type { ComponentType, ReactNode } from 'react'
import { Fragment } from 'react'

import { Prose } from './components/Prose'
import { Markdown } from './mdx/Markdown'
import type { ContentDocument, ContentRenderContext, MarkdownContentBlock, MdxContentBlock, OpenAPIContentBlock } from './content'

function defaultMarkdownRenderer(block: MarkdownContentBlock): ReactNode {
  return (
    <Markdown>
      {block.value}
    </Markdown>
  )
}

function defaultMdxRenderer(block: MdxContentBlock): ReactNode {
  return (
    <Markdown>
      {block.value}
    </Markdown>
  )
}

function ContentDocumentShell(arg0: { children: ReactNode }) {
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
  component?: ComponentType
  renderers?: ContentRenderContext
}

export function createDocumentRouteComponent(data: DocumentRouteData) {
  return function DocumentRoutePage(): ReactNode {
    if (data.contentDocument?.content?.length) {
      return renderContentDocument(data.contentDocument, data.renderers)
    }

    if (data.component) {
      const Component = data.component
      return <Component />
    }

    return null
  }
}

export function renderContentDocument(document: ContentDocument | undefined, context: ContentRenderContext = {}): ReactNode {
  if (!document?.content?.length) return null

  const renderMarkdown = context.renderMarkdown ?? defaultMarkdownRenderer
  const renderMdx = context.renderMdx ?? defaultMdxRenderer
  const renderOpenApi = context.renderOpenApi ?? defaultOpenApiRenderer

  return (
    <ContentDocumentShell>
      {document.content.map((block, index) => {
        if (block.kind === 'markdown') {
          return <Fragment key={`${block.kind}-${index}`}>{renderMarkdown(block)}</Fragment>
        }

        if (block.kind === 'mdx') {
          return <Fragment key={`${block.kind}-${index}`}>{renderMdx(block)}</Fragment>
        }

        if (block.kind === 'openapi') {
          return <Fragment key={`${block.kind}-${index}`}>{renderOpenApi(block)}</Fragment>
        }

        return null
      })}
    </ContentDocumentShell>
  )
}
