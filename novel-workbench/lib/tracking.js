/**
 * The book's visible memory: progress, chapter summaries, foreshadowing and
 * character states.
 *
 * The source of truth stays structured — one memory record per chapter, the
 * outline, the character identities. These helpers fold that into the four
 * sheets a human (and the Agent) can read without opening JSON, mirroring the
 * tracked-files workflow that works well with a general-purpose Agent.
 *
 * Pure over a `buildSnapshot()` result: no filesystem, no writes.
 */

import { computeJourney } from './journey.js'

/** Display labels for common state dimensions when the book has no vocabulary. */
const DIMENSION_LABELS = {
  location: '位置',
  inventory: '持有物',
  possession: '持有物',
  relationship: '关系',
  knowledge: '认知',
  status: '状态',
  goal: '目标',
  emotion: '情绪',
  health: '身体',
  ability: '能力',
  reputation: '名声',
  appearance: '外观',
  identity: '身份',
}

/** Human label for one state dimension. */
function dimensionLabel(snapshot, key) {
  const row = (snapshot?.stateVocabulary?.dimensions ?? []).find((dimension) => dimension.key === key || dimension.predicate === key)
  return row?.display_name || row?.displayName || DIMENSION_LABELS[key] || key
}

/** Human label for a state operation. */
function operationLabel(value) {
  return ({ set: '变为', add: '获得', remove: '失去', increase: '增加', decrease: '减少', update: '更新' })[value] ?? value ?? ''
}

/** Human label for a foreshadowing action. */
function actionLabel(value) {
  return ({ plant: '埋设', develop: '推进', reveal: '揭晓' })[value] ?? value ?? ''
}

/** A short readable value for a state slot. */
function stateValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join('、')
  if (value === null || value === undefined) return '空'
  return String(value)
}

/** One progress bar made of block characters. */
function bar(percent, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)))
  return `${'■'.repeat(filled)}${'□'.repeat(width - filled)}`
}

/** Escape a markdown table cell. */
function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()
}

/** Group chapters into volumes, using the outline ranges when present. */
function volumeGroups(snapshot) {
  const chapters = Array.isArray(snapshot?.chapters) ? snapshot.chapters : []
  const volumes = Array.isArray(snapshot?.volumes) ? snapshot.volumes : []
  const groups = []
  for (const volume of volumes) {
    const no = Number.isInteger(volume.volumeNo) ? volume.volumeNo : null
    const arcStarts = (Array.isArray(volume.arcs) ? volume.arcs : []).map((arc) => arc.chapterStart).filter(Number.isInteger)
    const arcEnds = (Array.isArray(volume.arcs) ? volume.arcs : []).map((arc) => arc.chapterEnd).filter(Number.isInteger)
    const rangeStart = Number.isInteger(volume.chapterStart) ? volume.chapterStart : arcStarts.length > 0 ? Math.min(...arcStarts) : null
    const rangeEnd = Number.isInteger(volume.chapterEnd) ? volume.chapterEnd : arcEnds.length > 0 ? Math.max(...arcEnds) : null
    // An outlined chapter may have no explicit volume: fall back to the volume
    // range so it is not counted as a loose chapter next to its real volume.
    const inVolume = chapters.filter((row) => {
      if (no === null) return row.volume === null
      if (row.volume === no) return true
      return row.volume === null && rangeStart !== null && rangeEnd !== null && row.chapter >= rangeStart && row.chapter <= rangeEnd
    })
    const total = rangeStart && rangeEnd ? rangeEnd - rangeStart + 1 : inVolume.length
    groups.push({
      volumeNo: no,
      title: volume.title || (no ? `第 ${no} 卷` : '未分卷'),
      start: rangeStart,
      end: rangeEnd,
      total,
      written: inVolume.filter((row) => row.hasText).length,
      chapters: inVolume,
    })
  }
  const loose = chapters.filter((row) => !groups.some((group) => group.chapters.includes(row)))
  if (loose.length > 0) {
    groups.push({
      volumeNo: null,
      title: '未分卷',
      start: null,
      end: null,
      total: loose.length,
      written: loose.filter((row) => row.hasText).length,
      chapters: loose,
    })
  }
  return groups.filter((group) => group.total > 0 || group.chapters.length > 0)
}

