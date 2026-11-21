/**
 * Submission programs for the novel preset.
 *
 * These are the "guarantees" of the distilled Narracat pipeline: the agent
 * writes a draft and submits it; the host performs the mechanical checks,
 * records the chapter's memory entry, publishes the manuscript, and answers
 * with one of three states (returned / stopped / saved). Nothing here trusts
 * the model's word that a chapter is written.
 *
 * A review report is optional in this version: `novel_submit_review` records
 * one and computes the verdict, and a submitter can require it per book
 * (`review_required` in config.yaml) — the default is off, matching the
 * "review optional first" plan.
 */

import { createHash } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import { isAbsolute, posix, resolve, sep } from 'node:path'
import { buildSnapshot, countWords, readBookFile, removeBookFile, writeBookFile } from './project.js'
import { scanProse, visibleText } from './novel-tools.js'
import { refreshTracking } from './tracking-store.js'

/** Submissions per chapter before the author has to decide. */
export const MAX_ATTEMPTS = 3

/** Zero-pad helper. */
const pad = (value, width) => String(value).padStart(width, '0')

/** Full hex sha256 of one text. */
const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

/** Short revision label. */
const shortRevision = (text) => sha(text).slice(0, 16)

/** Staging draft path for one chapter. */
export const stagingPath = (chapter) => `.narracat/staging/ch-${pad(chapter, 3)}.md`

/**
 * Normalize a book-relative draft path and refuse traversal. The staging
 * prefix check alone is not enough: `.narracat/staging/../../manuscript/...`
 * starts with the prefix but resolves to a published chapter.
 * @param {string} value - path from the tool or a default.
 * @returns {string | null} normalized POSIX path, or null when it escapes.
 */
function normalizeDraftPath(value) {
  const text = String(value ?? '').replace(/\\/g, '/').trim()
  if (!text || text.startsWith('/') || /^[A-Za-z]:/.test(text)) return null
  const normalized = posix.normalize(text)
  if (normalized === '..' || normalized.startsWith('../')) return null
  return normalized
}

/** Memory record path for one chapter. */
export const memoryPath = (chapter) => `.narracat/memory/ch-${pad(chapter, 3)}.json`

/** Submission journal path for one chapter. */
export const journalPath = (chapter) => `.narracat/submissions/ch-${pad(chapter, 3)}.json`

/** Read a JSON file or null when absent/unreadable. */
async function readJson(book, rel) {
  try {
    return JSON.parse((await readBookFile(book, rel)).text)
  } catch {
    return null
  }
}

/** Write one JSON file through the guard rail. */
async function writeJson(book, rel, value) {
  return await writeBookFile(book, rel, JSON.stringify(value, null, 2), undefined, { internal: true })
}

/** Whether a chapter already has a stored memory record. */
async function memoryChapters(book) {
  try {
    const entries = await readdir(`${book}/.narracat/memory`)
    return new Set(entries.filter((name) => /^ch-\d+\.json$/.test(name)).map((name) => Number.parseInt(name.replace(/\D/g, ''), 10)))
  } catch {
    return new Set()
  }
}

/** Derive the volume a chapter belongs to from the book outline. */
function volumeOfChapter(outline, chapter) {
  if (!outline) return null
  for (const volume of Array.isArray(outline.volumes) ? outline.volumes : []) {
    for (const arc of Array.isArray(volume?.arc_list) ? volume.arc_list : []) {
      if (Number.isInteger(arc?.chapter_start) && Number.isInteger(arc?.chapter_end) && chapter >= arc.chapter_start && chapter <= arc.chapter_end) {
        return { volume: Number.isInteger(volume?.volume_no) ? volume.volume_no : null, arc: arc?.arc_id ?? null }
      }
    }
  }
  for (const plan of Array.isArray(outline.volume_plan) ? outline.volume_plan : []) {
    if (Number.isInteger(plan?.chapter_start) && Number.isInteger(plan?.chapter_end) && chapter >= plan.chapter_start && chapter <= plan.chapter_end) {
      return { volume: Number.isInteger(plan?.volume_no) ? plan.volume_no : null, arc: null }
    }
  }
  return null
}

