import type { ClarifyPlugin } from '../../types.js'

const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var e=localStorage.getItem('clarify:theme');var t=e==='dark'||e==='light'||e==='system'?e:'system';var r=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';document.documentElement.classList.toggle('dark',r);document.documentElement.style.colorScheme=r?'dark':'light'}catch(e){}})();`

export function createHtmlShellPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:html-shell',
    hooks: {
      'html:transform': (input) => ({
        html: input.html,
        tags: [
          ...input.tags,
          {
            tag: 'script',
            children: THEME_BOOTSTRAP_SCRIPT,
            injectTo: 'head-prepend',
          },
          {
            tag: 'script',
            attrs: { type: 'module', src: input.clientEntryId },
            injectTo: 'body',
          },
        ],
        clientEntryId: input.clientEntryId,
        dev: input.dev,
      }),
    },
  }
}
