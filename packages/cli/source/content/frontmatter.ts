import matter from 'gray-matter'

/**
 * 从 MDX 文件内容中提取 frontmatter。
 * 使用 gray-matter 支持 YAML frontmatter 的标准语法和类型解析。
 */
export function extractFrontmatter(content: string): Record<string, unknown> {
  return matter(content).data
}
