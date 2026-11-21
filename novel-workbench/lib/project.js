/**
 * Narracat `.narracat` project reader.
 *
 * Reads a book directory the way the Narracat desktop app stores it:
 * `config.yaml` for identity, `manuscript/` for published text,
 * `.narracat/data/` for the JSON SSOTs, `bible/` for the visible settings.
 *
 * Read-only by design: the HTTP API in `index.js` owns writes. Every path
 * handed to this module is resolved and checked inside the book directory, and
 * symlinks may not escape it.
 */

import { createHash, randomUUID } from 'node:crypto'
import { lstat, open, readdir, realpath, rm, stat, rename, mkdir } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { foldCharacterStates, foldForeshadowing } from './memory-fold.js'

/** Maximum entries walked while collecting one book's files. */
const MAX_WALK = 20000
/** Maximum manuscript bytes read for one chapter (word counts and titles). */
const MAX_MANUSCRIPT_SCAN_BYTES = 256 * 1024
/** Total manuscript bytes one snapshot reads; a very long book reports outline titles instead. */
const MAX_MANUSCRIPT_TOTAL_BYTES = 48 * 1024 * 1024
/** Maximum bytes a single file read returns. */
export const MAX_READ_BYTES = 2 * 1024 * 1024
/** Maximum bytes one write accepts. */
export const MAX_WRITE_BYTES = 4 * 1024 * 1024
/** Text extensions the editor may open and save. */
const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.json', '.yaml', '.yml', '.csv', '.tsv', '.html', '.css', '.js'])
/** Paths the workbench must never write through the raw-file editor. */
const WRITE_DENY = [
  /^\.narracat\/memory\.db(-wal|-shm)?$/,
  /^\.narracat\/content\//,
  /^\.narracat\/documents\//,
  /^\.narracat\/materials\/originals\//,
  /^\.narracat\/project-memory\//,
  /^\.narracat\/units\//,
  /^\.narracat\/manuscript-(revisions|drafts)\//,
  /^\.narracat\/migration-backups\//,
  /^\.narracat\/memory\//,
  /^\.narracat\/submissions\//,
  /^\.narracat\/data\/reviews\//,
  /^tracking\/(进度|章节摘要|伏笔表|人物状态)\.md$/,
  /\.lock$/,
  /\.tmp$/,
]
/** Paths the workbench refuses to read even though they sit inside a book. */
const READ_DENY = [/^\.narracat\/memory\.db(-wal|-shm)?$/]

/** One request-level failure with an HTTP status and a stable code. */
export class ApiError extends Error {
  /**
   * @param {number} status - HTTP status to answer with.
   * @param {string} code - stable machine-readable failure code.
   * @param {string} message - readable explanation for the browser.
   */
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Whether a directory is a Narracat book (has `.narracat/config.yaml`).
 * @param {string} dir - absolute directory.
 * @returns {Promise<boolean>} true when the marker file exists.
 */
export async function isBookDir(dir) {
  try {
    return (await stat(join(dir, '.narracat', 'config.yaml'))).isFile()
  } catch {
    return false
  }
}

/**
 * Parse the flat `key: value` subset of a Narracat `config.yaml`.
 * @param {string} text - file content.
 * @returns {Record<string, string | number | null>} parsed top-level fields.
 */
function parseScalar(raw) {
  const text = String(raw).trim()
  if (text.startsWith('"')) {
    for (let index = 1; index < text.length; index += 1) {
      if (text[index] === '\\') { index += 1; continue }
      if (text[index] === '"') {
        const literal = text.slice(0, index + 1)
        try { return JSON.parse(literal) } catch { return literal.slice(1, -1) }
      }
    }
    return text
  }
  if (text.startsWith("'")) {
    const end = text.indexOf("'", 1)
    return end > 0 ? text.slice(1, end) : text
  }
  // YAML comments start at a hash preceded by whitespace.
  return text.replace(/\s+#.*$/, '').trim()
}

export function parseConfig(text) {
  /** @type {Record<string, string | number | null>} */
  const config = {}
  for (const raw of String(text).split(/\r?\n/)) {
    const match = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(raw)
    if (!match) continue
    const value = parseScalar(match[2])
    config[match[1]] = value === '' || value === 'null' || value === '~' ? null : /^-?\d+$/.test(value) ? Number.parseInt(value, 10) : value
  }
  return config
}

/**
 * Count Chinese characters and Latin word runs as "words".
 * @param {string} text - prose.
 * @returns {number} a character/word count comparable across chapters.
 */
export function countWords(text) {
  const cjk = text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu)
  const latin = text.replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)
  return (cjk ? cjk.length : 0) + (latin ? latin.length : 0)
}

/** Strip markdown/HTML comment metadata so prose checks and memory see the visible text. */
export function visibleText(raw) {
  return String(raw)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

/** Short content revision label (first 16 hex of sha256). */
export function shortRevision(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex').slice(0, 16)
}

/**
 * Resolve `target` and refuse it unless it lies inside `root`.
 * @param {string} root - absolute real path.
 * @param {string} target - absolute candidate path.
 * @param {string} code - failure code to raise.
 */
function assertInside(root, target, code) {
  const rel = relative(root, target)
  if (rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel))) return
  throw new ApiError(403, code, '路径越出了作品目录')
}

