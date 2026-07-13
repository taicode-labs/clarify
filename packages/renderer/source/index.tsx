import './styles.css'

import { AppShell } from './app/AppShell'
import { BuiltWithClarify } from './app/BuiltWithClarify'
import { createContentDiagnosticComponent, type ContentDiagnostic, type ContentDiagnosticKind } from './app/ContentDiagnostic'
import { PageBanner } from './app/PageBanner'
import { PageFooter } from './app/PageFooter'
import { SectionProvider, useSectionStore, type Section } from './app/SectionProvider'
import { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Feedback, GridPattern, Heading, HeroPattern, Logo, Mermaid, Pre, Prose, Step, Steps, Tab, Tabs, Tag, WebFrame } from './components'
import { OpenApiSpecsContext, useOpenApiSpecs } from './context'
import { useMDXComponents } from './mdx/components'
import { DocShell } from './mdx/DocShell'
import { Markdown } from './mdx/Markdown'
import { markdownRemarkPlugins, parseCodeMeta } from './mdx/remark'
import { OpenApiDocument, OpenApiOperation, createOpenApiRouteComponent } from './openapi'
import { render } from './runtime/render'
import { SlotProvider, RuntimeSlot, RuntimeSlotsProvider, useSlot } from './slots'
import { applyThemeVariables, themeEditorPresets, ThemeEditor } from './theme/ThemeEditor'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import { ThemeToggle } from './theme/ThemeToggle'
import { themePresets, themeBootstrapScript } from './theme/variables'
import type { Config, RouteItem, RouteSection, RenderOptions, ServerRenderOptions } from './types'
import { remToPx } from './utils/remToPx'

export type { OpenApiOperationProps, OpenApiDocumentProps, OpenAPIOperation, OpenAPISpec, OpenApiRouteData } from './openapi'
export type { ThemeEditorProps } from './theme/ThemeEditor'
export type { StepProps, StepsProps, TabItem, TabProps, TabsProps } from './components'
export type { ContentDiagnostic, ContentDiagnosticKind }
export type { Config, RouteItem, RouteSection, RenderOptions, ServerRenderOptions, Section }
export type { RuntimeSlotEntry, RuntimeSlotRegistry, UISlotRegistration, UISlotName, UISlotContext } from './slots'

// App and runtime exports
export { AppShell, render, OpenApiSpecsContext, useOpenApiSpecs, BuiltWithClarify, PageBanner, PageFooter, ThemeProvider, ThemeToggle, ThemeEditor, useTheme, SectionProvider, useSectionStore, remToPx, applyThemeVariables, themeEditorPresets, themePresets, themeBootstrapScript, createContentDiagnosticComponent, createOpenApiRouteComponent }

// Built-in MDX and UI components
export { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Pre, Prose, Heading, Logo, Mermaid, GridPattern, HeroPattern, Feedback, Step, Steps, Tab, Tabs, Tag, WebFrame }

// MDX integration helpers
export { DocShell, Markdown, useMDXComponents, markdownRemarkPlugins, parseCodeMeta }

// Plugin runtime UI slots
export { SlotProvider, RuntimeSlot, RuntimeSlotsProvider, useSlot }

// OpenAPI components
export { OpenApiDocument, OpenApiOperation }
