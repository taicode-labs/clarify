import './styles.css'

import { AppShell } from './app/AppShell'
import { BuiltWithClarify } from './app/BuiltWithClarify'
import { PageFooter } from './app/PageFooter'
import { SectionProvider, useSectionStore, type Section } from './app/SectionProvider'
import { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Feedback, GridPattern, Heading, HeroPattern, Logo, Pre, Prose, Tag } from './components'
import { ClarifyConfigContext, OpenApisContext, useClarifyConfig, useOpenApis } from './context'
import { useMDXComponents } from './mdx/components'
import { DocShell } from './mdx/DocShell'
import { Markdown } from './mdx/Markdown'
import { markdownRemarkPlugins } from './mdx/remark'
import { OpenApiDocument, OpenApiOperation } from './openapi'
import { render } from './runtime/render'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import { ThemeToggle } from './theme/ThemeToggle'
import type { ClarifyConfig, RouteItem, RenderOptions, ServerRenderOptions } from './types'
import { remToPx } from './utils/remToPx'

export type { OpenApiOperationProps, OpenApiDocumentProps, OpenAPIOperation, OpenAPISpec } from './openapi'
export type { ClarifyConfig, RouteItem, RenderOptions, ServerRenderOptions, Section }

// App and runtime exports
export { AppShell, render, ClarifyConfigContext, OpenApisContext, useClarifyConfig, useOpenApis, BuiltWithClarify, PageFooter, ThemeProvider, ThemeToggle, useTheme, SectionProvider, useSectionStore, remToPx }

// Built-in MDX and UI components
export { Button, Callout, Card, CardGroup, Code, CodeGroup, Collapse, Pre, Prose, Heading, Logo, GridPattern, HeroPattern, Feedback, Tag }

// MDX integration helpers
export { DocShell, Markdown, useMDXComponents, markdownRemarkPlugins }

// OpenAPI components
export { OpenApiDocument, OpenApiOperation }
