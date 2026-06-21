import { builtinModules } from 'node:module'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { cliPackageJson } from './source/cli/package.js'

const pkg = cliPackageJson as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

// Build @clarify-labs/cli as a Node.js library and executable.
//
// The package exposes a user-facing `clarify` binary while keeping the internal
// Vite-powered engine available for advanced integrations and tests.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  // Node built-ins (both `node:` prefixed and bare forms)
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  // Sub-paths of dependencies that aren't in the dependencies map
  /^node:/,
  /^vite\//,
]

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'source',
      outDir: 'output',
      include: ['source/**/*.ts'],
      exclude: ['source/**/*.test.ts'],
      rollupTypes: false,
    }),
  ],
  build: {
    outDir: 'output',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'node20',
    lib: {
      entry: {
        index: resolve(__dirname, 'source/index.ts'),
        cli: resolve(__dirname, 'source/cli/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      external,
      output: {
        preserveModules: false,
      },
    },
  },
})