/** Validate the chapter memory payload and return field-level issues. */
function validateMemory(memory) {
  const issues = []
  if (!memory || typeof memory !== 'object') {
    issues.push({
      step: 'memory',
      code: 'memory_missing',
      message: '提交必须带本章记忆：summary、events 与状态/伏笔变化',
      hint: '参数 memory.summary 写这一章真正发生了什么（不是写法评价），memory.events 按顺序列事件，state_changes 写人物状态的变化，foreshadowing 写伏笔动作。',
    })
    return issues
  }
  const summary = typeof memory.summary === 'string' ? memory.summary.trim() : ''
  if (summary.length < 12) {
    issues.push({
      step: 'memory',
      code: 'summary_too_short',
      field: 'memory.summary',
      message: '本章摘要太短，读者（与后续章节）靠它理解前情',
      hint: '用一两句话说清这一章发生了什么事、人物处境变成了什么样。',
    })
  }
  if (memory.events === undefined) {
    issues.push({ step: 'memory', code: 'events_missing', field: 'memory.events', message: '记忆要列出这一章发生的事', hint: 'events 每项写 {description}，按章节内顺序排列；至少一条。' })
  } else if (!Array.isArray(memory.events)) {
    issues.push({ step: 'memory', code: 'events_not_array', field: 'memory.events', message: 'events 必须是数组', hint: '每一项写 {description}，按章节内顺序排列。' })
  } else if (memory.events.length === 0) {
    issues.push({ step: 'memory', code: 'events_empty', field: 'memory.events', message: '这一章至少要记一件事', hint: 'events 写这一章按顺序发生的 2–5 件事，不要留空。' })
  } else if (memory.events.some((event) => typeof event?.description !== 'string' || event.description.trim().length === 0)) {
    issues.push({ step: 'memory', code: 'event_invalid', field: 'memory.events', message: '每个事件都要有 description', hint: 'description 写这一拍发生了什么，不要写评价。' })
  }
  if (memory.state_changes !== undefined) {
    if (!Array.isArray(memory.state_changes)) {
      issues.push({ step: 'memory', code: 'state_changes_not_array', field: 'memory.state_changes', message: 'state_changes 必须是数组', hint: '每项写 {character, dimension, operation: set|add|remove, value}。' })
    } else {
      for (const [index, change] of memory.state_changes.entries()) {
        if (typeof change?.character !== 'string' || typeof change?.dimension !== 'string'
          || !['set', 'add', 'remove'].includes(change?.operation) || change?.value === undefined) {
          issues.push({
            step: 'memory',
            code: 'state_change_invalid',
            field: `memory.state_changes[${index}]`,
            message: '状态变化格式不对',
            hint: '每项必须写 {character, dimension, operation: set|add|remove, value}；没有变化就不传。',
          })
        }
      }
    }
  }
  if (memory.foreshadowing !== undefined) {
    if (!Array.isArray(memory.foreshadowing)) {
      issues.push({ step: 'memory', code: 'foreshadowing_not_array', field: 'memory.foreshadowing', message: 'foreshadowing 必须是数组', hint: '每项写 {id, action: plant|develop|reveal}，没有就不传。' })
    } else {
      for (const [index, action] of memory.foreshadowing.entries()) {
        if (typeof action?.id !== 'string' || !['plant', 'develop', 'reveal'].includes(action?.action)) {
          issues.push({ step: 'memory', code: 'foreshadowing_invalid', field: `memory.foreshadowing[${index}]`, message: '伏笔动作格式不对', hint: '{id, action: plant|develop|reveal}；id 用全书大纲里的伏笔编号。' })
        }
      }
    }
  }
  return issues
}

/** Word range from the book config or an author requirement. */
function resolveWordRange(snapshot, requirement) {
  const target = snapshot.book.wordsPerChapter
  if (requirement && typeof requirement === 'object') {
    const min = Number(requirement.min)
    const max = Number(requirement.max)
    const hasMin = Number.isFinite(min) && min > 0
    const hasMax = Number.isFinite(max) && max > 0
    if (!hasMin && !hasMax) {
      return { error: '字数要求要写 min 或 max（或两者），数量要大于 0。' }
    }
    const low = hasMin ? Math.round(min) : Math.max(1, Math.round((hasMax ? max : target) * 0.85))
    const high = hasMax
      ? Math.round(max)
      : Math.max(low, Math.round(Math.max(low * 1.15, (typeof target === 'number' && target > 0 ? target : low) * 1.1)))
    if (high < low) return { error: `字数要求的下限 ${low} 高于上限 ${high}。` }
    return { min: low, max: high, basis: 'author', author_quote: typeof requirement.author_quote === 'string' ? requirement.author_quote : '' }
  }
  if (typeof target !== 'number' || target <= 0) return null
  return { min: Math.round(target * 0.9), max: Math.round(target * 1.1), basis: 'config' }
}

