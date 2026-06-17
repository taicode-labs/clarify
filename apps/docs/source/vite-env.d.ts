declare module 'virtual:clarify-config' {
  export const config: {
    title: string;
    logo?: string;
    theme: { primary?: string };
    description: string;
    documentationRoot: string;
    routeBase: string;
    outputDirectory: string;
  };
}

declare module 'virtual:clarify-routes' {
  import type { ComponentType } from 'react';
  export const routes: Array<{ path: string; title: string; component: ComponentType }>;

  type NavigationNode = {
    path: string;
    title: string;
    children?: NavigationNode[];
  };
  export const navigation: NavigationNode[];
}
