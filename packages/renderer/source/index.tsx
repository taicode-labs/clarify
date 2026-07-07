import './styles.css'

import { AppShell } from './app/AppShell'
import { BuiltWithClarify } from './app/BuiltWithClarify'
import { createContentDiagnosticComponent, type ContentDiagnostic } from './app/ContentDiagnostic'
import { PageBanner } from './app/PageBanner'
import { PageFooter } from './app/PageFooter'
import { SectionProvider, useSectionStore, type Section } from './app/SectionProvider'
import { createDocumentRouteComponent, renderContentDocument } from './content-renderer'
import { OpenApisContext, useOpenApis } from './context'
import { useMDXComponents } from './mdx/components'
import { DocShell } from './mdx/DocShell'
import { Markdown } from './mdx/Markdown'
import { markdownRemarkPlugins } from './mdx/remark'
import { OpenApiDocument, OpenApiOperation, createOpenApiRouteComponent } from './openapi'
import { render } from './runtime/render'
import { RuntimeSlot, RuntimeSlotsProvider, SlotProvider, useSlot } from './slots'
import { applyThemeVariables, themeEditorPresets, ThemeEditor } from './theme/ThemeEditor'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import { ThemeToggle } from './theme/ThemeToggle'
import { themePresets, themeBootstrapScript } from './theme/variables'
import type { Config, RouteItem, RenderOptions, ServerRenderOptions } from './types'
import { remToPx } from './utils/remToPx'

export type { ContentBlock, ContentDocument, ContentDocumentRoute, ContentMetadata, ContentRenderContext, ContentSectionMetadata, ContentSource, MarkdownContentBlock, MdxContentBlock, OpenAPIContentBlock, OpenAPIOperationReference, OpenAPISpecReference } from './content'
export type { OpenApiOperationProps, OpenApiDocumentProps, OpenAPIOperation, OpenAPISpec, OpenApiRouteData } from './openapi'
export type { ThemeEditorProps } from './theme/ThemeEditor'
export type { ContentDiagnostic }
export type { Config, RouteItem, RenderOptions, ServerRenderOptions, Section }
export type { RuntimeSlotEntry, RuntimeSlots, UISlotRegistration, UISlotName, SlotContext } from './slots'

export { AppShell, render, OpenApisContext, useOpenApis, BuiltWithClarify, PageBanner, PageFooter, ThemeProvider, ThemeToggle, ThemeEditor, useTheme, SectionProvider, useSectionStore, remToPx, applyThemeVariables, themeEditorPresets, themePresets, themeBootstrapScript, createContentDiagnosticComponent, createOpenApiRouteComponent, createDocumentRouteComponent, renderContentDocument }
export { DocShell, Markdown, useMDXComponents, markdownRemarkPlugins }
export { RuntimeSlot, RuntimeSlotsProvider, SlotProvider, useSlot }
export { OpenApiDocument, OpenApiOperation }
