# Clarify VS Code Extension

The Clarify VS Code extension brings your documentation site directly into Visual Studio Code with a live preview experience. It detects Clarify projects, starts a local preview server, and keeps the preview synchronized with the active Markdown, MDX, or OpenAPI file.

## Features

- Automatically detects Clarify documentation workspaces and supported content files (`.md`, `.mdx`, `.openapi.json`, `.openapi.yaml`, `.openapi.yml`).
- Automatically installs and manages the Clarify CLI with visible progress when a project does not provide a local installation.
- Starts a local Clarify preview server for the current project.
- Opens a preview panel in VS Code and refreshes it as you switch files or edit content.
- Provides commands to open, refresh, and stop the preview from the command palette or editor toolbar.
- Works well for authoring and reviewing documentation without leaving the editor.

## Commands

- Clarify: Preview
- Clarify: Refresh Preview
- Clarify: Stop Dev Server

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
