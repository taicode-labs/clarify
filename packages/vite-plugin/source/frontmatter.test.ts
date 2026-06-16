import { describe, it, expect } from 'vitest';

import { extractFrontmatter } from './frontmatter.js';

describe('extractFrontmatter', () => {
  it('extracts basic frontmatter', () => {
    const content = '---\ntitle: Hello\ndescription: World\n---\n\n# Body';
    const result = extractFrontmatter(content);
    expect(result.title).toBe('Hello');
    expect(result.description).toBe('World');
  });

  it('returns empty object when no frontmatter', () => {
    const result = extractFrontmatter('# Hello');
    expect(result).toEqual({});
  });

  it('trims quotes from values', () => {
    const content = '---\ntitle: "Quoted"\n---\n';
    const result = extractFrontmatter(content);
    expect(result.title).toBe('Quoted');
  });

  it('handles single quotes', () => {
    const content = "---\ntitle: 'Single Quoted'\n---\n";
    const result = extractFrontmatter(content);
    expect(result.title).toBe('Single Quoted');
  });

  it('ignores content after frontmatter', () => {
    const content = '---\ntitle: A\n---\n\n# B\n\nC: D';
    const result = extractFrontmatter(content);
    expect(result.title).toBe('A');
    expect(result['C']).toBeUndefined();
  });
});
