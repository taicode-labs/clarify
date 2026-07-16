import { useId, useMemo, useState } from 'react'

import { useLocale } from '../core/context'
import { useBuiltInText, type BuiltInTextKey } from '../core/i18n'

export type ImageQuality = 'low' | 'medium' | 'high'

export type ImageTokenCalculatorProps = {
  model?: 'gpt-image-2'
}

export type ImageTokenInput = {
  width: number
  height: number
  quality: ImageQuality
}

type ImageSize = {
  width: number | null
  height: number | null
}

export type ImageSizeValidationKey = Extract<BuiltInTextKey,
  | 'imageTokenCalculator.positiveIntegers'
  | 'imageTokenCalculator.divisibleBy16'
  | 'imageTokenCalculator.pixelMinimum'
  | 'imageTokenCalculator.pixelMaximum'
  | 'imageTokenCalculator.maximumEdge'
  | 'imageTokenCalculator.aspectRatio'
>

const qualityBases: Record<ImageQuality, number> = {
  low: 16,
  medium: 48,
  high: 96,
}

const qualityOptions: Array<{ label: BuiltInTextKey, value: ImageQuality }> = [
  { label: 'imageTokenCalculator.low', value: 'low' },
  { label: 'imageTokenCalculator.medium', value: 'medium' },
  { label: 'imageTokenCalculator.high', value: 'high' },
]

const minimumPixels = 655_360
const maximumPixels = 8_294_400
const maximumEdge = 3_840
const maximumAspectRatio = 3

// Mirrors the public gpt-image-2 calculator shipped by OpenAI on 2026-07-16.
export function calculateImageOutputTokens(input: ImageTokenInput): number {
  const { width, height, quality } = input
  const longEdge = Math.max(width, height)
  const shortEdge = Math.min(width, height)
  const qualityBase = qualityBases[quality]
  const scaledBase = Math.round(qualityBase * shortEdge / longEdge)
  const widthFactor = width >= height ? qualityBase : scaledBase
  const heightFactor = width >= height ? scaledBase : qualityBase

  return Math.ceil(widthFactor * heightFactor * (2_000_000 + width * height) / 4_000_000)
}

export function validateImageSize(size: ImageSize): ImageSizeValidationKey[] {
  const { width, height } = size
  if (!width || !height || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return ['imageTokenCalculator.positiveIntegers']
  }

  const errors: ImageSizeValidationKey[] = []
  if (width % 16 !== 0 || height % 16 !== 0) errors.push('imageTokenCalculator.divisibleBy16')

  const pixels = width * height
  if (pixels < minimumPixels) errors.push('imageTokenCalculator.pixelMinimum')
  if (pixels > maximumPixels) errors.push('imageTokenCalculator.pixelMaximum')

  const longEdge = Math.max(width, height)
  const shortEdge = Math.min(width, height)
  if (longEdge > maximumEdge) errors.push('imageTokenCalculator.maximumEdge')
  if (longEdge / shortEdge > maximumAspectRatio) errors.push('imageTokenCalculator.aspectRatio')

  return errors
}

function parseDimension(value: string): number | null {
  const number = Number(value)
  return Number.isFinite(number) && Number.isInteger(number) && number > 0 ? number : null
}

export function ImageTokenCalculator(arg0: ImageTokenCalculatorProps) {
  const { model = 'gpt-image-2' } = arg0
  const t = useBuiltInText()
  const locale = useLocale()
  const groupName = useId()
  const [quality, setQuality] = useState<ImageQuality>('low')
  const [widthValue, setWidthValue] = useState('1024')
  const [heightValue, setHeightValue] = useState('1024')

  const size = useMemo(() => ({
    width: parseDimension(widthValue),
    height: parseDimension(heightValue),
  }), [heightValue, widthValue])
  const errors = useMemo(() => validateImageSize(size), [size])
  const outputTokens = useMemo(() => {
    if (!size.width || !size.height || errors.length > 0) return null
    return calculateImageOutputTokens({ width: size.width, height: size.height, quality })
  }, [errors.length, quality, size.height, size.width])
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

  return (
    <div className="not-prose my-5 rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-4 md:p-5" data-model={model}>
      <div className="grid gap-4 md:grid-cols-3">
        <fieldset className="m-0 border-0 p-0 md:col-span-3">
          <legend className="mb-2 text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground)">{t('imageTokenCalculator.quality')}</legend>
          <div className="inline-flex rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-ui-subtle-background) p-1">
            {qualityOptions.map(option => (
              <label key={option.value} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  checked={quality === option.value}
                  name={groupName}
                  onChange={() => setQuality(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="block rounded-(--clarify-theme-tokens-radius-sm) px-4 py-1.5 text-sm font-medium text-(--clarify-ui-text-soft) transition peer-checked:bg-(--clarify-theme-tokens-colors-surface) peer-checked:text-(--clarify-theme-tokens-colors-foreground) peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
                  {t(option.label)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground)">{t('imageTokenCalculator.width')}</span>
          <input
            className="h-10 w-full rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 text-sm text-(--clarify-theme-tokens-colors-foreground) outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
            inputMode="numeric"
            min="1"
            onChange={event => setWidthValue(event.currentTarget.value)}
            step="1"
            type="number"
            value={widthValue}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground)">{t('imageTokenCalculator.height')}</span>
          <input
            className="h-10 w-full rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 text-sm text-(--clarify-theme-tokens-colors-foreground) outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
            inputMode="numeric"
            min="1"
            onChange={event => setHeightValue(event.currentTarget.value)}
            step="1"
            type="number"
            value={heightValue}
          />
        </label>

        <div className="rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-4 py-3" aria-live="polite">
          <div className="text-sm font-semibold text-(--clarify-ui-text-soft)">{t('imageTokenCalculator.outputTokens')}</div>
          <div className="mt-1 text-2xl font-semibold text-(--clarify-theme-tokens-colors-foreground)">
            {outputTokens === null ? t('imageTokenCalculator.invalidSize') : formatter.format(outputTokens)}
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-code-danger-border) bg-(--clarify-code-danger-background) px-4 py-3 text-sm text-(--clarify-code-danger) md:col-span-3" role="alert">
            <div className="font-semibold">{t('imageTokenCalculator.sizeRules')}</div>
            <ul className="mt-2 list-disc pl-5">
              {errors.map(error => <li key={error}>{t(error)}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