/**
 * Publish one chapter: mechanical checks, memory record, manuscript write.
 * @param {string} book - real book directory.
 * @param {object} args - {chapter, memory, word_requirement?, path?, author_approved_retry?, author_quote?}
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function chapterSubmit(book, args) {
  const chapter = args.chapter
  if (!Number.isInteger(chapter) || chapter < 1) {
    return {
      status: 'returned',
      issues: [{ step: 'check', code: 'chapter_invalid', message: '章节号必须是 ≥1 的整数', hint: 'chapter 写要提交第几章。' }],
    }
  }
  const snapshot = await buildSnapshot(book)
  const requestedDraft = typeof args.path === 'string' && args.path.length > 0 ? args.path : stagingPath(chapter)
  const draftRel = normalizeDraftPath(requestedDraft)
  if (!draftRel || (!draftRel.startsWith('.narracat/staging/') && !draftRel.startsWith('.narracat/revisions/'))) {
    return {
      status: 'stopped',
      step: 'check',
      code: 'draft_outside_staging',
      reason: `草稿必须写在暂存区（${stagingPath(chapter)}），不能直接提交正式正文路径。`,
      draft_path: stagingPath(chapter),
    }
  }
  // A draft belongs to exactly one chapter; refuse a path whose file name says
  // otherwise so chapter 1 cannot publish chapter 2's draft (and vice versa).
  const draftChapter = /(?:^|\/)ch-(\d+)\.md$/i.exec(draftRel)?.[1]
  if (!draftChapter || Number.parseInt(draftChapter, 10) !== chapter) {
    return {
      status: 'stopped',
      step: 'check',
      code: 'draft_chapter_mismatch',
      reason: `草稿路径（${draftRel}）与要提交的第 ${chapter} 章对不上。`,
      draft_path: stagingPath(chapter),
    }
  }
  let draft
  try {
    draft = await readBookFile(book, draftRel, { full: true })
  } catch (error) {
    if (error && error.code === 'too-large') {
      return {
        status: 'stopped',
        step: 'check',
        code: 'draft_too_large',
        reason: `草稿超过提交上限，不能保存：${error.message}`,
        draft_path: draftRel,
      }
    }
    return {
      status: 'stopped',
      step: 'check',
      code: 'no_draft',
      reason: `没有找到这一章的草稿（${draftRel}）。先把正文写到上下文包给的路径，再提交。`,
      draft_path: draftRel,
    }
  }
  const journal = (await readJson(book, journalPath(chapter))) ?? { chapter, attempts: 0, last_result: null, submitted_at: null }
  // A successful save ends that draft's budget. Rewriting the published chapter
  // starts a new round; otherwise the third-ever rewrite would be blocked by
  // attempts that belonged to earlier drafts.
  const previousAttempts = journal.last_result === 'saved' ? 0 : (Number.isInteger(journal.attempts) ? journal.attempts : 0)
  const approvedRetry = args.author_approved_retry === true
  if (previousAttempts >= MAX_ATTEMPTS && !approvedRetry) {
    return {
      status: 'stopped',
      step: 'check',
      code: 'attempts_exhausted',
      reason: `这一章已经提交过 ${previousAttempts} 次。不要自己重试：先用问答卡问作者，是再改一次还是先停下。`,
      attempts: previousAttempts,
      attempts_left: 0,
      hint: '作者同意再试后，带 author_approved_retry: true 与 author_quote（作者原话）再提交。',
    }
  }
  if (approvedRetry && (typeof args.author_quote !== 'string' || args.author_quote.trim().length < 2)) {
    return {
      status: 'stopped',
      step: 'check',
      code: 'author_quote_required',
      reason: '作者同意再试时，要带上作者原话作为凭据。',
      hint: 'author_quote 填作者同意继续的原话（逐字，不改写）。',
      attempts: previousAttempts,
    }
  }
  const text = visibleText(draft.text)
  const words = countWords(text)
  const isRevision = draftRel.startsWith('.narracat/revisions/')
  let range
  /** @type {Array<{step: string, code: string, message: string, hint?: string}>} */
  const issues = []
  if (args.word_requirement) {
    range = resolveWordRange(snapshot, args.word_requirement)
    if (range?.error) {
      issues.push({ step: 'check', code: 'word_requirement_invalid', message: range.error, hint: '让作者给出下限和上限（或只说“至少 N 字”也可以），再按范围核对。' })
      range = null
    }
  } else if (isRevision) {
    // A rewrite without an author requirement is measured against the chapter
    // it replaces, not the book's per-chapter target.
    const original = (snapshot.chapters ?? []).find((row) => row.chapter === chapter)
    const originalWords = original?.words ?? 0
    range = originalWords > 0 ? { min: Math.round(originalWords * 0.8), max: Math.round(originalWords * 1.2), basis: 'original' } : null
  } else {
    range = resolveWordRange(snapshot, undefined)
  }
  /** @type {string[]} */
  const reminders = []
  if (!text) {
    issues.push({ step: 'check', code: 'empty_body', message: '草稿是空的', hint: `把正文写到 ${draftRel}，第一行可以是章标题。` })
  }
  if (range && text) {
    if (words < range.min) {
      issues.push({
        step: 'check',
        code: 'word_below',
        message: `正文 ${words} 字，低于下限 ${range.min} 字`,
        hint: `按上下文包把缺的戏补足到 ${range.min}–${range.max} 字之间，不贴下限硬凑。`,
      })
    } else if (words > range.max * 1.05) {
      issues.push({
        step: 'check',
        code: 'word_above',
        message: `正文 ${words} 字，超过上限 ${range.max} 字`,
        hint: `删减到 ${range.min}–${range.max} 字之间，优先删与本章事件无关的铺陈。`,
      })
    } else if (words > range.max) {
      reminders.push(`字数 ${words}，高于上限 ${range.max} 但在 5% 余量内，照常保存。`)
    }
  }
  const scan = scanProse(text)
  if (scan.clues.length > 0) {
    reminders.push(`机械扫描命中 ${scan.clues.length} 类线索（${scan.clues.slice(0, 3).map((clue) => clue.label).join('、')}），只作体检，不拦稿。`)
  }
  const outlineEntry = snapshot.chapterOutlines?.[String(chapter)]
  if (!outlineEntry) reminders.push('这一章没有章纲；正文可能偏离全书规划，保存后提醒作者补章纲。')
  const memoryIssues = validateMemory(args.memory)
  issues.push(...memoryIssues)
  if (snapshot.book.config?.review_required === true || snapshot.book.config?.review_required === 'true') {
    const review = await readJson(book, `.narracat/data/reviews/ch-${pad(chapter, 3)}-review.json`)
    const draftRevision = shortRevision(text)
    if (!review) {
      issues.push({
        step: 'review',
        code: 'review_required',
        message: '这本书要求先审校再保存',
        hint: '让审校先读这一版草稿（novel_submit_review，path 传草稿路径），拿到 pass 与同一版正文版本后再提交。',
      })
    } else if (review.verdict !== 'pass') {
      issues.push({
        step: 'review',
        code: 'review_failed',
        message: `这一版审校未通过（${(Array.isArray(review.issues) ? review.issues.filter((issue) => issue?.severity === 'blocker').length : 0)} 个 blocker）`,
        hint: '先按审校问题修改草稿，再重审并提交；不要跳过审校。',
      })
    } else if (review.reviewed_source_revision !== draftRevision) {
      issues.push({
        step: 'review',
        code: 'review_stale',
        message: '审校报告对应的不是现在这一版草稿',
        hint: `草稿改过之后要重新审（当前版本 ${draftRevision}）；旧报告不能放行。`,
      })
    }
  }
  const attempts = previousAttempts + 1
  if (issues.length > 0) {
    await writeJson(book, journalPath(chapter), {
      chapter,
      attempts,
      last_result: 'returned',
      submitted_at: new Date().toISOString(),
      last_issues: issues,
      author_approved_retry: approvedRetry || undefined,
    })
    return {
      status: 'returned',
      chapter,
      issues,
      attempt: attempts,
      attempts_left: Math.max(0, MAX_ATTEMPTS - attempts),
      reminders,
      draft_path: draftRel,
      not_saved: true,
    }
  }
  // Publish: the manuscript file is the source of truth; keep the previous
  // version beside the submission journal.
  const existing = (snapshot.chapters ?? []).find((row) => row.chapter === chapter)
  const outlineVolume = outlineEntry?.path ? /vol-(\d+)/.exec(outlineEntry.path)?.[1] : null
  const derivedVolume = outlineVolume ? Number.parseInt(outlineVolume, 10) : volumeOfChapter((await readJson(book, '.narracat/data/outline/outline-structure.json')), chapter)?.volume ?? null
  const targetRel = existing?.path ?? (derivedVolume !== null
    ? `manuscript/vol-${pad(derivedVolume, 2)}/ch-${pad(chapter, 3)}.md`
    : `manuscript/ch-${pad(chapter, 3)}.md`)
  const revision = shortRevision(text)
  let backupPath = null
  try {
    if (existing?.path) {
      const current = await readBookFile(book, existing.path, { full: true })
      backupPath = `.narracat/submissions/backups/ch-${pad(chapter, 3)}-${shortRevision(current.text)}.md`
      await writeBookFile(book, backupPath, current.text, undefined, { internal: true })
    }
    await writeBookFile(book, targetRel, draft.text, existing?.path ? existing.mtime : undefined)
  } catch (error) {
    return {
      status: 'stopped',
      step: 'publish',
      code: 'publish_failed',
      reason: `发布正文失败：${error instanceof Error ? error.message : String(error)}`,
      attempts,
      draft_path: draftRel,
    }
  }
  let memorySaved = true
  try {
    await writeJson(book, memoryPath(chapter), {
      chapter,
      title: (snapshot.chapters ?? []).find((row) => row.chapter === chapter)?.title ?? null,
      source_revision: revision,
      content_hash: sha(text),
      word_count: words,
      summary: String(args.memory?.summary ?? '').trim(),
      events: Array.isArray(args.memory?.events) ? args.memory.events : [],
      state_changes: Array.isArray(args.memory?.state_changes) ? args.memory.state_changes : [],
      foreshadowing: Array.isArray(args.memory?.foreshadowing) ? args.memory.foreshadowing : [],
      review: null,
      published_at: new Date().toISOString(),
      path: targetRel,
    })
  } catch (error) {
    memorySaved = false
    reminders.push(`正文已保存，但本章记忆写入失败：${error instanceof Error ? error.message : String(error)}。草稿保留，修好后再提交一次即可补记。`)
  }
  // The draft is a staging/revision file, never the published target. The
  // guard is redundant after normalization, but keeps a future caller honest.
  if (memorySaved && draftRel !== targetRel && (draftRel.startsWith('.narracat/staging/') || draftRel.startsWith('.narracat/revisions/'))) {
    await removeBookFile(book, draftRel)
  }
  let tracking = null
  try {
    tracking = await refreshTracking(book)
  } catch (error) {
    reminders.push(`正文与记忆已保存，但追踪文件没有刷新：${error instanceof Error ? error.message : String(error)}。可以稍后让 Agent 调 novel_tracking_refresh。`)
  }
  await writeJson(book, journalPath(chapter), {
    chapter,
    attempts,
    last_result: memorySaved ? 'saved' : 'stopped',
    submitted_at: new Date().toISOString(),
    saved_at: new Date().toISOString(),
    source_revision: revision,
    path: targetRel,
    backup_path: backupPath,
    memory_saved: memorySaved,
    author_approved_retry: approvedRetry || undefined,
    author_quote: approvedRetry ? String(args.author_quote) : undefined,
  })
  if (!memorySaved) {
    return {
      status: 'stopped',
      step: 'memory',
      code: 'memory_write_failed',
      chapter,
      path: targetRel,
      published: true,
      memory_saved: false,
      reason: '正文已经发布，但本章记忆没有写进去；草稿还在，修好存储问题后再提交一次即可补记。',
      hint: '不要把这次当成完成：作者的前情还缺这一章。先修好文件权限/磁盘，再带同一份 memory 重交。',
      memory_path: memoryPath(chapter),
      attempts,
      reminders,
      tracking,
    }
  }
  return {
    status: 'saved',
    chapter,
    path: targetRel,
    word_count: words,
    word_range: range,
    source_revision: revision,
    memory_path: memoryPath(chapter),
    memory_saved: true,
    backup_path: backupPath,
    attempts,
    reminders,
    tracking,
  }
}

