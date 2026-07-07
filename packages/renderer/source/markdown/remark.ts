import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'

export type MarkdownNode = {
  type?: string
  meta?: string | null
  data?: {
    hProperties?: Record<string, unknown>
  }
  children?: MarkdownNode[]
}

function parseCodeMeta(meta: string | null | undefined): Record<string, string> {
  if (!meta) return {}

  const props: Record<string, string> = {}
  const pattern = /([\w-]+)(?:=("([^"]*)"|'([^']*)'|([^\s"']+)))?/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(meta))) {
    const [, key, , doubleQuotedValue, singleQuotedValue, bareValue] = match
    if (!key) continue
    props[key] = doubleQuotedValue ?? singleQuotedValue ?? bareValue ?? 'true'
  }

  return props
}

function addCodeMetaAttributes(node: MarkdownNode) {
  if (node.type === 'code') {
    const props = parseCodeMeta(node.meta)
    if (Object.keys(props).length) {
      node.data = node.data ?? {}
      node.data.hProperties = {
        ...node.data.hProperties,
        ...props,
      }
    }
  }

  for (const child of node.children ?? []) addCodeMetaAttributes(child)
}

function remarkCodeMeta() {
  return (tree: MarkdownNode) => addCodeMetaAttributes(tree)
}

export const markdownRemarkPlugins = [remarkGfm, remarkCodeMeta]
export const mdxRemarkPlugins = [remarkMdx, ...markdownRemarkPlugins]
