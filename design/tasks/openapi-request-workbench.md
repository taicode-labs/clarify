# OpenAPI Request Workbench Productionization

## Goal

Turn the OpenAPI request tester into a production-quality API workbench with explicit domain boundaries, complete request and response inspection, shared authentication state, typed parameter editing, and responsive behavior.

## Product principles

- Request composition and response inspection are equally important.
- Body, headers, metadata, and generated code are first-class views, not nested afterthoughts.
- OpenAPI serialization rules belong in pure domain modules, never in React components.
- Credentials are shared for the current site session and are never persisted to disk by default.
- Browser limitations such as CORS, forbidden headers, and cookie management must be visible and honest.
- The CLI should provide a local same-origin runtime when browser restrictions prevent direct API requests.
- Every work package requires focused unit tests, typecheck, lint, production build, and desktop/mobile visual verification.

## Target architecture

```text
OpenApiRequestWorkbench
├── useOpenApiRequestWorkbench        state orchestration and execution
├── OpenApiRequestToolbar             method, URL, send/cancel, timing
├── OpenApiRequestEditor
│   ├── RequestAuthenticationSection  requirement choice and credentials
│   ├── RequestVariablesSection       server choice, server and path variables
│   ├── RequestCookiesSection         browser-managed cookie state
│   ├── RequestHeadersSection         header parameters
│   ├── RequestQuerySection           query parameters
│   ├── RequestBodySection            media type and typed body editor
│   └── RequestCodeSection            redacted request snippets
└── OpenApiResponseViewer
    ├── ResponseSummary               status, duration, size, content type
    ├── ResponseCookies               browser visibility boundary
    ├── RequestHeaders                headers sent by the workbench
    ├── ResponseHeaders               searchable name/value table with copy
    └── ResponseBody                  Preview / Raw with copy/download

clarify start
├── build coordinator                 build when output is missing or stale
├── static asset server               serve output with SPA fallback
├── OpenAPI server discovery          derive stable proxy targets from specifications
└── scoped API proxy                  same-origin forwarding to discovered targets
```

## Domain contracts

### Request draft

- Selected server and server variables
- Selected OpenAPI security requirement
- Credential values keyed by security scheme
- Parameter values keyed by location and name
- Selected request media type and body draft
- Validation issues and dirty state

### Response exchange

- Request URL, method, headers, and body snapshot
- Response status, status text, final URL, redirect flag, duration, and byte size
- Response headers as ordered name/value entries
- Content type and raw body/blob
- Parsed preview model when supported
- Error category: validation, network, CORS-likely, abort, or response

## Work packages

### WP1 - Domain and execution split

Status: complete

- [x] Move request/response types out of the React workbench.
- [x] Add a focused execution function with `AbortController` support.
- [x] Preserve raw body/blob and derive previews without losing bytes.
- [x] Capture request snapshot for response code generation.
- [x] Add focused tests for response metadata, binary bytes, and abort forwarding.
- [x] Add focused tests for empty responses and network failure classification.

Acceptance:

- React components do not call `fetch` directly.
- Starting a new request aborts the previous request.
- Object URLs are created and revoked in one owner.

### WP2 - Response viewer

Status: complete

- [x] Introduce first-class Preview, Body, Headers, and Code tabs.
- [x] Show status, duration, size, and content type persistently.
- [x] Show the final response URL and redirect state.
- [x] Render headers as a responsive table with search and copy actions.
- [x] Add copy and download actions for raw body.
- [x] Generate redacted cURL and Fetch reproduction code from the actual request exchange.
- [x] Handle JSON, image, audio, video, HTML, XML/YAML/text, empty, and binary bodies.

Acceptance:

- Headers are reachable in one click and never hidden inside body content.
- All tabs preserve their scroll position while switching.
- Long names and values do not resize or overflow the workbench.
- Mobile uses a horizontally scrollable tab strip without page overflow.

### WP8 - Workbench information architecture

Status: complete

- [x] Use a persistent method, resolved URL, and Send toolbar.
- [x] Keep authentication choice and credentials in one request section.
- [x] Group server and path substitutions under Variables.
- [x] Order request sections as Authentication, Variables, Cookies, Headers, Query Parameters, Request Body, and Code Snippet.
- [x] Move generated request code out of the response viewer.
- [x] Order response sections as Request Headers, Response Headers, and Body beneath a persistent response summary.
- [x] Keep Preview and Raw as modes within Body instead of top-level response tabs.
- [x] Remove the duplicate operation-level credential editor.

