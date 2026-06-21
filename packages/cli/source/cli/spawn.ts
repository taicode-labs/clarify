import { spawnSync as nodeSpawnSync, SpawnSyncOptions } from 'node:child_process'

type SpawnOptions = { cwd?: string; stdio?: 'inherit' | 'ignore' | Array<string> }

export function spawnSync(command: string, args: string[], options: SpawnOptions) {
  return nodeSpawnSync(command, args, options as SpawnSyncOptions)
}
