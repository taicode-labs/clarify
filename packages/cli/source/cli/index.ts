#!/usr/bin/env node
import { main } from './program.js'

main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
