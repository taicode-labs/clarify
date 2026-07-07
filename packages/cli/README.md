# @clarify-labs/cli

Official Clarify CLI package.

Start a new project with:

```bash
npx @clarify-labs/cli init my-docs
cd my-docs
```

This package provides the public `clarify` command used for:

- `clarify init`
- `clarify dev`
- `clarify build`

## Deployment model

Clarify's default deployment model is build-time SSR plus static hosting.

- `clarify build` renders every route during the build and writes static HTML files into the output directory.
- The deployed site is expected to run from static assets served by a CDN, object storage, or any other static host.
- Clarify does not require a request-time Node.js SSR server for its default production deployment model.

This distinction matters for renderer evolution: async React and MDX components are supported during the build-time SSR phase, while the production deployment target stays a static site.

For usage and examples, please visit the official Clarify docs:

https://clarify.pub