Acceptance:

- Authentication credentials have one editing surface per operation.
- Request and response columns use protocol entities instead of generic configuration cards.
- Desktop uses a stable two-column workbench; mobile stacks the same sections without changing their order.
- Credentials remain redacted from generated snippets and response snapshots.

### WP3 - Typed request editor

Status: complete

- [x] Extract reusable section and field components.
- [x] Support enum, boolean, integer/number, date/date-time, arrays, and objects.
- [x] Support OpenAPI `style`, `explode`, `allowEmptyValue`, and required validation.
- [x] Preserve parameter draft values while allowing optional parameters to be excluded from a request.
- [x] Render request parameters as full-width rows with stable identity and value columns.
- [x] Distinguish browser-managed cookie parameters from editable values.
- [x] Add reset-to-example and clear controls per section.

Acceptance:

- Invalid structured values block send and point to the field.
- Required path parameters are always visible.
- Optional groups collapse without hiding validation failures.

### WP4 - Request body editor

Status: not started

- [ ] Separate JSON/text, URL-encoded, multipart, and binary editors.
- [ ] Support multipart file fields from binary schemas.
- [ ] Validate JSON before send and preserve user formatting.
- [ ] Support examples and schema-generated defaults without overwriting dirty drafts.

Acceptance:

- Browser-generated multipart boundaries are preserved.
- Switching media type asks before discarding a dirty body.

### WP5 - Site authentication

Status: complete

- [x] Model OpenAPI security requirements correctly: OR between requirement objects, AND within one object.
- [x] Share credential values by specification and security scheme.
- [x] Add explicit clear-one and clear-all controls.
- [x] Keep credentials memory-only by default.
- [x] Support API key, HTTP Basic/Bearer, OAuth2 token input, and OpenID Connect token input.

Acceptance:

- Multiple schemes in one requirement are sent together.
- Credentials never appear in generated DOM text, logs, or persistent storage.
- Operation examples and the request workbench use the same credential source.

### WP6 - Public API and naming

Status: complete

- [x] Use `OpenApiRequest` to match `OpenApiDocument` and `OpenApiOperation`.
- [x] Rename internal files and types after component boundaries stabilize.
- [x] Update English and Chinese documentation and examples.
- [x] Decide whether a migration alias is needed before release.

### WP7 - Verification

Status: in progress

- [x] Unit tests for authentication requirements, credential scoping, request construction, and request code generation.
- [ ] Component tests for tabs, headers, field validation, and credential sharing.
- [x] Full renderer test, typecheck, lint, and production build.
- [x] Docs static build.
- [x] Browser verification at 390x844, 768x1024, and 1440x900.
- [x] Verify light/dark themes, keyboard navigation, focus, overflow, and reduced motion.

### WP9 - CLI static server and smart API proxy

Status: planned

- [ ] Add `clarify start` as the production-like runtime for compiled documentation; keep `clarify dev` focused on authoring and hot reload.
- [ ] Build automatically when output is missing or older than project inputs, with explicit `--build` and `--no-build` overrides for deterministic automation.
- [ ] Serve the configured output directory with correct MIME types, cache headers, compressed assets when available, and SPA/document-route fallback.
- [ ] Reuse the shared `--root`, `--content`, `--output`, `--host`, `--port`, and `--open` option model instead of introducing a second configuration surface.
- [ ] Discover proxy targets from normalized OpenAPI `servers`, assign stable local target identifiers, and publish the mapping to the compiled runtime without modifying generated files.
- [ ] Route workbench requests through a reserved same-origin path when proxying is enabled while preserving the selected server path, query, method, body, status, and streaming response.
- [ ] Forward end-to-end request and response headers, remove hop-by-hop headers, rewrite `Host`, and handle redirects and `Set-Cookie` attributes for the local origin deliberately.
- [ ] Support multiple specifications and multiple server origins without route collisions; show the resolved upstream target in CLI logs and the workbench request summary.
- [ ] Enable the discovered-target proxy by default for `start`, with `--proxy`, `--no-proxy`, and explicit target overrides for CI, private gateways, and incomplete specifications.
- [ ] Bind to loopback by default and reject arbitrary upstream URLs so the server cannot become an open proxy; non-loopback binding must print a security warning.
- [ ] Preserve TLS verification by default, redact credentials and sensitive query values from logs, cap request body size, and return structured proxy errors without leaking secrets.
- [ ] Shut down cleanly on signals and report actionable errors for occupied ports, missing output, invalid server URLs, unreachable upstreams, and proxy timeouts.
- [ ] Document direct-browser versus local-proxy behavior in English and Chinese, including the remaining limits around browser cookie policy and client certificates.

