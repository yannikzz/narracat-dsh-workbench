// Submission path-boundary regression: a crafted draft path must not read or
// delete a published chapter, and a normal staging submit must still publish.
// Run: node dev/test-submission.mjs
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chapterSubmit, reviewSubmit } from '../novel-workbench/lib/submission.js'

const sample = fileURLToPath(new URL('../demo/雨港来信', import.meta.url))
const workspace = await mkdtemp(join(tmpdir(), 'nw-submission-'))
const book = join(workspace, 'book')
let failures = 0

function check(name, condition, detail) {
  if (condition) {
    console.log('PASS', name)
    return
  }
  failures += 1
  console.error('FAIL', name, detail === undefined ? '' : JSON.stringify(detail))
}
const exists = async (path) => stat(path).then(() => true).catch(() => false)
const memory = {
  summary: '林照在旧渡口的石阶缝里捡到一封没有署名的干信，信上只写着明早旧渡口等着；他决定按信里的时间去一趟，并把信封收进内袋。',
  events: [{ description: '林照在石阶缝里捡到干信封' }],
  state_changes: [],
  foreshadowing: [],
}

try {
  await cp(sample, book, { recursive: true })
  const chapterPath = join(book, 'manuscript', 'vol-01', 'ch-001.md')
  check('fixture chapter exists', await exists(chapterPath))

  const crafted = '.narracat/staging/../../manuscript/vol-01/ch-001.md'
  const escaped = await chapterSubmit(book, { chapter: 1, path: crafted, memory })
  check('crafted draft path is stopped', escaped.status === 'stopped' && escaped.code === 'draft_outside_staging', escaped)
  check('crafted submit leaves the published chapter intact', await exists(chapterPath))

  const backslash = '.narracat\\staging\\..\\..\\manuscript\\vol-01\\ch-001.md'
  const windows = await chapterSubmit(book, { chapter: 1, path: backslash, memory })
  check('backslash traversal is stopped', windows.status === 'stopped' && windows.code === 'draft_outside_staging', windows)

  const review = await reviewSubmit(book, { chapter: 1, path: crafted, issues: [] })
  check('crafted review path is stopped', review.status === 'stopped' && review.code === 'bad_path', review)

  const text = await readFile(chapterPath, 'utf8')
  await mkdir(join(book, '.narracat', 'staging'), { recursive: true })
  await writeFile(join(book, '.narracat', 'staging', 'ch-001.md'), text)
  const saved = await chapterSubmit(book, { chapter: 1, memory })
  check('normal staging submit still publishes', saved.status === 'saved', saved)
  check('staging draft is removed after publish', !(await exists(join(book, '.narracat', 'staging', 'ch-001.md'))))
  check('published chapter still exists after publish', await exists(chapterPath))
} catch (error) {
  failures += 1
  console.error('FAIL submission test crashed', error instanceof Error ? error.stack : String(error))
} finally {
  await rm(workspace, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nSUBMISSION CHECKS PASSED' : `\n${failures} SUBMISSION CHECK(S) FAILED`)
if (failures > 0) process.exitCode = 1
