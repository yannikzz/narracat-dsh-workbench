// The whole first-book loop without a DSH process: create → setup → outline →
// write → finish → export. It pins the stage transitions the workbench and
// `novel_journey` both read.
//
// Run: node dev/test-flow.mjs
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBook } from '../novel-workbench/lib/book-create.js'
import { buildSnapshot } from '../novel-workbench/lib/project.js'
import { computeJourney } from '../novel-workbench/lib/journey.js'
import { exportBook } from '../novel-workbench/lib/export.js'

let failures = 0
function check(label, ok, detail) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 240))
  if (!ok) failures += 1
}

const parent = await mkdtemp(join(tmpdir(), 'nw-flow-'))
const { bookDir: createdDir } = await createBook({
  title: '流程测试',
  genre: '悬疑',
  idea: '一个只在雨天出现的邮差。',
  plannedChapters: 3,
  wordsPerChapter: 800,
  parentDir: parent,
})
const bookDir = await realpath(createdDir)

async function journey() {
  const snapshot = await buildSnapshot(bookDir)
  return computeJourney(snapshot)
}

let step = await journey()
check('a new book starts at setup', step.stage === 'setup' && step.action?.id === 'setup', step.action)

await mkdir(join(bookDir, '.narracat', 'data', 'bible'), { recursive: true })
await writeFile(join(bookDir, '.narracat', 'data', 'bible', 'premise-cards.json'), JSON.stringify({
  cards: [
    { card: 'core_hook', fields: [{ key: 'hook', value: '一个邮差只在雨天出现。', certainty: 'canon' }] },
    { card: 'central_dramatic_question', fields: [{ key: 'question', value: '他是谁？', certainty: 'canon' }] },
    { card: 'protagonist_desire', fields: [{ key: 'surface_want', value: '把最后一封信送到。', certainty: 'canon' }] },
  ],
  revision: 1,
}))
step = await journey()
check('a settled core premise moves the book to outline', step.stage === 'outline' && step.action?.id === 'outline', step.action)

await writeFile(join(bookDir, '.narracat', 'data', 'outline', 'outline-structure.json'), JSON.stringify({
  title: '流程测试',
  synopsis: '一个邮差只在雨天出现。',
  storylines: [{ id: 'main', name: '主线' }],
  volumes: [{ volume_no: 1, title: '第一卷', arc_list: [{ arc_id: 'A1', title: '开场', chapter_start: 1, chapter_end: 3 }] }],
}))
step = await journey()
check('an outline without chapter rows asks for chapter 1 first', step.action?.id === 'plan-chapter-1', step.action)

for (let chapter = 1; chapter <= 3; chapter += 1) {
  await writeFile(join(bookDir, `.narracat/data/outline/vol-01/ch-00${chapter}.json`), JSON.stringify({
    chapter,
    characters: [],
    beats: ['场景'],
  }))
}
step = await journey()
check('an outline moves the book to writing chapter 1', step.stage === 'writing' && step.action?.id === 'write-1', step.action)

await mkdir(join(bookDir, 'manuscript', 'vol-01'), { recursive: true })
const prose = (line) => `第一章 ${line}\n\n${'雨落在瓦上。'.repeat(90)}`
await writeFile(join(bookDir, 'manuscript', 'vol-01', 'ch-001.md'), prose('起点'))
step = await journey()
check('writing chapter 1 moves the next step to chapter 2', step.action?.id === 'write-2', step.action)
check('the checklist notices the missing memory', step.checklist.some((item) => item.id === 'memory-missing'), step.checklist.map((item) => item.id))

await writeFile(join(bookDir, 'manuscript', 'vol-01', 'ch-003.md'), prose('结束'))
step = await journey()
check('a gap in the middle points at the missing chapter', step.action?.id === 'write-2', step.action)
check('the checklist reports the gap', step.checklist.some((item) => item.id === 'gap'), step.checklist.map((item) => item.id))

await writeFile(join(bookDir, 'manuscript', 'vol-01', 'ch-002.md'), prose('继续'))
step = await journey()
check('all planned chapters reach done', step.stage === 'done' && step.action?.id === 'done', step.action)
check('done is an export action', step.action?.kind === 'export', step.action)

const exported = await exportBook(bookDir, { format: 'docx' })
check('a done book exports', exported.status === 'saved' && exported.complete === true && exported.chapters === 3, { path: exported.path, complete: exported.complete, chapters: exported.chapters })
const bytes = await readFile(join(bookDir, exported.path))
check('the export is a real docx', bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.length > 1000, { size: bytes.length })

const html = await exportBook(bookDir, { format: 'html' })
check('html export is print-ready', html.status === 'saved' && html.path.endsWith('.html'), html.path)
const htmlText = await readFile(join(bookDir, html.path), 'utf8')
check('html carries the title and prose', htmlText.includes('流程测试') && htmlText.includes('雨落在瓦上。') && htmlText.includes('@media print'), htmlText.slice(0, 80))

await rm(parent, { recursive: true, force: true })
console.log(failures === 0 ? '\nFLOW CHECKS PASSED' : `\n${failures} FLOW CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
