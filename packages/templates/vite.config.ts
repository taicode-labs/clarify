import { builtinModules } from 'node:module'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const external = [
  ...builtinModules,
  ...builtinModules.map(moduleName => `node:${moduleName}`),
  /^node:/,
]

export default defineConfig({
  plugins: [
    dts({
      entryRoot: '.',
      outDir: 'output',
      include: ['index.ts'],
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
        index: resolve(__dirname, 'index.ts'),
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
