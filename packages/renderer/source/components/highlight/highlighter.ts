import { isHighlightLanguage, languageLoaders, type HighlightLanguage } from './languages'

type ShikiCore = typeof import('shiki/core')
type ShikiHighlighter = Awaited<ReturnType<ShikiCore['createHighlighterCore']>>
type ShikiTheme = Awaited<ReturnType<ShikiCore['createCssVariablesTheme']>>

export type HighlightTokens = Array<Array<{ content: string; color?: string; htmlStyle?: Record<string, string | number> }>>

export type HighlighterHandle = {
  codeToTokens: (code: string, options: { lang: string }) => { tokens: HighlightTokens }
}

const loadedLanguages = new Set<HighlightLanguage>()
let statePromise: Promise<{ highlighter: ShikiHighlighter; theme: ShikiTheme }> | undefined

/**
 * The shiki runtime (regex engine, CSS variables theme and tokenizer) is
 * imported on demand so it stays out of the initial payload. `HighlightedCode`
 * renders a plain `<code>` fallback while it resolves.
 */
function getHighlighterState(): Promise<{ highlighter: ShikiHighlighter; theme: ShikiTheme }> {
  statePromise ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(async ([core, engine]) => {
    const theme = core.createCssVariablesTheme()
    const highlighter = await core.createHighlighterCore({
      themes: [theme],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    })

    return { highlighter, theme }
  })

  return statePromise
}

/**
 * Resolve a tokenizer with `language` registered, or `undefined` when the
 * language is not part of the curated allowlist.
 *
 * Grammars are imported on demand so each one stays in its own lazy chunk
 * instead of being bundled into the initial payload.
 */
export async function getHighlighterFor(language: string): Promise<HighlighterHandle | undefined> {
  if (!isHighlightLanguage(language)) return undefined

  const { highlighter, theme } = await getHighlighterState()

  if (!loadedLanguages.has(language)) {
    await highlighter.loadLanguage(languageLoaders[language] as never)
    loadedLanguages.add(language)
  }

  return {
    codeToTokens: (code, options) => {
      const { tokens } = highlighter.codeToTokens(code, { lang: options.lang, theme })
      return { tokens: tokens as HighlightTokens }
    },
  }
}
