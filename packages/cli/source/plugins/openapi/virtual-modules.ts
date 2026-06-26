import { VIRTUAL_OPENAPI } from '../../core/virtual-modules.js'
import type { ContentDiagnostic, OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = VIRTUAL_OPENAPI

export function generateOpenAPIRegistryModule(openApis: Record<string, OpenAPISpec>): string {
  return `export const openApis = ${JSON.stringify(openApis)};`
}

type OpenAPIPageModuleOptions =
  | { mode: 'inline'; spec: OpenAPISpec; tagFilter?: string[] }
  | { mode: 'lazy'; spec: OpenAPISpec; tagFilter?: string[]; specUrl: string; specKey: string }

export function generateOpenAPIPageModule(opts: OpenAPIPageModuleOptions): string {
  const { spec, tagFilter } = opts

  if (opts.mode === 'inline') {
    // Dev mode — inline spec data directly (fast, no file system round-trip)
    return [
      `import { createElement } from 'react';`,
      `import { OpenApiDocument } from '@clarify-labs/renderer';`,
      `const spec = ${JSON.stringify(spec)};`,
      `const tagFilter = ${JSON.stringify(tagFilter ?? undefined)};`,
      `export default function OpenApiRoutePage() {`,
      `  return createElement(OpenApiDocument, { spec, tagFilter });`,
      `}`,
    ].join('\n')
  }

  // Build mode — lazy: check inline <script> (hydration) → fetch (SPA nav)
  const { specUrl, specKey } = opts
  return [
    `import { createElement, useEffect, useRef, useState } from 'react';`,
    `import { OpenApiDocument, useOpenApis } from '@clarify-labs/renderer';`,
    `var SPEC_KEY = ${JSON.stringify(specKey)};`,
    `var SPEC_URL = ${JSON.stringify(specUrl)};`,
    `var TAG_FILTER = ${JSON.stringify(tagFilter ?? undefined)};`,
    `function getInitialSpec() {`,
    `  try {`,
    `    var el = document.getElementById('__openapi-spec-' + SPEC_KEY);`,
    `    if (el) {`,
    `      try { sessionStorage.setItem('__openapi-spec-' + SPEC_KEY, el.textContent); } catch(e) {}`,
    `      return JSON.parse(el.textContent);`,
    `    }`,
    `  } catch(e) {}`,
    `  try {`,
    `    var cached = sessionStorage.getItem('__openapi-spec-' + SPEC_KEY);`,
    `    if (cached) return JSON.parse(cached);`,
    `  } catch(e) {}`,
    `  return null;`,
    `}`,
    `export default function OpenApiRoutePage() {`,
    `  var specs = useOpenApis();`,
    `  var serverSpec = specs[SPEC_KEY];`,
    `  var [spec, setSpec] = useState(serverSpec || getInitialSpec());`,
    `  var fetchRef = useRef(false);`,
    `  useEffect(function() {`,
    `    if (spec) return;`,
    `    if (fetchRef.current) return;`,
    `    fetchRef.current = true;`,
    `    fetch(SPEC_URL).then(function(r) { return r.json(); }).then(function(data) {`,
    `      setSpec(data);`,
    `      try { sessionStorage.setItem('__openapi-spec-' + SPEC_KEY, JSON.stringify(data)); } catch(e) {}`,
    `    });`,
    `  }, [spec]);`,
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
