import { describe, expect, it } from 'vitest'

import * as renderer from './index'

describe('renderer public API', () => {
  it('exports a focused runtime-facing surface', () => {
    expect(Object.keys(renderer).sort()).toEqual([
      'AppShell',
      'BuiltWithClarify',
      'DocShell',
      'Markdown',
      'OpenApiDocument',
      'OpenApiOperation',
      'OpenApisContext',
      'PageBanner',
      'PageFooter',
      'RuntimeSlot',
      'RuntimeSlotsProvider',
      'SectionProvider',
      'SlotProvider',
      'ThemeEditor',
      'ThemeProvider',
      'ThemeToggle',
      'applyThemeVariables',
      'createContentDiagnosticComponent',
      'createDocumentRouteComponent',
      'createOpenApiRouteComponent',
      'markdownRemarkPlugins',
      'render',
      'renderContentDocument',
      'remToPx',
      'themeBootstrapScript',
      'themeEditorPresets',
      'themePresets',
      'useMDXComponents',
      'useOpenApis',
      'useSectionStore',
      'useSlot',
      'useTheme',
    ].sort())
  })
})