/** Current states for every character, plus state-only subjects. */
function characterRows(snapshot) {
  const lastWritten = snapshot?.status?.lastWrittenChapter ?? 0
  const records = [...(snapshot?.memoryRecords ?? [])].sort((left, right) => (right.chapter ?? 0) - (left.chapter ?? 0))
  const states = snapshot?.characterStates ?? {}
  const rows = []
  const seen = new Set()
  const add = (name, identity, path) => {
    if (!name || seen.has(name)) return
    seen.add(name)
    const current = Object.entries(states[name] ?? {}).map(([dimension, state]) => ({
      dimension,
      label: dimensionLabel(snapshot, dimension),
      value: state?.value,
      chapter: state?.chapter ?? null,
    }))
    current.sort((left, right) => (right.chapter ?? 0) - (left.chapter ?? 0))
    const recent = []
    for (const record of records) {
      if (recent.length >= 5) break
      for (const change of Array.isArray(record.state_changes) ? record.state_changes : []) {
        if (change?.character !== name) continue
        recent.push({
          chapter: record.chapter,
          dimension: change.dimension,
          label: dimensionLabel(snapshot, change.dimension),
          operation: change.operation,
          value: change.value,
        })
        if (recent.length >= 5) break
      }
    }
    rows.push({
      name,
      identity: identity ?? null,
      path: path ?? null,
      stage: identity?.profileStage ?? 'unknown',
      portrait: identity?.portrait ?? '',
      current,
      recent,
      hasState: current.length > 0,
      lastChanged: current.reduce((max, item) => Math.max(max, item.chapter ?? 0), 0) || null,
    })
  }
  for (const character of snapshot?.characters ?? []) add(character.name, character.identity, character.path)
  for (const name of Object.keys(states)) {
    if (!seen.has(name)) add(name, null, null)
  }
  rows.sort((left, right) => {
    if (left.hasState !== right.hasState) return left.hasState ? -1 : 1
    return (right.lastChanged ?? 0) - (left.lastChanged ?? 0) || left.name.localeCompare(right.name, 'zh')
  })
  return rows.slice(0, 400)
}

