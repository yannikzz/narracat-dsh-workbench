// In-process check of the workbench HTTP API (no DSH needed).
// Run: node dev/test-api.mjs
import { createServer } from 'node:http'
import { cp, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../novel-workbench/index.js'

const samples = new URL('../demo', import.meta.url).pathname
const workspace = await mkdtemp(join(tmpdir(), 'nw-workspace-'))
await cp(join(samples, '雨港来信'), join(workspace, 'S3'), { recursive: true })
await cp(join(samples, '雨港来信'), join(workspace, 'P0'), { recursive: true })

const knownWorkspaces = [{ path: workspace, title: 'test' }]
const routes = []
const ctx = {
  webServer: { register: (route) => { routes.push(route); return () => {} } },
  effect: (fn) => { const dispose = fn(); return dispose },
  get: (name) => ({
    workspaceRegistry: {
      list: () => knownWorkspaces,
      resolveByPath: async (path) => knownWorkspaces.find((row) => row.path === path),
      create: async (path) => {
        const row = { id: 'w-new', path, title: 'new' }
        knownWorkspaces.push(row)
        return row
      },
    },
    connection: { requestRejection: () => undefined },
  })[name],
}

apply(ctx)
const server = createServer((req, res) => routes[0].handler(req, res))
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`

async function get(route) {
  const response = await fetch(origin + route)
  return { status: response.status, body: await response.json() }
}
async function put(route, body) {
  const response = await fetch(origin + route, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}
async function post(route, body) {
  const response = await fetch(origin + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}

let failures = 0
function check(label, condition, detail) {
  console.log(condition ? `PASS ${label}` : `FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 300))
  if (!condition) failures += 1
}

const books = await get('/novel-workbench/api/books')
check('GET /books ok', books.status === 200 && books.body.ok === true, { status: books.status, count: books.body.books?.length })
check('GET /books finds both sample books', books.body.books?.length === 2, books.body.books?.map((b) => b.title))

const book = await get(`/novel-workbench/api/book?root=${encodeURIComponent(workspace)}&dir=S3`)
check('GET /book ok', book.status === 200 && book.body.ok === true, { status: book.status })
check('book title', book.body.book?.title === '雨港来信', book.body.book?.title)
check('chapters parsed', book.body.chapters?.length === 4, book.body.chapters?.length)
check('written chapters', book.body.status?.writtenChapters === 3, book.body.status)
check('word counts', book.body.chapters?.[0]?.words > 0, book.body.chapters?.[0]?.words)
check('characters merged', book.body.characters?.length === 2 && book.body.characters.every((c) => c.identity), book.body.characters?.map((c) => [c.name, c.identity?.profileStage]))

const stamp = await get(`/novel-workbench/api/stamp?root=${encodeURIComponent(workspace)}&dir=S3`)
check('GET /stamp ok', stamp.status === 200 && stamp.body.ok === true && /^\d+:\d+:\d+$/.test(String(stamp.body.stamp)), { status: stamp.status, body: stamp.body })
check('book snapshot carries the same stamp', typeof book.body.stamp === 'string' && book.body.stamp === stamp.body.stamp, { book: book.body.stamp, stamp: stamp.body.stamp })
await mkdir(join(workspace, 'S3', 'notes'), { recursive: true })
const touchPath = join(workspace, 'S3', 'notes', 'stamp-touch.txt')
await writeFile(touchPath, 'one change')
const stampAfter = await get(`/novel-workbench/api/stamp?root=${encodeURIComponent(workspace)}&dir=S3`)
check('stamp changes when a book file changes', stampAfter.body.stamp !== stamp.body.stamp, { before: stamp.body.stamp, after: stampAfter.body.stamp })
await rm(touchPath, { force: true })
const stampDenied = await get(`/novel-workbench/api/stamp?root=${encodeURIComponent('/tmp')}&dir=S3`)
check('stamp refuses an unregistered root', stampDenied.status === 403, stampDenied.status)

const file = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('manuscript/vol-01/ch-001.md')}`)
check('GET /file ok', file.status === 200 && file.body.ok === true, { status: file.status })
check('file text', typeof file.body.text === 'string' && file.body.text.startsWith('第一章'), file.body.text?.slice(0, 20))

const denied = await get(`/novel-workbench/api/file?root=${encodeURIComponent('/tmp')}&dir=.&path=AGENTS.md`)
check('root outside registry is refused', denied.status === 403, { status: denied.status, body: denied.body })

const protectedRead = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('.narracat/memory.db')}`)
check('memory.db read refused', protectedRead.status === 403 || protectedRead.status === 404, protectedRead.status)

