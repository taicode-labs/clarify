import type { ComponentType } from 'react'

import type { OpenAPISpec } from '../openapi/lib/utils'

export type RouteComponent = ComponentType | (() => Promise<{ default: ComponentType }>)

export type RouteSection = {
  id: string;
  title: string;
  badge?: string;
  tags?: string[];
};

export type NavigationNode = {
  path: string;
  title: string;
  icon?: string;
  children?: NavigationNode[];
  sections?: RouteSection[];
};

export type RouteItem = {
  path: string;
  basePath?: string;
  locale?: string;
  isFallback?: boolean;
  alternates?: Record<string, string>;
  title: string;
  description?: string;
  keywords?: string[];
  component: RouteComponent;
  lazy?: boolean;
  kind?: 'mdx' | 'openapi';
  openapiTagFilter?: string[];
  sections?: RouteSection[];
  contentArtifactUrl?: string;
};

export type ClarifyLogoConfig = string | { light?: string; dark?: string };

export type ClarifyFaviconConfig = string | { light?: string; dark?: string };

export type ClarifyLocalizedText = string | Record<string, string>;

export type ClarifyLocaleConfig = {
  code: string;
  label: string;
  dir?: 'ltr' | 'rtl';
};

export type ClarifyI18nConfig = {
  defaultLocale: string;
  missing: 'fallback' | '404' | 'hide';
  locales: ClarifyLocaleConfig[];
};

export type ClarifyNavbarLink = {
  label: ClarifyLocalizedText;
  href: string;
  external?: boolean;
};

export type ClarifyBannerConfig = {
  content: ClarifyLocalizedText;
  dismissible?: boolean;
};

export type ClarifyFooterConfig = {
  links?: ClarifyNavbarLink[];
  socials?: Record<string, string>;
  copyright?: ClarifyLocalizedText;
};

export type ClarifyThemePreset = 'default' | 'base';

export type ClarifyThemeColorTokensConfig = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  surface: string;
  muted: string;
  border: string;
  codeBackground: string;
};

export type ClarifyThemeRadiusTokensConfig = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

export type ClarifyThemeTokensConfig = {
  colors: ClarifyThemeColorTokensConfig;
  radius: ClarifyThemeRadiusTokensConfig;
};

export type ClarifyThemeLayoutConfig = {
  maxWidth: string;
};

export type ClarifyThemeConfig = {
  preset: ClarifyThemePreset;
  tokens: ClarifyThemeTokensConfig;
  layout: ClarifyThemeLayoutConfig;
};

export type ClarifyPagesItem =
  | string
  | {
      page: string;
      title?: ClarifyLocalizedText;
      icon?: string;
      redirect?: string;
    }
  | {
      openapi: string;
      icon?: string;
      title?: ClarifyLocalizedText;
      filter?: {
        tags?: string[];
      };
    };

export type ClarifyPagesGroup = {
  group: ClarifyLocalizedText;
  icon?: string;
  pages: ClarifyPagesItem[];
};

export type ClarifyPagesConfig = ClarifyPagesGroup[] | 'FileTree';

export type ClarifyTabItem = {
  tab: ClarifyLocalizedText;
  icon?: string;
  pages?: ClarifyPagesConfig;
};

export type ClarifyTabsConfig = ClarifyTabItem[];

export type ClarifyConfig = {
  title: string;
  logo?: ClarifyLogoConfig;
  favicon?: ClarifyFaviconConfig;
  theme: ClarifyThemeConfig;
  description: string;
  rootDirectory: string;
  routePrefix: string;
  outputDirectory: string;
  navbar?: { links?: ClarifyNavbarLink[] };
  banner?: ClarifyBannerConfig;
  footer?: ClarifyFooterConfig;
  i18n?: ClarifyI18nConfig;
  tabs?: ClarifyTabsConfig;
};

export type NavigationTab = {
  type: 'tab';
  path: string;
  title: string;
  icon?: string;
  children: NavigationNode[];
};

export type TabbedNavigation = { tabs: NavigationTab[] };

export type LocalizedNavigation = Record<string, NavigationNode[]>;

export type LocalizedTabbedNavigation = Record<string, TabbedNavigation>;

export type NavigationTree = NavigationNode[] | LocalizedNavigation | TabbedNavigation | LocalizedTabbedNavigation;

export type RenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[];
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree;
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApis?: Record<string, OpenAPISpec>;
  /** 挂载节点，默认 document.getElementById('root') */
  container?: Element | null;
};

export type ServerRouteItem = Omit<RouteItem, 'component'> & {
  component: ComponentType;
};

export type ServerRenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的服务端路由数组 */
  routes: ServerRouteItem[];
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree;
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApis?: Record<string, OpenAPISpec>;
  /** 当前请求的 URL */
  url: string;
};
