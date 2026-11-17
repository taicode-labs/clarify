import { useEffect, useState, type ReactNode } from 'react'

import { getHighlighterFor, type HighlightTokens } from './highlight/highlighter'

type HighlightedCodeProps = {
  code: string
  language: string
}

type HighlightResult = {
  key: string
  lines: HighlightTokens
}

function highlightKey(code: string, language: string): string {
  return `${language}\u0000${code}`
}

/**
 * Renders syntax-highlighted code.
 *
 * The shiki runtime and grammars load lazily, so this renders plain text
 * immediately and upgrades in place once the highlighter resolves.
 */
export function HighlightedCode(arg0: HighlightedCodeProps): ReactNode {
  const { code, language } = arg0
  const [result, setResult] = useState<HighlightResult>()

  useEffect(() => {
    let active = true
    const key = highlightKey(code, language)

    void getHighlighterFor(language)
      .then(highlighter => highlighter?.codeToTokens(code, { lang: language }).tokens)
      .then((tokens) => {
        if (active && tokens) setResult({ key, lines: tokens })
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [code, language])

  const lines = result?.key === highlightKey(code, language) ? result.lines : undefined

  if (!lines) return <code className={`language-${language}`}>{code}</code>

  return (
    <code className={`language-${language}`}>
      {lines.map((line, lineIndex) => (
        <span className="line" key={lineIndex}>
          {line.map((token, tokenIndex) => (
            <span key={tokenIndex} style={{ color: token.color, ...token.htmlStyle }}>{token.content}</span>
          ))}
          {lineIndex < lines.length - 1 ? '\n' : null}
        </span>
      ))}
    </code>
  )
}
