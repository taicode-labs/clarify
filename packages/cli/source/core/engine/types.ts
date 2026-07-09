import type { Plugin } from 'vite'

import type { ClarifyPlugin, ContentRoute, NavigationTree } from '../../types.js'
import type { VirtualModules } from '../runtime/virtual-modules.js'

import type { ClarifyContext } from './context.js'

export type ClarifyEngineMode = 'development' | 'production'

export type BuildSSRBundleOptions = {
  root: string
  ssrEntry: string
  ssrOutDir: string
  plugins: Plugin[]
}

export type ClarifyEngineRuntime = {
  command: 'build' | 'serve'
  mode: ClarifyEngineMode | string
  themeEditor?: boolean
  outputDirectory?: string
  ssrPlugins?: Plugin[]
  buildSSRBundle?: (options: BuildSSRBundleOptions) => Promise<void>
}

export type ClarifyEngineState = {
  projectRoot: string
  contentRoot: string
  configFilePath?: string
  projectConfig: ClarifyContext['projectConfig']
  generateOptions: ClarifyContext['generateOptions']
  routes: ContentRoute[]
  navigation: NavigationTree
  plugins: ClarifyPlugin[]
  virtualModules: VirtualModules
  ctx: ClarifyContext
}
