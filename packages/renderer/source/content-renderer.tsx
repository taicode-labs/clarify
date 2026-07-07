import type { ComponentType, ReactNode } from 'react'
import { Fragment } from 'react'

import { Markdown } from './mdx/Markdown'
import type { ContentDocument, ContentRenderContext, MarkdownContentBlock, MdxContentBlock, OpenAPIContentBlock } from './content'

function defaultMarkdownRenderer(block: MarkdownContentBlock): ReactNode {
  return (
    <Markdown className="prose-p:mt-0 prose-p:mb-4">
      {block.value}
    </Markdown>
  )
}

function defaultMdxRenderer(block: MdxContentBlock): ReactNode {
  return (
    <Markdown className="prose-p:mt-0 prose-p:mb-4">
      {block.value}
    </Markdown>
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
    <Fragment>
      {document.content.map((block, index) => {
        if (block.kind === 'markdown') {
          return <div key={`${block.kind}-${index}`}>{renderMarkdown(block)}</div>
        }

        if (block.kind === 'mdx') {
          return <div key={`${block.kind}-${index}`}>{renderMdx(block)}</div>
        }

        if (block.kind === 'openapi') {
          return <div key={`${block.kind}-${index}`}>{renderOpenApi(block)}</div>
        }

        return null
      })}
    </Fragment>
  )
}