const saved = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'manuscript/vol-01/ch-001.md',
  text: '第一章 雨港来信（测试写入）\n\n临时内容。\n',
  expectedMtime: file.body.mtime,
})
check('PUT /file saves', saved.status === 200 && saved.body.ok === true, { status: saved.status, body: saved.body })
const reread = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('manuscript/vol-01/ch-001.md')}`)
check('saved text round-trips', reread.body.text?.includes('测试写入'), reread.body.text?.slice(0, 30))

const stale = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'manuscript/vol-01/ch-001.md',
  text: 'conflict',
  expectedMtime: file.body.mtime - 60_000,
})
check('stale mtime is a conflict', stale.status === 409, { status: stale.status, body: stale.body })

const escapeWrite = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: '../P0/AGENTS.md',
  text: 'x',
  expectedMtime: undefined,
})
check('write outside book refused', escapeWrite.status === 403, { status: escapeWrite.status, body: escapeWrite.body })

// A symlinked directory inside the book must not carry a new file outside it.
const outside = join(workspace, 'outside')
await mkdir(outside, { recursive: true })
await mkdir(join(workspace, 'S3', 'bible'), { recursive: true })
await symlink(outside, join(workspace, 'S3', 'bible', 'escape'))
const symlinkWrite = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'bible/escape/pwn.md',
  text: 'escaped',
})
const escaped = await stat(join(outside, 'pwn.md')).then(() => true).catch(() => false)
check('write through a symlinked directory is refused', symlinkWrite.status === 403 && escaped === false, { status: symlinkWrite.status, escaped })

// A file larger than the read cap is returned truncated, never silently whole.
const largePath = join(workspace, 'S3', 'exports', 'large.md')
await mkdir(join(workspace, 'S3', 'exports'), { recursive: true })
await writeFile(largePath, 'a'.repeat(2 * 1024 * 1024 + 4096))
const large = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('exports/large.md')}`)
check('large file read is truncated', large.status === 200 && large.body.truncated === true && large.body.text.length === 2 * 1024 * 1024, { status: large.status, truncated: large.body.truncated, length: large.body.text?.length })

// Case-insensitive filesystems must not smuggle a protected file past the deny list.
await mkdir(join(workspace, 'S3', '.narracat', 'memory'), { recursive: true })
await writeFile(join(workspace, 'S3', '.narracat', 'memory', 'ch-001.json'), '{"protected":true}\n')
const caseDeny = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: '.NARRACAT/MEMORY/CH-001.json',
  text: '{"protected":false}\n',
})
// Case folding is a filesystem property: on macOS/Windows the uppercase
// spelling aliases the protected file and must be refused; on case-sensitive
// Linux it is a distinct path, so the write is allowed and touches no protected
// data. Keep the assertion meaningful on both.
const caseFoldPlatform = process.platform === 'darwin' || process.platform === 'win32'
check(
  'case-folded protected path follows filesystem semantics',
  caseFoldPlatform ? caseDeny.status === 403 : caseDeny.status === 200,
  { platform: process.platform, status: caseDeny.status, body: caseDeny.body },
)

// A symlink alias inside the book must not reach a protected directory either.
await symlink(join(workspace, 'S3', '.narracat', 'memory'), join(workspace, 'S3', 'alias-memory'))
const aliasDeny = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'alias-memory/ch-001.json',
  text: '{"protected":false}\n',
})
check('symlink alias to a protected path is refused', aliasDeny.status === 403, { status: aliasDeny.status, body: aliasDeny.body })

// A JSON body that is null must be a 400, never a 500 from a property read.
const nullBody = await post('/novel-workbench/api/tracking/refresh', null)
check('null JSON body is a 400', nullBody.status === 400 && nullBody.body.error?.code === 'bad-body', { status: nullBody.status, body: nullBody.body })

// Content type must be JSON for state-changing routes.
const wrongType = await fetch(`${origin}/novel-workbench/api/file`, {
  method: 'PUT',
  headers: { 'content-type': 'text/plain' },
  body: JSON.stringify({ root: workspace, dir: 'S3', path: 'AGENTS.md', text: 'x' }),
})
check('non-JSON content type is refused', wrongType.status === 415, wrongType.status)

// The editor's size CAS must reject a save from a stale view.
const sizeConflict = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'manuscript/vol-01/ch-001.md',
  text: 'small change',
  expectedMtime: reread.body.mtime,
  expectedSize: reread.body.size + 1,
})
check('stale size is a conflict', sizeConflict.status === 409, { status: sizeConflict.status, body: sizeConflict.body })