/**
 * Recursively collect files under `dir`, skipping dot-directories and node_modules.
 * @param {string} dir - absolute start directory.
 * @param {(abs: string, rel: string) => void | Promise<void>} visit - per-file callback.
 * @param {{ maxDepth?: number }} [options] - walk limits.
 * @returns {Promise<void>} after the walk completes.
 */
async function walk(dir, visit, options = {}) {
  const maxDepth = options.maxDepth ?? 8
  /** @type {Array<{ dir: string, depth: number }>} */
  const queue = [{ dir, depth: 0 }]
  let seen = 0
  while (queue.length > 0) {
    const next = queue.shift()
    let entries
    try {
      entries = await readdir(next.dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        if (!(next.depth === 0 && entry.name === '.narracat')) continue
      }
      if (entry.isSymbolicLink()) continue
      const abs = join(next.dir, entry.name)
      let info
      try {
        info = await lstat(abs)
      } catch {
        continue
      }
      if (info.isDirectory()) {
        if (next.depth + 1 <= maxDepth) queue.push({ dir: abs, depth: next.depth + 1 })
        continue
      }
      if (!info.isFile()) continue
      seen += 1
      if (seen > MAX_WALK) return
      await visit(abs, abs.slice(dir.length + 1).split(sep).join('/'))
    }
  }
}

/**
 * Read at most `maxBytes` from the start of a file, without loading the rest.
 * @param {string} path - absolute path.
 * @param {number} maxBytes - byte cap.
 * @returns {Promise<{ text: string, bytes: number } | null>} head text or null.
 */
async function readTextHead(path, maxBytes) {
  let handle
  try {
    handle = await open(path, 'r')
    const buffer = Buffer.alloc(maxBytes)
    const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0)
    return { text: buffer.subarray(0, bytesRead).toString('utf8'), bytes: bytesRead }
  } catch {
    return null
  } finally {
    if (handle) await handle.close()
  }
}

/**
 * Read a book-relative text file through the path guard, so a symlink inside
 * the book cannot surface a file outside it. Returns null when absent/rejected.
 * @param {string} bookAbs - real book directory.
 * @param {string} rel - book-relative path.
 * @returns {Promise<string | null>} text or null.
 */
async function readBookText(bookAbs, rel) {
  try {
    return (await readBookFile(bookAbs, rel)).text
  } catch {
    return null
  }
}

/**
 * Read a book-relative JSON file through the same guard.
 * @param {string} bookAbs - real book directory.
 * @param {string} rel - book-relative path.
 * @returns {Promise<any | null>} parsed JSON or null.
 */
