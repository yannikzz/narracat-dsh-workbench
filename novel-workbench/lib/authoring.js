/**
 * Authoring programs for the novel preset: settings, book info, premise cards,
 * a revision draft, and review lookup.
 *
 * Every program validates the whole batch before writing anything, returns the
 * same `returned / stopped / saved` vocabulary as the submission pipeline, and
 * keeps the single-write-entry rule: characters, world settings, relationships,
 * premise cards and book info are only written here.
 */

import { createHash } from 'node:crypto'
import { buildSnapshot, countWords, readBookFile, writeBookFile } from './project.js'
import { visibleText } from './novel-tools.js'

/** Zero-pad helper. */
const pad = (value, width) => String(value).padStart(width, '0')

/** Full hex sha256. */
const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

/** Read a JSON file or null. */
async function readJson(book, rel) {
  try {
    return JSON.parse((await readBookFile(book, rel)).text)
  } catch {
    return null
  }
}

/** Write a JSON file as an internal program (bypasses the raw-editor deny list). */
async function writeJson(book, rel, value) {
  return await writeBookFile(book, rel, JSON.stringify(value, null, 2), undefined, { internal: true })
}

/** Read a text file or null. */
async function readText(book, rel) {
  try {
    return (await readBookFile(book, rel)).text
  } catch {
    return null
  }
}

/** One character identity path. */
const identityPath = (name) => `.narracat/data/bible/characters/${name}.json`
/** One character profile path. */
const profilePath = (name) => `bible/characters/${name}.md`
/** One world setting path. */
const worldPath = (name) => `bible/world/${name}.md`

