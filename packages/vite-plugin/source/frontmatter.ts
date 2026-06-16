/**
 * 从 MDX 文件内容中提取 frontmatter。
 * 只解析 `---\nkey: value\n---` 这种简单格式，不引入外部依赖。
 */
export function extractFrontmatter(content: string): Record<string, string> {
  const match = content.trimStart().match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      result[key] = value;
    }
  }
  return result;
}
