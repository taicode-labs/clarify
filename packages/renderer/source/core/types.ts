import type { ComponentType } from 'react'

import type { OpenAPISpec } from '../openapi/lib/utils'
import type { RuntimeSlots } from '../slots'

export type RouteComponent = ComponentType | (() => Promise<{ default: ComponentType }>)

export type RouteSection = {
  id: string
  title: string
  level?: number
  badge?: string
  tags?: string[]
}

export type NavigationNode = {
  path: string
  title: string
  icon?: string
  children?: NavigationNode[]
  sections?: RouteSection[]
}

export type RouteItem = {
  path: string
  basePath?: string
  locale?: string
  isFallback?: boolean
  alternates?: Record<string, string>
  title: string
  description?: string
  keywords?: string[]
  component: RouteComponent
  lazy?: boolean
  kind?: string
  sections?: RouteSection[]
  contentArtifactUrl?: string
  sourceUrl?: string
}

export type LogoConfig = string | { light?: string; dark?: string }

export type FaviconConfig = string | { light?: string; dark?: string }

export type LocalizedText = string | Record<string, string>

export type LocaleConfig = {
  code: string
  label: string
  dir?: 'ltr' | 'rtl'
}

export type I18nConfig = {
  defaultLocale: string
  missing: 'fallback' | '404' | 'hide'
  locales: LocaleConfig[]
}

export type NavbarLink = {
  label: LocalizedText
  href: string
  external?: boolean
}

export type BannerConfig = {
  content: LocalizedText
  dismissible?: boolean
  link?: NavbarLink
}

export type FooterConfig = {
  links?: NavbarLink[]
  socials?: Record<string, string>
  copyright?: LocalizedText
}

export type SourceConfig = {
  repository: string
  branch?: string
  directory?: string
}

export type ThemePreset = 'default' | 'base'

export type ThemeModeColorValue = {
  light?: string
  dark?: string
}

export type ThemeColorValue = string | ThemeModeColorValue

export type ThemeColorTokensConfig = {
  primary: ThemeColorValue
  accent: ThemeColorValue
  background: ThemeColorValue
  foreground: ThemeColorValue
  surface: ThemeColorValue
  muted: ThemeColorValue
  border: ThemeColorValue
  codeBackground: ThemeColorValue
}

export type ThemeRadiusTokensConfig = {
  sm: string
  md: string
  lg: string
  xl: string
}

export type ThemeTokensConfig = {
  colors: ThemeColorTokensConfig
  radius: ThemeRadiusTokensConfig
}

export type ThemeLayoutConfig = {
  maxWidth: string
}

export type ThemeConfig = {
  preset: ThemePreset
  tokens: ThemeTokensConfig
  layout: ThemeLayoutConfig
  editor: boolean
}

export type PagesItem =
  | string
  | {
    page: string
    path?: string
    title?: LocalizedText
    icon?: string
    redirect?: string
  }
  | {
    openapi: string
    icon?: string
    title?: LocalizedText
    filter?: {
      tags?: string[]
    }
  }
  | PagesGroup

export type PagesGroup = {
  group: LocalizedText
  icon?: string
  pages: PagesItem[]
}

export type PagesConfig = PagesGroup[] | 'FileTree'

export type TabItem = {
  tab: LocalizedText
  icon?: string
  pages?: PagesConfig
}

export type TabsConfig = TabItem[]

export type Config = {
  title: string
  logo?: LogoConfig
  homeUrl?: string
  favicon?: FaviconConfig
  theme: ThemeConfig
  description: string
  siteUrl?: string
  source?: SourceConfig
  rootDirectory: string
  routePrefix: string
  assetPrefix: string
  outputDirectory: string
  navbar?: { links?: NavbarLink[] }
  banner?: BannerConfig
  footer?: FooterConfig
  i18n?: I18nConfig
  tabs?: TabsConfig
}

export type NavigationTab = {
  type: 'tab'
  path: string
  title: string
  icon?: string
  children: NavigationNode[]
}

export type TabbedNavigation = { tabs: NavigationTab[] }

export type LocalizedNavigation = Record<string, NavigationNode[]>

export type LocalizedTabbedNavigation = Record<string, TabbedNavigation>

export type NavigationTree = NavigationNode[] | LocalizedNavigation | TabbedNavigation | LocalizedTabbedNavigation

export type RenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: Config
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[]
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApis?: Record<string, OpenAPISpec>
  /** Plugin runtime UI slots imported from virtual:clarify-runtime-slots. */
  runtimeSlots?: RuntimeSlots
  /** Whether to render the live theme editor inside the app tree. */
  themeEditor?: boolean
  /** 挂载节点，默认 document.getElementById('root') */
  container?: Element | null
}

export type ServerRouteItem = Omit<RouteItem, 'component'> & {
  component: ComponentType
}

export type ServerRenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: Config
  /** 从 virtual:clarify-routes 导入的服务端路由数组 */
  routes: ServerRouteItem[]
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApis?: Record<string, OpenAPISpec>
  /** Plugin runtime UI slots imported from virtual:clarify-runtime-slots. */
  runtimeSlots?: RuntimeSlots
  /** Whether to render the live theme editor inside the app tree. */
  themeEditor?: boolean
  /** 当前请求的 URL */
  url: string
}