// A truncated view cannot be saved back over the tail of a large file.
const huge = 'x'.repeat(3 * 1024 * 1024)
await mkdir(join(workspace, 'S3', 'exports'), { recursive: true })
await writeFile(join(workspace, 'S3', 'exports', 'huge.md'), huge)
const hugeRead = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('exports/huge.md')}`)
const hugeWrite = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'exports/huge.md',
  text: hugeRead.body.text,
  expectedMtime: hugeRead.body.mtime,
  expectedSize: hugeRead.body.size,
})
check('truncated large file cannot be saved back', hugeRead.body.truncated === true && hugeWrite.status === 409, { status: hugeWrite.status, body: hugeWrite.body })

const badJson = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: '.narracat/data/outline/vol-01/ch-001.json',
  text: '{ not json',
  expectedMtime: undefined,
})
check('invalid json refused', badJson.status === 422, { status: badJson.status, body: badJson.body })

const health = await get('/novel-workbench/api/health')
check('health', health.status === 200 && health.body.ok, health.body)

const missing = await get('/novel-workbench/api/nope')
check('unknown route 404', missing.status === 404, missing.status)

// ---- journey, create-book, export ----------------------------------------
check('book carries the single next step', book.body.journey?.stage === 'writing' && book.body.journey?.action?.id === 'write-4', book.body.journey?.action)
check('journey checklist sees missing memory', Array.isArray(book.body.journey?.checklist) && book.body.journey.checklist.some((item) => item.id === 'memory-missing'), book.body.journey?.checklist?.map((item) => item.id))

// ---- tracking: visible memory sheets -------------------------------------
check('book carries the visible tracking model', book.body.tracking?.progress?.written === 3 && book.body.tracking?.summaries?.length === 3, book.body.tracking?.progress)
const tracked = await post('/novel-workbench/api/tracking/refresh', { root: workspace, dir: 'S3' })
check('POST /tracking/refresh writes the sheets', tracked.status === 200 && tracked.body.ok === true && tracked.body.files?.some((file) => file.kind === 'progress'), { status: tracked.status, files: tracked.body.files?.map((file) => file.kind) })
const progressFile = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('tracking/进度.md')}`)
check('progress sheet is readable', progressFile.status === 200 && progressFile.body.text.includes('# 进度') && progressFile.body.text.includes('下一章'), progressFile.body.text?.slice(0, 40))
const memoFile = await get(`/novel-workbench/api/file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('tracking/写作备忘.md')}`)
check('memo is created by refresh', memoFile.status === 200 && memoFile.body.text.includes('# 写作备忘'), memoFile.body.text?.slice(0, 30))
const protectedTracking = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'tracking/进度.md',
  text: '手改',
  expectedMtime: progressFile.body.mtime,
})
check('generated tracking sheet is write-protected', protectedTracking.status === 403, { status: protectedTracking.status, body: protectedTracking.body })
const memoWrite = await put('/novel-workbench/api/file', {
  root: workspace,
  dir: 'S3',
  path: 'tracking/写作备忘.md',
  text: `${memoFile.body.text}\n- 作者说：下一章别揭晓写信人。\n`,
  expectedMtime: memoFile.body.mtime,
})
check('authored memo is editable', memoWrite.status === 200, { status: memoWrite.status, body: memoWrite.body })
const bookAfterMemo = await get(`/novel-workbench/api/book?root=${encodeURIComponent(workspace)}&dir=S3`)
check('snapshot reads the memo', String(bookAfterMemo.body.book?.memo).includes('别揭晓写信人'), bookAfterMemo.body.book?.memo?.slice(-40))

