import { describe, it, expect } from 'vitest'

import type { ClarifyProjectContext, ResolvedProjectConfig } from '../../types.js'
import { resolveThemeConfig } from '../config/theme.js'

import {
  buildProjectInfo,
  CONTENT_FILE_EXTENSIONS,
  handleProjectInfoRequest,
} from './project-info.js'

const mockProjectConfig: ResolvedProjectConfig = {
  title: 'Test',
  description: '',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig(),
  variables: {},
}

const mockI18nProjectConfig: ResolvedProjectConfig = {
  ...mockProjectConfig,
  i18n: {
    defaultLocale: 'en-US',
    missing: 'fallback',
    locales: [
      { code: 'en-US', label: 'English' },
      { code: 'zh-CN', label: '中文' },
    ],
  },
}

const mockContext: ClarifyProjectContext = {
  projectRoot: '/proj',
  contentRoot: '/proj/source',
  projectConfig: mockProjectConfig,
  generateOptions: {
    projectRoot: '/proj',
    rootDirectory: 'source',
    outputDirectory: undefined,
    ssg: { failOnError: true },
  },
  version: 'test',
}

const mockI18nContext: ClarifyProjectContext = {
  ...mockContext,
  projectConfig: mockI18nProjectConfig,
}

describe('CONTENT_FILE_EXTENSIONS', () => {
  it('includes md, mdx, and openapi variants', () => {
    expect(CONTENT_FILE_EXTENSIONS).toContain('.md')
    expect(CONTENT_FILE_EXTENSIONS).toContain('.mdx')
    expect(CONTENT_FILE_EXTENSIONS).toContain('.openapi.json')
    expect(CONTENT_FILE_EXTENSIONS).toContain('.openapi.yaml')
    expect(CONTENT_FILE_EXTENSIONS).toContain('.openapi.yml')
  })
})

describe('buildProjectInfo', () => {
  it('exposes config filenames, content extensions, and content root name', () => {
    const info = buildProjectInfo(mockContext)
    expect(info.configFilenames).toEqual(['clarify.ts', 'clarify.js', 'clarify.json'])
    expect(info.contentFileExtensions).toBe(CONTENT_FILE_EXTENSIONS)
    expect(info.contentRoot).toBe('source')
    expect(info.projectRoot).toBe('/proj')
    expect(info.i18n).toBeUndefined()
  })

  it('derives the content root name from an absolute content root path', () => {
    const info = buildProjectInfo({ ...mockContext, contentRoot: '/proj/docs-content' })
    expect(info.contentRoot).toBe('docs-content')
  })

  it('falls back to the raw path when content root is outside the project root', () => {
    const info = buildProjectInfo({ ...mockContext, contentRoot: '/elsewhere/source' })
    expect(info.contentRoot).toBe('/elsewhere/source')
  })

  it('includes i18n locale info when configured', () => {
    const info = buildProjectInfo(mockI18nContext)
    expect(info.i18n).toEqual({
      defaultLocale: 'en-US',
      locales: ['en-US', 'zh-CN'],
    })
  })
})

describe('handleProjectInfoRequest', () => {
  function mockRes() {
    const chunks: Buffer[] = []
    const headers: Record<string, string> = {}
    return {
      res: {
        setHeader(name: string, value: string) { headers[name] = value },
        end(data: string) { chunks.push(Buffer.from(data)) },
      } as unknown as import('node:http').ServerResponse,
      headers,
      body: () => JSON.parse(Buffer.concat(chunks).toString('utf-8')),
    }
  }

  it('responds with JSON content-type and the project info payload', () => {
    const { res, headers, body } = mockRes()
    handleProjectInfoRequest(
      {} as import('node:http').IncomingMessage,
      res,
      mockI18nContext,
    )
    expect(headers['Content-Type']).toBe('application/json; charset=utf-8')
    expect(body()).toEqual({
      configFilenames: ['clarify.ts', 'clarify.js', 'clarify.json'],
      contentFileExtensions: [...CONTENT_FILE_EXTENSIONS],
      contentRoot: 'source',
      projectRoot: '/proj',
      i18n: { defaultLocale: 'en-US', locales: ['en-US', 'zh-CN'] },
    })
  })
})
