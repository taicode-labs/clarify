import type { Plugin } from 'vite';

export type ClarifyPluginOptions = {
  docsRoot?: string;
};

export function clarifyPlugin(options: ClarifyPluginOptions = {}): Plugin {
  const docsRoot = options.docsRoot ?? 'source/content';

  return {
    name: 'clarify:core',
    config() {
      return {
        define: {
          __CLARIFY_DOCS_ROOT__: JSON.stringify(docsRoot)
        }
      };
    }
  };
}
