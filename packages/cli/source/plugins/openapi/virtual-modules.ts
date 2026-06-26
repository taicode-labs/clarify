import { VIRTUAL_OPENAPI } from '../../core/virtual-modules.js'
import type { ContentDiagnostic, OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = VIRTUAL_OPENAPI
export const OPENAPI_SPEC_PREFIX = 'virtual:clarify/openapi-spec/'

export function specVirtualModuleId(specKey: string): string {
  return `${OPENAPI_SPEC_PREFIX}${specKey}`
}

export function generateOpenAPIRegistryModule(openApis: Record<string, OpenAPISpec>): string {
  return `export const openApis = ${JSON.stringify(openApis)};`
}

/** Generate a virtual module that exports a single spec as default. */
export function generateOpenAPISpecModule(spec: OpenAPISpec): string {
  return `export default ${JSON.stringify(spec)};`
}

type OpenAPIPageModuleOptions = { specKey: string; tagFilter?: string[] }

export function generateOpenAPIPageModule(opts: OpenAPIPageModuleOptions): string {
  const { specKey, tagFilter } = opts

  return [
    `import { createElement, useState, useEffect, useRef } from 'react';`,
    `import { OpenApiDocument, useOpenApis } from '@clarify-labs/renderer';`,
    `var SPEC_KEY = ${JSON.stringify(specKey)};`,
    `var TAG_FILTER = ${JSON.stringify(tagFilter ?? undefined)};`,
    `var loadPromise = null;`,
    `function loadSpec() {`,
    `  if (!loadPromise) loadPromise = import(${JSON.stringify(specVirtualModuleId(specKey))}).then(function(m) { return m.default; });`,
    `  return loadPromise;`,
    `}`,
    `export default function OpenApiRoutePage() {`,
    `  var specs = useOpenApis();`,
    `  var serverSpec = specs[SPEC_KEY];`,
    `  var [spec, setSpec] = useState(serverSpec || null);`,
    `  var mountedRef = useRef(false);`,
    `  useEffect(function() {`,
    `    if (mountedRef.current) return;`,
    `    mountedRef.current = true;`,
    `    if (spec) return;`,
    `    loadSpec().then(setSpec);`,
    `  }, []);`,
    `  if (!spec) return null;`,
    `  return createElement(OpenApiDocument, { spec: spec, tagFilter: TAG_FILTER });`,
    `}`,
  ].join('\n')
}

export function generateOpenAPIErrorModule(diagnostic: ContentDiagnostic): string {
  return `import { createElement } from 'react';
const diagnostic = ${JSON.stringify(diagnostic)};
export default function OpenApiErrorRoutePage() {
  return createElement('article', { className: 'flex h-full flex-col pt-16 pb-10' },
    createElement('div', { className: 'prose max-w-none flex-auto dark:prose-invert' },
      createElement('p', { className: 'mb-3 text-xs/6 font-medium tracking-widest text-red-500 uppercase dark:text-red-400' }, 'OpenAPI Error'),
      createElement('h1', null, diagnostic.title),
      createElement('p', { className: 'lead' }, diagnostic.message),
      diagnostic.filePath ? createElement('div', { className: 'not-prose mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-white/5' },
        createElement('div', { className: 'mb-1 font-semibold text-zinc-900 dark:text-white' }, 'File'),
        createElement('code', { className: 'break-all text-zinc-700 dark:text-zinc-300' }, diagnostic.filePath)
      ) : null,
      diagnostic.cause ? createElement('div', { className: 'not-prose mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' },
        createElement('div', { className: 'mb-1 font-semibold' }, 'Why it happened'),
        createElement('pre', { className: 'whitespace-pre-wrap break-words text-xs' }, diagnostic.cause)
      ) : null
    )
  );
}`
}
