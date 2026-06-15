import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { clarifyPlugin } from '../../packages/vite-plugin/source/index.js';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    clarifyPlugin({
      docsRoot: 'source/content',
    }),
  ],
  resolve: {
    alias: {
      '@clarify/renderer': path.resolve(__dirname, '../../packages/renderer/source/index.tsx'),
      '@clarify/vite-plugin': path.resolve(__dirname, '../../packages/vite-plugin/source/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
