import { defineConfig } from 'vite';
import { clarifyPlugin } from '@clarify/vite-plugin';

export default defineConfig({
  plugins: [
    clarifyPlugin({
      outputDirectory: 'output',
      rootDirectory: 'source/content',
    }),
  ],
});
