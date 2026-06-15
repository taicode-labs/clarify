declare module 'virtual:clarify-routes' {
  import type { ComponentType } from 'react';
  export const routes: Array<{ path: string; component: ComponentType }>;
  export const navTree: Array<unknown>;
}

declare module 'virtual:clarify-config' {
  export const config: {
    title: string;
    logo?: string;
    theme: { primary?: string };
    description: string;
    docRoot: string;
    routeBase: string;
    outPath: string;
  };
}
