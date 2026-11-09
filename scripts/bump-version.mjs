#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Every workspace manifest is kept in lockstep with the release tag.
const manifests = [
  'package.json',
  'apps/apis/package.json',
  'apps/docs/package.json',
  'apps/www/package.json',
  'extensions/vscode/package.json',
  'packages/cli/package.json',
  'packages/renderer/package.json',
  'packages/templates/package.json',
]

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const usage = [
  'Usage:',
  '  node scripts/bump-version.mjs <version>          Bump every package.json version',
  '  node scripts/bump-version.mjs --check <version>  Fail if any package.json version differs',
].join('\n')

function fail(message) {
  console.error(`Error: ${message}`)
  process.exit(1)
}

function normalizeVersion(raw) {
  if (!raw) fail(`missing version argument\n\n${usage}`)
  const version = raw.trim().replace(/^v/, '')
  if (!semverPattern.test(version)) {
    fail(`invalid version "${raw}", expected semver such as 1.2.3 or v1.2.3`)
  }
  return version
}

function readManifests() {
  return manifests.map(relativePath => {
    const absolutePath = path.join(repoRoot, relativePath)
    if (!fs.existsSync(absolutePath)) fail(`missing manifest ${relativePath}`)
    return { relativePath, absolutePath, raw: fs.readFileSync(absolutePath, 'utf8') }
  })
}

const args = process.argv.slice(2)
const checkOnly = args[0] === '--check'
const version = normalizeVersion(checkOnly ? args[1] : args[0])
const entries = readManifests()

if (checkOnly) {
  const mismatches = entries.filter(({ raw }) => JSON.parse(raw).version !== version)
  if (mismatches.length > 0) {
    fail(`version ${version} does not match: ${mismatches.map(entry => entry.relativePath).join(', ')}`)
  }
  console.log(`All ${entries.length} manifests are at version ${version}`)
  process.exit(0)
}

const changes = []
for (const entry of entries) {
  const manifest = JSON.parse(entry.raw)
  if (manifest.version === version) continue
  changes.push(`${entry.relativePath}: ${manifest.version} -> ${version}`)
  fs.writeFileSync(entry.absolutePath, `${JSON.stringify({ ...manifest, version }, null, 2)}\n`)
}

if (changes.length === 0) {
  console.log(`All ${entries.length} manifests are already at version ${version}`)
} else {
  console.log(changes.join('\n'))
  console.log(`\nBumped ${changes.length} manifest(s) to ${version}`)
}
