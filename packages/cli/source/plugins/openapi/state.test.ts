import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config/config.js'
import { resolveBuildOptions } from '../../core/config/options.js'
import { ClarifyContext } from '../../core/engine/context.js'
import { contentRoute } from '../../parsers/routes/routes.test-utils.js'
import type { ContentRoute } from '../../types.js'

import { OpenAPIPluginState } from './state.js'

describe('OpenAPIPluginState', () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'clarify-openapi-state-'))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  function createContext(routes: ContentRoute[]): ClarifyContext {
    const ctx = new ClarifyContext({
      projectRoot,
      contentRoot: projectRoot,
      projectConfig: resolveProjectConfig(),
      generateOptions: resolveBuildOptions({ projectRoot }),
      version: 'test',
    })
    ctx.routes = routes
    return ctx
  }

  it('drops spec modules from a previous enrichment pass', async () => {
    const firstSpecPath = join(projectRoot, 'first.openapi.json')
    const secondSpecPath = join(projectRoot, 'second.openapi.json')
    writeFileSync(firstSpecPath, JSON.stringify({ openapi: '3.0.0', info: { title: 'First', version: '1' }, paths: {} }))
    writeFileSync(secondSpecPath, JSON.stringify({ openapi: '3.0.0', info: { title: 'Second', version: '1' }, paths: {} }))
    const state = new OpenAPIPluginState()
    const firstRoutes = [contentRoute({ path: '/first', kind: 'openapi', filePath: firstSpecPath, pageVirtualModuleId: 'virtual:clarify-page/first' })]
    const secondRoutes = [contentRoute({ path: '/second', kind: 'openapi', filePath: secondSpecPath, pageVirtualModuleId: 'virtual:clarify-page/second' })]

    await state.enrichRoutes(firstRoutes, createContext(firstRoutes))
    await state.enrichRoutes(secondRoutes, createContext(secondRoutes))
    const modules = state.contributeModules(new Map(), secondRoutes)

    expect([...modules.keys()].some(id => id.includes('first_openapi_json'))).toBe(false)
    expect([...modules.keys()].some(id => id.includes('second_openapi_json'))).toBe(true)
    expect(modules.has('virtual:clarify-page/first')).toBe(false)
    expect(modules.has('virtual:clarify-page/second')).toBe(true)
  })
})
