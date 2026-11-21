/**
 * Model-facing novel tools for the `novel` agent preset.
 *
 * Read-only over a `.narracat` book: status, content reading, object/memory
 * lookup, arc and review queries, a writing context pack, and a mechanical
 * prose-hygiene scan. Writes stay in the hand of the author (through the
 * workbench UI) until the submission pipeline lands; no tool here mutates
 * manuscript text.
 *
 * Every tool resolves its book from the calling Session's working directory, so
 * one preset serves any number of book workspaces. The only file write is the
 * derived context pack under `.narracat/context-packs/`.
 */

import { readdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { foldCharacterStates, foldForeshadowing } from './memory-fold.js'
import { memoryBrief, trackingModel, TRACKING_PATHS } from './tracking.js'
import {
  buildSnapshot,
  countWords,
  isBookDir,
  readBookFile,
  resolveBook,
  scanRoot,
  shortRevision,
  visibleText,
  writeBookFile,
} from './project.js'

/** Re-exported for the submission programs that share the visible-text rule. */
export { visibleText }

/** Short stable content revision for one text. */
function revisionOf(text) {
  return shortRevision(text)
}

/** Cut text to a character budget with an explicit marker. */
function cut(text, max) {
  if (typeof text !== 'string') return ''
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…（已截断，原文 ${text.length} 字）`
}

/** First non-empty line of a manuscript. */
function firstLine(text) {
  const line = text.split('\n').map((value) => value.trim()).find((value) => value.length > 0)
  return line ? line.replace(/^#+\s*/, '') : ''
}

/** Last non-empty paragraph of a manuscript. */
function lastParagraph(text) {
  const paragraphs = text.split(/\n\s*\n/).map((value) => value.trim()).filter((value) => value.length > 0)
  return paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : ''
}

/** First paragraph of a manuscript. */
function firstParagraph(text) {
  const paragraphs = text.split(/\n\s*\n/).map((value) => value.trim()).filter((value) => value.length > 0)
  return paragraphs.length > 0 ? paragraphs[0] : ''
}

/**
 * Work out which book a Session is working on.
 * @param {string | undefined} cwd - the Session working directory.
 * @returns {Promise<string>} the real book directory.
 */
export async function resolveBookForCwd(cwd) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new Error('这个会话没有工作目录，无法定位作品；请先打开一个包含 Narracat 作品的工作区。')
  }
  if (await isBookDir(cwd)) return await realpath(cwd)
  const books = await scanRoot(cwd)
  if (books.length === 0) {
    throw new Error(`这个工作区里没有 Narracat 作品（缺少 .narracat/config.yaml）。当前工作区：${cwd}。请把工作区指向作品目录，或把作品放进工作区。`)
  }
  if (books.length > 1) {
    throw new Error(`这个工作区里有 ${books.length} 部作品：${books.map((book) => book.relDir).join('、')}。请让工作区直接指向其中一部，再开始写作。`)
  }
  const resolved = await resolveBook(cwd, books[0].relDir)
  return resolved.book
}

/** Read one manuscript by chapter number through the guard rail. */
async function readChapter(book, chapter) {
  const snapshot = await buildSnapshot(book)
  const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
  if (!row) return { snapshot, row: null, text: null }
  if (!row.path) return { snapshot, row, text: null }
  const file = await readBookFile(book, row.path, { full: true })
  return { snapshot, row, text: visibleText(file.text) }
}

/** List staged drafts (a chapter started but not published). */
async function listStaging(book) {
  try {
    const entries = await readdir(join(book, '.narracat', 'staging'))
    return entries.filter((name) => /^ch-\d+\.(md|request\.md|brief\.md)$/.test(name)).sort()
  } catch {
    return []
  }
}

/** Normalise one premise card's fields into a flat object. */
function premiseFieldMap(cards) {
  const map = {}
  const collection = Array.isArray(cards) ? cards : []
  for (const card of collection) {
    const key = String(card?.card ?? '')
    if (!key) continue
    map[key] = {}
    for (const field of Array.isArray(card?.fields) ? card.fields : []) {
      map[key][String(field?.key ?? '')] = String(field?.value ?? '')
    }
  }
  return map
}

/** Sum word counts from the snapshot's chapter rows. */
function wordRange(snapshot) {
  const target = snapshot.book.wordsPerChapter
  if (typeof target !== 'number' || target <= 0) return null
  return { min: Math.round(target * 0.9), max: Math.round(target * 1.1), target }
}

/**
 * `project_writing_status`: what the book has, what to do next, per aspect.
 * @param {string} book - real book directory.
 * @param {{ aspect?: 'write' | 'outline' | 'settings' | 'status' }} args - aspect.
 * @returns {Promise<object>} status body.
 */
export async function writingStatus(book, args = {}) {
  const aspect = ['write', 'outline', 'settings', 'status'].includes(args.aspect) ? args.aspect : 'write'
  const snapshot = await buildSnapshot(book)
  const staging = await listStaging(book)
  const chapters = snapshot.chapters ?? []
  const written = chapters.filter((row) => row.hasText)
  const outlined = chapters.filter((row) => row.hasOutline)
  const planned = chapters.length
  const lastWritten = written.length > 0 ? written[written.length - 1].chapter : 0
  const totalChapters = snapshot.book.totalChapters
  const outOfOrder = outlined.filter((row) => row.chapter < lastWritten && !row.hasText).map((row) => row.chapter)
  const firstMissingOutline = (() => {
    const known = new Set(outlined.map((row) => row.chapter))
    const limit = Math.max(lastWritten + 5, planned, 1)
    for (let chapter = 1; chapter <= limit; chapter += 1) {
      if (!known.has(chapter)) return chapter
    }
    return null
  })()
  const base = {
    book: {
      title: snapshot.book.title,
      genre: snapshot.book.genre,
      language: snapshot.book.language,
      total_chapters: totalChapters,
      words_per_chapter: snapshot.book.wordsPerChapter,
      path: book,
    },
    progress: {
      written_chapters: written.length,
      outlined_chapters: outlined.length,
      planned_chapters: planned,
      total_words: snapshot.status.totalWords,
      last_written_chapter: lastWritten,
      next_chapter: snapshot.status.nextChapter,
      completion: snapshot.status.completion,
      chapters_out_of_order: outOfOrder,
      first_missing_outline: firstMissingOutline,
    },
    word_range: wordRange(snapshot),
    staging,
    memory: {
      records: snapshot.book.memory?.records ?? 0,
      chapters_without_memory: chapters.filter((row) => row.hasText && !row.hasMemory).map((row) => row.chapter),
    },
    reminders: [],
  }
  if (staging.length > 0) base.reminders.push(`暂存区里有未发布的稿：${staging.join('、')}`)
  if (outOfOrder.length > 0) base.reminders.push(`第 ${outOfOrder.join('、')} 章有章纲但没有正文，顺序比已写章靠前。`)
  if (aspect === 'write') {
    return {
      ...base,
      aspect,
      suggestion: snapshot.status.nextChapter
        ? `下一章是第 ${snapshot.status.nextChapter} 章${outlined.some((row) => row.chapter === snapshot.status.nextChapter) ? '（章纲已在）' : '（章纲还没有，先规划章纲）'}`
        : '还没有章节记录，先规划大纲与第一章章纲。',
    }
  }
  if (aspect === 'outline') {
    return {
      ...base,
      aspect,
      outline: {
        has_book_outline: snapshot.outline !== null,
        storylines: snapshot.outline?.storylines?.length ?? 0,
        volumes: snapshot.volumes?.length ?? 0,
        foreshadowing: snapshot.outline?.foreshadowing?.length ?? 0,
        outlined_ahead_of_written: outlined.filter((row) => row.chapter > lastWritten).map((row) => row.chapter),
        missing_outline_from: firstMissingOutline,
      },
    }
  }
  if (aspect === 'settings') {
    return {
      ...base,
      aspect,
      settings: {
        characters: (snapshot.characters ?? []).map((row) => ({
          name: row.name,
          profile_stage: row.identity?.profileStage ?? 'unknown',
          has_profile: Boolean(row.path),
        })),
        world_settings: (snapshot.settings?.world ?? []).map((row) => row.name),
        premise_cards: (snapshot.premise?.cards ?? []).map((card) => String(card?.card ?? '')),
        relationships: Boolean(snapshot.book.relationships),
      },
    }
  }
  return { ...base, aspect }
}

/**
 * `project_content_read`: read one chapter's visible manuscript text.
 * @param {string} book - real book directory.
 * @param {{ chapter: number, max_chars?: number }} args - chapter and cap.
 * @returns {Promise<object>} content body.
 */
export async function contentRead(book, args) {
  const chapter = args.chapter
  const maxChars = Math.min(Math.max(Number(args.max_chars ?? 12000), 500), 60000)
  const { row, text } = await readChapter(book, chapter)
  if (!row) return { chapter, has_text: false, reason: 'not_found', hint: '这本书里没有这一章（既没有正文也没有章纲）。' }
  if (text === null) {
    return {
      chapter,
      title: row.title,
      has_text: false,
      reason: 'not_written',
      has_outline: row.hasOutline,
      hint: '这一章还没有正文。先看章纲，或让作者确认要写这一章。',
    }
  }
  return {
    chapter,
    title: row.title,
    has_text: true,
    path: row.path,
    words: row.words,
    revision: revisionOf(text),
    review: row.review ? { verdict: row.review.verdict, issues: row.review.issues, blockers: row.review.blockers } : null,
    text: cut(text, maxChars),
    truncated: text.length > maxChars,
  }
}

/**
 * `project_memory_object`: read characters, settings, outline, foreshadowing or
 * one chapter's planned facts, without a memory database.
 * @param {string} book - real book directory.
 * @param {{ kind?: string, names?: string[], chapter?: number }} args - query.
 * @returns {Promise<object>} object body.
 */
export async function memoryObject(book, args = {}) {
  const snapshot = await buildSnapshot(book)
  const names = Array.isArray(args.names) ? args.names.map((name) => String(name).normalize('NFC')) : []
  const kind = args.kind ?? (names.length > 0 ? 'character' : args.chapter ? 'chapter' : 'outline')
  if (kind === 'character') {
    const rows = (snapshot.characters ?? []).filter((row) => names.length === 0 || names.includes(row.name))
    if (rows.length === 0) return { kind, objects: [], hint: names.length > 0 ? `没有找到人物：${names.join('、')}` : '这本书还没有人物档案。' }
    const objects = []
    const foldedStates = foldCharacterStates(snapshot.memoryRecords ?? [], snapshot.status.lastWrittenChapter)
    for (const row of rows) {
      const profile = row.path ? visibleText((await readBookFile(book, row.path, { full: true })).text) : ''
      objects.push({
        name: row.name,
        character_uid: row.identity?.characterUid ?? '',
        profile_stage: row.identity?.profileStage ?? 'full',
        aliases: row.identity?.aliases ?? [],
        gender: row.identity?.gender ?? '',
        age: row.identity?.age ?? '',
        portrait: row.identity?.portrait ?? '',
        initial_states: row.identity?.initialStates ?? [],
        current_state: foldedStates[row.name] ?? {},
        profile_path: row.path,
        profile_text: cut(profile, 4000),
      })
    }
    return { kind, objects }
  }
  if (kind === 'setting') {
    const rows = [...(snapshot.settings?.world ?? []), ...(snapshot.settings?.other ?? [])]
      .filter((row) => names.length === 0 || names.includes(row.name))
    if (rows.length === 0) return { kind, objects: [], hint: '没有找到这些世界设定。' }
    const objects = []
    for (const row of rows) {
      const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
      objects.push({ name: row.name, kind: row.kind ?? 'world', path: row.path, text: cut(text, 4000) })
    }
    return { kind, objects }
  }
  if (kind === 'foreshadowing') {
    const rows = snapshot.outline?.foreshadowing ?? []
    return {
      kind,
      total: rows.length,
      objects: rows.map((item) => ({
        id: item?.id ?? '',
        type: item?.type ?? '',
        description: item?.description ?? '',
        planted_chapter: item?.planted_chapter ?? null,
        target_reveal: item?.target_reveal ?? null,
        theme_link: item?.theme_link ?? '',
      })),
    }
  }
  if (kind === 'chapter') {
    const chapter = Number(args.chapter)
    const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
    if (!row) return { kind, chapter, found: false, hint: '没有这一章。' }
    const outline = snapshot.chapterOutlines?.[String(chapter)]?.data ?? null
    return {
      kind,
      chapter,
      title: row.title,
      has_text: row.hasText,
      has_outline: row.hasOutline,
      words: row.words,
      outline,
      review: row.review ?? null,
    }
  }
  const outline = snapshot.outline
  return {
    kind: 'outline',
    found: outline !== null,
    synopsis: outline?.synopsis ?? '',
    mystery_count: outline?.mysteries?.length ?? 0,
    storylines: outline?.storylines ?? [],
    foreshadowing: outline?.foreshadowing ?? [],
    volumes: snapshot.volumes ?? [],
    hint: outline ? undefined : '这本书还没有全书大纲（.narracat/data/outline/outline-structure.json）。',
  }
}

/**
 * `project_memory_query`: literal search across the book's text.
 * @param {string} book - real book directory.
 * @param {{ query: string, limit?: number }} args - search.
 * @returns {Promise<object>} results body.
 */
export async function memoryQuery(book, args) {
  const query = String(args.query ?? '').trim()
  if (query.length === 0) return { query, results: [], hint: '查询词为空。' }
  const limit = Math.min(Math.max(Number(args.limit ?? 10), 1), 30)
  const snapshot = await buildSnapshot(book)
  const results = []
  const rows = [...(snapshot.chapters ?? [])].sort((left, right) => right.chapter - left.chapter)
  for (const row of rows) {
    if (results.length >= limit) break
    if (!row.path) continue
    const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    const at = text.indexOf(query)
    if (at < 0) continue
    const start = Math.max(0, at - 40)
    results.push({
      source: 'manuscript',
      chapter: row.chapter,
      title: row.title,
      path: row.path,
      excerpt: text.slice(start, Math.min(text.length, at + query.length + 60)),
    })
  }
  if (results.length < limit) {
    for (const row of [...(snapshot.characters ?? []), ...(snapshot.settings?.world ?? [])]) {
      if (results.length >= limit) break
      if (!row.path) continue
      const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
      const at = text.indexOf(query)
      if (at < 0) continue
      results.push({
        source: 'bible',
        name: row.name,
        path: row.path,
        excerpt: text.slice(Math.max(0, at - 40), Math.min(text.length, at + query.length + 60)),
      })
    }
  }
  return { query, total: results.length, results, bounded: results.length >= limit }
}

/**
 * `novel_get_premise_cards`: the book's nine premise cards.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} cards body.
 */
export async function premiseCards(book) {
  const snapshot = await buildSnapshot(book)
  const premise = snapshot.premise
  if (!premise) return { found: false, cards: [], hint: '这本书还没有立项卡（.narracat/data/bible/premise-cards.json）。' }
  return {
    found: true,
    path: premise.path,
    revision: Number.isInteger(premise.raw?.revision) ? premise.raw.revision : 0,
    cards: premise.cards.map((card) => ({
      card: String(card?.card ?? ''),
      fields: (Array.isArray(card?.fields) ? card.fields : []).map((field) => ({
        key: String(field?.key ?? ''),
        value: cut(String(field?.value ?? ''), 1200),
        certainty: String(field?.certainty ?? ''),
        note: String(field?.note ?? ''),
      })),
    })),
  }
}

/**
 * `novel_get_arc`: the arc (and its volume) covering a chapter, or one arc.
 * @param {string} book - real book directory.
 * @param {{ chapter?: number, arc_id?: string }} args - query.
 * @returns {Promise<object>} arc body.
 */
export async function getArc(book, args = {}) {
  const snapshot = await buildSnapshot(book)
  const volumes = snapshot.volumes ?? []
  const arcId = typeof args.arc_id === 'string' ? args.arc_id : ''
  const chapter = Number.isInteger(args.chapter) ? args.chapter : null
  for (const volume of volumes) {
    const arc = (volume.arcs ?? []).find((item) => (arcId ? item.arcId === arcId : chapter !== null
      && typeof item.chapterStart === 'number' && typeof item.chapterEnd === 'number'
      && chapter >= item.chapterStart && chapter <= item.chapterEnd))
    if (arc) return { found: true, volume: { volume_no: volume.volumeNo, title: volume.title, synopsis: volume.synopsis }, arc }
  }
  if (chapter !== null) {
    const volume = volumes.find((item) => typeof item.chapterStart === 'number' && typeof item.chapterEnd === 'number'
      && chapter >= item.chapterStart && chapter <= item.chapterEnd)
    if (volume) return { found: false, chapter, volume: { volume_no: volume.volumeNo, title: volume.title }, arc: null, hint: '这一章所在卷没有登记段（arc）信息。' }
  }
  return { found: false, arc: null, hint: volumes.length === 0 ? '这本书还没有全书大纲，因此没有卷与段。' : '没有找到对应的段。' }
}

/**
 * `novel_failed_reviews`: chapters whose review did not pass.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} review body.
 */
export async function failedReviews(book) {
  const snapshot = await buildSnapshot(book)
  const failed = (snapshot.reviews ?? []).filter((review) => review.verdict === 'fail')
  return {
    failed_chapters: failed.map((review) => review.chapter),
    total: failed.length,
    reviews: failed,
    hint: snapshot.reviews.length === 0 ? '这本书还没有审校报告。' : undefined,
  }
}

/**
 * Mechanical prose scan over one text (shared by the tool and the submitter).
 * @param {string} text - visible manuscript text.
 * @returns {{paragraphs: number, sentences: number, clues: object[]}} scan body.
 */
export function scanProse(text) {
  const paragraphs = text.split(/\n\s*\n/).map((value) => value.trim()).filter((value) => value.length > 0)
  const sentences = text.split(/[。！？!?…]+/).map((value) => value.trim()).filter((value) => value.length > 0)
  const closingSet = new Map()
  for (const sentence of sentences) {
    const ending = sentence.slice(-2)
    closingSet.set(ending, (closingSet.get(ending) ?? 0) + 1)
  }
  const topClosing = [...closingSet.entries()].sort((left, right) => right[1] - left[1])[0]
  const openingWords = new Map()
  for (const paragraph of paragraphs) {
    const head = paragraph.slice(0, 2)
    if (head.length === 2) openingWords.set(head, (openingWords.get(head) ?? 0) + 1)
  }
  const repeatedOpenings = [...openingWords.entries()].filter(([, count]) => count >= 3).slice(0, 5)
  const patterns = [
    '不由得', '仿佛', '一丝', '微微', '嘴角', '眼中闪过', '心中一紧', '空气仿佛凝固',
    '缓缓', '顿时', '竟然', '顿时觉得',
  ]
  const clues = []
  for (const label of patterns) {
    const count = text.split(label).length - 1
    if (count > 0) clues.push({ id: 'phrase', label, count })
  }
  if (topClosing && topClosing[1] >= Math.max(8, Math.round(sentences.length * 0.3))) {
    clues.push({ id: 'punctuation', label: `句末标点集中在「${topClosing[0]}」`, count: topClosing[1], of: sentences.length })
  }
  if (repeatedOpenings.length > 0) {
    clues.push({ id: 'paragraph-opening', label: '连续段落开头重复', count: repeatedOpenings.length, examples: repeatedOpenings.map(([word, count]) => `${word}×${count}`) })
  }
  const exclamations = (text.match(/[！!]/g) ?? []).length
  if (exclamations > 3) clues.push({ id: 'exclamation', label: '感叹号偏多', count: exclamations })
  return { paragraphs: paragraphs.length, sentences: sentences.length, clues }
}

/**
 * `novel_check_prose_hygiene`: mechanical prose scan (clues, not a verdict).
 * @param {string} book - real book directory.
 * @param {{ chapter: number }} args - chapter.
 * @returns {Promise<object>} scan body.
 */
export async function proseHygiene(book, args) {
  const chapter = args.chapter
  const { row, text } = await readChapter(book, chapter)
  if (!row || text === null) {
    return { chapter, has_text: false, errors: [{ code: 'no_text', message: '这一章还没有正文，无法扫描。' }], clues: [] }
  }
  const scan = scanProse(text)
  return {
    chapter,
    title: row.title,
    has_text: true,
    words: row.words,
    paragraphs: scan.paragraphs,
    sentences: scan.sentences,
    errors: [],
    clues: scan.clues,
    note: scan.clues.length === 0 ? '机械扫描没有命中；这不代表用笔与故事没有问题。' : '这些只是线索，按功能判断，不要求归零。',
  }
}

/**
 * `project_memory_status`: coverage and freshness of the chapter memory ledger.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} status body.
 */
export async function memoryStatus(book) {
  const snapshot = await buildSnapshot(book)
  const records = snapshot.memoryRecords ?? []
  const status = snapshot.status?.memory ?? { recorded: records.length, missing: [], stale: [] }
  return {
    recorded_chapters: records.map((record) => record.chapter),
    stale_chapters: records.filter((record) => record.fresh === false).map((record) => record.chapter),
    missing_written_chapters: status.missing ?? [],
    total_records: records.length,
    last_written_chapter: snapshot.status.lastWrittenChapter,
    status: (status.stale?.length ?? 0) === 0 && (status.missing?.length ?? 0) === 0 ? 'current' : 'needs_review',
    hint: records.length === 0 ? '这本书还没有章节记忆；写章提交时会自动记。' : undefined,
  }
}

/** Highest chapter that contributed to one folded state. */
function lastStateChapter(state) {
  let last = null
  for (const value of Object.values(state ?? {})) {
    if (typeof value?.chapter === 'number' && (last === null || value.chapter > last)) last = value.chapter
  }
  return last
}

/**
 * `novel_character_statuses`: folded character state up to one chapter.
 * @param {string} book - real book directory.
 * @param {{ names?: string[], at_chapter?: number }} args - query.
 * @returns {Promise<object>} statuses body.
 */
export async function characterStatuses(book, args = {}) {
  const snapshot = await buildSnapshot(book)
  const at = Number.isInteger(args.at_chapter) ? args.at_chapter : snapshot.status.lastWrittenChapter
  const folded = foldCharacterStates(snapshot.memoryRecords ?? [], at)
  const known = new Map((snapshot.characters ?? []).map((row) => [row.name, row]))
  const names = Array.isArray(args.names) && args.names.length > 0
    ? args.names.map(String)
    : [...new Set([...known.keys(), ...Object.keys(folded)])]
  return {
    at_chapter: at,
    characters: names.map((name) => ({
      name,
      identity: known.get(name)?.identity ?? null,
      state: folded[name] ?? {},
      last_state_chapter: lastStateChapter(folded[name]),
    })),
    hint: names.length === 0 ? '这本书还没有人物，也没有章节记忆。' : undefined,
  }
}

/**
 * `novel_chapter_summary`: recorded chapter summaries.
 * @param {string} book - real book directory.
 * @param {{ chapter?: number, from?: number, to?: number }} args - range.
 * @returns {Promise<object>} summaries body.
 */
export async function chapterSummary(book, args = {}) {
  const snapshot = await buildSnapshot(book)
  let rows = [...(snapshot.memoryRecords ?? [])].sort((left, right) => left.chapter - right.chapter)
  if (Number.isInteger(args.chapter)) rows = rows.filter((row) => row.chapter === args.chapter)
  else if (Number.isInteger(args.from) || Number.isInteger(args.to)) {
    rows = rows.filter((row) => (args.from === undefined || row.chapter >= args.from) && (args.to === undefined || row.chapter <= args.to))
  }
  return {
    summaries: rows.map((row) => ({
      chapter: row.chapter,
      summary: row.summary,
      word_count: row.word_count,
      source_revision: row.source_revision,
      fresh: row.fresh,
      path: row.path,
    })),
    hint: rows.length === 0 ? '没有找到章节记忆；写章提交时会自动记。' : undefined,
  }
}

/**
 * `novel_foreshadowing_status`: registry threads joined with their latest action.
 * @param {string} book - real book directory.
 * @param {{ at_chapter?: number }} args - query.
 * @returns {Promise<object>} foreshadowing body.
 */
export async function foreshadowingStatus(book, args = {}) {
  const snapshot = await buildSnapshot(book)
  const at = Number.isInteger(args.at_chapter) ? args.at_chapter : snapshot.status.lastWrittenChapter
  const folded = foldForeshadowing(snapshot.memoryRecords ?? [], at)
  const registry = snapshot.outline?.foreshadowing ?? []
  return {
    at_chapter: at,
    threads: registry.map((item) => ({
      id: item?.id ?? '',
      description: item?.description ?? '',
      planted_chapter: item?.planted_chapter ?? null,
      target_reveal: item?.target_reveal ?? null,
      last_action: folded[item?.id]?.last_action ?? null,
      last_chapter: folded[item?.id]?.chapter ?? null,
      actions: folded[item?.id]?.actions ?? [],
    })),
    unregistered: Object.keys(folded).filter((id) => !registry.some((item) => item?.id === id)),
    hint: registry.length === 0 ? '全书大纲里还没有登记伏笔。' : undefined,
  }
}

/**
 * `novel_memory_record`: rewrite one chapter's memory entry without republishing.
 * Used after a manual manuscript edit (reconcile) — the agent supplies what the
 * chapter now says.
 * @param {string} book - real book directory.
 * @param {{ chapter: number, memory: object }} args - chapter and memory payload.
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function memoryRecord(book, args) {
  const memory = args.memory
  const chapter = args.chapter
  const issues = []
  if (!memory || typeof memory !== 'object') {
    issues.push({ step: 'memory', code: 'memory_missing', message: '要更新本章记忆', hint: 'memory 写 {summary, events?, state_changes?, foreshadowing?}。' })
  } else {
    if (typeof memory.summary !== 'string' || memory.summary.trim().length < 12) {
      issues.push({ step: 'memory', code: 'summary_too_short', message: '本章摘要太短', hint: '写这一章真正发生了什么、人物处境变成了什么样。' })
    }
    if (memory.state_changes !== undefined && (!Array.isArray(memory.state_changes) || memory.state_changes.some((change) => typeof change?.character !== 'string' || typeof change?.dimension !== 'string' || !['set', 'add', 'remove'].includes(change?.operation) || change?.value === undefined))) {
      issues.push({ step: 'memory', code: 'state_change_invalid', message: '状态变化格式不对', hint: '每项写 {character, dimension, operation: set|add|remove, value}。' })
    }
    if (memory.foreshadowing !== undefined && (!Array.isArray(memory.foreshadowing) || memory.foreshadowing.some((action) => typeof action?.id !== 'string' || !['plant', 'develop', 'reveal'].includes(action?.action)))) {
      issues.push({ step: 'memory', code: 'foreshadowing_invalid', message: '伏笔动作格式不对', hint: '每项写 {id, action: plant|develop|reveal}。' })
    }
  }
  if (issues.length > 0) return { status: 'returned', issues }
  const snapshot = await buildSnapshot(book)
  const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
  if (!row?.path) return { status: 'stopped', step: 'memory', code: 'no_text', reason: `第 ${chapter} 章还没有正文，不能写记忆。` }
  const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
  const existing = (snapshot.memoryRecords ?? []).find((record) => record.chapter === chapter)
  const record = {
    chapter,
    title: row.title,
    source_revision: shortRevision(text),
    word_count: countWords(text),
    summary: String(memory.summary).trim(),
    events: Array.isArray(memory.events) ? memory.events : [],
    state_changes: Array.isArray(memory.state_changes) ? memory.state_changes : [],
    foreshadowing: Array.isArray(memory.foreshadowing) ? memory.foreshadowing : [],
    review: existing?.review ?? null,
    published_at: existing?.published_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    path: row.path,
  }
  const rel = `.narracat/memory/ch-${String(chapter).padStart(3, '0')}.json`
  try {
    await writeBookFile(book, rel, JSON.stringify(record, null, 2), undefined, { internal: true })
  } catch (error) {
    return { status: 'stopped', step: 'memory', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return { status: 'saved', chapter, path: rel, source_revision: record.source_revision, fresh: true }
}

/**
 * `project_memory_reconcile`: list chapters whose memory no longer matches the
 * manuscript, with the per-chapter re-record instructions.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} reconcile body.
 */
export async function memoryReconcile(book) {
  const snapshot = await buildSnapshot(book)
  const records = snapshot.memoryRecords ?? []
  const stale = records.filter((record) => record.fresh === false).map((record) => record.chapter)
  const missing = snapshot.status?.memory?.missing ?? []
  const clean = stale.length === 0 && missing.length === 0
  return {
    status: clean ? 'current' : 'needs_review',
    stale_chapters: stale,
    missing_chapters: missing,
    guidance: clean
      ? '记忆与正文一致，不需要核对。'
      : `需要核对的章：${[...new Set([...stale, ...missing])].sort((left, right) => left - right).join('、')}。逐章读正文（project_content_read），再用 novel_memory_record 更新那一章的记忆；不要整本重建，也不要改别的章。`,
  }
}

const PREMISE_FOR_PACK = ['genre_contract', 'core_hook', 'golden_finger', 'protagonist_desire', 'antagonistic_force', 'world_rules', 'narrator_voice']

/**
 * `novel_build_writing_context_pack`: assemble this chapter's writing context.
 * @param {string} book - real book directory.
 * @param {{ chapter: number, max_chars?: number }} args - chapter.
 * @returns {Promise<object>} pack summary and paths.
 */
export async function buildContextPack(book, args) {
  const chapter = args.chapter
  const snapshot = await buildSnapshot(book)
  const tracking = trackingModel(snapshot)
  const outlineEntry = snapshot.chapterOutlines?.[String(chapter)]
  if (!outlineEntry) {
    return {
      ok: false,
      chapter,
      error_code: 'OUTLINE_MISSING',
      hint: `第 ${chapter} 章还没有章纲（.narracat/data/outline/vol-NN/ch-${String(chapter).padStart(3, '0')}.json）。先规划章纲，再组装写作上下文。`,
    }
  }
  const outline = outlineEntry.data ?? {}
  const warnings = []
  const castNames = (Array.isArray(outline.characters) ? outline.characters : []).map((item) => String(item?.name ?? '')).filter(Boolean)
  const cards = []
  const withoutCards = []
  const foldedStates = foldCharacterStates(snapshot.memoryRecords ?? [], chapter - 1)
  const memoryByChapter = new Map((snapshot.memoryRecords ?? []).map((record) => [record.chapter, record]))
  for (const name of castNames) {
    const row = (snapshot.characters ?? []).find((item) => item.name === name)
    if (!row) {
      withoutCards.push({ name, reason: '没有人物档案' })
      continue
    }
    cards.push({
      name: row.name,
      character_uid: row.identity?.characterUid ?? '',
      profile_stage: row.identity?.profileStage ?? 'full',
      portrait: row.identity?.portrait ?? '',
      initial_states: row.identity?.initialStates ?? [],
      current_state: foldedStates[row.name] ?? {},
      profile_path: row.path,
    })
    if (!row.identity?.portrait) withoutCards.push({ name, reason: '档案里没有人物速写（portrait）' })
  }
  if (withoutCards.length > 0) warnings.push(`有 ${withoutCards.length} 个出场人物缺少状态卡或速写，写之前先补查，不要自行补造。`)
  const previous = []
  for (const row of [...(snapshot.chapters ?? [])].filter((item) => item.chapter < chapter && item.hasText).slice(-10)) {
    const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    const record = memoryByChapter.get(row.chapter)
    previous.push({
      chapter: row.chapter,
      title: row.title,
      words: row.words,
      summary: record?.summary ? cut(record.summary, 400) : null,
      memory_fresh: record ? record.fresh : null,
      opening: cut(firstParagraph(text), 120),
      ending: cut(lastParagraph(text), 220),
    })
  }
  if (previous.length === 0) warnings.push('这是第一章之外的第一次写作吗？前文没有可用的正文。')
  const stalePrevious = previous.filter((row) => row.memory_fresh === false).map((row) => row.chapter)
  if (stalePrevious.length > 0) warnings.push(`第 ${stalePrevious.join('、')} 章的正文在记忆之后改过：先核对这几章的记忆，再拿旧摘要当前情。`)
  const overdue = tracking.foreshadowing.filter((item) => item.status === '逾期' || item.status === '缺动作')
  if (overdue.length > 0) warnings.push(`有 ${overdue.length} 条伏笔的状态需要看一眼：${overdue.slice(0, 5).map((item) => item.id).join('、')}。`)
  const premiseMap = premiseFieldMap(snapshot.premise?.cards)
  const premise = {}
  for (const key of PREMISE_FOR_PACK) {
    if (premiseMap[key]) premise[key] = premiseMap[key]
  }
  const outlineText = JSON.stringify(outline)
  const namedSettings = []
  const catalog = [...(snapshot.settings?.world ?? []), ...(snapshot.settings?.other ?? [])]
  for (const row of catalog) {
    if (!outlineText.includes(row.name)) continue
    const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    namedSettings.push({ name: row.name, path: row.path, text: cut(text, 600) })
  }
  const due = (snapshot.outline?.foreshadowing ?? []).filter((item) => {
    const planted = item?.planted_chapter === null || item?.planted_chapter === undefined || item?.planted_chapter === ''
      ? null
      : Number(item.planted_chapter)
    const target = item?.target_reveal === null || item?.target_reveal === undefined || item?.target_reveal === ''
      ? null
      : Number(item.target_reveal)
    if (planted === null || !Number.isFinite(planted)) return false
    if (planted >= chapter) return false
    return target === null || (Number.isFinite(target) && target >= chapter)
  })
  const focusIds = Array.isArray(outline.storyline_focus) ? outline.storyline_focus.map(String) : []
  const storylineFocus = focusIds.map((id) => {
    const line = (snapshot.outline?.storylines ?? []).find((item) => String(item?.id) === id)
    return { id, name: line?.name ?? '' }
  })
  const range = wordRange(snapshot)
  const existingRow = (snapshot.chapters ?? []).find((row) => row.chapter === chapter)
  const hasText = Boolean(existingRow?.hasText)
  const revisionPath = `.narracat/revisions/ch-${String(chapter).padStart(3, '0')}.md`
  // A published chapter cannot be written straight into `manuscript/`: the file
  // guard and the submitter both refuse it. Point the writer at a rewrite draft
  // instead, and say so, rather than handing back a path it may not touch.
  const draftPath = hasText
    ? null
    : `.narracat/staging/ch-${String(chapter).padStart(3, '0')}.md`
  if (hasText) warnings.push(`第 ${chapter} 章已经有正式正文。要改写它，先开改写稿（project_revision_draft_open），把新稿写到 ${revisionPath}，再用 project_chapter_submit 交；不要直接改正文。`)
  const pack = {
    version: 1,
    generated_by: 'dsh-novel-workbench',
    target_chapter: chapter,
    book: { title: snapshot.book.title, genre: snapshot.book.genre, language: snapshot.book.language },
    word_count_range: range,
    style_directive: {
      narrator_voice: premise.narrator_voice ?? {},
      style_profile: snapshot.book.styleProfile ?? null,
    },
    chapter_outline: outline,
    draft_path: draftPath,
    rewrite_required: hasText,
    revision_path: hasText ? revisionPath : null,
    premise_cards: premise,
    setting_catalog: catalog.map((row) => ({ name: row.name, kind: row.kind ?? 'world' })),
    named_settings: namedSettings,
    previous_chapter_briefs: previous,
    recent_chapter_summaries: tracking.summaries.filter((row) => row.chapter < chapter).slice(-10),
    character_cards: cards,
    characters_without_cards: withoutCards,
    all_character_states: tracking.characters.filter((person) => person.current.length > 0),
    foreshadowing_due: due,
    foreshadowing_open: tracking.openForeshadowing.slice(0, 50),
    foreshadowing_open_total: tracking.openForeshadowing.length,
    storyline_focus: storylineFocus,
    progress: tracking.progress,
    author_notes: snapshot.book?.memo ?? '',
    tracking_files: TRACKING_PATHS,
    warnings,
  }
  const chapterOutlinePath = outlineEntry.path
  const packPath = `.narracat/context-packs/ch-${String(chapter).padStart(3, '0')}.json`
  try {
    await writeBookFile(book, packPath, JSON.stringify(pack, null, 2), undefined)
  } catch (error) {
    warnings.push(`上下文包没能写入 ${packPath}：${error instanceof Error ? error.message : String(error)}`)
  }
  const maxChars = Math.min(Math.max(Number(args.max_chars ?? 8000), 1000), 24000)
  return {
    ok: true,
    chapter,
    pack_path: packPath,
    manuscript_path: draftPath,
    draft_path: draftPath,
    rewrite_required: hasText,
    revision_path: hasText ? revisionPath : null,
    outline_path: chapterOutlinePath,
    word_count_range: range,
    chapter_outline: outline,
    character_cards: cards,
    characters_without_cards: withoutCards,
    previous_chapter_briefs: previous,
    recent_chapter_summaries: tracking.summaries.filter((row) => row.chapter < chapter).slice(-10),
    all_character_states: tracking.characters.filter((person) => person.current.length > 0),
    foreshadowing_due: due,
    foreshadowing_open: tracking.openForeshadowing.slice(0, 50),
    foreshadowing_open_total: tracking.openForeshadowing.length,
    progress: tracking.progress,
    author_notes: snapshot.book?.memo ?? '',
    storyline_focus: storylineFocus,
    premise_cards: premise,
    named_settings: namedSettings,
    warnings,
    tracking_files: TRACKING_PATHS,
    rendered: cut(JSON.stringify({ chapter_outline: outline, character_cards: cards, previous_chapter_briefs: previous, all_character_states: tracking.characters.filter((person) => person.current.length > 0), foreshadowing_open: tracking.openForeshadowing }, null, 2), maxChars),
  }
}

/**
 * `novel_memory_brief`: what a careful writer reads before drafting — progress,
 * the last ten chapter summaries, current character states, open foreshadowing
 * and the author's memo.
 * @param {string} book - real book directory.
 * @param {{ chapter: number, recent_chapters?: number }} args - target chapter.
 * @returns {Promise<object>} brief.
 */
export async function memoryBriefForChapter(book, args) {
  const chapter = args.chapter
  const snapshot = await buildSnapshot(book)
  const model = trackingModel(snapshot)
  const brief = memoryBrief(model, chapter, { recent: args.recent_chapters })
  return {
    ok: true,
    book: { title: snapshot.book.title, genre: snapshot.book.genre },
    ...brief,
    tracking_files: TRACKING_PATHS,
  }
}
