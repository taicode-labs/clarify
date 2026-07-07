import './styles.css'

import { createContentDiagnosticComponent, type ContentDiagnostic } from './app/ContentDiagnostic'
import { useMDXComponents } from './markdown/components'
import { createOpenApiRouteComponent } from './openapi'
import { MainPreview } from './preview/pages/MainPreview'
import { MdxPreview } from './preview/pages/MdxPreview'
import { OpenApiPreview } from './preview/pages/OpenApiPreview'
import { createDocumentRouteComponent } from './routes/content'
import { render } from './runtime/render'
import { renderToHTML } from './runtime/server'
import { useSlot } from './slots'
import { themePresets, themeBootstrapScript } from './theme/variables'

export type { ContentDiagnostic }
export type {
  ContentSource,
  ContentSectionMetadata,
  ContentDiagnosticMetadata,
  ContentMetadata,
  MarkdownContentBlock,
  OpenAPISpecReference,
  OpenAPIOperationReference,
  OpenAPIContentBlock,
  ContentBlock,
  ContentDocumentRoute,
  ContentDocument,
} from './content/index'
export type { UISlotRegistration, UISlotName, SlotContext } from './slots'

export {
  render,
  renderToHTML,
  useSlot,
  useMDXComponents,
  MainPreview,
  MdxPreview,
  OpenApiPreview,
  themePresets,
  themeBootstrapScript,
  createOpenApiRouteComponent,
  createDocumentRouteComponent,
  createContentDiagnosticComponent,
}
