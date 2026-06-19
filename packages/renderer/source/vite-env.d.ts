declare module 'virtual:clarify-routes' {
  import type { RouteItem, NavigationTree } from './types';
  export const routes: RouteItem[];
  export const navigation: NavigationTree;
}

declare module 'virtual:clarify-routes/server' {
  import type { ServerRouteItem, NavigationTree } from './types';
  export const routes: ServerRouteItem[];
  export const navigation: NavigationTree;
}

declare module 'virtual:clarify-config' {
  import type { ClarifyThemeConfig } from './types';

  export const config: {
    title: string;
    logo?: string;
    theme: ClarifyThemeConfig;
    description: string;
    rootDirectory: string;
    routePrefix: string;
    outputDirectory: string;
  };
}

declare module '*.css' {
  export default string;
}
