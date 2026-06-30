import type { ClarifyVariablesConfig, ClarifyPlugin } from '../../types.js'
import { applyVariables } from '../../parsers/variables.js'

function applyVariablesToFrontmatter(frontmatter: Record<string, unknown>, variables: ClarifyVariablesConfig): Record<string, unknown> {
  const nextFrontmatter = { ...frontmatter }
  for (const key of ['title', 'description'] as const) {
    if (typeof nextFrontmatter[key] !== 'string') continue
    nextFrontmatter[key] = applyVariables(nextFrontmatter[key], variables)
  }
  return nextFrontmatter
}

export function createVariablesPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:variables',
    hooks: {
      'content:transform': (input, ctx) => ({
        ...input,
        frontmatter: applyVariablesToFrontmatter(input.frontmatter, ctx.projectConfig.variables),
        content: applyVariables(input.content, ctx.projectConfig.variables),
      }),
    },
  }
}
