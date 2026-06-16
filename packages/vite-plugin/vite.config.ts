import { readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

// Build @clarify/vite-plugin as a Node.js library.
//
// This package runs inside the consumer's Vite build process, so:
//   - All runtime dependencies stay external (vite, @mdx-js/rollup, etc.)
//   - Node built-ins are external (node:fs, node:path, etc.)
//   - Output both ESM and CJS to support consumers using either module system
//   - Generate .d.ts declarations via vite-plugin-dts
//
// We do NOT bundle dependencies because:
//   1. The consumer already has `vite` installed (peer-style usage)
//   2. Bundling vite would create version conflicts
//   3. Node libraries should resolve their deps at runtime
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
