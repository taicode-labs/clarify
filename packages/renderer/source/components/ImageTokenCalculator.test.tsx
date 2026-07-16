import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LocaleContext } from '../core/context'

import { calculateImageOutputTokens, ImageTokenCalculator, validateImageSize } from './ImageTokenCalculator'

describe('calculateImageOutputTokens', () => {
  it.each([
    ['low', 1024, 1024, 196],
    ['medium', 1024, 1024, 1756],
    ['high', 1024, 1024, 7024],
    ['low', 1024, 1536, 158],
    ['medium', 1536, 1024, 1372],
    ['high', 2048, 1024, 4720],
    ['low', 640, 1024, 107],
    ['low', 3840, 1280, 139],
  ] as const)('matches OpenAI for %s at %ix%i', (quality, width, height, expected) => {
    expect(calculateImageOutputTokens({ quality, width, height })).toBe(expected)
  })
})

describe('validateImageSize', () => {
  it('accepts documented boundary sizes', () => {
    expect(validateImageSize({ width: 640, height: 1024 })).toEqual([])
    expect(validateImageSize({ width: 3840, height: 1280 })).toEqual([])
  })

  it('reports every violated rule', () => {
    expect(validateImageSize({ width: 4000, height: 1024 })).toEqual([
      'imageTokenCalculator.maximumEdge',
      'imageTokenCalculator.aspectRatio',
    ])
    expect(validateImageSize({ width: 1024, height: 1000 })).toEqual([
      'imageTokenCalculator.divisibleBy16',
    ])
  })
})

describe('ImageTokenCalculator', () => {
  it('renders accessible controls and the default result', () => {
    const html = renderToStaticMarkup(<ImageTokenCalculator />)

    expect(html).toContain('<fieldset')
    expect(html).toContain('type="radio"')
    expect(html).toContain('type="number"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('>196<')
  })

  it('shows request field names in English with Chinese explanations on Chinese pages', () => {
    const html = renderToStaticMarkup(
      <LocaleContext.Provider value="zh-CN">
        <ImageTokenCalculator />
      </LocaleContext.Provider>
    )

    expect(html).toContain('>Quality（质量）<')
    expect(html).toContain('>Low（低）<')
    expect(html).toContain('>Medium（中）<')
    expect(html).toContain('>High（高）<')
    expect(html).toContain('>Width（宽度）<')
    expect(html).toContain('>Height（高度）<')
  })
})
