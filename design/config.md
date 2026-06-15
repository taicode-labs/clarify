# Clarify Configuration — Layered Design

Clarify uses **two configuration layers** with a clear boundary. This document defines the ownership, rationale, and interaction between each layer.

> **This is Phase 1 (minimum viable config). Advanced features (i18n, search, custom components, etc.) will be introduced in Phase 2.**

---

## Golden Rule

| Layer | Audience | File | Concern |
|------|------|------|--------|
| **Project Config** | Content authors, technical writers | `clarify.json` | What the site *displays* |
| **Plugin Config** | Frontend developers, build engineers | `vite.config.ts` | How the site *builds* and *runs* |

> **Content creators should not touch `vite.config.ts`. Developers should not frequently modify `clarify.json`.**

---

## 1. `clarify.json` — Project Configuration

`clarify.json` lives at the project root (next to `vite.config.ts`). It is an **author-facing** config file, similar to Mintlify's `docs.json` or Jekyll's `_config.yml`.

### Phase 1 Supported Fields

| Field | Description |
|------|------|
| `title` | Site title. Authors change this often. |
| `description` | Site description, used for SEO. |
| `logo` | Brand logo path. |
| `base` | Base URL for the site. Can be overridden by plugin options. |
| `theme` | Theme config (Phase 1 only supports `primary` color). |
| `openApi` | Path to the OpenAPI spec file. |

### Example

```json
{
  "title": "Clarify Docs",
  "description": "Open-source documentation publishing for MDX and OpenAPI.",
  "logo": "/logo.svg",
  "theme": {
    "primary": "#0ea5e9"
  },
  "openApi": "./openapi.yaml"
}
```

### Phase 2 Fields (Designed but not yet implemented)

The following fields are designed but will be implemented in future versions:

- `favicon`, `socialPreview`
- `locales` (internationalization)
- `nav` (navigation structure)
- `footer`, `social`
- `hideEditLink`, `githubRepo`, `githubBranch`

---

## 2. Vite Plugin Options — Build Configuration

Plugin options live in `vite.config.ts` as arguments to `clarifyPlugin()`. They are **developer-facing** and control build-time behavior.

### Phase 1 Supported Fields

| Field | Description |
|------|------|
| `docsRoot` | Root directory for content files. Default: `'source/content'`. |
| `base` | Deployment path, overrides the value in `clarify.json`. |

### Example

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { clarifyPlugin } from '@clarify/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    clarifyPlugin({
      docsRoot: 'source/content',
    }),
  ],
});
```

### Phase 2 Fields (Designed but not yet implemented)

- `components` (custom MDX components)
- `transformFrontmatter` (frontmatter transformation)
- `mdxPlugins` (remark/rehype plugins)
- `searchOptions` (search configuration)

---

## 3. Priority & Resolution Order

When a config field exists in **both** layers, the plugin follows this resolution order:

```
vite.config.ts (plugin options) > clarify.json > default values
```

This allows developers to override author settings without modifying `clarify.json`.

### Example: `base` Override

```json
// clarify.json
{ "base": "/docs/" }
```

```typescript
// vite.config.ts
clarifyPlugin({
  base: '/staging/docs/', // overrides clarify.json for staging builds
});
```

---

## 4. Internal Resolution Flow

```
Build starts
    │
    ├─ Load clarify.json (if exists)
    │
    ├─ Load vite.config.ts → clarifyPlugin(options)
    │
    ├─ Merge: plugin options (highest priority) + clarify.json + defaults
    │
    ▼
ResolvedClarifyOptions
    │
    ├─ Generate virtual:clarify-config (merged config for runtime)
    ├─ Generate virtual:clarify-routes (based on docsRoot)
    ├─ Generate virtual:clarify-openapi (if openApi is configured)
    └─ Generate search index (Phase 2)
```

---

## 5. Migrating from Mintlify

Mintlify users have a `docs.json` file. Clarify's `clarify.json` is designed to be **compatible** with common Mintlify fields.

| Mintlify `docs.json` | Clarify `clarify.json` | Note |
|----------------------|------------------------|------|
| `name` | `title` | Same purpose |
| `description` | `description` | Direct match |
| `logo` | `logo` | Direct match |
| `api` | `openApi` | OpenAPI spec path |
| `colors` | `theme` | `colors.primary` → `theme.primary` |

Unknown Mintlify fields will be accepted and ignored (with a warning). This provides a fast migration path.

---

## 6. Validation

The plugin validates both layers at build time:

```typescript
type ConfigError = {
  file: 'clarify.json' | 'vite.config.ts';
  field: string;
  message: string;
  severity: 'error' | 'warning';
};
```

- **Errors**: Invalid `base` (does not start with `/`), `docsRoot` path does not exist, malformed `nav` structure.
- **Warnings**: Unknown fields in `clarify.json`, deprecated field names, `openApi` file not found.

Validation results are printed to the console and displayed via Vite's error overlay during development.

---

## 7. Summary

| If a content author asks... | Look in |
|------------------|--------|
| "How do I change the site title?" | `clarify.json` |
| "How do I change the theme color?" | `clarify.json` |
| "How do I point to my OpenAPI spec?" | `clarify.json` |

| If a developer asks... | Look in |
|----------------|---------|
| "How do I change the content directory?" | `vite.config.ts` |
| "How do I override base for staging?" | `vite.config.ts` |
| "How do I add custom MDX components?" | `vite.config.ts` (Phase 2) |
