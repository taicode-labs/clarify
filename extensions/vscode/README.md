# Clarify VS Code Extension

The Clarify VS Code extension provides a preview experience for Clarify documentation projects inside Visual Studio Code.

## What it does

- Detects Clarify documentation workspaces and content files (`.md`, `.mdx`, `.openapi.json`, `.openapi.yaml`, `.openapi.yml`).
- Starts a local Clarify preview server for the current project.
- Opens a preview panel in VS Code and keeps it in sync with the active editor.
- Provides commands to open, refresh, and stop the preview.

## Install and build

From the repository root:

```bash
pnpm install
cd extensions/vscode
pnpm exec vsce package --no-dependencies
```

The built extension bundle is emitted to `extensions/vscode/*.vsix`.

## Development

During local development, use the extension source in `extensions/vscode/source`.

To build the extension JavaScript bundle:

```bash
cd extensions/vscode
pnpm build
```

To run the extension tests:

```bash
cd extensions/vscode
pnpm test
```

## Release

The repository release workflow now packages the extension and uploads the generated `.vsix` file to GitHub release assets.

## Learn more

- VS Code extension docs: `/features/vscode-extension`
- Extension source: `extensions/vscode/source`
- CLI documentation: `apps/docs/source/en-US/features/vscode-extension.mdx`
