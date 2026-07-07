import './styles.css'

import { createContentDiagnosticComponent, type ContentDiagnostic } from './app/ContentDiagnostic'
import { createDocumentRouteComponent } from './content-renderer'
import { useMDXComponents } from './mdx/components'
import { createOpenApiRouteComponent } from './openapi'
import { render } from './runtime/render'
import { useSlot } from './slots'
import { themePresets, themeBootstrapScript } from './theme/variables'

export type { ContentDiagnostic }
export type { ContentBlock, ContentDocument } from './content'
export type { UISlotRegistration, UISlotName, SlotContext } from './slots'

export {
  render,
  useSlot,
  themePresets,
  themeBootstrapScript,
  useMDXComponents,
  createOpenApiRouteComponent,
  createDocumentRouteComponent,
  createContentDiagnosticComponent,
}
