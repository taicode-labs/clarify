import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@clarify/renderer': path.resolve(__dirname, '../../packages/renderer/source/index.tsx')
    }
  },
  server: {
    port: 5173
  }
});