const created = await post('/novel-workbench/api/create-book', {
  title: '空白新书',
  genre: '悬疑',
  idea: '一个只在雨天出现的邮差。',
  plannedChapters: 6,
  wordsPerChapter: 1200,
  parentDir: workspace,
})
check('POST /create-book ok', created.status === 200 && created.body.ok === true, { status: created.status, body: created.body })
check('created book reuses the containing workspace', created.body.root === workspace && created.body.dir === '空白新书', { root: created.body.root, dir: created.body.dir })
const createdDir = created.body.dir === '.' ? created.body.root : join(created.body.root, created.body.dir)
const createdConfig = await readFile(join(createdDir, '.narracat', 'config.yaml'), 'utf8')
check('created config has the plan', createdConfig.includes('title: 空白新书') && createdConfig.includes('estimated_total_chapters: 6') && createdConfig.includes('words_per_chapter: 1200'), createdConfig)
const injectedCreate = await post('/novel-workbench/api/create-book', { title: '注入测试', language: 'zh-CN\ntitle: 被注入', parentDir: workspace })
check('create-book rejects a YAML-injecting language', injectedCreate.status === 400 && injectedCreate.body.error?.code === 'create-failed', { status: injectedCreate.status, body: injectedCreate.body })
const yamlLikeCreate = await post('/novel-workbench/api/create-book', { title: 'null', parentDir: workspace })
const yamlLikeConfig = yamlLikeCreate.status === 200 ? await readFile(join(workspace, 'null', '.narracat', 'config.yaml'), 'utf8') : ''
check('create-book quotes a YAML-like title', yamlLikeCreate.status === 200 && yamlLikeConfig.includes('title: "null"'), { status: yamlLikeCreate.status, config: yamlLikeConfig.split('\n').slice(0, 3) })
const createdInstructions = await readFile(join(createdDir, 'AGENTS.md'), 'utf8')
check('created book keeps the one-line idea as instructions', createdInstructions.includes('只在雨天出现的邮差'), createdInstructions)
const createdBook = await get(`/novel-workbench/api/book?root=${encodeURIComponent(workspace)}&dir=${encodeURIComponent('空白新书')}`)
check('new book starts at setup', createdBook.body.journey?.stage === 'setup' && createdBook.body.journey?.action?.id === 'setup', createdBook.body.journey?.action)
check('new book has no chapters yet', createdBook.body.status?.writtenChapters === 0 && createdBook.body.chapters?.length === 0, createdBook.body.status)

const emptyExport = await post('/novel-workbench/api/export', { root: workspace, dir: '空白新书', format: 'md' })
check('export without prose is refused', emptyExport.status === 422 && emptyExport.body.error?.code === 'no-text', { status: emptyExport.status, body: emptyExport.body })

for (const format of ['md', 'txt', 'html', 'docx']) {
  const exported = await post('/novel-workbench/api/export', { root: workspace, dir: 'S3', format })
  const expectedExt = format
  check(`export ${format} writes a file`, exported.status === 200 && exported.body.path?.startsWith('exports/') && exported.body.path?.endsWith(`.${expectedExt}`), { status: exported.status, path: exported.body.path, error: exported.body.error })
  if (exported.status === 200) {
    const info = await stat(join(workspace, 'S3', exported.body.path))
    check(`export ${format} has bytes`, info.size > 100 && exported.body.bytes === info.size, { size: info.size, bytes: exported.body.bytes })
    const download = await fetch(origin + exported.body.download)
    const payload = Buffer.from(await download.arrayBuffer())
    check(`download ${format} is the export`, download.status === 200 && payload.length === info.size, { status: download.status, size: payload.length })
    if (format === 'docx') check('docx starts as a zip', payload[0] === 0x50 && payload[1] === 0x4b, payload.slice(0, 4))
  }
}

const badFormat = await post('/novel-workbench/api/export', { root: workspace, dir: 'S3', format: 'pdf' })
check('unsupported export format is refused', badFormat.status === 400, { status: badFormat.status, body: badFormat.body })
const traverse = await get(`/novel-workbench/api/export-file?root=${encodeURIComponent(workspace)}&dir=S3&path=${encodeURIComponent('../P0/AGENTS.md')}`)
check('export download stays inside exports/', traverse.status === 403 || traverse.status === 404, { status: traverse.status, body: traverse.body })

const booksAfter = await get('/novel-workbench/api/books')
// The snapshot must not surface a symlinked file from outside the book.
await writeFile(join(outside, 'secret.md'), 'OUTSIDE-SECRET\n')
await mkdir(join(workspace, 'S3', 'tracking'), { recursive: true })
await rm(join(workspace, 'S3', 'tracking', '写作备忘.md'), { force: true })
await symlink(join(outside, 'secret.md'), join(workspace, 'S3', 'tracking', '写作备忘.md'))
const leakCheck = await get(`/novel-workbench/api/book?root=${encodeURIComponent(workspace)}&dir=S3`)
check('book snapshot does not follow symlinks out of the book', !JSON.stringify(leakCheck.body).includes('OUTSIDE-SECRET'), leakCheck.status)
check('new book appears in the shelf', booksAfter.body.books?.some((row) => row.title === '空白新书'), booksAfter.body.books?.map((row) => row.title))
check('books response names the default library', typeof booksAfter.body.libraryDir === 'string' && booksAfter.body.libraryDir.length > 0, booksAfter.body.libraryDir)

server.close()
await rm(workspace, { recursive: true, force: true })
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
