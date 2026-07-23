import {
  BOOTSTRAP_CONFIG_FILENAMES,
  BOOTSTRAP_CONTENT_EXTENSIONS,
  BOOTSTRAP_CONTENT_ROOT,
  type ProjectInfo,
} from '../server/projectInfo'

export type ProjectConventions = {
  configFilenames: readonly string[]
  contentFileExtensions: readonly string[]
  contentRoot: string
}

/** Bootstrap conventions used before the dev server returns authoritative project metadata. */
export const BOOTSTRAP_CONVENTIONS: ProjectConventions = {
  configFilenames: BOOTSTRAP_CONFIG_FILENAMES,
  contentFileExtensions: BOOTSTRAP_CONTENT_EXTENSIONS,
  contentRoot: BOOTSTRAP_CONTENT_ROOT,
}

export function conventionsFromProjectInfo(info: ProjectInfo): ProjectConventions {
  return {
    configFilenames: info.configFilenames,
    contentFileExtensions: info.contentFileExtensions,
    contentRoot: info.contentRoot,
  }
}