async function readBookJson(bookAbs, rel) {
  const text = await readBookText(bookAbs, rel)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Describe one book for the picker, without loading its whole contents.
 * @param {string} root - workspace root.
 * @param {string} dir - absolute book directory.
 * @returns {Promise<object>} compact book row.
 */
async function describeBook(root, dir) {
  const configText = await readBookText(dir, '.narracat/config.yaml')
  const config = configText === null ? {} : parseConfig(configText)
  /** @type {Array<{ chapter: number, bytes: number, mtime: number }>} */
  const manuscripts = []
  await walk(join(dir, 'manuscript'), (abs) => {
    if (!/^ch-\d+\.md$/i.test(basename(abs))) return
    manuscripts.push({ bytes: 0, mtime: 0, chapter: Number.parseInt(basename(abs).replace(/\D/g, ''), 10) })
  })
  const stats = await stat(join(dir, '.narracat', 'config.yaml'))
  return {
    root,
    dir,
    relDir: relative(root, dir) || '.',
    name: basename(dir),
    title: typeof config.title === 'string' && config.title ? config.title : basename(dir),
    genre: typeof config.genre === 'string' ? config.genre : '',
    language: typeof config.language === 'string' ? config.language : '',
    novelId: String(config.novel_id ?? config.project_id ?? ''),
    scene: typeof config.scene === 'string' ? config.scene : 'novel',
    totalChapters: typeof config.estimated_total_chapters === 'number' ? config.estimated_total_chapters : null,
    wordsPerChapter: typeof config.words_per_chapter === 'number' ? config.words_per_chapter : null,
    writtenChapters: manuscripts.length,
    updatedAt: stats.mtimeMs,
  }
}

/**
 * Find every Narracat book directly under one workspace root (or the root itself).
 * @param {string} root - absolute workspace path.
 * @returns {Promise<object[]>} compact book rows.
 */
export async function scanRoot(root) {
  if (!isAbsolute(root)) throw new ApiError(400, 'bad-root', '需要绝对路径')
  const rootAbs = resolve(root)
  const realRoot = await realpath(rootAbs).catch(() => rootAbs)
  /** Skips that can never hold a book, but would make a scan expensive. */
  const SKIP = new Set(['node_modules', 'dist', 'build', 'out', 'target', 'vendor', '.git'])
  /** @type {object[]} */
  const books = []
  const seen = new Set()
  const accept = async (dir) => {
    if (seen.has(dir)) return
    // A symlinked child may point at a book outside this workspace; listing it
    // would advertise a book that /book must then refuse to open.
    const realDir = await realpath(dir).catch(() => null)
    if (!realDir) return
    const rel = relative(realRoot, realDir)
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return
    seen.add(dir)
    books.push(await describeBook(rootAbs, dir))
  }
  if (await isBookDir(rootAbs)) await accept(rootAbs)
  // A workspace may hold the book itself, one book per child directory, or a
  // shelf such as `books/<book>`; two levels cover all three without walking
  // the whole tree.
  /** @type {Array<{ dir: string, depth: number }>} */
  const queue = [{ dir: rootAbs, depth: 0 }]
  while (queue.length > 0) {
    if (books.length >= 100) break
    const next = queue.shift()
    if (next.depth >= 2) continue
    let entries = []
    try {
      entries = await readdir(next.dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (books.length >= 100) break
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue
      const child = join(next.dir, entry.name)
      if (await isBookDir(child)) {
        await accept(child)
        continue
      }
      if (next.depth + 1 < 2) queue.push({ dir: child, depth: next.depth + 1 })
    }
  }
  return books
}

/**
 * Resolve one book directory and prove it sits inside the workspace root.
 * @param {string} root - workspace root.
 * @param {string} dir - book directory, absolute or root-relative.
 * @returns {Promise<{ root: string, book: string }>} real absolute paths.
 */
export async function resolveBook(root, dir) {
  if (!isAbsolute(root)) throw new ApiError(400, 'bad-root', '需要绝对路径')
  const rootAbs = resolve(root)
  const bookAbs = resolve(rootAbs, dir || '.')
  assertInside(rootAbs, bookAbs, 'book-outside-root')
  let realRoot
  let realBook
  try {
    realRoot = await realpath(rootAbs)
  } catch {
    throw new ApiError(404, 'no-root', '工作区目录不存在')
  }
  try {
    realBook = await realpath(bookAbs)
  } catch {
    throw new ApiError(404, 'no-book', '作品目录不存在')
  }
  // macOS resolves /var to /private/var, so containment must compare real paths.
  assertInside(realRoot, realBook, 'book-outside-root')
  if (!(await isBookDir(realBook))) throw new ApiError(404, 'not-a-book', '这个目录不是 Narracat 作品（缺少 .narracat/config.yaml）')
  return { root: realRoot, book: realBook }
}

/**
 * Resolve a target through its nearest existing ancestor, so a symlinked
 * parent directory cannot carry a not-yet-existing file outside the book.
 * @param {string} abs - absolute candidate path.
 * @returns {Promise<string>} the real path, with missing components appended.
 */
async function realCandidatePath(abs) {
  /** @type {string[]} */
  const missing = []
  let current = abs
  while (true) {
    try {
      const real = await realpath(current)
      return missing.length === 0 ? real : join(real, ...missing)
    } catch {
      const parent = dirname(current)
      if (parent === current) return abs
      missing.unshift(basename(current))
      current = parent
    }
  }
}

/**
 * Resolve a book-relative path for reading or writing.
 * @param {string} bookAbs - real book directory.
 * @param {string} relPath - book-relative path using forward slashes.
 * @param {{ write?: boolean, internal?: boolean, binary?: boolean }} [options] - apply the write deny list; `internal` marks plugin-owned programs (the submitter) that maintain derived files; `binary` allows a non-text export such as `.docx`.
 * @returns {Promise<{ abs: string, rel: string, ext: string }>} the resolved target.
 */
export async function resolveBookFile(bookAbs, relPath, options = {}) {
  if (typeof relPath !== 'string' || relPath.length === 0) throw new ApiError(400, 'bad-path', '缺少文件路径')
  if (relPath.includes('\0')) throw new ApiError(400, 'bad-path', '路径不合法')
  const normalized = relPath.split('\\').join('/').replace(/^\/+/, '')
  // The book root itself may be a symlinked spelling (macOS /var → /private/var).
  // Compare every candidate against its real path, never against the spelling.
  let rootReal
  try {
    rootReal = await realpath(bookAbs)
  } catch {
    rootReal = resolve(bookAbs)
  }
  const abs = resolve(rootReal, normalized)
  assertInside(rootReal, abs, 'file-outside-book')
  // Resolve through the nearest existing ancestor (and the existing target
  // itself when present). A symlink anywhere on the path that points outside
  // the book is rejected; a write may not create a file through such a link.
  const real = await realCandidatePath(abs)
  assertInside(rootReal, real, 'file-outside-book')
  const rel = relative(rootReal, abs).split(sep).join('/')
  const realRel = relative(rootReal, real).split(sep).join('/')
  // Deny checks must run on the canonical path: an uppercase spelling or a
  // symlink alias must not smuggle a host-maintained file past the patterns.
  // macOS/Windows filesystems are case-insensitive, so fold there.
  const denyRel = process.platform === 'darwin' || process.platform === 'win32' ? realRel.toLowerCase() : realRel
  if (!(options.write && options.internal) && (options.write ? WRITE_DENY : READ_DENY).some((pattern) => pattern.test(denyRel))) {
    throw new ApiError(403, 'protected-file', '这个文件由 Narracat 的宿主程序维护，工作台不直接改写')
  }
  const ext = extname(real).toLowerCase()
  const binaryAllowed = options.binary === true && ['.docx', '.pdf'].includes(ext)
  if (!TEXT_EXTS.has(ext) && !binaryAllowed) throw new ApiError(415, 'unsupported-file', '只支持文本类文件')
  return { abs: real, rel, ext }
}

/**
 * Read one text file from a book.
 * @param {string} bookAbs - real book directory.
 * @param {string} relPath - book-relative path.
 * @param {{ full?: boolean }} [options] - `full` reads the whole file for an
 *   internal integrity check and refuses files above the write cap instead of
 *   returning truncated text. The default returns the first 2 MiB for display.
 * @returns {Promise<{ path: string, text: string, size: number, mtime: number, truncated: boolean }>} the file.
 */
export async function readBookFile(bookAbs, relPath, options = {}) {
  const target = await resolveBookFile(bookAbs, relPath)
  const info = await stat(target.abs)
  const limit = options.full === true ? MAX_WRITE_BYTES : MAX_READ_BYTES
  if (options.full === true && info.size > limit) {
    throw new ApiError(413, 'too-large', `文件超过 ${Math.round(limit / 1024 / 1024)} MiB，不能作为一整份内容读取`)
  }
  const length = Math.min(info.size, limit)
  const buffer = Buffer.alloc(length)
  let read = 0
  const handle = await open(target.abs, 'r')
  try {
    while (read < length) {
      const chunk = await handle.read(buffer, read, length - read, read)
      if (chunk.bytesRead === 0) break
      read += chunk.bytesRead
    }
  } finally {
    await handle.close()
  }
  return {
    path: target.rel,
    text: buffer.subarray(0, read).toString('utf8'),
    size: info.size,
    mtime: info.mtimeMs,
    truncated: info.size > read,
  }
}

/**
 * Write one text file into a book with a last-write-wins guard.
 * @param {string} bookAbs - real book directory.
 * @param {string} relPath - book-relative path.
 * @param {string} text - new content.
 * @param {number | undefined} expectedMtime - mtime the editor loaded; a mismatch returns 409.
 * @param {{ internal?: boolean }} [options] - `internal` lets a plugin-owned program maintain derived files.
 * @returns {Promise<{ path: string, size: number, mtime: number }>} the saved file.
 */

/** Serialize read-check-write per target so two saves cannot both win. */
const writeQueues = new Map()

async function withWriteLock(key, run) {
  const previous = writeQueues.get(key) ?? Promise.resolve()
  let release
  const current = new Promise((resolve) => { release = resolve })
  const chained = previous.then(() => current)
  writeQueues.set(key, chained)
  await previous
  try {
    return await run()
  } finally {
    release()
    if (writeQueues.get(key) === chained) writeQueues.delete(key)
  }
}

/**
 * Write one text file into a book with an mtime/size CAS guard. Writes to one
 * path are serialized, the temp file is unique, and it is fsynced before the
 * atomic rename; a concurrent editor cannot silently lose the later update.
 * @param {string} bookAbs - real book directory.
 * @param {string} relPath - book-relative path.
 * @param {string} text - new content.
 * @param {number | undefined} expectedMtime - mtime the editor loaded; a mismatch returns 409.
 * @param {{ internal?: boolean, expectedSize?: number }} [options] - `internal` lets a plugin-owned program maintain derived files and bypass the large-file shrink guard; `expectedSize` is the loaded file size for CAS.
 * @returns {Promise<{ path: string, size: number, mtime: number }>} the saved file.
 */
export async function writeBookFile(bookAbs, relPath, text, expectedMtime, options = {}) {
  if (typeof text !== 'string') throw new ApiError(400, 'bad-body', '缺少文件内容')
  if (Buffer.byteLength(text, 'utf8') > MAX_WRITE_BYTES) throw new ApiError(413, 'too-large', '文件超过 4 MiB')
  if (options.expectedSize !== undefined && (!Number.isInteger(options.expectedSize) || options.expectedSize < 0)) {
    throw new ApiError(400, 'bad-size', 'expectedSize 必须是非负整数')
  }
  if (expectedMtime !== undefined && (typeof expectedMtime !== 'number' || !Number.isFinite(expectedMtime))) {
    throw new ApiError(400, 'bad-mtime', 'expectedMtime 必须是数字')
  }
  const target = await resolveBookFile(bookAbs, relPath, { write: true, internal: options.internal === true })
  if (target.ext === '.json') {
    try {
      JSON.parse(text)
    } catch (error) {
      throw new ApiError(422, 'invalid-json', `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return await withWriteLock(target.abs, async () => {
    let current = null
    try {
      current = await stat(target.abs)
    } catch {
      current = null
    }
    if (current && expectedMtime !== undefined && current.mtimeMs !== expectedMtime) {
      throw new ApiError(409, 'conflict', '文件在打开之后被改动过，请先重新加载')
    }
    if (current && options.expectedSize !== undefined && current.size !== options.expectedSize) {
      throw new ApiError(409, 'conflict', '文件在打开之后被改动过，请先重新加载')
    }
    // A >2 MiB file cannot be fully loaded by the editor; refusing a shorter
    // write stops a truncated view from silently deleting the tail. Internal
    // programs (submission/rewrite) may legitimately shrink a long chapter.
    if (current && options.internal !== true && current.size > MAX_READ_BYTES && Buffer.byteLength(text, 'utf8') < current.size) {
      throw new ApiError(409, 'large-file-reload', '这个文件超过 2 MiB，工作台只读到了前半部分；请用外部编辑器修改，避免丢失后半部分')
    }
    await mkdir(dirname(target.abs), { recursive: true })
    const tmp = `${target.abs}.nw-${process.pid}-${randomUUID()}.tmp`
    try {
      const handle = await open(tmp, 'w')
      try {
        await handle.writeFile(text, 'utf8')
        await handle.sync()
      } finally {
        await handle.close()
      }
      await rename(tmp, target.abs)
    } catch (error) {
      await rm(tmp, { force: true }).catch(() => {})
      throw error
    }
    const info = await stat(target.abs)
    return { path: target.rel, size: info.size, mtime: info.mtimeMs }
  })
}

/**
 * Remove one workbench-owned text file (staging drafts, generated packs).
 * @param {string} bookAbs - real book directory.
 * @param {string} relPath - book-relative path.
 * @returns {Promise<boolean>} whether a file was removed.
 */
export async function removeBookFile(bookAbs, relPath) {
  const target = await resolveBookFile(bookAbs, relPath, { write: true })
  try {
    await rm(target.abs, { force: true })
    return true
  } catch {
    return false
  }
}

/**
 * Read the first meaningful line of a manuscript as its chapter title.
 * @param {string} text - manuscript text.
 * @returns {string | null} short title candidate or null.
 */
function titleFromText(text) {
  const line = text.split(/\r?\n/).map((value) => value.trim()).find((value) => value.length > 0)
  if (!line) return null
  const plain = line.replace(/^#+\s*/, '').replace(/^第[零一二三四五六七八九十百千0-9]+章[\s:：、.．-]*/, '').trim()
  return plain.length > 0 && plain.length <= 40 ? plain : null
}

/**
 * Walk one book's manuscript directory into rows.
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<Map<number, object>>} chapter number to manuscript row.
 */
async function collectManuscripts(bookAbs) {
  /** @type {Map<number, object>} */
  const chapters = new Map()
  await walk(join(bookAbs, 'manuscript'), (abs, rel) => {
    const match = /^ch-(\d+)\.md$/i.exec(basename(abs))
    if (!match) return
    const chapter = Number.parseInt(match[1], 10)
    const volume = /(?:^|\/)vol-(\d+)(?:\/|$)/i.exec(rel)
    chapters.set(chapter, { chapter, path: `manuscript/${rel}`, volume: volume ? Number.parseInt(volume[1], 10) : null })
  })
  return chapters
}

/**
 * Walk one book's chapter-outline directory into rows.
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<Map<number, object>>} chapter number to outline row.
 */
async function collectChapterOutlines(bookAbs) {
  /** @type {Map<number, object>} */
  const outlines = new Map()
  await walk(join(bookAbs, '.narracat', 'data', 'outline'), (abs, rel) => {
    const match = /^ch-(\d+)\.json$/i.exec(basename(abs))
    if (!match) return
    outlines.set(Number.parseInt(match[1], 10), { chapter: Number.parseInt(match[1], 10), path: `.narracat/data/outline/${rel}`.split(sep).join('/') })
  })
  return outlines
}

/**
 * Collect the visible `bible/` markdown settings by directory.
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<Record<string, Array<{ name: string, path: string, bytes: number }>>>} settings by kind.
 */
async function collectSettings(bookAbs) {
  /** @type {Record<string, Array<{ name: string, path: string, bytes: number }>>} */
  const settings = {}
  await walk(join(bookAbs, 'bible'), async (abs, rel) => {
    const parts = rel.split('/')
    if (parts.length !== 2) return
    if (!/\.md$/i.test(parts[1])) return
    const kind = parts[0]
    const info = await stat(abs)
    if (!settings[kind]) settings[kind] = []
    settings[kind].push({ name: basename(parts[1], '.md').normalize('NFC'), path: `bible/${rel}`, bytes: info.size })
  }, { maxDepth: 2 })
  for (const rows of Object.values(settings)) rows.sort((left, right) => left.name.localeCompare(right.name, 'zh'))
  return settings
}

/**
 * Read the book's structured JSON SSOTs (outline, premise, identities, reviews).
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<object>} the book snapshot body.
 */
export async function buildSnapshot(bookAbs) {
  const configText = await readBookText(bookAbs, '.narracat/config.yaml')
  const config = configText === null ? {} : parseConfig(configText)
  const [manuscripts, chapterOutlineRows, settings] = await Promise.all([
    collectManuscripts(bookAbs),
    collectChapterOutlines(bookAbs),
    collectSettings(bookAbs),
  ])
  const structure = await readBookJson(bookAbs, '.narracat/data/outline/outline-structure.json')
    ?? await readBookJson(bookAbs, 'outline/outline-structure.json')
  const premise = await readBookJson(bookAbs, '.narracat/data/bible/premise-cards.json')
    ?? await readBookJson(bookAbs, 'bible/premise-cards.json')
  const stateVocabulary = await readBookJson(bookAbs, '.narracat/data/bible/state-vocabulary.json')
    ?? await readBookJson(bookAbs, 'bible/state-vocabulary.json')
  const chapterOutlines = new Map()
  for (const [chapter, row] of chapterOutlineRows) {
    chapterOutlines.set(chapter, { path: row.path, data: await readBookJson(bookAbs, row.path) })
  }
  /** @type {Map<number, object>} */
  const reviews = new Map()
  await walk(join(bookAbs, '.narracat', 'data', 'reviews'), async (abs, rel) => {
    const match = /^ch-(\d+)-review\.json$/i.exec(basename(abs))
    if (!match) return
    const data = await readBookJson(bookAbs, `.narracat/data/reviews/${rel}`)
    reviews.set(Number.parseInt(match[1], 10), {
      path: `.narracat/data/reviews/${rel}`.split(sep).join('/'),
      verdict: typeof data?.verdict === 'string' ? data.verdict : null,
      issues: Array.isArray(data?.issues) ? data.issues.length : 0,
      blockers: Array.isArray(data?.issues) ? data.issues.filter((issue) => issue?.severity === 'blocker').length : 0,
      wordCount: typeof data?.word_count === 'number' ? data.word_count : null,
    })
  }, { maxDepth: 2 })
  /** @type {Map<string, object>} */
  const identities = new Map()
  await walk(join(bookAbs, '.narracat', 'data', 'bible', 'characters'), async (abs, rel) => {
    if (!/\.json$/i.test(rel)) return
    const data = await readBookJson(bookAbs, `.narracat/data/bible/characters/${rel}`)
    if (!data || typeof data !== 'object') return
    const name = (typeof data.name === 'string' ? data.name : basename(rel, '.json')).normalize('NFC')
    identities.set(name, {
      path: `.narracat/data/bible/characters/${rel}`.split(sep).join('/'),
      characterUid: typeof data.character_uid === 'string' ? data.character_uid : '',
      aliases: Array.isArray(data.aliases) ? data.aliases.map(String) : [],
      gender: typeof data.gender === 'string' ? data.gender : '',
      age: typeof data.age === 'string' ? data.age : '',
      portrait: typeof data.portrait === 'string' ? data.portrait : '',
      profileStage: typeof data.profile_stage === 'string' ? data.profile_stage : 'full',
      initialStates: Array.isArray(data.initial_states) ? data.initial_states : [],
    })
  }, { maxDepth: 2 })

  // Chapter union with words and titles.
  const chapters = []
  const chapterNumbers = [...new Set([...manuscripts.keys(), ...chapterOutlines.keys()])].sort((left, right) => left - right)
  let totalWords = 0
  let scannedBytes = 0
  for (const chapter of chapterNumbers) {
    const manuscript = manuscripts.get(chapter) ?? null
    const outline = chapterOutlines.get(chapter) ?? null
    const review = reviews.get(chapter) ?? null
    let words = 0
    let title = null
    let mtime = 0
    if (manuscript) {
      try {
        const info = await stat(join(bookAbs, manuscript.path))
        mtime = info.mtimeMs
        if (scannedBytes < MAX_MANUSCRIPT_TOTAL_BYTES) {
          const head = await readTextHead(join(bookAbs, manuscript.path), MAX_MANUSCRIPT_SCAN_BYTES)
          if (head) {
            scannedBytes += head.bytes
            words = countWords(head.text)
            title = titleFromText(head.text)
          }
        }
      } catch {
        words = 0
      }
      totalWords += words
    }
    const outlineTitle = typeof outline?.data?.title === 'string' ? outline.data.title : null
    chapters.push({
      chapter,
      volume: manuscript?.volume ?? null,
      title: title ?? outlineTitle ?? `第 ${chapter} 章`,
      path: manuscript?.path ?? null,
      words,
      mtime,
      hasText: manuscript !== null,
      hasOutline: outline !== null,
      outlinePath: outline?.path ?? null,
      review,
    })
  }
  const written = chapters.filter((row) => row.hasText)
  const lastWritten = written.length > 0 ? written[written.length - 1].chapter : 0
  const outlined = chapters.filter((row) => row.hasOutline)
  const nextChapter = (() => {
    let candidate = lastWritten + 1
    const outlinedAhead = outlined.find((row) => row.chapter > lastWritten && !row.hasText)
    if (outlinedAhead && outlinedAhead.chapter < candidate) candidate = outlinedAhead.chapter
    return candidate
  })()
  const totalChapters = typeof config.estimated_total_chapters === 'number' ? config.estimated_total_chapters : null

  // Volumes: outline structure first, then manuscript grouping as fallback.
  const volumes = []
  const structureVolumes = Array.isArray(structure?.volumes) ? structure.volumes : []
  const volumePlan = Array.isArray(structure?.volume_plan) ? structure.volume_plan : []
  for (const volume of structureVolumes) {
    const plan = volumePlan.find((row) => row?.volume_no === volume?.volume_no)
    volumes.push({
      volumeNo: typeof volume?.volume_no === 'number' ? volume.volume_no : null,
      title: typeof volume?.title === 'string' ? volume.title : plan?.title ?? '',
      chapterStart: typeof plan?.chapter_start === 'number' ? plan.chapter_start : null,
      chapterEnd: typeof plan?.chapter_end === 'number' ? plan.chapter_end : null,
      synopsis: typeof plan?.synopsis === 'string' ? plan.synopsis : typeof volume?.synopsis === 'string' ? volume.synopsis : '',
      arcs: Array.isArray(volume?.arc_list) ? volume.arc_list.map((arc) => ({
        arcId: typeof arc?.arc_id === 'string' ? arc.arc_id : '',
        title: typeof arc?.title === 'string' ? arc.title : '',
        chapterStart: typeof arc?.chapter_start === 'number' ? arc.chapter_start : null,
        chapterEnd: typeof arc?.chapter_end === 'number' ? arc.chapter_end : null,
        synopsis: typeof arc?.synopsis === 'string' ? arc.synopsis : '',
      })) : [],
    })
  }
  for (const row of chapters) {
    if (row.volume === null || volumes.some((volume) => volume.volumeNo === row.volume)) continue
    volumes.push({ volumeNo: row.volume, title: '', chapterStart: null, chapterEnd: null, synopsis: '', arcs: [] })
  }
  volumes.sort((left, right) => (left.volumeNo ?? 0) - (right.volumeNo ?? 0))

  // Characters: visible markdown plus the identity JSON.
  const characterFiles = settings.characters ?? []
  const characters = characterFiles.map((row) => ({
    name: row.name,
    path: row.path,
    bytes: row.bytes,
    identity: identities.get(row.name) ?? null,
  }))
  for (const [name, identity] of identities) {
    if (!characters.some((row) => row.name === name)) {
      characters.push({ name, path: null, bytes: 0, identity })
    }
  }

  const memoryInfo = await readMemoryInfo(bookAbs)
  /** @type {object[]} */
  const memoryRecords = []
  for (const chapterNumber of memoryInfo.chapters ?? []) {
    const record = await readBookJson(bookAbs, `.narracat/memory/ch-${String(chapterNumber).padStart(3, '0')}.json`)
    if (!record || typeof record !== 'object') continue
    memoryRecords.push({
      chapter: Number.isInteger(record.chapter) ? record.chapter : chapterNumber,
      path: `.narracat/memory/ch-${String(chapterNumber).padStart(3, '0')}.json`,
      summary: typeof record.summary === 'string' ? record.summary : '',
      source_revision: typeof record.source_revision === 'string' ? record.source_revision : null,
      word_count: typeof record.word_count === 'number' ? record.word_count : null,
      events: Array.isArray(record.events) ? record.events : [],
      state_changes: Array.isArray(record.state_changes) ? record.state_changes : [],
      foreshadowing: Array.isArray(record.foreshadowing) ? record.foreshadowing : [],
      review: record.review ?? null,
      published_at: typeof record.published_at === 'string' ? record.published_at : null,
    })
  }
  const writtenRows = chapters.filter((row) => row.hasText)
  const lastWrittenChapter = writtenRows.length > 0 ? writtenRows[writtenRows.length - 1].chapter : 0
  for (const record of memoryRecords) {
    const row = chapters.find((item) => item.chapter === record.chapter)
    if (!row?.path) {
      record.fresh = false
      continue
    }
    try {
      const text = visibleText((await readBookFile(bookAbs, row.path, { full: true })).text)
      record.fresh = record.source_revision === shortRevision(text)
    } catch {
      record.fresh = false
    }
  }
  for (const row of chapters) {
    const record = memoryRecords.find((item) => item.chapter === row.chapter)
    row.hasMemory = record !== undefined
    row.memoryFresh = record ? record.fresh : null
    row.memorySummary = record?.summary ? record.summary.slice(0, 240) : null
    row.memoryStateChanges = record?.state_changes?.length ?? 0
  }
  const staleChapters = memoryRecords.filter((record) => record.fresh === false).map((record) => record.chapter)
  const characterStates = foldCharacterStates(memoryRecords, lastWrittenChapter)
  const foreshadowingStates = foldForeshadowing(memoryRecords, lastWrittenChapter)
  const agentsText = await readBookText(bookAbs, 'AGENTS.md')
  const relationshipsText = await readBookText(bookAbs, 'bible/relationships.md')
  const memoText = await readBookText(bookAbs, 'tracking/写作备忘.md')
  let configMtime = 0
  try {
    configMtime = (await stat(join(bookAbs, '.narracat', 'config.yaml'))).mtimeMs
  } catch {
    configMtime = 0
  }
  const updatedAt = Math.max(
    configMtime,
    ...chapters.map((row) => row.mtime || 0),
    memoryInfo.mtime ?? 0,
  )

  return {
    ok: true,
    book: {
      dir: bookAbs,
      name: basename(bookAbs),
      title: typeof config.title === 'string' ? config.title : basename(bookAbs),
      genre: typeof config.genre === 'string' ? config.genre : '',
      language: typeof config.language === 'string' ? config.language : '',
      novelId: String(config.novel_id ?? config.project_id ?? ''),
      scene: typeof config.scene === 'string' ? config.scene : 'novel',
      automationLevel: typeof config.automation_level === 'string' ? config.automation_level : '',
      styleProfile: typeof config.style_profile === 'string' ? config.style_profile : null,
      totalChapters,
      wordsPerChapter: typeof config.words_per_chapter === 'number' ? config.words_per_chapter : null,
      updatedAt: updatedAt > 0 ? updatedAt : null,
      agents: agentsText,
      relationships: relationshipsText,
      memo: memoText,
      memory: {
        ...memoryInfo,
        staleChapters,
        records: memoryRecords.length,
      },
      config,
    },
    status: {
      writtenChapters: written.length,
      outlinedChapters: outlined.length,
      plannedChapters: chapters.length,
      totalWords,
      lastWrittenChapter: lastWritten,
      nextChapter,
      completion: totalChapters ? Math.min(1, written.length / totalChapters) : null,
      outOfOrder: outlined.filter((row) => row.chapter < lastWritten && !row.hasText).map((row) => row.chapter),
      memory: {
        recorded: memoryRecords.length,
        missing: writtenRows.filter((row) => !row.hasMemory).map((row) => row.chapter),
        stale: staleChapters,
      },
    },
    volumes,
    chapters,
    characters,
    settings: {
      world: settings.world ?? [],
      other: Object.entries(settings)
        .filter(([kind]) => kind !== 'characters' && kind !== 'world' && kind !== 'references')
        .flatMap(([kind, rows]) => rows.map((row) => ({ ...row, kind }))),
      references: settings.references ?? [],
    },
    outline: structure
      ? {
        path: '.narracat/data/outline/outline-structure.json',
        title: typeof structure.title === 'string' ? structure.title : '',
        synopsis: typeof structure.synopsis === 'string' ? structure.synopsis : '',
        storylines: Array.isArray(structure.storylines) ? structure.storylines : [],
        mysteries: Array.isArray(structure.mysteries) ? structure.mysteries : [],
        foreshadowing: Array.isArray(structure.foreshadowing_registry) ? structure.foreshadowing_registry : [],
        stakesProgression: structure.stakes_progression ?? null,
        raw: structure,
      }
      : null,
    premise: premise
      ? {
        path: '.narracat/data/bible/premise-cards.json',
        cards: Array.isArray(premise.cards) ? premise.cards : [],
        raw: premise,
      }
      : null,
    stateVocabulary: stateVocabulary
      ? {
        path: '.narracat/data/bible/state-vocabulary.json',
        dimensions: Array.isArray(stateVocabulary.dimensions) ? stateVocabulary.dimensions : [],
      }
      : null,
    reviews: chapters.filter((row) => row.review).map((row) => ({ chapter: row.chapter, ...row.review })),
    chapterOutlines: Object.fromEntries([...chapterOutlines].map(([chapter, row]) => [String(chapter), { path: row.path, data: row.data }])),
    memoryRecords: memoryRecords.map((record) => ({
      chapter: record.chapter,
      path: record.path,
      summary: record.summary.slice(0, 240),
      source_revision: record.source_revision,
      fresh: record.fresh,
      word_count: record.word_count,
      events: Array.isArray(record.events) ? record.events.slice(0, 8) : [],
      state_changes: record.state_changes,
      foreshadowing: record.foreshadowing,
      review: record.review,
      published_at: record.published_at,
    })),
    characterStates,
    foreshadowingStates,
  }
}

/**
 * A cheap change fingerprint for one book: every file's newest mtime plus the
 * file count and total bytes. No file contents are read, so a UI can poll this
 * on a short interval and reload the full snapshot only when something moved.
 *
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<{ stamp: string, mtime: number, files: number, bytes: number }>} fingerprint.
 */
export async function bookStamp(bookAbs) {
  let newest = 0
  let bytes = 0
  let files = 0
  await walk(bookAbs, async (abs) => {
    try {
      const info = await stat(abs)
      if (!info.isFile()) return
      files += 1
      bytes += info.size
      if (info.mtimeMs > newest) newest = info.mtimeMs
    } catch {
      // A file may disappear between the walk and the stat; the next poll sees it.
    }
  })
  return {
    stamp: `${Math.round(newest)}:${files}:${bytes}`,
    mtime: newest,
    files,
    bytes,
  }
}

/**
 * Read memory database presence and author-decision commit count.
 * @param {string} bookAbs - real book directory.
 * @returns {Promise<object>} memory facts for the workbench.
 */
async function readMemoryInfo(bookAbs) {
  /** @type {{ dbBytes: number | null, dbMtime: number | null, walBytes: number, commits: number, records: number, chapters: number[] }} */
  const info = { dbBytes: null, dbMtime: null, walBytes: 0, commits: 0, records: 0, chapters: [] }
  try {
    const statRow = await stat(join(bookAbs, '.narracat', 'memory.db'))
    info.dbBytes = statRow.size
    info.dbMtime = statRow.mtimeMs
  } catch {
    info.dbBytes = null
  }
  try {
    const wal = await stat(join(bookAbs, '.narracat', 'memory.db-wal'))
    info.walBytes = wal.size
  } catch {
    info.walBytes = 0
  }
  try {
    const entries = await readdir(join(bookAbs, '.narracat', 'project-memory', 'v1', 'commits'))
    info.commits = entries.filter((name) => name.endsWith('.json')).length
  } catch {
    info.commits = 0
  }
  try {
    const entries = await readdir(join(bookAbs, '.narracat', 'memory'))
    info.chapters = entries
      .filter((name) => /^ch-\d+\.json$/.test(name))
      .map((name) => Number.parseInt(name.replace(/\D/g, ''), 10))
      .sort((left, right) => left - right)
    info.records = info.chapters.length
  } catch {
    info.chapters = []
    info.records = 0
  }
  return info
}
