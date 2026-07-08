import type { IncomingMessage, ServerResponse } from 'node:http'

import type { ClarifyProjectContext } from '../types.js'

import { CONFIG_FILENAMES } from './user-config.js'

/**
 * Dev-only HTTP endpoint that exposes project metadata so external tooling
 * (e.g. the VS Code extension) can discover which files Clarify recognizes
 * without hardcoding conventions that may drift between CLI versions.
 *
 * Mounted at `GET /dev/project-info`. Returns a JSON object describing:
 *  - `configFilenames`: config files Clarify looks for at the project root.
 *  - `contentFileExtensions`: file extensions treated as content files.
 *  - `contentRoot`: the resolved content root directory name (relative to
 *    the project root, e.g. `"source"`).
 *  - `projectRoot`: the absolute project root path.
 *  - `i18n`: locale information when internationalization is configured.
 */
export const CLARIFY_DEV_PROJECT_INFO_ENDPOINT = '/dev/project-info'

/**
 * File extensions Clarify treats as content files. Kept in sync with the
 * patterns used by route discovery in `parsers/routes.ts` and the OpenAPI
 * page generator. Exposed to tooling so the extension's "is this a content
 * file?" check stays accurate without duplicating the regex.
 */
export const CONTENT_FILE_EXTENSIONS = [
  '.md',
  '.mdx',
  '.openapi.json',
  '.openapi.yaml',
  '.openapi.yml',
] as const

export type ProjectInfoResponse = {
  configFilenames: readonly string[]
  contentFileExtensions: readonly string[]
  contentRoot: string
  projectRoot: string
  i18n?: {
    defaultLocale: string
    locales: string[]
  }
}

/**
 * Build the project-info response payload from the resolved plugin state.
 */
export function buildProjectInfo(context: ClarifyProjectContext): ProjectInfoResponse {
  const { projectRoot, contentRoot, projectConfig } = context
  // `contentRoot` is an absolute path (join(root, rootDirectory)); expose the
  // relative directory name so tooling can reason about file locations
  // without assuming a specific absolute path.
  const contentRootName = contentRoot.startsWith(projectRoot)
    ? contentRoot.slice(projectRoot.length).replace(/^[/\\]+/, '')
    : contentRoot

  const response: ProjectInfoResponse = {
    configFilenames: CONFIG_FILENAMES,
    contentFileExtensions: CONTENT_FILE_EXTENSIONS,
    contentRoot: contentRootName || 'source',
    projectRoot,
  }

  if (projectConfig.i18n) {
    response.i18n = {
      defaultLocale: projectConfig.i18n.defaultLocale,
      locales: projectConfig.i18n.locales.map(l => l.code),
    }
  }

  return response
}

/**
 * Handle a request to the project-info endpoint. Responds to any method
 * (GET is typical) with the JSON payload — there is no request body to parse.
 */
export function handleProjectInfoRequest(_req: IncomingMessage, res: ServerResponse, context: ClarifyProjectContext): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(buildProjectInfo(context)))
}
