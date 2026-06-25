declare module 'virtual:clarify/routes' {
  import type { RouteItem, NavigationTree } from './types';
  export const routes: RouteItem[];
  export const navigation: NavigationTree;
}

declare module 'virtual:clarify/routes/server' {
  import type { ServerRouteItem, NavigationTree } from './types';
  export const routes: ServerRouteItem[];
  export const navigation: NavigationTree;
}

declare module 'virtual:clarify/config' {
  import type { ThemeConfig } from './types';

  export const config: {
    title: string;
    logo?: string;
    theme: ThemeConfig;
    description: string;
    routePrefix: string;
    rootDirectory: string;
    outputDirectory: string;
  };
}

declare module 'virtual:clarify/openapi' {
  import type { OpenAPISpec } from './openapi/lib/utils';

  export const openApis: Record<string, OpenAPISpec>;
}

declare module 'virtual:clarify/slot' {
  import type { ClarifyUISlotName, ClarifySlotContext } from '@clarify-labs/cli';

  export { ClarifyUISlotName, ClarifySlotContext };

  export function useClarifySlot(): ClarifySlotContext;
}

declare module 'virtual:clarify/slots' {
  import type { ComponentType } from 'react'

  export type RuntimeSlotEntry = {
    plugin: string;
    /** Lazy import factory — yields the default-exported React component. */
    component: () => Promise<{ default: ComponentType }>;
  };

  export const runtimeSlots: Record<string, RuntimeSlotEntry[]>;
}



declare module '*.css' {
  export default string;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