/**
 * Submit book-level outline or a batch of chapter outlines.
 * @param {string} book - real book directory.
 * @param {object} args - {layer, payload, overwrite?}
 * @returns {Promise<object>} saved / returned / stopped.
 */
export async function outlineSubmit(book, args) {
  const layer = args.layer
  if (layer === 'book') {
    const payload = args.payload
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'payload_invalid', message: 'layer=book 需要一个对象', hint: 'payload 传全书大纲对象（synopsis / storylines / volumes / volume_plan / mysteries / foreshadowing_registry）。' }] }
    }
    const issues = []
    if (payload.storylines !== undefined && !Array.isArray(payload.storylines)) {
      issues.push({ step: 'outline', code: 'storylines_invalid', message: 'storylines 必须是数组', hint: '每条至少写 {id, name}。' })
    }
    if (payload.volumes !== undefined && !Array.isArray(payload.volumes)) {
      issues.push({ step: 'outline', code: 'volumes_invalid', message: 'volumes 必须是数组', hint: '每卷写 {volume_no, title, arc_list}。' })
    }
    if (issues.length > 0) return { status: 'returned', issues }
    try {
      await writeJson(book, '.narracat/data/outline/outline-structure.json', payload)
    } catch (error) {
      return { status: 'stopped', step: 'outline', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
    }
    return {
      status: 'saved',
      layer: 'book',
      path: '.narracat/data/outline/outline-structure.json',
      volumes: Array.isArray(payload.volumes) ? payload.volumes.length : 0,
      storylines: Array.isArray(payload.storylines) ? payload.storylines.length : 0,
      warnings: [],
    }
  }
  if (layer === 'chapters') {
    const batch = Array.isArray(args.payload) ? args.payload : Array.isArray(args.payload?.chapters) ? args.payload.chapters : null
    if (!batch) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'payload_invalid', message: 'layer=chapters 需要章节数组', hint: 'payload 传 {chapters: [...]}，每章写 {chapter, title?, beats:[...]}。' }] }
    }
    const snapshot = await buildSnapshot(book)
    const outline = (await readJson(book, '.narracat/data/outline/outline-structure.json')) ?? {}
    const issues = []
    for (const [index, item] of batch.entries()) {
      if (!Number.isInteger(item?.chapter) || item.chapter < 1) {
        issues.push({ step: 'outline', code: 'chapter_invalid', field: `chapters[${index}].chapter`, message: '章节号必须是 ≥1 的整数', hint: 'chapter 写第几章。' })
        continue
      }
      if (!Array.isArray(item.beats) || item.beats.length === 0) {
        issues.push({ step: 'outline', code: 'beats_invalid', field: `chapters[${index}].beats`, message: `第 ${item.chapter} 章没有拍`, hint: 'beats 至少一拍，写这一章按顺序发生的事。' })
        continue
      }
      const exists = snapshot.chapterOutlines?.[String(item.chapter)]
      if (exists && args.overwrite !== true) {
        issues.push({ step: 'outline', code: 'chapter_exists', field: `chapters[${index}]`, message: `第 ${item.chapter} 章已有章纲`, hint: '不覆盖已有章纲；要改这一章用 layer=chapter_edit。' })
      }
    }
    if (issues.length > 0) return { status: 'returned', issues }
    const written = []
    for (const item of batch) {
      const volume = Number.isInteger(item.volume) ? item.volume : (volumeOfChapter(outline, item.chapter)?.volume ?? 1)
      const rel = `.narracat/data/outline/vol-${pad(volume, 2)}/ch-${pad(item.chapter, 3)}.json`
      try {
        await writeJson(book, rel, item)
        written.push({ chapter: item.chapter, path: rel })
      } catch (error) {
        return { status: 'stopped', step: 'outline', code: 'write_failed', reason: String(error instanceof Error ? error.message : error), written }
      }
    }
    return { status: 'saved', layer: 'chapters', written, warnings: written.length < batch.length ? ['部分章纲没有写入'] : [] }
  }
  if (layer === 'volume' || layer === 'volumes' || layer === 'full') {
    const payload = args.payload
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'payload_invalid', message: `${layer} 层需要一个对象`, hint: 'payload 写 {volumes:[...], volume_plan?:[...]}；layer=full 时还可带书级字段。' }] }
    }
    const incoming = Array.isArray(payload.volumes) ? payload.volumes : []
    if (incoming.length === 0 && !Array.isArray(payload.volume_plan)) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'no_volumes', message: '没有要提交的卷', hint: 'payload.volumes 至少一卷，每卷写 {volume_no, title, arc_list}。' }] }
    }
    for (const [index, volume] of incoming.entries()) {
      if (!Number.isInteger(volume?.volume_no) || volume.volume_no < 1) {
        return { status: 'returned', issues: [{ step: 'outline', code: 'volume_invalid', field: `volumes[${index}].volume_no`, message: '卷号必须是 ≥1 的整数', hint: 'volume_no 写第几卷。' }] }
      }
    }
    const current = (await readJson(book, '.narracat/data/outline/outline-structure.json')) ?? {}
    const next = { ...current }
    if (layer === 'full') {
      for (const key of ['synopsis', 'mysteries', 'stakes_progression', 'storylines', 'foreshadowing_registry', 'title']) {
        if (payload[key] !== undefined) next[key] = payload[key]
      }
    }
    const volumes = Array.isArray(next.volumes) ? [...next.volumes] : []
    for (const volume of incoming) {
      const at = volumes.findIndex((item) => item?.volume_no === volume.volume_no)
      if (at >= 0) volumes[at] = volume
      else volumes.push(volume)
    }
    next.volumes = volumes.sort((left, right) => (left?.volume_no ?? 0) - (right?.volume_no ?? 0))
    if (Array.isArray(payload.volume_plan)) {
      const plans = Array.isArray(next.volume_plan) ? [...next.volume_plan] : []
      for (const plan of payload.volume_plan) {
        const at = plans.findIndex((item) => item?.volume_no === plan?.volume_no)
        if (at >= 0) plans[at] = plan
        else plans.push(plan)
      }
      next.volume_plan = plans.sort((left, right) => (left?.volume_no ?? 0) - (right?.volume_no ?? 0))
    }
    try {
      await writeJson(book, '.narracat/data/outline/outline-structure.json', next)
    } catch (error) {
      return { status: 'stopped', step: 'outline', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
    }
    return {
      status: 'saved',
      layer,
      path: '.narracat/data/outline/outline-structure.json',
      volumes: next.volumes.length,
      volumes_written: incoming.map((volume) => volume.volume_no),
      warnings: [],
    }
  }
  if (layer === 'character') {
    const payload = args.payload
    const name = typeof payload?.name === 'string' ? payload.name.trim() : ''
    if (name.length === 0) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'name_missing', message: '新增角色要带名字或称呼', hint: 'payload 写 {name, importance?: major|minor|extra, proposed_chapter?, source?}。' }] }
    }
    const registryPath = '.narracat/entities/v1/registry.json'
    const registry = (await readJson(book, registryPath)) ?? { schemaVersion: 1, entities: [], merges: [] }
    const entities = Array.isArray(registry.entities) ? registry.entities : []
    const known = entities.find((entity) => entity?.name === name || (Array.isArray(entity?.aliases) ? entity.aliases.some((alias) => alias?.name === name) : false))
    if (known) {
      return {
        status: 'saved',
        layer: 'character',
        decision: known.candidate ? 'candidate' : 'known',
        name,
        character_uid: known.candidate?.characterUid ?? known.id ?? null,
        path: registryPath,
        hint: '这个角色已经登记过，直接沿用已有名字写进章纲。',
      }
    }
    const random = createHash('sha256').update(`${name}:${Date.now()}`).digest('hex')
    const characterUid = `${random.slice(0, 8)}-${random.slice(8, 12)}-${random.slice(12, 16)}-${random.slice(16, 20)}-${random.slice(20, 32)}`
    const now = new Date().toISOString()
    const importance = ['major', 'minor', 'extra'].includes(payload?.importance) ? payload.importance : 'minor'
    entities.push({
      id: `entity:${random.slice(0, 16)}`,
      type: 'person',
      name,
      aliases: [],
      summary: '',
      candidate: {
        characterUid,
        importance,
        proposedChapter: Number.isInteger(payload?.proposed_chapter) ? payload.proposed_chapter : null,
        note: typeof payload?.note === 'string' ? payload.note : '',
        source: typeof payload?.source === 'string' ? payload.source : 'plan',
      },
      createdAt: now,
      updatedAt: now,
    })
    registry.entities = entities
    try {
      await writeJson(book, registryPath, registry)
    } catch (error) {
      return { status: 'stopped', step: 'outline', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
    }
    return {
      status: 'saved',
      layer: 'character',
      decision: 'candidate',
      name,
      character_uid: characterUid,
      importance,
      path: registryPath,
      hint: '已登记为候选角色；候选可以写进章纲的出场人物，等设定提交接上后再建简档。',
    }
  }
  if (layer === 'chapter_edit') {
    const { chapter, edits } = args.payload ?? {}
    if (!Number.isInteger(chapter) || !Array.isArray(edits) || edits.length === 0) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'payload_invalid', message: 'chapter_edit 需要 chapter 与 edits', hint: 'edits 每项写 {field, value}，可选 expected（旧值）。' }] }
    }
    const snapshot = await buildSnapshot(book)
    const entry = snapshot.chapterOutlines?.[String(chapter)]
    if (!entry) {
      return { status: 'returned', issues: [{ step: 'outline', code: 'chapter_missing', message: `第 ${chapter} 章还没有章纲`, hint: '先用 layer=chapters 新建。' }] }
    }
    const current = entry.data ?? {}
    const issues = []
    for (const [index, edit] of edits.entries()) {
      if (typeof edit?.field !== 'string' || edit.field.length === 0) {
        issues.push({ step: 'outline', code: 'edit_invalid', field: `edits[${index}].field`, message: '缺少 field', hint: 'field 写要改的字段名。' })
        continue
      }
      if (edit.expected !== undefined && JSON.stringify(current[edit.field]) !== JSON.stringify(edit.expected)) {
        issues.push({ step: 'outline', code: 'stale_value', field: `edits[${index}]`, message: `字段 ${edit.field} 的旧值对不上`, hint: '先重新读一次章纲，以实际值为准。' })
      }
    }
    if (issues.length > 0) return { status: 'returned', issues }
    const next = { ...current }
    for (const edit of edits) {
      if (edit.value === null) delete next[edit.field]
      else next[edit.field] = edit.value
    }
    try {
      await writeJson(book, entry.path, next)
    } catch (error) {
      return { status: 'stopped', step: 'outline', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
    }
    return { status: 'saved', layer: 'chapter_edit', chapter, path: entry.path }
  }
  return { status: 'returned', issues: [{ step: 'outline', code: 'layer_invalid', message: '不认识的 layer', hint: 'layer 只能是 book / volume / volumes / full / chapters / chapter_edit / character。' }] }
}

