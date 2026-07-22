# Clarify APIs

A Cloudflare Worker that accepts product events and forwards them to Google Analytics 4 through the Measurement Protocol.

## Configuration

Set the secrets before deploying:

```bash
pnpm --filter @clarify-labs/apis exec wrangler secret put GA_MEASUREMENT_ID
pnpm --filter @clarify-labs/apis exec wrangler secret put GA_API_SECRET
```

The API accepts requests from any browser origin. No origin allowlist is required.

## Development

```bash
pnpm --filter @clarify-labs/apis dev
pnpm --filter @clarify-labs/apis test
pnpm --filter @clarify-labs/apis typecheck
pnpm --filter @clarify-labs/apis build
```

## API

`POST /track` accepts:

```json
{
  "client_id": "browser-session-id",
  "user_id": "optional-user-id",
  "event_name": "docs_search",
  "params": {
    "query": "workers",
    "result_count": 3
  }
}
```

`GET /health` returns the service status. Event names and parameter keys must start with a letter and contain only letters, numbers, or underscores. Parameter values may be strings, numbers, or booleans.
