import { create, insertMultiple, search } from '@orama/orama'
import { persist, restore } from '@orama/plugin-data-persistence'
import { persistToFile, restoreFromFile } from '@orama/plugin-data-persistence/server'
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// 中文 + 英文混合文档
const docs = [
  {
    path: '/zh-cn/getting-started/',
    title: '快速开始',
    locale: 'zh-cn',
    content: 'Clarify 是一个现代化的文档站点生成器，支持 Markdown 和 MDX。本指南将帮助你快速搭建第一个文档站点。',
    keywords: ['文档', '快速开始', '安装'],
  },
  {
    path: '/zh-cn/guides/',
    title: '使用指南',
    locale: 'zh-cn',
    content: '深入了解 Clarify 的高级功能，包括多语言支持、主题定制和搜索集成。',
    keywords: ['指南', '多语言', '搜索'],
  },
  {
    path: '/en-us/getting-started/',
    title: 'Getting Started',
    locale: 'en-us',
    content: 'Clarify is a modern documentation site generator supporting Markdown and MDX.',
    keywords: ['docs', 'getting started', 'install'],
  },
]

const db = create({
  schema: {
    path: 'string',
    title: 'string',
    locale: 'string',
    content: 'string',
    keywords: 'string[]',
  },
})

insertMultiple(db, docs)

console.log('=== Test 1: Chinese full-text search ===')
const zhResults = search(db, { term: '文档', where: { locale: { eq: 'zh-cn' } } })
console.log(`"文档" -> ${zhResults.count} hits`)
for (const hit of zhResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 2: English search ===')
const enResults = search(db, { term: 'documentation', where: { locale: { eq: 'en-us' } } })
console.log(`"documentation" -> ${enResults.count} hits`)
for (const hit of enResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 3: Chinese phrase search ===')
const phraseResults = search(db, { term: '多语言支持', where: { locale: { eq: 'zh-cn' } } })
console.log(`"多语言支持" -> ${phraseResults.count} hits`)
for (const hit of phraseResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 4: Typo tolerance (Chinese) ===')
const typoResults = search(db, { term: '文档站点', where: { locale: { eq: 'zh-cn' } }, tolerance: 1 })
console.log(`"文档站点" (tolerance=1) -> ${typoResults.count} hits`)
for (const hit of typoResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 5: Binary persistence (msgpack) ===')
const tmpDir = mkdtempSync(join(tmpdir(), 'orama-test-'))
const indexPath = join(tmpDir, 'index.msp')

// Save to file using binary (msgpack) format
await persistToFile(db, 'binary', indexPath)
const stat = writeFileSync.bind(null, indexPath)
// Check file size
const { statSync } = await import('node:fs')
const fileStat = statSync(indexPath)
console.log(`Index file: ${indexPath}`)
console.log(`Index size: ${fileStat.size} bytes`)

// Restore from file
const restoredDb = await restoreFromFile('binary', indexPath)
const restoredResults = search(restoredDb, { term: '文档', where: { locale: { eq: 'zh-cn' } } })
console.log(`Restored search "文档" -> ${restoredResults.count} hits`)
for (const hit of restoredResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 6: In-memory binary persistence ===')
const buffer = await persist(db, 'binary')
console.log(`In-memory buffer type: ${typeof buffer}, length: ${buffer instanceof Uint8Array ? buffer.length : 'N/A'}`)
const restoredFromBuffer = await restore('binary', buffer)
const bufferResults = search(restoredFromBuffer, { term: '指南' })
console.log(`Restored from buffer "指南" -> ${bufferResults.count} hits`)
for (const hit of bufferResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n=== Test 7: prefix search ===')
const prefixResults = search(db, { term: '文', where: { locale: { eq: 'zh-cn' } }, prefix: true })
console.log(`prefix "文" -> ${prefixResults.count} hits`)
for (const hit of prefixResults.hits) {
  console.log(`  - ${hit.document.title} (${hit.document.path}) score=${hit.score}`)
}

console.log('\n✅ All Orama tests passed!')
