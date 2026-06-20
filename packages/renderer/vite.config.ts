import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}).map(name => new RegExp(`^${name}/`)),
  ...Object.keys(pkg.peerDependencies ?? {}).map(name => new RegExp(`^${name}/`)),
]

// Build @clarify-labs/renderer as a library with two entries:
//   - source/index.tsx   → output/index.{js,cjs}   (public/client API)
//   - source/server.tsx  → output/server.{js,cjs}  (SSR compatibility entry)
//
// CSS is built together with JS via @tailwindcss/vite. The output
// renderer.css contains only the utilities actually used by components.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      entryRoot: 'source',
      outDir: 'output',
      include: ['source/**/*.ts', 'source/**/*.tsx'],
      exclude: ['source/**/*.test.ts', 'source/**/*.test.tsx'],
      rollupTypes: false,
    }),
  ],
  build: {
    outDir: 'output',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'source/index.tsx'),
        markdown: resolve(__dirname, 'source/markdown.ts'),
        preview: resolve(__dirname, 'source/preview.tsx'),
        client: resolve(__dirname, 'source/client.tsx'),
        server: resolve(__dirname, 'source/server.tsx'),
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
