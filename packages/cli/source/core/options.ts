import type { FilterPattern } from 'vite'

import type { ClarifyPlugin } from '../types.js'

export type ClarifyBuildOptions = {
  /** Project root directory. Defaults to the current working directory. */
  projectRoot?: string
  /** Root directory for MDX content. Default: 'source/content' */
  rootDirectory?: string
  /** Output directory for the built docs site. When omitted, Vite's build.outDir is used. */
  outputDirectory?: string
  /** Static generation behavior. */
  ssg?: {
    /** Fail the build when SSG fails. Default: true. */
    failOnError?: boolean
  }

  /** Custom include/exclude filters for MDX processing. */
  include?: FilterPattern
  exclude?: FilterPattern

  /** Clarify plugin extensions for translation, search, and other build-time features. */
  plugins?: ClarifyPlugin[]
}

export type ResolvedBuildOptions = {
  rootDirectory: string
  outputDirectory?: string
  ssg: {
    failOnError: boolean
  }
}

/** @deprecated Use ClarifyBuildOptions instead. */
export type ClarifyGenerateOptions = ClarifyBuildOptions

/** @deprecated Use ResolvedBuildOptions instead. */
export type ResolvedGenerateOptions = ResolvedBuildOptions

export function resolveBuildOptions(options: ClarifyBuildOptions = {}): ResolvedBuildOptions {
  return {
    rootDirectory: options.rootDirectory ?? 'source/content',
    outputDirectory: options.outputDirectory,
    ssg: {
      failOnError: options.ssg?.failOnError ?? true,
    },
  }
}
