import type { ClarifyThemeConfig, ClarifyThemeRadiusTokensConfig } from '../types'

type RandomThemePalette = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  surface: string;
  muted: string;
  borderMix: number;
  codeMix: number;
}

const randomThemePalettes = [
  { primary: '#047857', accent: '#0D9488', background: '#ffffff', foreground: '#111827', surface: '#ffffff', muted: '#64748b', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#2563eb', accent: '#7c3aed', background: '#f8fafc', foreground: '#0f172a', surface: '#ffffff', muted: '#64748b', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#9333ea', accent: '#db2777', background: '#fdf4ff', foreground: '#2e1065', surface: '#ffffff', muted: '#7e22ce', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#ea580c', accent: '#ca8a04', background: '#fff7ed', foreground: '#431407', surface: '#fffbeb', muted: '#9a3412', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#0f766e', accent: '#0891b2', background: '#f0fdfa', foreground: '#042f2e', surface: '#ffffff', muted: '#0f766e', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#be123c', accent: '#f97316', background: '#fff1f2', foreground: '#4c0519', surface: '#ffffff', muted: '#9f1239', borderMix: 0.13, codeMix: 0.06 },
  { primary: '#4f46e5', accent: '#06b6d4', background: '#eef2ff', foreground: '#1e1b4b', surface: '#ffffff', muted: '#4338ca', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#0e7490', accent: '#22c55e', background: '#ecfeff', foreground: '#083344', surface: '#ffffff', muted: '#155e75', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#7c2d12', accent: '#dc2626', background: '#fef2f2', foreground: '#450a0a', surface: '#fff7ed', muted: '#991b1b', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#365314', accent: '#84cc16', background: '#f7fee7', foreground: '#1a2e05', surface: '#ffffff', muted: '#4d7c0f', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#0369a1', accent: '#14b8a6', background: '#f0f9ff', foreground: '#082f49', surface: '#ffffff', muted: '#075985', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#a21caf', accent: '#e879f9', background: '#fdf4ff', foreground: '#4a044e', surface: '#ffffff', muted: '#86198f', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#c2410c', accent: '#fb7185', background: '#fff7ed', foreground: '#431407', surface: '#ffffff', muted: '#9a3412', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#1d4ed8', accent: '#f59e0b', background: '#eff6ff', foreground: '#172554', surface: '#ffffff', muted: '#1e40af', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#6d28d9', accent: '#10b981', background: '#faf5ff', foreground: '#2e1065', surface: '#ffffff', muted: '#6b21a8', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#0f172a', accent: '#64748b', background: '#f8fafc', foreground: '#0f172a', surface: '#ffffff', muted: '#475569', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#18181b', accent: '#71717a', background: '#fafafa', foreground: '#18181b', surface: '#ffffff', muted: '#52525b', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#166534', accent: '#06b6d4', background: '#f0fdf4', foreground: '#052e16', surface: '#ffffff', muted: '#15803d', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#9d174d', accent: '#8b5cf6', background: '#fdf2f8', foreground: '#500724', surface: '#ffffff', muted: '#be185d', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#4338ca', accent: '#ec4899', background: '#f5f3ff', foreground: '#312e81', surface: '#ffffff', muted: '#4f46e5', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#92400e', accent: '#65a30d', background: '#fffbeb', foreground: '#451a03', surface: '#ffffff', muted: '#a16207', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#0f766e', accent: '#f43f5e', background: '#f8fafc', foreground: '#134e4a', surface: '#ffffff', muted: '#0f766e', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#1e3a8a', accent: '#0ea5e9', background: '#f8fafc', foreground: '#0f172a', surface: '#ffffff', muted: '#475569', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#581c87', accent: '#f97316', background: '#faf5ff', foreground: '#3b0764', surface: '#ffffff', muted: '#7e22ce', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#991b1b', accent: '#facc15', background: '#fef2f2', foreground: '#450a0a', surface: '#ffffff', muted: '#b91c1c', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#115e59', accent: '#a3e635', background: '#f0fdfa', foreground: '#042f2e', surface: '#ffffff', muted: '#0f766e', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#075985', accent: '#38bdf8', background: '#f0f9ff', foreground: '#082f49', surface: '#ffffff', muted: '#0369a1', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#7e22ce', accent: '#f472b6', background: '#faf5ff', foreground: '#3b0764', surface: '#ffffff', muted: '#9333ea', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#b45309', accent: '#ef4444', background: '#fffbeb', foreground: '#451a03', surface: '#ffffff', muted: '#92400e', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#065f46', accent: '#2dd4bf', background: '#ecfdf5', foreground: '#022c22', surface: '#ffffff', muted: '#047857', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#312e81', accent: '#22d3ee', background: '#eef2ff', foreground: '#1e1b4b', surface: '#ffffff', muted: '#4338ca', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#831843', accent: '#fb923c', background: '#fdf2f8', foreground: '#500724', surface: '#ffffff', muted: '#be185d', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#164e63', accent: '#818cf8', background: '#ecfeff', foreground: '#083344', surface: '#ffffff', muted: '#155e75', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#3f6212', accent: '#f97316', background: '#f7fee7', foreground: '#1a2e05', surface: '#ffffff', muted: '#4d7c0f', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#1e40af', accent: '#fb7185', background: '#eff6ff', foreground: '#172554', surface: '#ffffff', muted: '#2563eb', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#701a75', accent: '#14b8a6', background: '#fdf4ff', foreground: '#4a044e', surface: '#ffffff', muted: '#a21caf', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#713f12', accent: '#eab308', background: '#fefce8', foreground: '#422006', surface: '#ffffff', muted: '#a16207', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#1f2937', accent: '#0ea5e9', background: '#f9fafb', foreground: '#111827', surface: '#ffffff', muted: '#4b5563', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#27272a', accent: '#a855f7', background: '#fafafa', foreground: '#18181b', surface: '#ffffff', muted: '#52525b', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#374151', accent: '#10b981', background: '#f3f4f6', foreground: '#111827', surface: '#ffffff', muted: '#4b5563', borderMix: 0.12, codeMix: 0.04 },
  { primary: '#064e3b', accent: '#f59e0b', background: '#f8fafc', foreground: '#022c22', surface: '#ffffff', muted: '#047857', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#7f1d1d', accent: '#60a5fa', background: '#fff7ed', foreground: '#450a0a', surface: '#ffffff', muted: '#991b1b', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#3730a3', accent: '#34d399', background: '#f8fafc', foreground: '#1e1b4b', surface: '#ffffff', muted: '#4f46e5', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#9f1239', accent: '#22c55e', background: '#fff1f2', foreground: '#4c0519', surface: '#ffffff', muted: '#be123c', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#134e4a', accent: '#8b5cf6', background: '#f0fdfa', foreground: '#042f2e', surface: '#ffffff', muted: '#0f766e', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#1d4ed8', accent: '#dc2626', background: '#f8fafc', foreground: '#0f172a', surface: '#ffffff', muted: '#475569', borderMix: 0.12, codeMix: 0.05 },
  { primary: '#6b21a8', accent: '#fbbf24', background: '#faf5ff', foreground: '#2e1065', surface: '#ffffff', muted: '#7e22ce', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#155e75', accent: '#84cc16', background: '#f0f9ff', foreground: '#083344', surface: '#ffffff', muted: '#0369a1', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#854d0e', accent: '#06b6d4', background: '#fefce8', foreground: '#422006', surface: '#ffffff', muted: '#a16207', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#14532d', accent: '#f43f5e', background: '#f0fdf4', foreground: '#052e16', surface: '#ffffff', muted: '#166534', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#4c1d95', accent: '#2dd4bf', background: '#f5f3ff', foreground: '#2e1065', surface: '#ffffff', muted: '#6d28d9', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#9a3412', accent: '#c084fc', background: '#fff7ed', foreground: '#431407', surface: '#ffffff', muted: '#c2410c', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#0c4a6e', accent: '#f472b6', background: '#f0f9ff', foreground: '#082f49', surface: '#ffffff', muted: '#075985', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#166534', accent: '#facc15', background: '#f7fee7', foreground: '#052e16', surface: '#ffffff', muted: '#15803d', borderMix: 0.13, codeMix: 0.05 },
  { primary: '#be185d', accent: '#38bdf8', background: '#fdf2f8', foreground: '#500724', surface: '#ffffff', muted: '#9d174d', borderMix: 0.14, codeMix: 0.06 },
  { primary: '#5b21b6', accent: '#ef4444', background: '#f5f3ff', foreground: '#2e1065', surface: '#ffffff', muted: '#6d28d9', borderMix: 0.14, codeMix: 0.06 },
] as const satisfies readonly RandomThemePalette[]

const randomRadiusSets = [
  { sm: '2px', md: '6px', lg: '10px', xl: '14px' },
  { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
  { sm: '6px', md: '10px', lg: '14px', xl: '18px' },
  { sm: '8px', md: '12px', lg: '18px', xl: '24px' },
  { sm: '10px', md: '14px', lg: '20px', xl: '28px' },
  { sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  { sm: '999px', md: '999px', lg: '999px', xl: '999px' },
] as const satisfies ReadonlyArray<ClarifyThemeRadiusTokensConfig>

const randomLayoutWidths = ['72rem', '76rem', '78rem', '80rem', '82rem', '86rem', '90rem', '96rem'] as const

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomRgbMix(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

function modeColor(light: string, dark: string): { light: string; dark: string } {
  return { light, dark }
}

export function createRandomTheme(): ClarifyThemeConfig {
  const palette = randomItem(randomThemePalettes)
  const radius = randomItem(randomRadiusSets)
  const maxWidth = randomItem(randomLayoutWidths)

  return {
    preset: 'default',
    tokens: {
      colors: {
        primary: modeColor(palette.primary, palette.accent),
        accent: modeColor(palette.accent, palette.primary),
        background: modeColor(palette.background, '#09090b'),
        foreground: modeColor(palette.foreground, '#f8fafc'),
        surface: modeColor(palette.surface, '#18181b'),
        muted: modeColor(palette.muted, '#a1a1aa'),
        border: modeColor(randomRgbMix(palette.foreground, palette.borderMix), 'rgb(255 255 255 / 0.1)'),
        codeBackground: modeColor(randomRgbMix(palette.primary, palette.codeMix), '#18181b'),
      },
      radius: { ...radius },
    },
    layout: { maxWidth },
    editor: false,
  }
}
