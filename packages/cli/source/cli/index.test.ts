import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runInitSpy = vi.fn()

vi.mock('./commands/init.js', () => ({
  runInit: runInitSpy,
}))

describe('createCli', () => {
  const originalArgv = process.argv

  beforeEach(() => {
    runInitSpy.mockReset()
  })

  afterEach(() => {
    process.argv = originalArgv
  })

  it('passes the positional init directory as the project root', async () => {
    process.argv = ['node', 'clarify', 'init', 'my-docs', '--content', 'docs', '--template', 'minimal', '--install']

    const { main } = await import('./program.js')
    await main(process.argv)

    expect(runInitSpy).toHaveBeenCalledWith(expect.objectContaining({
      root: expect.stringMatching(/my-docs$/),
      content: 'docs',
      output: 'output',
    }), false, 'minimal', true)
  }, 10_000)

  it('uses the current working directory when init directory is omitted', async () => {
    process.argv = ['node', 'clarify', 'init']

    const { main } = await import('./program.js')
    await main(process.argv)

    expect(runInitSpy).toHaveBeenCalledWith(expect.objectContaining({
      root: process.cwd(),
      content: 'source',
      output: 'output',
    }), false, undefined, false)
  })
})
