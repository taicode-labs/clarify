import matter from 'gray-matter'

export type ParsedFrontmatter = {
  frontmatter: Record<string, unknown>
  content: string
}

/**
 * 在内容入口统一解析 MDX frontmatter，并返回可供后续流程复用的标准化正文。
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const parsed = matter(content)
  return {
    frontmatter: parsed.data,
    content: parsed.content.replace(/^\r?\n/, ''),
  }
}

/**
 * 从 MDX 文件内容中提取 frontmatter。
 * 使用 gray-matter 支持 YAML frontmatter 的标准语法和类型解析。
 */
export function extractFrontmatter(content: string): Record<string, unknown> {
  return parseFrontmatter(content).frontmatter
}

/**
 * 移除 MDX 文件开头的 YAML frontmatter，保留页面正文。
 */
export function stripFrontmatter(content: string): string {
  return parseFrontmatter(content).content
}