/** Foreshadowing registry joined with the actions recorded in chapter memory. */
function foreshadowingRows(snapshot) {
  const registry = Array.isArray(snapshot?.outline?.foreshadowing) ? snapshot.outline.foreshadowing : []
  const folded = snapshot?.foreshadowingStates ?? {}
  const lastWritten = snapshot?.status?.lastWrittenChapter ?? 0
  const rows = []
  const seen = new Set()
  for (const item of registry) {
    const id = String(item?.id ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    const action = folded[id]
    const plantedRaw = item?.planted_chapter
    const targetRaw = item?.target_reveal
    const planted = plantedRaw === null || plantedRaw === undefined || plantedRaw === '' || !Number.isFinite(Number(plantedRaw)) ? null : Number(plantedRaw)
    const target = targetRaw === null || targetRaw === undefined || targetRaw === '' || !Number.isFinite(Number(targetRaw)) ? null : Number(targetRaw)
    let status = '待埋'
    if (action?.last_action === 'reveal') status = '已收'
    else if (action?.last_action === 'develop') status = '推进中'
    else if (action?.last_action === 'plant') status = '埋'
    else if (planted !== null && planted <= lastWritten) status = '缺动作'
    if (status !== '已收' && target !== null && target <= lastWritten) status = '逾期'
    rows.push({
      id,
      description: String(item?.description ?? ''),
      planted,
      target,
      status,
      level: status === '已收' ? 'good' : status === '逾期' || status === '缺动作' ? 'warn' : 'info',
      lastAction: action?.last_action ?? null,
      lastActionLabel: actionLabel(action?.last_action),
      lastChapter: action?.chapter ?? null,
      actions: action?.actions ?? [],
      registered: true,
    })
  }
  for (const [id, action] of Object.entries(folded)) {
    if (seen.has(id)) continue
    rows.push({
      id,
      description: '记忆里出现过，但全书大纲没有登记',
      planted: null,
      target: null,
      status: '未登记',
      level: 'warn',
      lastAction: action?.last_action ?? null,
      lastActionLabel: actionLabel(action?.last_action),
      lastChapter: action?.chapter ?? null,
      actions: action?.actions ?? [],
      registered: false,
    })
  }
  const order = { 逾期: 0, 缺动作: 1, 推进中: 2, 埋: 3, 待埋: 4, 未登记: 5, 已收: 6 }
  rows.sort((left, right) => (order[left.status] ?? 9) - (order[right.status] ?? 9) || (left.planted ?? 9999) - (right.planted ?? 9999))
  return rows
}

/** Chapter summaries in reading order. */
function summaryRows(snapshot) {
  const records = new Map((snapshot?.memoryRecords ?? []).map((record) => [record.chapter, record]))
  const rows = []
  for (const chapter of [...(snapshot?.chapters ?? [])].sort((left, right) => left.chapter - right.chapter)) {
    if (!chapter.hasText) continue
    const record = records.get(chapter.chapter)
    rows.push({
      chapter: chapter.chapter,
      title: chapter.title || '',
      volume: chapter.volume ?? null,
      words: chapter.words ?? 0,
      summary: record?.summary ?? '',
      events: Array.isArray(record?.events) ? record.events.map((event) => String(event?.description ?? event)).filter(Boolean) : [],
      fresh: record ? record.fresh !== false : null,
      missing: !record,
      stale: record?.fresh === false,
    })
  }
  return rows
}

/**
 * Build the tracking model from a book snapshot.
 * @param {object} snapshot - `buildSnapshot()` result.
 * @returns {object} tracking model used by the UI, markdown sheets and tools.
 */
export function trackingModel(snapshot) {
  const status = snapshot?.status ?? {}
  const book = snapshot?.book ?? {}
  const written = status.writtenChapters ?? (snapshot?.chapters ?? []).filter((row) => row.hasText).length
  const total = book.totalChapters ?? null
  const percent = total && total > 0 ? Math.min(100, Math.round((written / total) * 100)) : 0
  const journey = snapshot?.journey ?? computeJourney(snapshot)
  const volumes = volumeGroups(snapshot).map((group) => ({
    volumeNo: group.volumeNo,
    title: group.title,
    start: group.start,
    end: group.end,
    total: group.total,
    written: group.written,
    percent: group.total > 0 ? Math.min(100, Math.round((group.written / group.total) * 100)) : 0,
  }))
  const summaries = summaryRows(snapshot)
  const foreshadowing = foreshadowingRows(snapshot)
  const characters = characterRows(snapshot)
  const openForeshadowing = foreshadowing.filter((item) => item.status !== '已收')
  const progress = {
    written,
    total,
    percent,
    words: status.totalWords ?? 0,
    nextChapter: status.nextChapter ?? (written + 1),
    lastWrittenChapter: status.lastWrittenChapter ?? 0,
    memory: {
      recorded: status.memory?.recorded ?? 0,
      missing: status.memory?.missing ?? [],
      stale: status.memory?.stale ?? [],
    },
    stage: journey?.stage ?? 'writing',
    stageLabel: journey?.stageLabel ?? '写正文',
    nextStep: journey?.action?.label ?? '',
    nextDescription: journey?.action?.description ?? '',
    volumes,
  }
  return {
    generatedAt: new Date().toISOString(),
    book: { title: book.title ?? '', genre: book.genre ?? '' },
    progress,
    summaries,
    foreshadowing,
    openForeshadowing,
    characters,
    checklist: journey?.checklist ?? [],
    memo: typeof book.memo === 'string' ? book.memo : '',
  }
}

/** Render the progress sheet. */
function progressMarkdown(model) {
  const { progress, checklist, summaries } = model
  const lines = [
    `# 进度：${model.book.title}`,
    '',
    '> 由 Narracat · 叙述猫根据正文、章节记忆与全书大纲自动生成；更新于 ' + model.generatedAt + '。',
    '> 不要手改这一页；要补记忆用章节记忆工具，要记作者的话写 `tracking/写作备忘.md`。',
    '',
    '## 当前',
    '',
    `- 当前进度：已写 ${progress.written} 章${progress.total ? ` / 计划 ${progress.total} 章（${progress.percent}%）` : '（还没定计划章数）'}`,
    `- 总字数：${Number(progress.words).toLocaleString()} 字`,
    `- 下一章：第 ${progress.nextChapter} 章`,
    `- 下一步：${progress.nextStep || '继续写'}`,
    progress.nextDescription ? `- 这一步：${progress.nextDescription}` : '',
    `- 记忆覆盖：已记 ${progress.memory.recorded} 章${progress.memory.missing.length ? `；缺记忆 ${progress.memory.missing.length} 章（${progress.memory.missing.slice(0, 12).map((n) => `第 ${n} 章`).join('、')}${progress.memory.missing.length > 12 ? ' 等' : ''}）` : ''}${progress.memory.stale.length ? `；过期 ${progress.memory.stale.length} 章` : ''}`,
    '',
    '## 卷进度',
    '',
    ...progress.volumes.map((volume) => `- ${volume.title}：\`${bar(volume.percent)}\` ${volume.written}/${volume.total}`),
    progress.volumes.length === 0 ? '- 还没有分卷。' : '',
    '',
    '## 待处理',
    '',
    ...(checklist.length > 0
      ? checklist.filter((item) => item.level !== 'good').map((item) => `- ${item.label}${item.detail ? `：${item.detail}` : ''}`)
      : ['- 没有明显的待处理项。']),
    '',
    '## 最近写过的章',
    '',
    '| 章 | 标题 | 字数 | 记忆 |',
    '| --- | --- | --- | --- |',
    ...summaries.slice(-8).reverse().map((row) => `| 第 ${row.chapter} 章 | ${cell(row.title)} | ${row.words} | ${row.missing ? '缺' : row.stale ? '过期' : '在'} |`),
    '',
  ]
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

/** Render the chapter summary sheet. */
function summariesMarkdown(model) {
  const groups = new Map()
  for (const row of model.summaries) {
    const key = row.volume === null ? '未分卷' : `第 ${row.volume} 卷`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  const lines = [
    '# 章节摘要',
    '',
    '> 由 Narracat · 叙述猫根据每章记忆生成；更新于 ' + model.generatedAt + '。',
    '> 记忆的源头是提交时的本章摘要与事件；要改摘要请重记那一章（不重发正文）。',
    '',
  ]
  for (const [group, rows] of groups) {
    lines.push(`## ${group}`, '')
    for (const row of rows) {
      lines.push(`### 第 ${row.chapter} 章 ${row.title}`.trim())
      if (row.missing) {
        lines.push('- （还没有本章记忆；写完提交或补记后会出现摘要。）', '')
        continue
      }
      lines.push(row.summary || '- （摘要为空）')
      if (row.events.length > 0) {
        lines.push('', ...row.events.map((event) => `- ${event}`))
      }
      if (row.stale) lines.push('', '- ⚠ 正文在这份摘要之后改过，摘要可能过期。')
      lines.push('')
    }
  }
  if (model.summaries.length === 0) lines.push('还没有已写章节。', '')
  return lines.join('\n').trimEnd() + '\n'
}

/** Render the foreshadowing sheet. */
function foreshadowingMarkdown(model) {
  const open = model.openForeshadowing.length
  const overdue = model.foreshadowing.filter((item) => item.status === '逾期').length
  const lines = [
    '# 伏笔表',
    '',
    '> 由 Narracat · 叙述猫根据全书大纲的伏笔登记与各章记忆的伏笔动作生成；更新于 ' + model.generatedAt + '。',
    '> 状态：待埋 / 埋 / 推进中 / 已收 / 逾期 / 缺动作 / 未登记。逾期与缺动作需要作者或 Agent 看一眼。',
    '',
    `共 ${model.foreshadowing.length} 条 · 未收 ${open} 条 · 逾期 ${overdue} 条`,
    '',
    '| # | 伏笔 | 埋设 | 计划回收 | 状态 | 最近动作 | 依据章 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...model.foreshadowing.map((item) => `| ${cell(item.id)} | ${cell(item.description)} | ${item.planted ?? '—'} | ${item.target ?? '—'} | ${item.status} | ${item.lastActionLabel || '—'} | ${item.lastChapter ?? '—'} |`),
    '',
  ]
  return lines.join('\n') + '\n'
}

/** Render the character-state sheet. */
function charactersMarkdown(model) {
  const lines = [
    '# 人物状态',
    '',
    '> 由 Narracat · 叙述猫根据人物档案与各章记忆的状态变化在读取时折叠生成；更新于 ' + model.generatedAt + '。',
    '> 当前状态只显示截至最后一章的折叠结果；正文改过后，对应章节的记忆会标为过期。',
    '',
  ]
  if (model.characters.length === 0) {
    lines.push('还没有人物档案，也没有记过人物状态。', '')
    return lines.join('\n') + '\n'
  }
  for (const person of model.characters) {
    const identity = person.identity
    const bits = []
    if (identity?.gender) bits.push(identity.gender)
    if (identity?.age) bits.push(`${String(identity.age).replace(/\s*岁$/, '')} 岁`)
    if (Array.isArray(identity?.aliases) && identity.aliases.length > 0) bits.push(`别名：${identity.aliases.join('、')}`)
    lines.push(`## ${person.name}`)
    if (bits.length > 0) lines.push(`- 身份：${bits.join(' · ')}`)
    if (person.portrait) lines.push(`- 速写：${person.portrait.slice(0, 240)}${person.portrait.length > 240 ? '…' : ''}`)
    if (person.current.length === 0) {
      lines.push('- 当前状态：还没有记过状态变化。')
    } else {
      lines.push('- 当前状态：')
      for (const state of person.current.slice(0, 12)) {
        lines.push(`  - ${state.label}：${stateValue(state.value)}${state.chapter ? `（第 ${state.chapter} 章）` : ''}`)
      }
    }
    if (person.recent.length > 0) {
      lines.push('- 最近变化：')
      for (const change of person.recent) {
        lines.push(`  - 第 ${change.chapter} 章：${change.label} ${operationLabel(change.operation)} ${stateValue(change.value)}`)
      }
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

/**
 * Render one tracking sheet.
 * @param {object} model - from `trackingModel`.
 * @param {'progress'|'summaries'|'foreshadowing'|'characters'} kind - which sheet.
 * @returns {string} markdown.
 */
export function trackingMarkdown(model, kind) {
  if (kind === 'summaries') return summariesMarkdown(model)
  if (kind === 'foreshadowing') return foreshadowingMarkdown(model)
  if (kind === 'characters') return charactersMarkdown(model)
  return progressMarkdown(model)
}

/** Paths of the generated sheets, relative to the book. */
export const TRACKING_PATHS = {
  progress: 'tracking/进度.md',
  summaries: 'tracking/章节摘要.md',
  foreshadowing: 'tracking/伏笔表.md',
  characters: 'tracking/人物状态.md',
}

/** The authored memo, never generated over. */
export const MEMO_PATH = 'tracking/写作备忘.md'

/** Starter memo for a new book. */
export const MEMO_STARTER = `# 写作备忘

> 这里放作者的话、待办和临时提醒。Agent 写下一章前会读到它。
> 自动生成的进度、摘要、伏笔和人物状态在同一个目录下，不要手改那四份。

## 备忘录

- （在这里写：作者的决定、要盯的细节、还没想好的地方。）

## 待办

- （可选）
`

/**
 * A compact memory brief for writing one chapter: what a general Agent would
 * read before drafting (progress, recent summaries, character states, open
 * threads, author notes).
 *
 * @param {object} model - from `trackingModel`.
 * @param {number} chapter - target chapter.
 * @param {{ recent?: number }} [options] - how many previous summaries.
 * @returns {object} brief.
 */
export function memoryBrief(model, chapter, options = {}) {
  const recent = Math.max(1, Math.min(20, Number(options.recent ?? 10)))
  const previous = model.summaries.filter((row) => row.chapter < chapter).slice(-recent)
  const due = model.openForeshadowing.filter((item) => {
    const target = item.target
    const planted = item.planted
    if (planted !== null && planted >= chapter) return false
    return target === null || target >= chapter
  })
  return {
    chapter,
    progress: model.progress,
    recent_chapters: previous.map((row) => ({
      chapter: row.chapter,
      title: row.title,
      summary: row.summary,
      events: row.events.slice(0, 6),
      memory: row.missing ? 'missing' : row.stale ? 'stale' : 'fresh',
    })),
    character_states: model.characters
      .filter((person) => person.current.length > 0)
      .map((person) => ({
        name: person.name,
        stage: person.stage,
        current: person.current,
        recent: person.recent,
      })),
    foreshadowing_due: due,
    foreshadowing_open: model.openForeshadowing.slice(0, 50),
    foreshadowing_open_total: model.openForeshadowing.length,
    author_notes: model.memo,
    checklist: model.checklist,
  }
}
