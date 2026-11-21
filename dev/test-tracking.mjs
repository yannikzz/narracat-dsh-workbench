// Visible memory: chapter summaries, character states, foreshadowing and the
// author memo, folded from chapter memory into the four tracking sheets.
//
// Run: node dev/test-tracking.mjs
import { cp, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSnapshot } from '../novel-workbench/lib/project.js'
import { memoryRecord } from '../novel-workbench/lib/novel-tools.js'
import { trackingModel, memoryBrief } from '../novel-workbench/lib/tracking.js'
import { appendTrackingNote, readTracking, refreshTracking } from '../novel-workbench/lib/tracking-store.js'

let failures = 0
function check(label, ok, detail) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 260))
  if (!ok) failures += 1
}

const parent = await mkdtemp(join(tmpdir(), 'nw-track-'))
const created = join(parent, '书')
await cp(new URL('../demo/雨港来信', import.meta.url), created, { recursive: true })
const book = await realpath(created)
const outlinePath = join(book, '.narracat', 'data', 'outline', 'outline-structure.json')
const outline = JSON.parse(await readFile(outlinePath, 'utf8'))
outline.foreshadowing_registry = [{ id: 'letter-line', description: '写信的人是谁，为什么找林照', planted_chapter: 1, target_reveal: 10 }]
await writeFile(outlinePath, JSON.stringify(outline))

const chapters = [
  {
    chapter: 1,
    memory: {
      summary: '林照在渡口捡到没有署名的信，决定按信里的时间再去一次。',
      events: [{ description: '石阶缝里抽出湿信封' }, { description: '林照把信收进内袋' }],
      state_changes: [{ character: '林照', dimension: 'location', operation: 'set', value: '旧渡口' }],
      foreshadowing: [{ id: 'letter-line', action: 'plant' }],
    },
  },
  {
    chapter: 2,
    memory: {
      summary: '林照在旧渡口等到阿青，阿青看见木牌后脸色变了。',
      events: [{ description: '阿青认出木牌上的记号' }],
      state_changes: [
        { character: '林照', dimension: 'inventory', operation: 'add', value: '刻着记号的木牌' },
        { character: '阿青', dimension: 'relationship', operation: 'set', value: '知道林照在查信' },
      ],
      foreshadowing: [{ id: 'letter-line', action: 'develop' }],
    },
  },
  {
    chapter: 3,
    memory: {
      summary: '林照在鱼丸摊确认写信的人认识阿青，但阿青不肯说名字。',
      events: [{ description: '阿青把木牌推回林照面前' }],
      state_changes: [{ character: '林照', dimension: 'knowledge', operation: 'set', value: '写信人认识阿青' }],
      foreshadowing: [{ id: 'letter-line', action: 'develop' }],
    },
  },
]
for (const item of chapters) {
  const result = await memoryRecord(book, item)
  check(`memory recorded for chapter ${item.chapter}`, result.status === 'saved', result)
}

const snapshot = await buildSnapshot(book)
const model = trackingModel(snapshot)
check('progress reflects the written chapters', model.progress.written === 3 && model.progress.nextChapter === 4, model.progress)
check('volume range comes from the arc list', model.progress.volumes[0]?.total === 4 && model.progress.volumes[0]?.written === 3, model.progress.volumes)
check('summaries are in reading order', model.summaries.length === 3 && model.summaries[0].summary.includes('没有署名'), model.summaries.map((row) => row.chapter))
check('character states fold the latest values', model.characters.find((row) => row.name === '林照')?.current.some((state) => state.dimension === 'location' && state.value === '旧渡口'), model.characters.find((row) => row.name === '林照')?.current)
check('character recent changes are kept', model.characters.find((row) => row.name === '林照')?.recent.length >= 3, model.characters.find((row) => row.name === '林照')?.recent)
check('foreshadowing joins registry and memory', model.foreshadowing.length === 1 && model.foreshadowing[0].status === '推进中', model.foreshadowing)
check('open foreshadowing is exposed', model.openForeshadowing.length === 1, model.openForeshadowing.map((row) => row.id))

const brief = memoryBrief(model, 4)
check('memory brief reads the last chapters', brief.recent_chapters.length === 3 && brief.character_states.length >= 2, { chapters: brief.recent_chapters.length, people: brief.character_states.map((row) => row.name) })
check('memory brief includes open threads', brief.foreshadowing_open.length === 1, brief.foreshadowing_open.map((row) => row.id))

const note = await appendTrackingNote(book, { note: '作者说：写信人先不要露脸，只让阿青露出一点破绽。', chapter: 4 })
check('author memo accepts a note', note.status === 'saved' && note.note.includes('不要露脸'), note)
const briefWithNote = memoryBrief(trackingModel(await buildSnapshot(book)), 4)
check('memory brief reads the author memo', briefWithNote.author_notes.includes('不要露脸'), briefWithNote.author_notes.slice(-60))

const refreshed = await refreshTracking(book)
check('tracking refresh writes all sheets', refreshed.status === 'saved' && refreshed.files.filter((file) => file.kind !== 'memo').length === 4, refreshed.files)
const progress = await readTracking(book, 'progress')
check('progress sheet shows the next chapter and memory coverage', progress.text.includes('第 4 章') && progress.text.includes('记忆覆盖'), progress.text.slice(0, 80))
const summaries = await readTracking(book, 'summaries')
check('summary sheet carries the chapter prose summary', summaries.text.includes('没有署名') && summaries.text.includes('第 3 章'), summaries.text.slice(0, 80))
const threads = await readTracking(book, 'foreshadowing')
check('foreshadowing sheet lists the thread', threads.text.includes('letter-line') && threads.text.includes('推进中'), threads.text.slice(0, 80))
const people = await readTracking(book, 'characters')
check('character sheet lists current state', people.text.includes('林照') && people.text.includes('旧渡口'), people.text.slice(0, 80))
const memo = await readTracking(book, 'memo')
check('memo sheet is readable', memo.text.includes('不要露脸'), memo.text.slice(-60))

await rm(parent, { recursive: true, force: true })
console.log(failures === 0 ? '\nTRACKING CHECKS PASSED' : `\n${failures} TRACKING CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