Acceptance:

- `clarify start` serves a clean production build and deep links load directly after a fresh checkout.
- A request to every valid OpenAPI server can use the local same-origin proxy without API-side CORS changes.
- The proxy allowlist contains only discovered or explicitly configured targets and cannot forward to a URL supplied solely by a browser request.
- Switching between OpenAPI servers changes the upstream deterministically without rebuilding or restarting the CLI.
- Authorization, API key, JSON, form, multipart, binary, empty, error, redirect, and streaming exchanges retain their HTTP semantics through the proxy.
- Unit tests cover target discovery, URL/path joining, header filtering, cookie rewriting, allowlist enforcement, stale-build decisions, and shutdown.
- Integration tests start the CLI against fixture APIs and verify static fallback, proxy success, upstream failure, timeout, payload limits, and secret-redacted logs.

## Implementation order

1. WP1 domain and execution split
2. WP2 response viewer
3. WP3 typed request editor
4. WP4 request body editor
5. WP5 site authentication
6. WP6 public API cleanup
7. WP9 CLI static server and smart API proxy
8. WP7 final verification

## Known browser constraints

- Browsers control the `Cookie` header; the workbench uses credentialed fetch and cannot set arbitrary cookies.
- Cross-origin requests require the API to permit the documentation origin and requested headers.
- Some response headers are unavailable unless exposed by CORS.
- `Set-Cookie` is never readable from browser JavaScript.
- HTML preview must remain sandboxed without scripts or same-origin privileges.
- `clarify start` can remove CORS as a deployment prerequisite for local use, but it cannot override browser cookie policy, operating-system trust, upstream authorization, or mutual TLS requirements.

## Decision log

- 2026-07-14: Chose `OpenApiRequest`, matching the repository's existing `OpenApi*` public naming convention.
- 2026-07-14: Credentials remain memory-only. Persistence requires a separate explicit product decision.
- 2026-07-14: Response headers and code become first-class tabs alongside preview and raw body.
- 2026-07-14: Actual request code examples redact authorization, cookies, and common key/token query parameters.
- 2026-07-14: Operation snippets replace every selected security scheme value with a named placeholder; only the request executor receives in-memory credentials.
- 2026-07-14: Security requirement objects remain OR choices while every scheme inside the selected object is applied together.
- 2026-07-14: Empty security requirement objects are preserved as explicit no-auth choices with stable requirement keys.
- 2026-07-14: Credential values are isolated by in-memory OpenAPI specification identity and security scheme name.
- 2026-07-14: Browser verification covers three target viewports, light/dark themes, reduced motion, keyboard operation, focus visibility, overflow, and credential DOM redaction.
- 2026-07-14: No migration alias is added because `ApiRequest` and `OpenapiRequest` were never exposed by the renderer public API; internal component files now consistently use `OpenApiRequest`.
- 2026-07-14: Fetch failures are classified as network errors at the execution boundary while `AbortError` remains distinguishable and empty responses preserve their metadata.
- 2026-07-14: Optional parameter inclusion is independent from its draft value; disabling a parameter preserves the value while excluding it from validation and request serialization.
- 2026-07-14: Request parameters and response headers use continuous table-like rows instead of nested form cards.
- 2026-07-15: `clarify start` is planned as a production-like static runtime rather than an alias for `clarify dev`; it automatically manages compiled output and exposes a same-origin API proxy.
- 2026-07-15: Proxy targets are allowlisted from OpenAPI servers or explicit CLI configuration, and browser-supplied arbitrary upstream URLs are rejected.
