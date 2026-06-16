import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { clarifyPlugin } from '../../packages/vite-plugin/source/index.js';

export default defineConfig({
  root: '.',
  plugins: [
    react(),
    tailwindcss(),
    clarifyPlugin({
      docsRoot: 'source/content',
    }),
  ],
  server: {
    port: 5173,
  },
});
