import { useEffect, useState, type ReactNode } from 'react'
import { codeToTokens, createCssVariablesTheme, type BundledLanguage, type ThemedToken } from 'shiki'

const cssVariablesTheme = createCssVariablesTheme()

type HighlightedCodeProps = {
  code: string
  language: string
}

export function HighlightedCode(arg0: HighlightedCodeProps): ReactNode {
  const { code, language } = arg0
  const [lines, setLines] = useState<ThemedToken[][]>()

  useEffect(() => {
    let active = true

    void codeToTokens(code, { lang: language as BundledLanguage, theme: cssVariablesTheme })
      .then((result) => {
        if (active) setLines(result.tokens)
      })
      .catch(() => {
        if (active) setLines(undefined)
      })

    return () => {
      active = false
    }
  }, [code, language])

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
