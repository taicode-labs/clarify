import type { ComponentType } from 'react'

export type NavigationNode = {
  path: string;
  title: string;
  children?: NavigationNode[];
};

export type RouteItem = {
  path: string;
  title: string;
  component: ComponentType;
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

export type ClarifyPagesConfig = ClarifyPagesGroup[];

export type ClarifyConfig = {
  title: string;
  logo?: ClarifyLogoConfig;
  favicon?: ClarifyFaviconConfig;
  theme: { primary?: string };
  description: string;
  documentationRoot: string;
  routeBase: string;
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
  /** 当前请求的 URL */
  url: string;
};
