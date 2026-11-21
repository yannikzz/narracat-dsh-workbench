/**
 * The book's single next step.
 *
 * One pure function over a `buildSnapshot()` result. The workbench overview,
 * the agent's `novel_journey` tool, and the export checklist all read the same
 * answer, so the UI and the Agent cannot drift into two different "next steps".
 *
 * The shape is deliberately small: a novice sees one title, one sentence, one
 * primary action, and a short health strip. Everything else stays in the book.
 */

/** Four stages a first-time author can hold in their head. */
export const JOURNEY_STAGES = [
  { id: 'setup', label: '开书' },
  { id: 'outline', label: '搭骨架' },
  { id: 'writing', label: '写正文' },
  { id: 'done', label: '完本' },
]

const STAGE_INDEX = Object.fromEntries(JOURNEY_STAGES.map((stage, index) => [stage.id, index]))

/** A premise card counts when it has at least one non-empty field. */
function hasCard(cards, name) {
  const card = (Array.isArray(cards) ? cards : []).find((row) => row?.card === name)
  return Array.isArray(card?.fields) && card.fields.some((field) => String(field?.value ?? '').trim().length > 0)
}

/** The premise cards that decide whether the book is still in setup. */
const CORE_PREMISE_CARDS = ['core_hook', 'central_dramatic_question', 'protagonist_desire', 'antagonistic_force']

/**
 * Whether the book's core premise is settled enough to leave setup. One card
 * is too little (a hook alone is not a book); three of the four core cards
 * match the setup conversation's "hook, question, want" sequence.
 */
function premiseReady(snapshot) {
  const cards = snapshot?.premise?.cards ?? []
  const filled = CORE_PREMISE_CARDS.filter((name) => hasCard(cards, name)).length
  return filled >= 3
}

/** Whether the book has a usable outline (storylines or a volume). */
function outlineReady(snapshot) {
  const outline = snapshot?.outline
  if (!outline) return false
  const storylines = Array.isArray(outline.storylines) ? outline.storylines : []
  const volumes = Array.isArray(outline.raw?.volumes) ? outline.raw.volumes : []
  const volumePlan = Array.isArray(outline.raw?.volume_plan) ? outline.raw.volume_plan : []
  return storylines.length > 0 || volumes.length > 0 || volumePlan.length > 0
}

/** Find the first chapter that still needs work, in reading order.
 *  Missing chapters may not have a row yet (no outline, no manuscript), so gaps
 *  are synthesised from the highest planned/written chapter number. */
function pendingChapter(chapters, written) {
  const rows = Array.isArray(chapters) ? chapters : []
  const have = new Set((written ?? []).map((row) => row.chapter))
  const highest = rows.reduce((max, row) => Math.max(max, Number.isInteger(row?.chapter) ? row.chapter : 0), 0)
  const lastWritten = (written ?? []).reduce((max, row) => Math.max(max, row.chapter ?? 0), 0)
  for (let chapter = 1; chapter <= Math.max(highest, lastWritten); chapter += 1) {
    if (have.has(chapter)) continue
    return rows.find((row) => row.chapter === chapter) ?? { chapter, hasText: false, hasOutline: false }
  }
  // An outline may exist with no chapter rows yet: the first thing needed is
  // the chapter outline for chapter 1, not "plan more".
  if (highest === 0 && lastWritten === 0) return { chapter: 1, hasText: false, hasOutline: false }
  return rows.find((row) => !row?.hasText) ?? null
}

/** Human list, e.g. "第 1、2、5 章". */
function chapterList(numbers, limit = 8) {
  const clean = [...new Set(numbers)].filter((value) => Number.isInteger(value) && value > 0).sort((left, right) => left - right)
  const shown = clean.slice(0, limit).map((value) => `第 ${value} 章`)
  return clean.length > limit ? `${shown.join('、')} 等 ${clean.length} 章` : shown.join('、')
}

/**
 * The full-health checklist used by the overview strip and the export dialog.
 * It never blocks writing or exporting; it only tells the author what is left.
 *
 * @param {object} snapshot - a `buildSnapshot()` result.
 * @returns {object[]} ordered checklist items.
 */
