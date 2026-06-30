import { builtinModules } from 'node:module'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'

// Build the VS Code extension as a single CJS bundle.
//
// VS Code loads extensions via Node's require, so we emit a CommonJS bundle
// with `vscode` and Node built-ins kept external.
const external = [
  'vscode',
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
]

export default defineConfig({
  build: {
    outDir: 'output',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'node20',
    lib: {
      entry: resolve(__dirname, 'source/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external,
    },
  },
})
