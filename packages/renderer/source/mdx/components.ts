import { Steps, Step, Tabs, Tab } from '../components'
import { Collapse } from '../components/Collapse'
import { Mermaid } from '../components/Mermaid'
import { OpenApiDocument, OpenApiOperation } from '../openapi'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Markdown,
  Collapse,
  Mermaid,
  Steps,
  Step,
  Tabs,
  Tab,
}

const builtInOpenAPIComponents = {
  OpenApiDocument,
  OpenApiOperation,
}

export function useMDXComponents(components: Record<string, unknown> = {}) {
  return {
    ...components,
    ...builtInMDXComponents,
    ...builtInOpenAPIComponents,
  }
}