export function computeChecklist(snapshot) {
  const items = []
  const chapters = Array.isArray(snapshot?.chapters) ? snapshot.chapters : []
  const written = chapters.filter((row) => row?.hasText)
  const status = snapshot?.status ?? {}
  const target = snapshot?.book?.wordsPerChapter ?? 0
  const total = snapshot?.book?.totalChapters ?? null

  if (written.length === 0) {
    items.push({
      id: 'no-text',
      level: 'info',
      label: '还没有正文',
      detail: '写完第一章后，这里会开始记录进度。',
    })
  }

  const last = written.reduce((max, row) => Math.max(max, row.chapter ?? 0), 0)
  if (last > 0) {
    const have = new Set(written.map((row) => row.chapter))
    const gaps = []
    for (let chapter = 1; chapter <= last; chapter += 1) if (!have.has(chapter)) gaps.push(chapter)
    if (gaps.length > 0) {
      items.push({
        id: 'gap',
        level: 'warn',
        label: `${chapterList(gaps)} 还没有正文`,
        detail: '前后章之间缺章，读者会断。补上或把后面的章号顺延。',
        chapters: gaps,
      })
    }
  }

  if (written.length > 0 && !snapshot?.premise) {
    items.push({
      id: 'no-premise',
      level: 'info',
      label: '还没有立项卡',
      detail: '书已经在写了，但题材承诺、核心钩子还没落成文字；补上能帮 Agent 稳住方向。',
    })
  }
  if (written.length > 0 && !snapshot?.outline) {
    items.push({
      id: 'no-outline',
      level: 'info',
      label: '还没有全书大纲',
      detail: '现在靠正文往下写；补一份大纲能看清主线走到哪、还剩多少。',
    })
  }

  const missingMemory = status?.memory?.missing ?? []
  if (missingMemory.length > 0) {
    items.push({
      id: 'memory-missing',
      level: 'warn',
      label: `${missingMemory.length} 章还没有记记忆`,
      detail: `${chapterList(missingMemory)}。记忆是前情、人物状态和伏笔的依据，建议逐章补记。`,
      chapters: missingMemory,
    })
  }
  const staleMemory = status?.memory?.stale ?? []
  if (staleMemory.length > 0) {
    items.push({
      id: 'memory-stale',
      level: 'warn',
      label: `${staleMemory.length} 章的记忆过期了`,
      detail: `${chapterList(staleMemory)}。正文在记忆之后改过，旧摘要不能再当前情用。`,
      chapters: staleMemory,
    })
  }

  const short = target > 0 ? written.filter((row) => (row.words ?? 0) < target * 0.7) : []
  if (short.length > 0) {
    items.push({
      id: 'short',
      level: 'info',
      label: `${short.length} 章比目标字数短`,
      detail: `目标每章 ${target.toLocaleString()} 字；偏短的是 ${chapterList(short.map((row) => row.chapter))}。`,
      chapters: short.map((row) => row.chapter),
    })
  }

  const failed = (snapshot?.reviews ?? []).filter((review) => review?.verdict === 'fail')
  if (failed.length > 0) {
    items.push({
      id: 'review-fail',
      level: 'warn',
      label: `${failed.length} 章审校没过`,
      detail: `${chapterList(failed.map((review) => review.chapter))}。审校只查不改，改完再复看。`,
      chapters: failed.map((review) => review.chapter),
    })
  }

  const unresolved = Object.entries(snapshot?.foreshadowingStates ?? {})
    .filter(([, state]) => state?.last_action !== 'reveal')
    .map(([id]) => id)
  if (unresolved.length > 0) {
    items.push({
      id: 'foreshadowing',
      level: 'info',
      label: `${unresolved.length} 条伏笔还没揭晓`,
      detail: '写收尾前对一遍：该揭的揭，该留白的在全书大纲里说清。',
      count: unresolved.length,
    })
  }

  if (total && written.length >= total) {
    items.push({
      id: 'complete',
      level: 'good',
      label: '全书章节已经写齐',
      detail: `计划 ${total} 章，已写 ${written.length} 章。可以做最后的通读与导出。`,
    })
  }

  if (items.length === 0) {
    items.push({ id: 'clean', level: 'good', label: '现在没有明显的坑', detail: '继续按下一步写就好。' })
  }
  return items
}

