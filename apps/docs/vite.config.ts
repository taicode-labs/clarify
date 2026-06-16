import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { clarifyPlugin } from '@clarify/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    clarifyPlugin({
      rootDirectory: 'source/content',
    }),
  ],
  server: {
    port: 5173,
  },
});