/**
 * Record one chapter review. The verdict is computed here, never supplied.
 * @param {string} book - real book directory.
 * @param {object} args - {chapter, issues, declarations?, source_revision?}
 * @returns {Promise<object>} saved / returned / stopped.
 */
export async function reviewSubmit(book, args) {
  const chapter = args.chapter
  if (!Number.isInteger(chapter) || chapter < 1) {
    return { status: 'returned', issues: [{ step: 'review', code: 'chapter_invalid', message: '章节号必须是 ≥1 的整数', hint: 'chapter 写要审校第几章。' }] }
  }
  const issues = Array.isArray(args.issues) ? args.issues : null
  if (!Array.isArray(issues)) {
    return { status: 'returned', issues: [{ step: 'review', code: 'issues_not_array', message: '审校结论要交问题清单', hint: 'issues 每项写 {severity: blocker|note, where, what, fix_hint}；没有问题时传空数组。' }] }
  }
  const invalid = issues.filter((issue) => !['blocker', 'note'].includes(issue?.severity) || typeof issue?.what !== 'string' || issue.what.trim().length === 0)
  if (invalid.length > 0) {
    return { status: 'returned', issues: [{ step: 'review', code: 'issue_invalid', message: `${invalid.length} 条问题的格式不对`, hint: '每条写 {severity: blocker|note, where, what, fix_hint}；where 写第几段，what 写可核实的错误。' }] }
  }
  let text
  let reviewedPath = null
  try {
    const snapshot = await buildSnapshot(book)
    const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
    if (typeof args.path === 'string' && args.path.length > 0) {
      // Review a draft before it is published (staging or a revision copy).
      const reviewPath = normalizeDraftPath(args.path)
      if (!reviewPath || (!reviewPath.startsWith('.narracat/staging/') && !reviewPath.startsWith('.narracat/revisions/'))) {
        return { status: 'stopped', step: 'review', code: 'bad_path', reason: '只能审暂存区或改写稿里的草稿；正式正文直接读即可。' }
      }
      const draftChapter = /(?:^|\/)ch-(\d+)\.md$/i.exec(reviewPath)?.[1]
      if (!draftChapter || Number.parseInt(draftChapter, 10) !== chapter) {
        return { status: 'stopped', step: 'review', code: 'draft_chapter_mismatch', reason: `草稿路径（${reviewPath}）与第 ${chapter} 章对不上。` }
      }
      text = visibleText((await readBookFile(book, reviewPath, { full: true })).text)
      reviewedPath = reviewPath
    } else {
      if (!row?.path) {
        return { status: 'stopped', step: 'review', code: 'no_text', reason: `第 ${chapter} 章还没有正文，无法审校。` }
      }
      text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    }
  } catch (error) {
    return { status: 'stopped', step: 'review', code: 'read_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  const revision = shortRevision(text)
  if (typeof args.source_revision === 'string' && args.source_revision.length > 0 && args.source_revision !== revision) {
    return {
      status: 'returned',
      issues: [{ step: 'review', code: 'stale_source', message: '交上来的 source_revision 与当前正文版本对不上', hint: `先重新读正文（当前版本 ${revision}）再审校。` }],
      current_revision: revision,
    }
  }
  const blockers = issues.filter((issue) => issue.severity === 'blocker')
  const verdict = blockers.length > 0 ? 'fail' : 'pass'
  const report = {
    chapter,
    verdict,
    issues: issues.map((issue) => ({
      severity: issue.severity,
      where: typeof issue.where === 'string' ? issue.where : '',
      what: String(issue.what),
      fix_hint: typeof issue.fix_hint === 'string' ? issue.fix_hint : '',
    })),
    declarations: Array.isArray(args.declarations) ? args.declarations : [],
    word_count: countWords(text),
    reviewed_manuscript_sha256: sha(text),
    reviewed_source_revision: revision,
    reviewed_source_path: reviewedPath,
    reviewed_at: new Date().toISOString(),
  }
  try {
    await writeJson(book, `.narracat/data/reviews/ch-${pad(chapter, 3)}-review.json`, report)
    const memory = await readJson(book, memoryPath(chapter))
    if (memory) {
      memory.review = { verdict, blockers: blockers.length, notes: issues.length - blockers.length }
      await writeJson(book, memoryPath(chapter), memory)
    }
  } catch (error) {
    return { status: 'stopped', step: 'review', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return {
    status: 'saved',
    chapter,
    verdict,
    blockers: blockers.length,
    notes: issues.length - blockers.length,
    path: `.narracat/data/reviews/ch-${pad(chapter, 3)}-review.json`,
    source_revision: revision,
  }
}

/**
 * Remove one path if it is the workspace-relative form of the book file.
 * @param {string} book - real book directory.
 * @param {string} rel - book-relative path.
 * @returns {boolean} whether the path stays inside the book.
 */
export function insideBook(book, rel) {
  const abs = isAbsolute(rel) ? resolve(rel) : resolve(book, rel)
  return abs === book || abs.startsWith(`${book}${sep}`)
}
