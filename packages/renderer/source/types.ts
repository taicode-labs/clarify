import type { ComponentType } from 'react'

import type { OpenAPISpec } from './openapi-utils'

export type NavigationNode = {
  path: string;
  title: string;
  children?: NavigationNode[];
  sections?: { id: string; title: string }[];
};

export type RouteItem = {
  path: string;
  title: string;
  component: ComponentType;
  kind?: 'mdx' | 'openapi';
  sections?: { id: string; title: string }[];
};

export type ClarifyLogoConfig = string | { light?: string; dark?: string };

export type ClarifyFaviconConfig = string | { light?: string; dark?: string };

export type ClarifyNavbarLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type ClarifyBannerConfig = {
  content: string;
  dismissible?: boolean;
};

export type ClarifyFooterConfig = {
  socials?: Record<string, string>;
  copyright?: string;
};

export type ClarifyPagesItem =
  | string
  | {
      page: string;
      redirect?: string;
    };

export type ClarifyPagesGroup = {
  group: string;
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
  pages?: ClarifyPagesConfig;
};

export type RenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[];
  /** 从 virtual:clarify-routes 导入的导航树 */
  navigation?: NavigationNode[];
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
  /** 从 virtual:clarify-routes 导入的导航树 */
  navigation?: NavigationNode[];
  /** 从 virtual:clarify-openapi-registry 导入的 OpenAPI 规范表 */
  openApiSpecs?: Record<string, OpenAPISpec>;
  /** 当前请求的 URL */
  url: string;
};
