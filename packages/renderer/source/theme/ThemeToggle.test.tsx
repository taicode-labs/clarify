import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LocaleContext } from '../core/context'

import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

function render(locale?: string) {
  return renderToStaticMarkup(
    <LocaleContext.Provider value={locale}>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </LocaleContext.Provider>,
  )
}

describe('ThemeToggle', () => {
  it('uses an icon-only theme menu button in English', () => {
    const markup = render('en-US')

    expect(markup).toContain('aria-label="Switch theme"')
    expect(markup).not.toContain('System')
  })

  it('localizes the icon-only theme menu button', () => {
    const markup = render('zh-CN')

    expect(markup).toContain('aria-label="切换主题"')
    expect(markup).not.toContain('跟随系统')
  })
})
