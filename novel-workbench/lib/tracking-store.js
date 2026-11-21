/**
 * Read and refresh the book's visible memory sheets.
 *
 * The sheets are derived from chapter memory, the outline and character
 * identities; this module owns the filesystem side. A failed refresh never
 * blocks a chapter save — callers collect the warning and keep the book.
 */

import { buildSnapshot, readBookFile, writeBookFile } from './project.js'
import {
  MEMO_PATH,
  MEMO_STARTER,
  TRACKING_PATHS,
  trackingMarkdown,
  trackingModel,
} from './tracking.js'

/** Generated sheet kinds and their book-relative paths. */
export const TRACKING_KINDS = ['progress', 'summaries', 'foreshadowing', 'characters']

/** One Chinese label per sheet. */
export const TRACKING_LABELS = {
  progress: '进度',
  summaries: '章节摘要',
  foreshadowing: '伏笔表',
  characters: '人物状态',
  memo: '写作备忘',
}

/** Read one sheet; missing files return empty text rather than throwing. */
async function readTextOrEmpty(book, path) {
  try {
    return (await readBookFile(book, path)).text
  } catch {
    return ''
  }
}

/** Ensure the authored memo exists; never overwrite existing words. */
export async function ensureMemo(book) {
  const existing = await readTextOrEmpty(book, MEMO_PATH)
  if (existing.length > 0) return { path: MEMO_PATH, created: false, text: existing }
  await writeBookFile(book, MEMO_PATH, MEMO_STARTER, undefined)
  return { path: MEMO_PATH, created: true, text: MEMO_STARTER }
}

/**
 * Regenerate the four generated sheets from the current book state.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} saved files and warnings.
 */
export async function refreshTracking(book) {
  const snapshot = await buildSnapshot(book)
  const model = trackingModel(snapshot)
  const files = []
  const warnings = []
  for (const kind of TRACKING_KINDS) {
    const path = TRACKING_PATHS[kind]
    const text = trackingMarkdown(model, kind)
    try {
      const saved = await writeBookFile(book, path, text, undefined, { internal: true })
      files.push({ kind, path, bytes: saved.size, mtime: saved.mtime })
    } catch (error) {
      warnings.push(`${TRACKING_LABELS[kind]}没有写成功：${error instanceof Error ? error.message : String(error)}`)
    }
  }
  try {
    const memo = await ensureMemo(book)
    files.push({ kind: 'memo', path: MEMO_PATH, bytes: Buffer.byteLength(memo.text), created: memo.created })
  } catch (error) {
    warnings.push(`写作备忘没有写成功：${error instanceof Error ? error.message : String(error)}`)
  }
  return {
    status: files.some((file) => file.kind !== 'memo') ? 'saved' : 'stopped',
    generated_at: model.generatedAt,
    progress: model.progress,
    files,
    warnings,
  }
}

/**
 * Read one sheet (or the memo) for a tool or the UI.
 * @param {string} book - real book directory.
 * @param {'progress'|'summaries'|'foreshadowing'|'characters'|'memo'} kind - sheet.
 * @param {{ max_chars?: number }} [options] - truncate long sheets.
 * @returns {Promise<object>} path and text.
 */
export async function readTracking(book, kind, options = {}) {
  const key = TRACKING_KINDS.includes(kind) ? kind : kind === 'memo' ? 'memo' : 'progress'
  const path = key === 'memo' ? MEMO_PATH : TRACKING_PATHS[key]
  let text = await readTextOrEmpty(book, path)
  const exists = text.length > 0
  if (!exists && key === 'memo') {
    const memo = await ensureMemo(book)
    text = memo.text
  }
  const max = Math.min(Math.max(Number(options.max_chars ?? 20000), 1000), 60000)
  return {
    kind: key,
    label: TRACKING_LABELS[key],
    path,
    exists,
    text: text.length > max ? `${text.slice(0, max)}\n\n…（后略）` : text,
    truncated: text.length > max,
  }
}

/**
 * Append one dated note to the authored memo.
 * @param {string} book - real book directory.
 * @param {{ note: string, chapter?: number }} args - note text.
 * @returns {Promise<object>} saved state.
 */
export async function appendTrackingNote(book, args) {
  const note = String(args?.note ?? '').trim()
  if (note.length < 2) {
    return { status: 'returned', issues: [{ step: 'tracking_note', code: 'note_too_short', message: '备忘至少写两个字', hint: '写作者的决定、要盯的细节或待办。' }] }
  }
  const memo = await ensureMemo(book)
  const date = new Date().toISOString().slice(0, 10)
  const chapter = Number.isInteger(args?.chapter) && args.chapter > 0 ? `（第 ${args.chapter} 章）` : ''
  const line = `- ${date}${chapter} ${note.replace(/\s+/g, ' ')}`
  const next = `${memo.text.replace(/\s*$/, '')}\n${line}\n`
  try {
    const saved = await writeBookFile(book, MEMO_PATH, next, undefined)
    return { status: 'saved', path: MEMO_PATH, note: line, bytes: saved.size }
  } catch (error) {
    return { status: 'stopped', step: 'tracking_note', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
}
