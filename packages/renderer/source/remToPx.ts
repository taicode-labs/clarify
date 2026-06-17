export function remToPx(remValue: number) {
  const rootFontSize =
    typeof window === 'undefined'
      ? 16
      : Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)

  return remValue * rootFontSize
}
