import type { Plugin } from 'vite'

export type ClarifyEngineMode = 'development' | 'production'

export type PrepareOptions = {
  /** Force re-initialization even if already prepared (used by config-file hot reload). */
  force?: boolean
  /** Toggle the HTML shell builtin plugin (default: true). */
  htmlShell?: boolean
  /** Skip building virtual modules (used by check command). */
  skipModules?: boolean
  /** Skip startup hints logging (used by check command). */
  skipHints?: boolean
}

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
