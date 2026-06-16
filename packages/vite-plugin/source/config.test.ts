import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProjectConfig, resolveOptions } from './config.js';

describe('loadProjectConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty object when clarify.json does not exist', () => {
    const result = loadProjectConfig(tempDir);
    expect(result).toEqual({});
  });

  it('parses clarify.json correctly', () => {
    const config = { title: 'My Docs', description: 'Test docs', routeBase: '/docs' };
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify(config), 'utf-8');
    const result = loadProjectConfig(tempDir);
    expect(result).toEqual(config);
  });

  it('returns empty object when clarify.json is invalid JSON', () => {
    writeFileSync(join(tempDir, 'clarify.json'), 'not json', 'utf-8');
    const result = loadProjectConfig(tempDir);
    expect(result).toEqual({});
  });
});

describe('resolveOptions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('uses defaults when no config and no options provided', () => {
    const result = resolveOptions(tempDir);
    expect(result).toEqual({
      title: 'Clarify Docs',
      description: '',
      logo: undefined,
      routeBase: '/',
      theme: {},
      docRoot: 'source/content',
      outPath: 'output',
    });
  });

  it('merges project config with defaults', () => {
    const config = { title: 'Project Docs', description: 'Desc', theme: { primary: '#333' } };
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify(config), 'utf-8');
    const result = resolveOptions(tempDir);
    expect(result.title).toBe('Project Docs');
    expect(result.description).toBe('Desc');
    expect(result.theme).toEqual({ primary: '#333' });
    expect(result.docRoot).toBe('source/content');
  });

  it('plugin options override project config', () => {
    const config = { title: 'Project Docs', routeBase: '/docs', docsRoot: 'content' };
    writeFileSync(join(tempDir, 'clarify.json'), JSON.stringify(config), 'utf-8');
    const result = resolveOptions(tempDir, { routeBase: '/api', docsRoot: 'docs' });
    expect(result.routeBase).toBe('/api');
    expect(result.docRoot).toBe('docs');
    expect(result.title).toBe('Project Docs');
  });
});
