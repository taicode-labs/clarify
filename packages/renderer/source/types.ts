import type { ComponentType } from 'react';

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

export type ClarifyConfig = {
  title: string;
  logo?: string;
  theme: { primary?: string };
  description: string;
  documentationRoot: string;
  routeBase: string;
  outputDirectory: string;
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
