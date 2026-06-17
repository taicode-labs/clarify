import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Build @clarify/renderer as a library with two entries:
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
        server: resolve(__dirname, 'source/server.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        'react-dom/server',
        'react-router-dom',
      ],
      output: {
        preserveModules: false,
      },
    },
  },
})
