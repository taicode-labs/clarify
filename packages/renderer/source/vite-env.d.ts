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
  import type { ThemeConfig } from './types';

  export const config: {
    title: string;
    logo?: string;
    theme: ThemeConfig;
    description: string;
    rootDirectory: string;
    routePrefix: string;
    outputDirectory: string;
  };
}

declare module '*.css' {
  export default string;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
