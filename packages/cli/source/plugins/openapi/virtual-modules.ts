import type { ContentDiagnostic, OpenAPISpec } from '../../types.js'

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

export function generateOpenAPIErrorModule(diagnostic: ContentDiagnostic): string {
  return `import { createElement } from 'react';
const diagnostic = ${JSON.stringify(diagnostic)};
export default function OpenApiErrorRoutePage() {
  return createElement('article', { className: 'flex h-full flex-col pt-16 pb-10' },
    createElement('div', { className: 'prose max-w-none flex-auto dark:prose-invert' },
      createElement('p', { className: 'mb-3 font-mono text-xs/6 font-medium tracking-widest text-red-500 uppercase dark:text-red-400' }, 'OpenAPI Error'),
      createElement('h1', null, diagnostic.title),
      createElement('p', { className: 'lead' }, diagnostic.message),
      diagnostic.filePath ? createElement('div', { className: 'not-prose mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-white/5' },
        createElement('div', { className: 'mb-1 font-semibold text-zinc-900 dark:text-white' }, 'File'),
        createElement('code', { className: 'break-all text-zinc-700 dark:text-zinc-300' }, diagnostic.filePath)
      ) : null,
      diagnostic.cause ? createElement('div', { className: 'not-prose mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' },
        createElement('div', { className: 'mb-1 font-semibold' }, 'Why it happened'),
        createElement('pre', { className: 'whitespace-pre-wrap break-words font-mono text-xs' }, diagnostic.cause)
      ) : null
    )
  );
}`
}
