import './styles.css'

import { AppShell } from './app/AppShell'
import { BuiltWithClarify } from './app/BuiltWithClarify'
import { PageBanner } from './app/PageBanner'
import { PageFooter } from './app/PageFooter'
import { SectionProvider, useSectionStore, type Section } from './app/SectionProvider'
import { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Feedback, GridPattern, Heading, HeroPattern, Logo, Pre, Prose, Tag, WebFrame } from './components'
import { ConfigContext, OpenApisContext, useConfig, useOpenApis } from './context'
import { useMDXComponents } from './mdx/components'
import { DocShell } from './mdx/DocShell'
import { Markdown } from './mdx/Markdown'
import { markdownRemarkPlugins } from './mdx/remark'
import { OpenApiDocument, OpenApiOperation } from './openapi'
import { render } from './runtime/render'
import { applyThemeVariables, themeEditorPresets, ThemeEditor } from './theme/ThemeEditor'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import { ThemeToggle } from './theme/ThemeToggle'
import { themePresets, themeBootstrapScript } from './theme/variables'
import type { Config, RouteItem, RenderOptions, ServerRenderOptions } from './types'
import { remToPx } from './utils/remToPx'

export type { OpenApiOperationProps, OpenApiDocumentProps, OpenAPIOperation, OpenAPISpec } from './openapi'
export type { ThemeEditorProps } from './theme/ThemeEditor'
export type { Config, RouteItem, RenderOptions, ServerRenderOptions, Section }

// App and runtime exports
export { AppShell, render, ConfigContext, OpenApisContext, useConfig, useOpenApis, BuiltWithClarify, PageBanner, PageFooter, ThemeProvider, ThemeToggle, ThemeEditor, useTheme, SectionProvider, useSectionStore, remToPx, applyThemeVariables, themeEditorPresets, themePresets, themeBootstrapScript }

// Built-in MDX and UI components
export { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Pre, Prose, Heading, Logo, GridPattern, HeroPattern, Feedback, Tag, WebFrame }

// MDX integration helpers
export { DocShell, Markdown, useMDXComponents, markdownRemarkPlugins }

// OpenAPI components
export { OpenApiDocument, OpenApiOperation }
