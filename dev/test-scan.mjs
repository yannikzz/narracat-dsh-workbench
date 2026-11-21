// Reader + write-guard checks against the bundled demo book.
// Run: node dev/test-scan.mjs
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanRoot, buildSnapshot, readBookFile, writeBookFile, resolveBook, countWords, parseConfig, isBookDir } from '../novel-workbench/lib/project.js'

const base = fileURLToPath(new URL('../demo', import.meta.url))
const dir = join(base, '雨港来信')
let failures = 0

function check(name, condition, detail) {
  if (condition) {
    console.log('PASS', name)
    return
  }
  failures += 1
  console.error('FAIL', name, detail === undefined ? '' : JSON.stringify(detail))
}

async function denied(target, mode) {
  try {
    if (mode === 'read') await readBookFile((await resolveBook(dir, '.')).book, target)
    else await writeBookFile((await resolveBook(dir, '.')).book, target, 'x', undefined)
    return null
  } catch (error) {
    return error?.code ?? error?.message ?? 'unknown'
  }
}

try {
  check('demo book is recognized', await isBookDir(dir))
  const books = await scanRoot(dir)
  check('scanRoot finds exactly the demo book', books.length === 1 && books[0].title === '雨港来信', books)
  const resolved = await resolveBook(dir, '.')
  const snap = await buildSnapshot(resolved.book)
  check('snapshot has the book title', snap.book.title === '雨港来信', snap.book.title)
  check('snapshot has three written chapters', (snap.chapters ?? []).filter((row) => row.hasText).length === 3, snap.chapters.map((row) => row.chapter))
  check('snapshot has one volume', snap.volumes.length === 1, snap.volumes.length)
  const firstText = (snap.chapters ?? []).find((row) => row.hasText)
  check('demo has a chapter with text', Boolean(firstText?.path), firstText)
  if (firstText?.path) {
    const file = await readBookFile(resolved.book, firstText.path)
    check('readBookFile returns the manuscript', file.text.length > 0 && file.truncated === false, { bytes: file.size })
  } else {
    check('readBookFile returns the manuscript', false, 'no chapter text')
  }
  check('countWords counts CJK characters and Latin words', countWords('雨港来信，hello world 123') === 7)
  const config = parseConfig('novel_id: abc\ntitle: "雨港来信"\nstyle_profile: null\nchapter_gate: off\n')
  check('parseConfig keeps quoted values and flags', config.novel_id === 'abc' && config.title === '雨港来信' && config.chapter_gate === 'off', config)
  check('memory.db write is denied', (await denied('.narracat/memory.db', 'write')) === 'protected-file')
  check('write outside the book is denied', (await denied('../outside.md', 'write')) === 'file-outside-book')
  check('project-memory write is denied', (await denied('.narracat/project-memory/v1/commits/x.json', 'write')) === 'protected-file')
  check('memory.db read is denied', (await denied('.narracat/memory.db', 'read')) === 'protected-file')
} catch (error) {
  failures += 1
  console.error('FAIL scan crashed', error instanceof Error ? error.stack : String(error))
}

console.log(failures === 0 ? '\nSCAN CHECKS PASSED' : `\n${failures} SCAN CHECK(S) FAILED`)
if (failures > 0) process.exitCode = 1