/** Build the action for one stage. All copy is author-facing, never tool names. */
function actionFor(snapshot, stage, details) {
  const title = snapshot?.book?.title ?? '这本书'
  const chapter = details.chapter
  if (stage === 'setup') {
    return {
      id: 'setup',
      kind: 'agent',
      title: '先定下这本书的核心',
      label: '开始立项',
      description: 'Agent 会一次问你一个问题：写给谁、钩子是什么、主角想要什么。答完就能往下走。',
      prompt: `我想把《${title}》写出来。请带我立项：一次只问一个最关键的问题，先问“这是一本写给谁、让他们期待什么”的书；能从我给的信息里推断的就不要问。问完后把这本书的核心一次定好，再告诉我下一步。`,
    }
  }
  if (stage === 'outline') {
    return {
      id: 'outline',
      kind: 'agent',
      title: '把故事搭成一个骨架',
      label: '规划全书大纲',
      description: '先有全书走向、第一卷和前三章；后面的章纲写到再展开，不用一次想完。',
      prompt: `请帮我为《${title}》搭全书骨架：先给全书梗概、一条主故事线、第一卷的卷纲和段落划分，再细化前 3 章的章纲。不要一次展开全书所有章节；做完告诉我下一步。`,
    }
  }
  if (details.kind === 'plan-chapter') {
    return {
      id: `plan-chapter-${chapter}`,
      kind: 'agent',
      title: `第 ${chapter} 章还差一份章纲`,
      label: `补第 ${chapter} 章大纲`,
      description: '章纲定下这一章的场景、冲突和收束，写的时候就不会飘。',
      prompt: `请为第 ${chapter} 章补一份可写的章纲：场景、冲突、出场人物、这一章改变了什么、收尾留什么钩子。放进大纲；做完告诉我下一步。`,
      chapter,
    }
  }
  if (details.kind === 'plan-more') {
    const next = (details.written ?? 0) + 1
    return {
      id: 'plan-more',
      kind: 'agent',
      title: '已规划的章写完了',
      label: '规划后面的章纲',
      description: `从第 ${next} 章往后补一批（一次 3–5 章），别一次铺满全书。想在这里收尾，也可以告诉 Agent 把计划章数改小。`,
      prompt: `已规划的章都写完了。请帮我规划后面的章纲：先看全书还剩多少章、主线走到哪，再从第 ${next} 章补下一批（一次 3–5 章）。做完告诉我下一步。`,
    }
  }
  if (details.kind === 'write') {
    return {
      id: `write-${chapter}`,
      kind: 'write',
      title: `把第 ${chapter} 章写出来`,
      label: `写第 ${chapter} 章`,
      description: 'Agent 会先取本章资料和前面的记忆，写完走检查、记记忆、发布。你只要看结果。',
      prompt: `写第 ${chapter} 章。先看这本书的写作现状和本章资料；如果本章还没有章纲，先补一份简短的章纲再写。写完保存好，再告诉我结果。`,
      chapter,
    }
  }
  if (details.kind === 'done') {
    return {
      id: 'done',
      kind: 'export',
      title: '全书已经写完',
      label: '完本并导出',
      description: '做一次全书检查，把正文导出成 Word / HTML / Markdown / TXT。',
    }
  }
  return null
}

/**
 * Compute the one next step, the stage, progress, and the health checklist.
 *
 * @param {object} snapshot - a `buildSnapshot()` result.
 * @returns {object} journey payload.
 */
export function computeJourney(snapshot) {
  const chapters = Array.isArray(snapshot?.chapters) ? snapshot.chapters : []
  const written = chapters.filter((row) => row?.hasText)
  const total = snapshot?.book?.totalChapters ?? null
  const pct = total && total > 0 ? Math.min(100, Math.round((written.length / total) * 100)) : 0
  const checklist = computeChecklist(snapshot)
  const progress = {
    written: written.length,
    total,
    planned: chapters.length,
    words: snapshot?.status?.totalWords ?? 0,
    percent: pct,
  }

  let stage = 'writing'
  let details = {}
  if (written.length === 0 && !premiseReady(snapshot)) {
    stage = 'setup'
  } else if (written.length === 0 && !outlineReady(snapshot)) {
    stage = 'outline'
  } else {
    const pending = pendingChapter(chapters, written)
    if (pending) {
      details = { kind: pending.hasOutline ? 'write' : 'plan-chapter', chapter: pending.chapter, written: written.length }
    } else if (total && written.length >= total) {
      stage = 'done'
      details = { kind: 'done' }
    } else {
      details = { kind: 'plan-more', written: written.length }
    }
  }

  const action = actionFor(snapshot, stage, details)
  const lifecycle = STAGE_INDEX[stage] ?? 2

  /** Gentle supporting notes; never a second primary action. */
  const hints = []
  if (stage !== 'setup' && (snapshot?.characters ?? []).length === 0) {
    hints.push('还没有主要人物档案。写之前可以让 Agent 先建 2–3 个，写起来会稳。')
  }
  if (stage === 'setup' && !hasCard(snapshot?.premise?.cards, 'narrator_voice')) {
    hints.push('立项时会顺带定下叙述人称和语气，不用单独准备。')
  }
  if (written.length === 0 && (snapshot?.reviews ?? []).length === 0) {
    hints.push('审校默认不做；想先审一遍，写完在章节里点“审校”。')
  }

  return {
    stage,
    stageLabel: JOURNEY_STAGES[lifecycle]?.label ?? '写正文',
    lifecycle,
    stages: JOURNEY_STAGES,
    action,
    progress,
    hints: hints.slice(0, 2),
    checklist,
    done: stage === 'done',
  }
}

/**
 * A compact version for the agent tool: the checklist can be long.
 * @param {object} journey - from `computeJourney`.
 * @returns {object} compact journey.
 */
export function compactJourney(journey) {
  return {
    stage: journey.stage,
    stage_label: journey.stageLabel,
    progress: journey.progress,
    action: journey.action
      ? {
        id: journey.action.id,
        kind: journey.action.kind,
        title: journey.action.title,
        label: journey.action.label,
        description: journey.action.description,
        chapter: journey.action.chapter ?? null,
        prompt: journey.action.prompt ?? null,
      }
      : null,
    hints: journey.hints,
    checklist: journey.checklist.slice(0, 8).map((item) => ({
      id: item.id,
      level: item.level,
      label: item.label,
      detail: item.detail,
    })),
  }
}
