import type { ClarifyPlugin, ClarifyProjectConfig } from '../../types.js'

import { clarifyProjectConfigSchema } from './config-schema.js'

export type ClarifyBuildOptions = ClarifyProjectConfig & {
  /** Project root directory. Defaults to the current working directory. */
  projectRoot?: string
  /** Root directory for content sources. Default: 'source' */
  rootDirectory?: string
  /** Output directory for the built docs site. When omitted, Vite's build.outDir is used. */
  outputDirectory?: string
  /** Static generation behavior. */
  ssg?: {
    /** Fail the build when SSG fails. Default: true. */
    failOnError?: boolean
  }

  /** Clarify plugin extensions for translation, search, and other build-time features. */
  plugins?: ClarifyPlugin[]
}

export type ResolvedBuildOptions = {
  projectRoot: string
  rootDirectory: string
  outputDirectory?: string
  ssg: {
    failOnError: boolean
  }
}

export function resolveBuildOptions(options: ClarifyBuildOptions = {}): ResolvedBuildOptions {
  const config = clarifyProjectConfigSchema.parse(options)
  return {
    projectRoot: options.projectRoot ?? process.cwd(),
    rootDirectory: options.rootDirectory ?? config.contentDir,
    outputDirectory: options.outputDirectory ?? config.outputDir,
    ssg: {
      failOnError: config.features?.ssg && typeof config.features.ssg !== 'boolean' && 'failOnError' in config.features.ssg
        ? config.features.ssg.failOnError
        : true,
    },
  }
}
