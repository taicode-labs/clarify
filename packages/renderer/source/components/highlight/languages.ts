/**
 * Languages that the OpenAPI viewers can ask `HighlightedCode` to render.
 *
 * Each entry is a dynamic import so the grammar only ships in its own lazy
 * chunk. Keep this list in sync with `codeLanguageForMediaType`,
 * `requestSnippetOptions` and `textLanguages`.
 */
export const languageLoaders = {
  bash: () => import('shiki/langs/bash.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  csv: () => import('shiki/langs/csv.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  graphql: () => import('shiki/langs/graphql.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  http: () => import('shiki/langs/http.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  kotlin: () => import('shiki/langs/kotlin.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  powershell: () => import('shiki/langs/powershell.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  ruby: () => import('shiki/langs/ruby.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  swift: () => import('shiki/langs/swift.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
}

export type HighlightLanguage = keyof typeof languageLoaders

export function isHighlightLanguage(language: string): language is HighlightLanguage {
  return Object.hasOwn(languageLoaders, language)
}
