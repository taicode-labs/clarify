import type { Plugin } from 'vite'

import type { ClarifyBuildOptions } from '../config/options.js'
import { createViteAdapter } from '../adapters/vite.js'

export function clarifyPlugin(options: ClarifyBuildOptions = {}): Plugin[] {
  return createViteAdapter(options)
}

export { createViteAdapter }
export type { ClarifyViteBridgeOptions } from '../adapters/vite.js'
