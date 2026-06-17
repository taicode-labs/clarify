import type { ComponentType } from 'react'

import type { OpenAPISpec } from './openapi/utils'

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
  sourceLocale?: string;
  isFallback?: boolean;
  alternates?: Record<string, string>;
  title: string;
  component: ComponentType;
  kind?: 'mdx' | 'openapi';
  sections?: RouteSection[];
  rawContentUrl?: string;
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
  sourceLocale: string;
  defaultLocale: string;
  strategy: 'prefix_except_default' | 'prefix_always';
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
  socials?: Record<string, string>;
  copyright?: ClarifyLocalizedText;
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
    };

export type ClarifyPagesGroup = {
  group: ClarifyLocalizedText;
  icon?: string;
  pages: ClarifyPagesItem[];
};

export type ClarifyPagesConfig = ClarifyPagesGroup[] | 'FileTree';

export type ClarifyConfig = {
  title: string;
  logo?: ClarifyLogoConfig;
  favicon?: ClarifyFaviconConfig;
  theme: { primary?: string };
  description: string;
  rootDirectory: string;
  routePrefix: string;
  outputDirectory: string;
  navbar?: { links?: ClarifyNavbarLink[] };
  banner?: ClarifyBannerConfig;
  footer?: ClarifyFooterConfig;
  i18n?: ClarifyI18nConfig;
  pages?: ClarifyPagesConfig;
};

export type LocalizedNavigation = Record<string, NavigationNode[]>;

export type NavigationTree = NavigationNode[] | LocalizedNavigation;

export type RenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[];
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree;
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApiSpecs?: Record<string, OpenAPISpec>;
  /** 挂载节点，默认 document.getElementById('root') */
  container?: Element | null;
};

export type ServerRenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[];
  /** 从 virtual:clarify-routes 导入的导航树；启用 i18n 时为按 locale 分组的导航树 */
  navigation?: NavigationTree;
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApiSpecs?: Record<string, OpenAPISpec>;
  /** 当前请求的 URL */
  url: string;
};
