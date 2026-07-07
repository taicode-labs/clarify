import { Button } from '../components/Button'
import { Callout } from '../components/Callout'
import { Card, CardGroup } from '../components/Card'
import { Code, CodeGroup, Pre } from '../components/Code'
import { Collapse } from '../components/Collapse'
import { Mermaid } from '../components/Mermaid'
import { Tabs } from '../components/Tabs'
import { WebFrame } from '../components/WebFrame'
import { OpenApiDocument, OpenApiOperation } from '../openapi'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Button,
  Callout,
  Card,
  CardGroup,
  Code,
  CodeGroup,
  Pre,
  Markdown,
  Collapse,
  Mermaid,
  Tabs,
  WebFrame,
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
