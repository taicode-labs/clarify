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
    assetPrefix: string;
    rootDirectory: string;
    outputDirectory: string;
  };
}

declare module 'virtual:clarify/openapi' {
  import type { OpenApiRegistry } from './core/types';

  export const openApiSpecs: OpenApiRegistry;
}

declare module 'virtual:clarify/openapi/server' {
  import type { OpenAPISpec } from './openapi/lib/utils';

  export const openApiSpecs: Record<string, OpenAPISpec>;
}

declare module 'virtual:clarify/slot' {
  import type { UISlotContext } from '@clarify-labs/cli'

  export function useSlot(): UISlotContext
}

declare module 'virtual:clarify/slots' {
  import type { RuntimeSlotRegistry } from './slots'

  export const runtimeSlots: RuntimeSlotRegistry;
}



declare module '*.css' {
  export default string;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
