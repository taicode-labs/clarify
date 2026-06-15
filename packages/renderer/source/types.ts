import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ComponentType } from 'react';

export type RouteItem = {
  path: string;
  component: ComponentType;
};

export type ClarifyConfig = {
  title: string;
  logo?: string;
  theme: { primary?: string };
  description: string;
  docRoot: string;
  routeBase: string;
  outPath: string;
};

export type RenderOptions = {
  /** 从 virtual:clarify-config 导入的 config */
  config: ClarifyConfig;
  /** 从 virtual:clarify-routes 导入的路由数组 */
  routes: RouteItem[];
  /** 挂载节点，默认 document.getElementById('root') */
  container?: Element | DocumentFragment | null;
};
