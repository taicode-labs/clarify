# @clarify-labs/renderer

Clarify renderer package.

This package contains the shared rendering logic used by Clarify documentation sites, including MDX rendering, UI components, and API reference layouts.

## Runtime contract

The renderer serves two different phases of the Clarify pipeline:

- build-time SSR, where the CLI renders route HTML during `clarify build`
- client hydration, where the browser hydrates the static HTML shell after deployment

The default Clarify deployment target remains static hosting. Server rendering in this package is a build-time capability, not a requirement to run a request-time SSR server in production.

For official documentation and integration guidance, visit:

https://clarify.pub
