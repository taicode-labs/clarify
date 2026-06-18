import type { OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = 'virtual:clarify-openapi-registry'

export function generateOpenAPIRegistryModule(openApis: Record<string, OpenAPISpec>): string {
  return `export const openApis = ${JSON.stringify(openApis)};`
}

export function generateOpenAPIModule(spec: OpenAPISpec): string {
  return `import { createElement } from 'react';
import { OpenApiPage } from '@clarify-labs/renderer';
const spec = ${JSON.stringify(spec)};
export default function OpenApiRoutePage() {
  return createElement(OpenApiPage, { spec });
}`
}
