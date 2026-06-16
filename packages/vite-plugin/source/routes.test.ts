import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findMdxFiles, generateConfigModule, generateRoutesModule } from './routes.js';
import type { ResolvedClarifyOptions, MdxRoute } from './types.js';

describe('findMdxFiles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when directory does not exist', () => {
    const result = findMdxFiles(join(tempDir, 'nonexistent'));
    expect(result).toEqual([]);
  });

  it('discovers flat mdx files', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8');
    writeFileSync(join(tempDir, 'about.mdx'), '# About', 'utf-8');

    const result = findMdxFiles(tempDir);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.path)).toContain('/');
    expect(result.map(r => r.path)).toContain('/about');
  });

  it('handles nested directories', () => {
    const guideDir = join(tempDir, 'guide');
    mkdirSync(guideDir, { recursive: true });
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8');
    writeFileSync(join(guideDir, 'getting-started.mdx'), '# GS', 'utf-8');

    const result = findMdxFiles(tempDir);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.path)).toContain('/');
    expect(result.map(r => r.path)).toContain('/guide/getting-started');
  });

  it('maps index.mdx to root path', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8');
    const result = findMdxFiles(tempDir);
    const indexRoute = result.find(r => r.path === '/');
    expect(indexRoute).toBeDefined();
    expect(indexRoute?.virtualModuleId).toBe('virtual:clarify-page/index');
  });

  it('ignores non-mdx files', () => {
    writeFileSync(join(tempDir, 'readme.txt'), 'text', 'utf-8');
    writeFileSync(join(tempDir, 'page.md'), '# MD', 'utf-8');
    const result = findMdxFiles(tempDir);
    expect(result).toHaveLength(0);
  });

  it('generates correct virtualModuleId', () => {
    const subDir = join(tempDir, 'api', 'auth');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'login.mdx'), '# Login', 'utf-8');

    const result = findMdxFiles(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].virtualModuleId).toBe('virtual:clarify-page/api/auth/login');
  });
});

describe('generateConfigModule', () => {
  it('generates a valid ES module export', () => {
    const config: ResolvedClarifyOptions = {
      title: 'Test',
      description: 'Desc',
      routeBase: '/',
      theme: { primary: '#fff' },
      docRoot: 'source/content',
      outPath: 'dist',
    };
    const code = generateConfigModule(config);
    expect(code).toBe(`export const config = ${JSON.stringify(config)};`);
  });
});

describe('generateRoutesModule', () => {
  it('generates empty routes for empty input', () => {
    const code = generateRoutesModule([]);
    expect(code).toContain('export const routes = [');
    expect(code).toContain('export const navTree = []');
    expect(code).not.toContain('import');
  });

  it('generates imports and routes array', () => {
    const routes: MdxRoute[] = [
      { path: '/', filePath: '/a/index.mdx', virtualModuleId: 'virtual:clarify-page/index' },
      { path: '/about', filePath: '/a/about.mdx', virtualModuleId: 'virtual:clarify-page/about' },
    ];
    const code = generateRoutesModule(routes);
    expect(code).toContain("import Page0 from 'virtual:clarify-page/index';");
    expect(code).toContain("import Page1 from 'virtual:clarify-page/about';");
    expect(code).toContain('{ path: "/", component: Page0 }');
    expect(code).toContain('{ path: "/about", component: Page1 }');
  });
});