/** Generate a UUID-shaped character id. */
function newCharacterUid(seed) {
  const hex = createHash('sha256').update(`${seed}:${Date.now()}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/** Validate a character name usable as a file name. */
function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 60
    && !name.includes('/') && !name.includes('\\') && !name.startsWith('.')
}

/** Validate the structured half of a character object. */
function validateCharacterFields(obj) {
  const issues = []
  const structured = obj.structured && typeof obj.structured === 'object' ? obj.structured : {}
  if (structured.aliases !== undefined) {
    if (!Array.isArray(structured.aliases) || structured.aliases.length > 12
      || structured.aliases.some((alias) => typeof alias !== 'string' || alias.trim().length === 0)) {
      issues.push({ step: 'settings', code: 'aliases_invalid', field: 'structured.aliases', message: '别名必须是至多 12 个非空字符串', hint: 'aliases 写这本书里别人怎么称呼他。' })
    }
  }
  if (structured.gender !== undefined && (typeof structured.gender !== 'string' || structured.gender.length > 8)) {
    issues.push({ step: 'settings', code: 'gender_invalid', field: 'structured.gender', message: '性别字段过长或不是字符串', hint: 'gender 写短短一个词。' })
  }
  if (structured.age !== undefined && (typeof structured.age !== 'string' || structured.age.length > 20)) {
    issues.push({ step: 'settings', code: 'age_invalid', field: 'structured.age', message: '年龄字段过长或不是字符串', hint: 'age 写小说里的说法，如「十九岁」。' })
  }
  if (structured.portrait !== undefined && (typeof structured.portrait !== 'string' || structured.portrait.length > 500)) {
    issues.push({ step: 'settings', code: 'portrait_invalid', field: 'structured.portrait', message: '人物速写最多 500 字', hint: 'portrait 是写手每章先拿到的那一小段，写外形与说话感觉，不写身份注释。' })
  }
  if (structured.profile_stage !== undefined && !['stub', 'sketch', 'full'].includes(structured.profile_stage)) {
    issues.push({ step: 'settings', code: 'stage_invalid', field: 'structured.profile_stage', message: '完善度只能是 stub / sketch / full', hint: '简档用 stub，人物成形用 sketch，六维度齐了用 full。' })
  }
  if (obj.profile_stage !== undefined && !['stub', 'sketch', 'full'].includes(obj.profile_stage)) {
    issues.push({ step: 'settings', code: 'stage_invalid', field: 'profile_stage', message: '完善度只能是 stub / sketch / full', hint: '简档用 stub，人物成形用 sketch，六维度齐了用 full。' })
  }
  if (structured.initial_states !== undefined && (!Array.isArray(structured.initial_states)
    || structured.initial_states.some((state) => typeof state?.dimension !== 'string' || state?.value === undefined))) {
    issues.push({ step: 'settings', code: 'initial_states_invalid', field: 'structured.initial_states', message: '初始状态格式不对', hint: '每项写 {dimension, value, note?}。' })
  }
  return { issues, structured }
}

/**
 * Save a batch of settings: characters, world settings, relationships.
 * @param {string} book - real book directory.
 * @param {{ objects: object[], ontology?: object }} args - batch.
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function settingsSubmit(book, args) {
  const objects = Array.isArray(args.objects) ? args.objects : null
  if (!objects || objects.length === 0) {
    return {
      status: 'returned',
      issues: [{
        step: 'settings',
        code: 'objects_missing',
        message: '没有要保存的设定',
        hint: 'objects 每项写 {kind: character|world|relationships, op: create|update|append|set, name, markdown, structured?}。',
      }],
    }
  }
  const issues = []
  const warnings = []
  /** @type {Array<{ kind: string, name?: string, op: string, markdown?: string, identity?: object, rows?: object[] }>} */
  const plan = []
  for (const [index, obj] of objects.entries()) {
    const kind = obj?.kind
    const op = obj?.op ?? 'create'
    if (!['character', 'world', 'relationships'].includes(kind)) {
      issues.push({ step: 'settings', code: 'kind_invalid', field: `objects[${index}].kind`, message: '不认识的设定类型', hint: 'kind 只能是 character / world / relationships。' })
      continue
    }
    if (kind === 'relationships') {
      if (op === 'set') {
        if (typeof obj.markdown !== 'string' || obj.markdown.trim().length === 0) {
          issues.push({ step: 'settings', code: 'markdown_missing', field: `objects[${index}].markdown`, message: 'relationships 整体替换需要 markdown', hint: 'markdown 写完整关系表（| 角色A | 关系 | 角色B | 备注 |）。' })
        } else {
          plan.push({ kind, op, markdown: obj.markdown })
        }
        continue
      }
      if (op === 'append') {
        const rows = Array.isArray(obj.rows) ? obj.rows : null
        if (!rows || rows.length === 0 || rows.some((row) => typeof row?.a !== 'string' || typeof row?.relation !== 'string' || typeof row?.b !== 'string')) {
          issues.push({ step: 'settings', code: 'rows_invalid', field: `objects[${index}].rows`, message: '追加关系要写 rows', hint: '每项写 {a, relation, b, note?}。' })
        } else {
          plan.push({ kind, op, rows })
        }
        continue
      }
      issues.push({ step: 'settings', code: 'op_invalid', field: `objects[${index}].op`, message: 'relationships 只支持 append / set', hint: '新关系用 append，整体重写用 set。' })
      continue
    }
    if (!['create', 'update'].includes(op)) {
      issues.push({ step: 'settings', code: 'op_invalid', field: `objects[${index}].op`, message: `${kind} 只支持 create / update`, hint: '新建设定用 create，改已存在的用 update。' })
      continue
    }
    const name = typeof obj.name === 'string' ? obj.name.trim().normalize('NFC') : ''
    if (!validateName(name)) {
      issues.push({ step: 'settings', code: 'name_invalid', field: `objects[${index}].name`, message: '名字不能为空、不能含路径分隔符、不能以点开头', hint: 'name 用书里对这个角色/设定的叫法。' })
      continue
    }
    const target = kind === 'character' ? identityPath(name) : worldPath(name)
    const exists = (await readText(book, target)) !== null
    if (op === 'create' && exists) {
      issues.push({ step: 'settings', code: 'already_exists', field: `objects[${index}]`, message: `${name} 已经存在`, hint: '要改已有的用 op: update，不要覆盖重建。' })
      continue
    }
    if (op === 'update' && !exists) {
      issues.push({ step: 'settings', code: 'not_found', field: `objects[${index}]`, message: `${name} 还没有档案`, hint: '新建用 op: create。' })
      continue
    }
    if (typeof obj.markdown !== 'string' || obj.markdown.trim().length === 0) {
      issues.push({ step: 'settings', code: 'markdown_missing', field: `objects[${index}].markdown`, message: '档案正文不能为空', hint: 'markdown 写这一份档案的正文；不知道的写「（留白）」，不要编造。' })
      continue
    }
    if (kind === 'character') {
      const checked = validateCharacterFields(obj)
      issues.push(...checked.issues)
      if (checked.issues.length > 0) continue
      const existing = op === 'update' ? await readJson(book, target) : null
      if (op === 'update' && (!existing || typeof existing !== 'object')) {
        issues.push({ step: 'settings', code: 'identity_unreadable', field: `objects[${index}]`, message: `${name} 的身份文件读不出来`, hint: '先让作者确认这份档案，不要覆盖坏文件。' })
        continue
      }
      if (typeof obj.profile_stage === 'string' && checked.structured.profile_stage === undefined) {
        checked.structured.profile_stage = obj.profile_stage
      }
      const identity = op === 'update'
        ? {
          ...existing,
          name,
          ...(checked.structured.aliases !== undefined ? { aliases: checked.structured.aliases } : {}),
          ...(checked.structured.gender !== undefined ? { gender: checked.structured.gender } : {}),
          ...(checked.structured.age !== undefined ? { age: checked.structured.age } : {}),
          ...(checked.structured.portrait !== undefined ? { portrait: checked.structured.portrait } : {}),
          ...(checked.structured.profile_stage !== undefined ? { profile_stage: checked.structured.profile_stage } : {}),
          ...(checked.structured.initial_states !== undefined ? { initial_states: checked.structured.initial_states } : {}),
        }
        : {
          character_uid: newCharacterUid(name),
          name,
          gender: checked.structured.gender ?? '',
          age: checked.structured.age ?? '',
          aliases: checked.structured.aliases ?? [],
          initial_states: checked.structured.initial_states ?? [],
          profile_stage: checked.structured.profile_stage ?? (typeof obj.profile_stage === 'string' ? obj.profile_stage : 'stub'),
          ...(checked.structured.portrait !== undefined ? { portrait: checked.structured.portrait } : {}),
          ...(Number.isInteger(checked.structured.effective_chapter) ? { effective_chapter: checked.structured.effective_chapter } : {}),
        }
      if (typeof identity.profile_stage !== 'string' || !['stub', 'sketch', 'full'].includes(identity.profile_stage)) identity.profile_stage = 'stub'
      plan.push({ kind, op, name, markdown: obj.markdown, identity })
    } else {
      plan.push({ kind, op, name, markdown: obj.markdown })
    }
  }
  if (args.ontology !== undefined) warnings.push('本体提交还没有接入：本次没有保存本体改动。')
  if (issues.length > 0) return { status: 'returned', issues, warnings }
  const saved = []
  try {
    for (const item of plan) {
      if (item.kind === 'character') {
        await writeBookFile(book, identityPath(item.name), JSON.stringify(item.identity, null, 2), undefined, { internal: true })
        await writeBookFile(book, profilePath(item.name), item.markdown, undefined, { internal: true })
        saved.push({ kind: 'character', name: item.name, path: profilePath(item.name), identity_path: identityPath(item.name) })
      } else if (item.kind === 'world') {
        await writeBookFile(book, worldPath(item.name), item.markdown, undefined, { internal: true })
        saved.push({ kind: 'world', name: item.name, path: worldPath(item.name) })
      } else if (item.op === 'set') {
        await writeBookFile(book, 'bible/relationships.md', item.markdown, undefined, { internal: true })
        saved.push({ kind: 'relationships', path: 'bible/relationships.md' })
      } else {
        const current = (await readText(book, 'bible/relationships.md')) ?? '# 人物关系\n\n| 角色A | 关系 | 角色B | 备注 |\n| --- | --- | --- | --- |\n'
        const lines = item.rows.map((row) => `| ${row.a} | ${row.relation} | ${row.b} | ${typeof row.note === 'string' ? row.note : ''} |`)
        const next = `${current.replace(/\s*$/, '')}\n${lines.join('\n')}\n`
        await writeBookFile(book, 'bible/relationships.md', next, undefined, { internal: true })
        saved.push({ kind: 'relationships', path: 'bible/relationships.md', rows: item.rows.length })
      }
    }
  } catch (error) {
    return { status: 'stopped', step: 'settings', code: 'write_failed', reason: String(error instanceof Error ? error.message : error), saved }
  }
  return { status: 'saved', saved, warnings }
}

/** Update one flat YAML key in place, preserving the rest of the file. */
function yamlScalar(value) {
  if (value === null || value === 'null') return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const text = String(value)
  // Keep readable CJK/plain values raw; quote anything that could be parsed as
  // structure (colon, hash, leading punctuation) or that contains a newline.
  return /^[\w\u4e00-\u9fff .,!?，。！？、；：（）()《》·—-]+$/u.test(text) && !text.endsWith(' ')
    ? text
    : JSON.stringify(text)
}

function setYamlKey(text, key, value) {
  const line = `${key}: ${yamlScalar(value)}`
  const pattern = new RegExp(`^${key}:.*$`, 'm')
  if (pattern.test(text)) return text.replace(pattern, line)
  const base = text.replace(/\s*$/, '')
  return `${base.length > 0 ? `${base}\n` : ''}${line}\n`
}

/**
 * Save the book's identity fields in `.narracat/config.yaml`.
 * @param {string} book - real book directory.
 * @param {object} args - provided fields only.
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function bookInfoSubmit(book, args) {
  const issues = []
  const updates = {}
  const stringFields = ['title', 'genre', 'language']
  for (const field of stringFields) {
    if (args[field] === undefined) continue
    if (typeof args[field] !== 'string' || args[field].trim().length === 0) {
      issues.push({ step: 'book_info', code: 'field_invalid', field, message: `${field} 必须是非空字符串`, hint: '按作者原话填。' })
    } else if (field === 'language' && !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(args[field].trim())) {
      issues.push({ step: 'book_info', code: 'field_invalid', field, message: '语言要写成 zh-CN / en 这样的语言标记', hint: '按作者的语言填，例如 zh-CN。' })
    } else {
      updates[field] = args[field].trim()
    }
  }
  for (const field of ['estimated_total_chapters', 'words_per_chapter']) {
    if (args[field] === undefined) continue
    if (!Number.isInteger(args[field]) || args[field] <= 0) {
      issues.push({ step: 'book_info', code: 'field_invalid', field, message: `${field} 必须是正整数`, hint: '按作者定的篇幅填；没定就不要传。' })
    } else {
      updates[field] = args[field]
    }
  }
  if (args.review_required !== undefined) {
    if (typeof args.review_required !== 'boolean') {
      issues.push({ step: 'book_info', code: 'field_invalid', field: 'review_required', message: '审校门开关必须是 true / false', hint: '作者要求每章先审校再保存时传 true。' })
    } else {
      updates.review_required = args.review_required
    }
  }
  if (args.style_profile !== undefined) {
    if (args.style_profile !== null && (typeof args.style_profile !== 'string' || args.style_profile.trim().length === 0)) {
      issues.push({ step: 'book_info', code: 'field_invalid', field: 'style_profile', message: '风格档位必须是字符串或 null', hint: '没定就传 null。' })
    } else {
      updates.style_profile = args.style_profile === null ? 'null' : args.style_profile.trim()
    }
  }
  if (Object.keys(updates).length === 0) {
    issues.push({ step: 'book_info', code: 'nothing_to_update', message: '没有要保存的作品信息', hint: '只传这次定下的字段（title / genre / language / estimated_total_chapters / words_per_chapter / style_profile）。' })
  }
  if (issues.length > 0) return { status: 'returned', issues }
  let text
  try {
    text = (await readBookFile(book, '.narracat/config.yaml')).text
  } catch (error) {
    return { status: 'stopped', step: 'book_info', code: 'config_unreadable', reason: String(error instanceof Error ? error.message : error) }
  }
  let next = text
  for (const [key, value] of Object.entries(updates)) next = setYamlKey(next, key, value)
  try {
    await writeBookFile(book, '.narracat/config.yaml', next, undefined, { internal: true })
  } catch (error) {
    return { status: 'stopped', step: 'book_info', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return { status: 'saved', path: '.narracat/config.yaml', changed: Object.keys(updates), values: updates }
}

/** Validate one premise card. */
function validatePremiseCard(card, index) {
  const issues = []
  if (typeof card?.card !== 'string' || card.card.trim().length === 0) {
    issues.push({ step: 'premise', code: 'card_invalid', field: `cards[${index}].card`, message: '每张卡要有卡名', hint: 'card 写九卡之一：genre_contract / core_hook / golden_finger / protagonist_desire / antagonistic_force / central_dramatic_question / world_rules / narrator_voice / blank_declaration。' })
    return issues
  }
  if (!Array.isArray(card.fields) || card.fields.length === 0) {
    issues.push({ step: 'premise', code: 'fields_invalid', field: `cards[${index}].fields`, message: `${card.card} 没有字段`, hint: 'fields 每项写 {key, value, certainty}。' })
    return issues
  }
  for (const [fieldIndex, field] of card.fields.entries()) {
    if (typeof field?.key !== 'string' || field.key.trim().length === 0 || field?.value === undefined) {
      issues.push({ step: 'premise', code: 'field_invalid', field: `cards[${index}].fields[${fieldIndex}]`, message: '字段缺少 key 或 value', hint: '每项写 {key, value, certainty}。' })
    } else if (field.certainty !== undefined && !['canon', 'tentative', 'open'].includes(field.certainty)) {
      issues.push({ step: 'premise', code: 'certainty_invalid', field: `cards[${index}].fields[${fieldIndex}].certainty`, message: '确定度只能是 canon / tentative / open', hint: '作者定下的用 canon，暂定用 tentative，没定用 open。' })
    }
  }
  return issues
}

/**
 * Submit or revise premise cards with an optimistic revision lock.
 * @param {string} book - real book directory.
 * @param {object} args - {payload, merge_cards?, expected_revision?}
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function premiseSubmit(book, args) {
  const payload = args.payload
  const cards = Array.isArray(payload) ? payload : Array.isArray(payload?.cards) ? payload.cards : null
  if (!cards || cards.length === 0) {
    return { status: 'returned', issues: [{ step: 'premise', code: 'payload_invalid', message: '没有要提交的立项卡', hint: 'payload 写 {cards:[...]}，每张卡 {card, fields:[{key, value, certainty}]}。' }] }
  }
  const issues = []
  for (const [index, card] of cards.entries()) issues.push(...validatePremiseCard(card, index))
  if (issues.length > 0) return { status: 'returned', issues }
  const rel = '.narracat/data/bible/premise-cards.json'
  const existing = (await readJson(book, rel)) ?? { cards: [], revision: 0 }
  const currentRevision = Number.isInteger(existing.revision) ? existing.revision : 0
  if (args.expected_revision !== undefined && args.expected_revision !== currentRevision) {
    return {
      status: 'returned',
      issues: [{ step: 'premise', code: 'stale_revision', message: '立项卡在读过之后被改过', hint: `先重新读立项卡（当前版本 ${currentRevision}），再交这次的改动。` }],
      current_revision: currentRevision,
    }
  }
  let nextCards
  if (args.merge_cards === true) {
    nextCards = Array.isArray(existing.cards) ? existing.cards.map((card) => ({ ...card, fields: [...(Array.isArray(card.fields) ? card.fields : [])] })) : []
    for (const incoming of cards) {
      const at = nextCards.findIndex((card) => card?.card === incoming.card)
      if (at >= 0) nextCards[at] = incoming
      else nextCards.push(incoming)
    }
  } else {
    nextCards = cards
  }
  const next = { ...existing, cards: nextCards, revision: currentRevision + 1 }
  try {
    await writeJson(book, rel, next)
  } catch (error) {
    return { status: 'stopped', step: 'premise', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return { status: 'saved', path: rel, cards: nextCards.length, revision: next.revision }
}

/**
 * Copy a published chapter into a revision draft. The agent edits the draft,
 * then submits it with `path` pointing at the revision file.
 * @param {string} book - real book directory.
 * @param {{ chapter: number, reuse?: boolean }} args - chapter.
 * @returns {Promise<object>} saved / stopped.
 */
export async function revisionDraftOpen(book, args) {
  const chapter = args.chapter
  const snapshot = await buildSnapshot(book)
  const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
  if (!row?.path) {
    return { status: 'stopped', step: 'revision', code: 'no_text', reason: `第 ${chapter} 章还没有正文，没有可改写的对象。` }
  }
  const rel = `.narracat/revisions/ch-${pad(chapter, 3)}.md`
  const existing = await readText(book, rel)
  if (existing !== null && args.reuse === true) {
    return {
      status: 'saved',
      chapter,
      path: rel,
      reused: true,
      words: countWords(visibleText(existing)),
      source_path: row.path,
      source_revision: sha(visibleText((await readBookFile(book, row.path, { full: true })).text)).slice(0, 16),
    }
  }
  const source = await readBookFile(book, row.path, { full: true })
  try {
    await writeBookFile(book, rel, source.text, undefined, { internal: true })
  } catch (error) {
    return { status: 'stopped', step: 'revision', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return {
    status: 'saved',
    chapter,
    path: rel,
    reused: false,
    words: countWords(visibleText(source.text)),
    source_path: row.path,
    source_revision: sha(visibleText(source.text)).slice(0, 16),
    hint: `在 ${rel} 上改，改完用 project_chapter_submit（chapter=${chapter}，path=${rel}）提交。`,
  }
}

/**
 * Read a chapter's review report and whether it still matches the manuscript.
 * @param {string} book - real book directory.
 * @param {{ chapter: number }} args - chapter.
 * @returns {Promise<object>} review body.
 */
export async function getReview(book, args) {
  const chapter = args.chapter
  const rel = `.narracat/data/reviews/ch-${pad(chapter, 3)}-review.json`
  const report = await readJson(book, rel)
  if (!report) return { found: false, chapter, path: rel, hint: '这一章还没有审校报告。' }
  const snapshot = await buildSnapshot(book)
  const row = (snapshot.chapters ?? []).find((item) => item.chapter === chapter)
  let currentRevision = null
  if (row?.path) {
    const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    currentRevision = sha(text).slice(0, 16)
  }
  const blockers = (Array.isArray(report.issues) ? report.issues : []).filter((issue) => issue?.severity === 'blocker')
  return {
    found: true,
    chapter,
    verdict: report.verdict ?? null,
    blockers: blockers.map((issue) => ({ where: issue.where ?? '', what: issue.what ?? '', fix_hint: issue.fix_hint ?? '' })),
    notes: (Array.isArray(report.issues) ? report.issues.length : 0) - blockers.length,
    fresh: currentRevision !== null && (report.reviewed_source_revision === currentRevision || report.reviewed_manuscript_sha256 === sha(visibleText((await readBookFile(book, row.path, { full: true })).text))),
    reviewed_source_revision: report.reviewed_source_revision ?? null,
    current_revision: currentRevision,
    path: rel,
  }
}
