/**
 * Novel workbench — Agent half.
 *
 * Mounted by the `novel` agent preset, so its tools and skills are scoped to
 * sessions that chose that preset. Contributes:
 *
 * - nine read-only model tools over the `.narracat` book (status, content,
 *   object/query, premise, arc, failed reviews, context pack, prose hygiene);
 * - the Narracat method and craft skills whose tool surface exists today;
 * - nothing that mutates manuscript text: authors write through the workbench,
 *   and the submission pipeline arrives in a later version.
 *
 * @module narracat-dsh-workbench/agent
 */

import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decideEntityProposal,
  decideOntology,
  entityCandidates,
  entityPage,
  getOntology,
  listEntities,
  proposeOntology,
  submitEntityProposals,
  unclassifiedDimensions,
} from './lib/knowledge.js'
import {
  bookInfoSubmit,
  getReview,
  premiseSubmit,
  revisionDraftOpen,
  settingsSubmit,
} from './lib/authoring.js'
import {
  chapterSubmit,
  outlineSubmit,
  reviewSubmit,
} from './lib/submission.js'
import { buildSnapshot } from './lib/project.js'
import { compactJourney, computeJourney } from './lib/journey.js'
import { exportBook } from './lib/export.js'
import { appendTrackingNote, readTracking, refreshTracking } from './lib/tracking-store.js'
import {
  buildContextPack,
  chapterSummary,
  characterStatuses,
  contentRead,
  failedReviews,
  foreshadowingStatus,
  getArc,
  memoryObject,
  memoryQuery,
  memoryBriefForChapter,
  memoryReconcile,
  memoryRecord,
  memoryStatus,
  premiseCards,
  proseHygiene,
  resolveBookForCwd,
  writingStatus,
} from './lib/novel-tools.js'

/** Plugin package root (this file lives at its top level). */
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))

/** Skills copied from Narracat Agent Core and safe with the current tool surface. */
const REGISTERED_SKILLS = [
  // Knowledge skills: references carry the craft; no host tools are needed.
  { dir: 'novel-web-craft', userInvocable: false },
  { dir: 'novel-structure', userInvocable: false },
  { dir: 'novel-setting-craft', userInvocable: false },
  { dir: 'novel-book-ontology', userInvocable: false },
  { dir: 'novel-deslop', userInvocable: false },
  // Method skills whose declared tools exist in this version.
  { dir: 'status', userInvocable: true },
  { dir: 'setup', userInvocable: true },
  { dir: 'write', userInvocable: true },
  { dir: 'plan', userInvocable: true },
  { dir: 'world', userInvocable: true },
  { dir: 'rewrite', userInvocable: true },
  { dir: 'review', userInvocable: true },
  { dir: 'revise-premise', userInvocable: true },
  { dir: 'sync-chapter-memory', userInvocable: true },
  { dir: 'organize-entities', userInvocable: true },
  { dir: 'organize-ontology', userInvocable: true },
]

/** The model-facing context once per run, kept short on purpose. */
const SECTION = `你在「Narracat · 叙述猫」里工作：作品就是工作区里的一个 .narracat 目录，正文与结构化数据都是文件。
- 先取材料再判断：写作现状、正文、人物与设定、大纲、上下文包都有工具，别靠猜，也别自己去翻目录。
- 提交才保存：正式正文用 project_chapter_submit（检查 → 记忆 → 发布），审校用 novel_submit_review；没提交成功不要声称保存、发布或记住。
- 不编造：查不到的留白、写「无」或如实说明，绝不用推测把档案填满。
- 对作者只说人话：不出现字段名、文件名、工具名、英文枚举；信息全保留，黑话全翻译。
- 写法归作者与写章手艺：方法 Skill 只给原则与判据，不替作者定口吻、句子长短、描写多少。
- 推进顺序是：立项 → 大纲 → 章纲 → 写章 → 审校或改写 → 下一章 → 完本导出。作者问「接下来做什么」「我该写哪」或刚打开一本书时，先调 novel_journey；只推进它给的那一件事，不要同时铺开立项、大纲和写章。
- 新书先立项再动笔：没有立项卡时按 setup 方法一次只问一个最关键的问题，能推断的不问，不要让作者自己填表。每完成一步，用一句话说「存下了什么」「下一步是什么」。
- 这个工作区还没有作品时，请作者在工作台点「新建作品」；不要自己在对话里造目录，也不要假装已经有书。
- 作者要成稿时用 novel_export_book（Word / HTML / Markdown / TXT）；导出前先看 novel_journey 的体检清单，把还开着的坑用一句人话说清。
- 写一章之前先调 novel_memory_brief：它给进度、最近十章摘要、人物当前状态、未收伏笔和作者的写作备忘。上下文包也会带这些；不要凭印象补前情。
- 追踪四张表（进度 / 章节摘要 / 伏笔表 / 人物状态）由程序刷新，不要用文件工具手改；作者的决定和提醒用 novel_tracking_note 记进写作备忘，下一章会读到。表缺失或过期时用 novel_tracking_refresh 重建。`

/** Read and parse the frontmatter subset Narracat skills use. */
function parseSkillFile(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  const meta = {}
  let body = raw
  if (match) {
    body = raw.slice(match[0].length)
    for (const line of match[1].split(/\r?\n/)) {
      const entry = /^([\w-]+):\s*(.*)$/.exec(line)
      if (!entry) continue
      let value = entry[2].trim()
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)
      } else if (/^(true|false)$/.test(value)) {
        value = value === 'true'
      } else {
        value = value.replace(/^['"]|['"]$/g, '')
      }
      meta[entry[1]] = value
    }
  }
  return { meta, body }
}

/** Rewrite Narracat path and MCP-name references for this installation. */
function rewriteSkillBody(body) {
  return body
    .replaceAll('${CLAUDE_PLUGIN_ROOT}', PLUGIN_ROOT)
    .replaceAll('mcp__narracat_memory__', '')
}

/** Throw a readable error for a bad integer argument. */
function requireInteger(args, name, minimum = 1) {
  const value = args?.[name]
  if (!Number.isInteger(value) || value < minimum) throw new Error(`参数 ${name} 必须是 ≥ ${minimum} 的整数`)
  return value
}

/** Register one tool definition with a shared shape, bound to one plugin context. */
function toolDefinition(ctx, name, description, parameters, title, run) {
  return {
    name,
    description,
    parameters,
    output: {
      schema: {},
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    presentCall: (args) => ({ card: 'generic', title, kind: 'read', rawInput: args }),
    async execute(args, exec) {
      const book = await resolveBookForExec(ctx, exec)
      return await run(book, args && typeof args === 'object' ? args : {})
    },
  }
}

/** Run a saved mutation, then refresh the visible memory sheets. */
async function withTrackingRefresh(run, book, args) {
  const result = await run(book, args)
  if (result?.status === 'saved') {
    try {
      result.tracking = await refreshTracking(book)
    } catch (error) {
      result.tracking_warning = `追踪文件没有刷新：${error instanceof Error ? error.message : String(error)}。可以调 novel_tracking_refresh 重试。`
    }
  }
  return result
}

/**
 * Resolve the book a tool call works on from the calling Session.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} exec - tool run context.
 * @returns {Promise<string>} the real book directory.
 */
async function resolveBookForExec(ctx, exec) {
  const session = exec?.agent?.session
  if (!session) throw new Error('这个工具需要在一个 Agent 会话里调用')
  const workingDirectory = ctx.get('workingDirectory')
  const cwd = (workingDirectory && typeof workingDirectory.get === 'function' ? workingDirectory.get(session) : undefined)
    ?? session.header?.cwd
  return await resolveBookForCwd(cwd)
}

const objectSchema = (properties, required = []) => ({
  type: 'object',
  properties,
  ...(required.length > 0 ? { required } : {}),
  additionalProperties: false,
})

/** Cordis plugin name. */
export const name = 'novel-workbench-agent'
/** Registries this plugin contributes to. */
export const inject = ['tools', 'skills', 'systemPrompt']

/**
 * Resolve a real path for an existing or not-yet-created target: walk up to
 * the nearest existing ancestor (macOS /var is a symlink to /private/var) and
 * append the missing tail.
 */
function realPathOf(path) {
  const missing = []
  let current = path
  for (let steps = 0; steps < 40; steps += 1) {
    try {
      const real = realpathSync(current)
      return missing.length === 0 ? real : join(real, ...missing)
    } catch {
      const parent = dirname(current)
      if (parent === current) return path
      missing.unshift(basename(current))
      current = parent
    }
  }
  return path
}

/**
 * Synchronous book detection for the tool guard (no await allowed there).
 * When a target path is supplied, return the book that contains it even in a
 * multi-book workspace; the guard must fail closed, not disappear, just
 * because the workspace holds more than one book.
 * @param {string} cwd - session working directory.
 * @param {string} [targetAbs] - resolved absolute write target.
 * @returns {string | null} the containing book's real path, or null.
 */
function bookSync(cwd, targetAbs) {
  if (typeof cwd !== 'string' || cwd.length === 0) return null
  const isBook = (dir) => existsSync(join(dir, '.narracat', 'config.yaml'))
  const skip = new Set(['node_modules', 'dist', 'build', 'out', 'target', 'vendor'])
  /** @type {string[]} */
  const found = []
  if (isBook(cwd)) found.push(realPathOf(cwd))
  const queue = [{ dir: cwd, depth: 0 }]
  while (queue.length > 0 && found.length < 100) {
    const next = queue.shift()
    if (next.depth >= 2) continue
    let entries
    try {
      entries = readdirSync(next.dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.') || skip.has(entry.name)) continue
      const child = join(next.dir, entry.name)
      if (isBook(child)) found.push(realPathOf(child))
      else if (next.depth + 1 < 2) queue.push({ dir: child, depth: next.depth + 1 })
    }
  }
  if (typeof targetAbs === 'string' && targetAbs.length > 0) {
    const inside = found.filter((dir) => targetAbs === dir || targetAbs.startsWith(`${dir}${sep}`))
    inside.sort((left, right) => right.length - left.length)
    return inside[0] ?? null
  }
  return found.length === 1 ? found[0] : null
}

/** Deny agent tools that would bypass the submission pipeline. */
function registerManuscriptGuard(ctx) {
  ctx.effect(() => ctx.tools.guard((execution) => {
    if (!['write', 'edit', 'apply_patch'].includes(execution.name)) return undefined
    const session = execution.agent?.session
    if (!session) return undefined
    const workingDirectory = ctx.get('workingDirectory')
    const cwd = (workingDirectory && typeof workingDirectory.get === 'function' ? workingDirectory.get(session) : undefined)
      ?? session.header?.cwd
    const args = execution.arguments
    const raw = String(args?.path ?? args?.file_path ?? '')
    if (raw.length === 0) return undefined
    const abs = realPathOf(isAbsolute(raw) ? resolve(raw) : resolve(cwd, raw))
    const book = bookSync(cwd, abs)
    if (!book) {
      // Fail closed for paths that look like a book, even when the layout is
      // too deep for the synchronous detector.
      const normalized = abs.split(sep).join('/')
      if (normalized.includes('/.narracat/') || /\/(manuscript|bible|outline|tracking|reviews)\//.test(normalized)) {
        return { reason: '无法确认这个路径属于哪本书；先让工作台打开作品，再在作品目录内写。' }
      }
      return undefined
    }
    // Allowlist, not a blocklist: agent file tools may only write drafts,
    // revision copies and deep-review reports. Everything else in a book goes
    // through the structured submit tools, so a prompt-injected agent cannot
    // rewrite config/AGENTS.md/outline/entities by opening a raw file.
    const allowed = [
      join(book, '.narracat', 'staging'),
      join(book, '.narracat', 'revisions'),
      join(book, 'reviews'),
    ]
    for (const directory of allowed) {
      if (abs === directory || abs.startsWith(`${directory}${sep}`)) return undefined
    }
    return {
      reason: 'Agent 只能直接写暂存区（.narracat/staging/）、改写稿（.narracat/revisions/）和审读报告（reviews/）；正文用 project_chapter_submit，设定/大纲/记忆用各自的提交工具。',
    }
  }), 'novel: manuscript guard')
}

/** Agent-role names Narracat prompts dispatch with `Task(...)`. */
const TASK_ROLES = ['chapter-writer', 'outline-architect', 'world-curator', 'continuity-editor']

/** Mentions of tools this version has not ported yet. */
const UNPORTED = [
  ['`project_pending_resolve`', '处理待办（本版本未接入：如实告诉作者）'],
  ['`novel_list_candidate_characters`', '候选角色登记（本版本未接入）'],
  ['`project_memory_write`', '记录作者决定（本版本未接入：提醒作者自己记进本书说明）'],
  ['`project_diagnostics_report`', '检查报告登记（本版本未接入：用作者的话汇报，不要声称已登记）'],
  ['`novel_memory_source`', '`project_content_read`'],
  ['`project_memory_source`', '`project_content_read`'],
  ['`project_ontology_propose`', '`novel_ontology_propose`'],
  ['`novel_memory_source({chapter:N})`', '`project_content_read({chapter:N})`'],
  ['每个核对过的章调一次 `project_diagnostics_report({chapter, items})`：仍成立的正文矛盾每条给逐字证据；没有矛盾也传空数组。只做了体检时，为作者要求核对的章登记一次。登记只进作者的「待处理」，不改正文或记忆；回执里 suppressed 的条目是作者已记为决定的，回复里不再当新问题提。', '仍成立的正文矛盾逐条用作者的话汇报（本版本没有检查报告登记）：每条给逐字证据；没有矛盾就直说没发现。不要声称已登记到「待处理」，也不改正文或记忆。'],
]

/** Per-skill adaptations for the DSH tool surface (applied after path rewrite). */
const SKILL_PATCHES = {
  write: [
    [
      '依据记录只带作者对本章说过的话，以及宿主附的本章决定与提醒里这章用得上的（`source_records` 按附上的记录编号与修订号填，宿主把原文交给写手）；立项问答卡不带。',
      '依据记录只带作者对本章说过的话，以及这一章用得上的作者决定与提醒（把作者原话摘给写手，不转述成规则）；立项问答卡不带。',
    ],
    [
      '保存（`saved`）：先把结果里审校判为要登记的新增（含写手漏报的）用 `project_settings_submit` 一次交齐——势力、规矩、会再用到的地点、等级价钱这类刻度写成世界设定，新关系追加进人物关系，新人物照新角色契约处置、不建完整档案，只记正文里已经写出的、不另编——再收尾。',
      '保存（`saved`）：把结果里要登记的新增（势力、规矩、会再用到的地点、刻度、新关系、新人物）用 `project_settings_submit` 一次交齐——只记正文里已经写出的、不另编，新人物先建简档——再收尾。',
    ],
    [
      '这章记进设定的（含留作候选的人物）回复下方各有一张卡，只用一句话说记了几项、见下方卡片，不逐条列；',
      '这章记进设定的（含留作候选的人物）在收尾里用一句话说明，不逐条列；',
    ],
    [
      '写手「本章没写成的」里要先问作者的、审校标了要先问作者的新增，用故事里的话问一句要不要加、留不留；',
      '写手「本章没写成的」里要先问作者的、审校（若做了）标了要先问作者的新增，用故事里的话问一句要不要加、留不留；',
    ],
    [
      '派发只给章号、路径（含上下文包给的申报路径）与参数',
      '派发只给章号、上下文包给的草稿路径与参数',
    ],
    [
      '写手交稿附本章新增申报，也写进申报路径交审校核对。',
      '写手交稿若附本章新增申报，写在暂存区的 ch-NNN.declarations.json；主会话在提交前核对。',
    ],
    [
      '给出拦稿项（提交时会复扫、命中就退回）与只作线索的 AI 腔提示',
      '给出只作线索的 AI 腔提示（提交时会复扫并附提醒，不拦稿）',
    ],
    [
      '提交程序会复扫，拦稿项命中会退回。',
      '提交程序会复扫并附提醒，不拦稿。',
    ],
  ],
  plan: [
    [
      '协作档在全书骨架、分卷入库后宿主会问作者，会删掉已有卷时两档都先问作者——这些卡宿主来发，你不用另问。',
      '本版本在全书骨架、分卷入库后不弹宿主确认，也不自动问作者；要删掉已有卷时必须先问作者，其余按立项卡与作者原话决定。',
    ],
    [
      '再交引擎校验入库，引擎先全查、有错不写，大纲文件由引擎渲染。',
      '再交 project_outline_submit：整批先校验、有错一件不写，通过后直接写结构化大纲（不另渲染文件）。',
    ],
    [
      '`issues` 逐条是要改的地方（引擎校验、起点或终点不对、已有章纲、作者没同意删卷……），带 `authorAnswer` 时是作者的原话。按问题定点修后再交，别整组重来；`attemptsLeft` 用完时宿主会直接问作者。',
      '`issues` 逐条是要改的地方（起点或终点不对、已有章纲、作者没同意删卷……）。按问题定点修后再交，别整组重来；本版本没有 attemptsLeft，也没有 authorAnswer。',
    ],
    [
      '**`saved`**：这一层已入库。`confirmation` 是协作档宿主刚问过作者的结论：`confirmed` 就接着往下；`adjust` 就按 `authorAnswer`（作者原话）改好这一层再交。`window.remaining` 是这次细化范围里还没交的章。`reminders` 是只提醒不拦的（如伏笔类型与兑现章对不上），写进结尾汇报。',
      '**`saved`**：这一层已入库。本版本没有 `confirmation` 与 `window`；`reminders` 是只提醒不拦的（如伏笔类型与兑现章对不上），写进结尾汇报。',
    ],
    ['`layer: window`', '窗口候选（本版本未接入）'],
    [
      '`confirmation` 是协作档宿主刚问过作者的结论',
      '本版本没有宿主确认，`confirmation` 字段不会出现；作者原话在对话里',
    ],
  ],
}

/** Apply the shared and per-skill adaptations, then append the DSH note. */
function adaptSkillBody(dir, body) {
  let next = body.replaceAll('AskUserQuestion', 'ask_user_question')
  for (const role of TASK_ROLES) {
    next = next.replaceAll(`Task(${role})`, `subagent（岗位提示词见 ${PLUGIN_ROOT}/agents/${role}.md；文中 <插件根目录> 指 ${PLUGIN_ROOT}）`)
  }
  for (const [needle, replacement] of UNPORTED) next = next.replaceAll(needle, replacement)
  for (const [needle, replacement] of SKILL_PATCHES[dir] ?? []) next = next.replaceAll(needle, replacement)
  const root = PLUGIN_ROOT
  const notes = {
    write: `
## 本版本（Narracat · 叙述猫）适配

- 写章前先调 novel_memory_brief（或 novel_build_writing_context_pack）：进度、最近十章摘要、人物当前状态、未收伏笔与作者的写作备忘都在里面；不要凭印象补前情。
- 追踪四张表由程序在提交/记忆/大纲/设定保存后刷新，不要手改；作者的决定用 novel_tracking_note 记进写作备忘。
- 提交程序不审校：审校可选，派子代理按 ${root}/agents/continuity-editor.md 审，再用 novel_submit_review 交结论；verdict 由程序算。
- project_chapter_submit 必须带 memory：summary 与 events 至少各一；有 state_changes / foreshadowing 就一并写。摘要写这一章发生了什么。
- 同一章最多提交 3 次；用完后用 ask_user_question 问作者，作者同意再带 author_approved_retry 与作者原话 author_quote。
- 没有记忆核对：记忆待同步时如实告诉作者，不要假装核对过。
- 派岗位用 subagent，把岗位契约路径与这次要做的事写进提示词；会话里没有 subagent 工具时自己做完，不要假装派发。
- 没有单独的申报工具：上下文包只给草稿路径；写手若附新增申报，写在 .narracat/staging/ch-NNN.declarations.json，主会话在提交前用 project_settings_submit / project_outline_submit（layer=character）处置。提交程序不会自动读取申报。
`,
    plan: `
## 本版本（Narracat · 叙述猫）适配

- layer 支持 book / volume / volumes / full / chapters / chapter_edit / character；没有 window 候选与 confirmation：细化从最早缺失章起，一批最多 10 章；作者在对话里给了终点就以作者为准并说明。
- 派发用 subagent，把 ${root}/agents/outline-architect.md 与这次要做的事写进提示词；没有 subagent 工具时自己规划，不要假装派发。
- 新设定用 project_settings_submit 一次登记；立项卡用 novel_get_premise_cards 读、novel_submit_premise 交（merge_cards + expected_revision）。
- DSH 版没有独立大纲引擎：project_outline_submit 自己校验并直接写 JSON，不渲染大纲文件；返回 saved / returned / stopped 与 issues，没有 attemptsLeft / authorAnswer / confirmation。
`,
    world: `
## 本版本（Narracat · 叙述猫）适配

- project_settings_submit 支持人物档案（正文 + 身份）、世界设定与人物关系；整批先校验，有错一件不写。
- 没有待办处理与候选角色登记：遇到时如实说明，不假装做过。
- 派发用 subagent，把 ${root}/agents/world-curator.md 与这次要做的事写进提示词；没有 subagent 工具时自己做完。
- blocking 冲突用 ask_user_question 问作者，一次一问，选项写清代价。
`,
    setup: `
## 本版本（Narracat · 叙述猫）适配

- project_book_info_submit（书名/题材/篇幅/风格）与 novel_submit_premise（立项卡）可用。
- 没有 project_memory_write：作者聊到的写法要求，请作者自己写进本书说明（AGENTS.md），不要声称已经记住。
`,
    rewrite: `
## 本版本（Narracat · 叙述猫）适配

- project_revision_draft_open 可用：在 .narracat/revisions/ch-NNN.md 上改，改完用 project_chapter_submit（chapter + path）提交；正式正文只由提交程序替换。
- 没有记忆核对与设定提交之外的宿主环节：遇到时如实说明。
- 审校可选：novel_submit_review 交结论、novel_get_review 读回；fresh=false 时不要拿旧报告当依据。
`,
    review: `
## 本版本（Narracat · 叙述猫）适配

- 取正文与版本用 project_content_read；需要独立视角时用 subagent（岗位提示词见 ${root}/agents/continuity-editor.md）审，再把结论用 novel_submit_review 交上来；verdict 由程序按 blocker 计算。
- 用 novel_get_review 读回结论与新鲜度（fresh）；fresh=false 时先重新审这一版，不要用旧报告。
- 深审报告可以用 write 写到 reviews/ch-NNN-deep-review.md（这个路径允许写）。
`,
    'organize-entities': `
## 本版本（Narracat · 叙述猫）适配

- novel_list_entity_candidates 给出候选名字，novel_submit_entity_proposals 提交分类，分类先存成待确认。
- 作者决定用 ask_user_question 逐条问（或一次问清），再用 novel_decide_entity_proposal 落实接受/不采用；不要自行接受。
- 需要看某章依据时用 project_content_read 读正文。
`,
    'organize-ontology': `
## 本版本（Narracat · 叙述猫）适配

- novel_ontology_unclassified 列出还没归进本体的状态维度，novel_ontology_propose 提交提议（待确认）。
- 作者决定用 ask_user_question 逐条问，再用 novel_ontology_decide 落实；接受后才会写成这本书的本体。
- novel_get_premise_cards 读题材与设定方向。
`,
    'sync-chapter-memory': `
## 本版本（Narracat · 叙述猫）适配

- 记忆重记后，进度、章节摘要、伏笔表、人物状态会由程序刷新；不要让作者手动改这四张表。
- project_memory_reconcile 只列出哪些章的记忆与正文对不上（stale / missing）；重记用 novel_memory_record 逐章更新。
- 没有检查报告登记：矛盾用作者的话汇报，不要声称已登记。
- 只动 reconcile 列出的章，不要整本重建。
`,
    'revise-premise': `
## 本版本（Narracat · 叙述猫）适配

- novel_get_premise_cards 读卡（带 revision），novel_submit_premise 交改动：只改目标卡时用 merge_cards=true 并带 expected_revision。
- 级联影响评估用 project_content_read 逐章读已完成章；先报告后确认，再写回。
`,
  }
  if (notes[dir]) next += notes[dir]
  return next
}

/**
 * Register the novel tools and the safely usable Narracat skills.
 * @param {import('@deepseek-ai/cordis').Context} ctx - preset-scoped context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_writing_status',
    '写作现状：这本书写了哪些章、下一章该写什么、字数目标、章纲缺口、人物与设定现状。写章、改写、规划大纲或整理设定之前先调它。aspect 决定看哪一面：write（写章）、outline（大纲）、settings（设定）、status（只读总览）。',
    objectSchema({
      aspect: {
        type: 'string',
        enum: ['write', 'outline', 'settings', 'status'],
        description: '要看哪一面；省略按 write。',
      },
    }),
    '查看写作现状',
    (book, args) => writingStatus(book, args),
  )), 'novel: project_writing_status')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_journey',
    '看这本书的下一步：现在处于开书 / 搭骨架 / 写正文 / 完本的哪一段，唯一推荐动作是什么，以及全书体检（缺章、缺记忆、审校没过、伏笔未收等）。作者问「接下来做什么」、刚打开一本书、或你拿不准该推进哪一步时先调它。一次只推进它给的一件事。',
    objectSchema({}),
    '看下一步',
    async (book) => {
      const snapshot = await buildSnapshot(book)
      const journey = computeJourney(snapshot)
      return {
        book: { title: snapshot.book.title, genre: snapshot.book.genre },
        status: snapshot.status,
        ...compactJourney(journey),
      }
    },
  )), 'novel: novel_journey')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_export_book',
    '把这本书的正文导出成一个文件，给作者交稿或备份：docx（Word，默认）/ html（可打印成 PDF）/ md / txt。导出写在作品的 exports/ 下，不改正文；返回文件路径、字数、章数与完本体检。作者说「导出」「要成稿」时用。',
    objectSchema({
      format: { type: 'string', enum: ['docx', 'html', 'md', 'txt'], description: '导出格式；省略按 docx。' },
    }),
    '导出成稿',
    (book, args) => exportBook(book, { format: args.format }),
  )), 'novel: novel_export_book')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_memory_brief',
    '写章前的记忆简报：进度、最近十章摘要、人物当前状态、未收/到期伏笔、作者的写作备忘。只读，不写文件；写第 N 章前先看它，再决定这一章接什么前情。',
    objectSchema({
      chapter: { type: 'integer', description: '要写的章节号，从 1 开始。' },
      recent_chapters: { type: 'integer', description: '带最近多少章摘要（默认 10，最多 20）。' },
    }, ['chapter']),
    '看写章记忆',
    (book, args) => memoryBriefForChapter(book, { chapter: requireInteger(args, 'chapter'), recent_chapters: args.recent_chapters }),
  )), 'novel: novel_memory_brief')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_tracking_read',
    '读全书的追踪表：进度 / 章节摘要 / 伏笔表 / 人物状态 / 写作备忘。作者问「写到哪了」「这个人现在怎么样」「哪些伏笔还没收」时用；返回文件路径与正文。',
    objectSchema({
      kind: { type: 'string', enum: ['progress', 'summaries', 'foreshadowing', 'characters', 'memo'], description: '要读哪一张表；省略按进度。' },
      max_chars: { type: 'integer', description: '最多返回多少字（默认 20000，上限 60000）。' },
    }),
    '读追踪表',
    (book, args) => readTracking(book, args.kind, { max_chars: args.max_chars }),
  )), 'novel: novel_tracking_read')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_tracking_refresh',
    '重建全书的追踪表（进度 / 章节摘要 / 伏笔表 / 人物状态）并确保写作备忘存在。追踪表由程序从章节记忆、大纲与人物档案生成；表缺失、过期或作者手动删了时用。',
    objectSchema({}),
    '刷新追踪表',
    (book) => refreshTracking(book),
  )), 'novel: novel_tracking_refresh')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_tracking_note',
    '把作者的决定、提醒或待办记进 `tracking/写作备忘.md`；写下一章前的记忆简报会读到它。只追加，不改正文，不改自动生成的追踪表。',
    objectSchema({
      note: { type: 'string', description: '要记的原话或要点（至少两个字）。' },
      chapter: { type: 'integer', description: '可选的关联章节号。' },
    }, ['note']),
    '记写作备忘',
    (book, args) => appendTrackingNote(book, { note: args.note, chapter: args.chapter }),
  )), 'novel: novel_tracking_note')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_content_read',
    '读一章的正式正文（已发布的正文文件）。返回正文、字数、内容版本与审校结论；这一章还没有正文时返回 has_text:false 并说明。不要用它读章纲或设定，用 project_memory_object。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号，从 1 开始。' },
      max_chars: { type: 'integer', description: '正文最多返回多少字（默认 12000，上限 60000）。' },
    }, ['chapter']),
    '读取正文',
    (book, args) => contentRead(book, { chapter: requireInteger(args, 'chapter'), max_chars: args.max_chars }),
  )), 'novel: project_content_read')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_memory_object',
    '看作品里的对象：人物（身份、速写、初始状态、档案正文）、世界设定、全书大纲、伏笔清单，或某一章的章纲。按名字或章节号取；没有名字时给清单。kind 省略时按参数推断。',
    objectSchema({
      kind: { type: 'string', enum: ['character', 'setting', 'outline', 'foreshadowing', 'chapter'], description: '要找哪类对象。' },
      names: { type: 'array', items: { type: 'string' }, description: '人物或世界设定的名字；找多个人物时一次传齐。' },
      chapter: { type: 'integer', description: 'kind=chapter 时的章节号。' },
    }),
    '查看记忆对象',
    (book, args) => memoryObject(book, args),
  )), 'novel: project_memory_object')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_memory_query',
    '在全书正文与设定里做字面检索（人名、物件、旧说法），返回命中的章节、路径与上下文片段，最近的章优先。用于确认某个说法以前写过没有、某个伏笔埋在哪一章。',
    objectSchema({
      query: { type: 'string', description: '要搜的字面文本（中文原样，不做分词）。' },
      limit: { type: 'integer', description: '最多返回几条（默认 10，上限 30）。' },
    }, ['query']),
    '检索记忆',
    (book, args) => memoryQuery(book, { query: String(args.query ?? ''), limit: args.limit }),
  )), 'novel: project_memory_query')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_get_premise_cards',
    '读这本书的九张立项卡：题材读者契约、核心钩子、金手指、主角欲望与代价、对抗力量、中心戏剧问题、世界规则、叙述人称、留白声明。带确定度（canon/tentative/open）。',
    objectSchema({}),
    '读立项卡',
    (book) => premiseCards(book),
  )), 'novel: novel_get_premise_cards')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_get_arc',
    '查一本书的段（arc）与所属卷：按章号查这一章落在哪个段，或按 arc_id 直接查。用来知道当前段的局面、不可逆变化与收束位置。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号。' },
      arc_id: { type: 'string', description: '段编号，如 V01-A01。' },
    }),
    '查段与卷',
    (book, args) => getArc(book, args),
  )), 'novel: novel_get_arc')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_failed_reviews',
    '列出审校未通过的章节（审校报告里结论为 fail 的章），带问题数。',
    objectSchema({}),
    '查未过审章',
    (book) => failedReviews(book),
  )), 'novel: novel_failed_reviews')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_build_writing_context_pack',
    '为一章组装写作上下文：本章章纲（整份）、出场人物的状态卡与速写、前几章的结尾、到期伏笔、故事线聚焦、相关立项卡与世界设定，并写到 .narracat/context-packs/ch-NNN.json。返回草稿路径、章纲路径、字数区间与缺卡提示。写章之前先调它；章纲不存在时返回 OUTLINE_MISSING。',
    objectSchema({
      chapter: { type: 'integer', description: '要写的那一章。' },
      max_chars: { type: 'integer', description: '内联摘要的上限（默认 8000）。' },
    }, ['chapter']),
    '组装写作上下文',
    (book, args) => buildContextPack(book, { chapter: requireInteger(args, 'chapter'), max_chars: args.max_chars }),
  )), 'novel: novel_build_writing_context_pack')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_check_prose_hygiene',
    '机械扫描一章正文：句末标点是否单一、段落开头是否重复、口头禅与套词密度、感叹号密度。只作线索，不判定好坏，也不要求归零；按功能判断（删掉后剧情/情绪/关系/理解有没有损失）。正文还没有时返回 no_text。',
    objectSchema({
      chapter: { type: 'integer', description: '要扫描的章节号。' },
    }, ['chapter']),
    '扫描正文卫生',
    (book, args) => proseHygiene(book, { chapter: requireInteger(args, 'chapter') }),
  )), 'novel: novel_check_prose_hygiene')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_chapter_submit',
    '把这一章交给提交程序：机械检查（字数区间、记忆完整性；正文卫生只给线索、不拦稿）→ 记进本章记忆 → 发布正式正文。草稿必须写在暂存区（上下文包返回的 manuscript_path，形如 .narracat/staging/ch-NNN.md）。返回三种结果：returned 按 issues 定点修（不整章重写、不改判问题成不成立）；stopped 如实告诉作者停在哪、为什么，不绕过；saved 是已保存，字数只按结果里的数字说。同一章最多提交 3 次，用完后先问作者，再带 author_approved_retry 与作者原话 author_quote 提交。提交必须带 memory：本章摘要、事件、状态变化与伏笔动作。这本书开了审校门（review_required）时，提交前必须有同一版草稿的通过审校报告。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号。' },
      memory: {
        type: 'object',
        description: '本章记忆：summary 写这一章发生了什么（不是写法评价）；events 按顺序列事件；state_changes 写人物状态变化；foreshadowing 写伏笔动作。',
        properties: {
          summary: { type: 'string', description: '本章摘要，至少一两句，写事件与结果。' },
          events: {
            type: 'array',
            description: '按章节内顺序的事件。',
            items: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] },
          },
          state_changes: {
            type: 'array',
            description: '本章造成的状态变化。',
            items: {
              type: 'object',
              properties: {
                character: { type: 'string' },
                dimension: { type: 'string' },
                operation: { type: 'string', enum: ['set', 'add', 'remove'] },
                value: { type: 'string' },
              },
              required: ['character', 'dimension', 'operation', 'value'],
            },
          },
          foreshadowing: {
            type: 'array',
            description: '本章的伏笔动作。',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                action: { type: 'string', enum: ['plant', 'develop', 'reveal'] },
              },
              required: ['id', 'action'],
            },
          },
        },
        required: ['summary', 'events'],
      },
      word_requirement: {
        type: 'object',
        description: '作者亲口给的字数要求；给了就按它核对，并逐字引用原话。',
        properties: {
          min: { type: 'integer' },
          max: { type: 'integer' },
          author_quote: { type: 'string', description: '作者原话，逐字引用。' },
        },
      },
      path: { type: 'string', description: '草稿路径；省略用暂存区默认路径。' },
      author_approved_retry: { type: 'boolean', description: '提交次数用完、作者同意再试一次时传 true。' },
      author_quote: { type: 'string', description: '作者同意再试的原话，逐字引用。' },
    }, ['chapter']),
    '提交本章',
    (book, args) => chapterSubmit(book, { ...args, chapter: requireInteger(args, 'chapter') }),
  )), 'novel: project_chapter_submit')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_outline_submit',
    '提交大纲或章纲。layer=book 交整份全书大纲；layer=volume/volumes 交一卷或几卷（按卷号合并进已有大纲）；layer=full 交全书加卷；layer=chapters 交一批章纲（已有章纲的章会退回，不覆盖）；layer=chapter_edit 定点改一章章纲（可带旧值校验）；layer=character 登记还没有档案的新角色（返回 known 或 candidate）。返回 saved / returned / stopped：returned 时按 issues 定点修后再交。',
    objectSchema({
      layer: { type: 'string', enum: ['book', 'volume', 'volumes', 'full', 'chapters', 'chapter_edit', 'character'], description: '交哪一层。' },
      payload: { description: '该层的内容：book/full 是全书大纲对象；volume 是 {volumes, volume_plan?}；chapters 是 {chapters:[...]} 或数组；chapter_edit 是 {chapter, edits}；character 是 {name, importance?, proposed_chapter?}。' },
      overwrite: { type: 'boolean', description: 'layer=chapters 时允许覆盖已有章纲（默认不允许）。' },
    }, ['layer']),
    '提交大纲',
    (book, args) => withTrackingRefresh(outlineSubmit, book, args),
  )), 'novel: project_outline_submit')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_submit_review',
    '交一章的审校结论。你只写能指出证据、能被验证的客观错误：severity=blocker 会把这一章判为未通过，note 只是提示。verdict 由提交程序按 blocker 数量计算，不由你写；没有问题时交空数组。可带 source_revision（正文版本）防止审旧稿；对不上会退回并给出当前版本。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号。' },
      issues: {
        type: 'array',
        description: '审校问题清单；没有问题时传空数组。',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['blocker', 'note'] },
            where: { type: 'string', description: '第几段或哪一处，让作者找得到。' },
            what: { type: 'string', description: '可核实的错误本身（与哪一章、哪条设定矛盾）。' },
            fix_hint: { type: 'string', description: '指向正文与已核实依据矛盾处的修改方向，不写风格意见。' },
          },
          required: ['severity', 'what'],
        },
      },
      declarations: {
        type: 'array',
        description: '对写手新增申报的处置意见（可选）。',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string' },
            disposition: { type: 'string', enum: ['register', 'ask_author'] },
            reason: { type: 'string' },
          },
          required: ['item', 'disposition'],
        },
      },
      source_revision: { type: 'string', description: '审校时的正文版本（project_content_read 返回的 revision）。' },
      path: { type: 'string', description: '审草稿时传草稿路径（.narracat/staging/ 或 .narracat/revisions/）；审已发布正文则不传。' },
    }, ['chapter', 'issues']),
    '提交审校结论',
    (book, args) => reviewSubmit(book, { ...args, chapter: requireInteger(args, 'chapter') }),
  )), 'novel: novel_submit_review')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_settings_submit',
    '保存一批设定：人物档案（正文 md + 身份 json）、世界设定、人物关系。整批先校验，有错一件不写。人物已有的名字/年龄/性别/别名原样沿用，只改这次给的字段；新人物先建 stub 简档，不建完整档案。只记作者确认或正文里已经写出的，不另编。',
    objectSchema({
      objects: {
        type: 'array',
        description: '要保存的设定对象，按顺序整批提交。',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['character', 'world', 'relationships'] },
            op: { type: 'string', enum: ['create', 'update', 'append', 'set'], description: '新建 / 更新 / 追加关系 / 整体重写关系表。' },
            name: { type: 'string', description: '人物名或设定名（不含路径分隔符）。' },
            markdown: { type: 'string', description: '档案正文；不知道的写「（留白）」，不要编造。' },
            profile_stage: { type: 'string', enum: ['stub', 'sketch', 'full'], description: '人物完善度，默认 stub。' },
            structured: {
              type: 'object',
              description: '人物的结构化半边。',
              properties: {
                aliases: { type: 'array', items: { type: 'string' } },
                gender: { type: 'string' },
                age: { type: 'string' },
                portrait: { type: 'string', description: '人物速写，最多 500 字。' },
                profile_stage: { type: 'string', enum: ['stub', 'sketch', 'full'] },
                effective_chapter: { type: 'integer' },
                initial_states: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { dimension: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } },
                    required: ['dimension', 'value'],
                  },
                },
              },
            },
            rows: {
              type: 'array',
              description: 'relationships + append 时的新关系。',
              items: {
                type: 'object',
                properties: { a: { type: 'string' }, relation: { type: 'string' }, b: { type: 'string' }, note: { type: 'string' } },
                required: ['a', 'relation', 'b'],
              },
            },
          },
          required: ['kind'],
        },
      },
    }, ['objects']),
    '保存设定',
    (book, args) => withTrackingRefresh(settingsSubmit, book, args),
  )), 'novel: project_settings_submit')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_book_info_submit',
    '保存作品信息：书名、题材、语言、计划总章数、每章字数、风格档位，写进 .narracat/config.yaml。只传这次作者定下的字段；没定就不要传。',
    objectSchema({
      title: { type: 'string' },
      genre: { type: 'string' },
      language: { type: 'string' },
      estimated_total_chapters: { type: 'integer' },
      words_per_chapter: { type: 'integer' },
      style_profile: { type: ['string', 'null'], description: '风格档位；作者没定就不传，clear 用 null。' },
      review_required: { type: 'boolean', description: '是否要求每章先审校再保存（默认关）；只有作者明确要求时才改，不要自行关闭审校门。' },
    }),
    '保存作品信息',
    (book, args) => withTrackingRefresh(bookInfoSubmit, book, args),
  )), 'novel: project_book_info_submit')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_submit_premise',
    '交九张立项卡。merge_cards=true 只改传上来的卡、其余原样；整份重交省略。带 expected_revision（读立项卡时的 revision）可防止覆盖别人刚改的卡。',
    objectSchema({
      payload: {
        type: 'object',
        description: '立项卡：{cards:[{card, fields:[{key, value, certainty: canon|tentative|open, note?}]}]}',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                card: { type: 'string' },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      value: { type: 'string' },
                      certainty: { type: 'string', enum: ['canon', 'tentative', 'open'] },
                      note: { type: 'string' },
                    },
                    required: ['key', 'value'],
                  },
                },
              },
              required: ['card', 'fields'],
            },
          },
        },
        required: ['cards'],
      },
      merge_cards: { type: 'boolean', description: '只改传上来的卡。' },
      expected_revision: { type: 'integer', description: '读到的立项卡版本。' },
    }, ['payload']),
    '提交立项卡',
    (book, args) => premiseSubmit(book, args),
  )), 'novel: novel_submit_premise')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_revision_draft_open',
    '把一章正式正文复制成改写稿（.narracat/revisions/ch-NNN.md），返回路径、来源版本与字数。在改写稿上改，改完用 project_chapter_submit（chapter 与 path）提交；不碰正式正文。',
    objectSchema({
      chapter: { type: 'integer', description: '要改写的章节号。' },
      reuse: { type: 'boolean', description: '已有改写稿时直接沿用（作者说继续改）。' },
    }, ['chapter']),
    '开改写稿',
    (book, args) => revisionDraftOpen(book, { chapter: requireInteger(args, 'chapter'), reuse: args.reuse === true }),
  )), 'novel: project_revision_draft_open')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_get_review',
    '读一章的审校结论与新鲜度：verdict、blocker 清单、以及这份报告是否还对应现在这一版正文（fresh）。改写或重写之后先看 fresh，不要拿旧报告当依据。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号。' },
    }, ['chapter']),
    '读审校结论',
    (book, args) => getReview(book, { chapter: requireInteger(args, 'chapter') }),
  )), 'novel: novel_get_review')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_memory_status',
    '记忆状况：哪些章已经有记忆记录、哪些已写章还没有、哪些章的正文在记忆之后被改过（stale）。写下一章之前用它确认前情记忆还可信。',
    objectSchema({}),
    '查记忆状况',
    (book) => memoryStatus(book),
  )), 'novel: project_memory_status')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_character_statuses',
    '按章折叠出人物的当前状态：把每一章记忆里的「变为/获得/失去」按时间折起来，返回截至某一章（默认最新已写章）每个人物每个维度的值与它来自哪一章。写章前查出场人物用。',
    objectSchema({
      names: { type: 'array', items: { type: 'string' }, description: '要查的人物名；省略查全部。' },
      at_chapter: { type: 'integer', description: '截至第几章（含）；省略用最新已写章。' },
    }),
    '查人物状态',
    (book, args) => characterStatuses(book, args),
  )), 'novel: novel_character_statuses')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_chapter_summary',
    '读已记录的章节摘要（单章 / 范围 / 全部），带字数、来源版本与是否新鲜。写下一章前用它接前情；摘要不新鲜时先核对那一章记忆。',
    objectSchema({
      chapter: { type: 'integer', description: '单章号。' },
      from: { type: 'integer', description: '起始章（含）。' },
      to: { type: 'integer', description: '结束章（含）。' },
    }),
    '读章节摘要',
    (book, args) => chapterSummary(book, args),
  )), 'novel: novel_chapter_summary')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_foreshadowing_status',
    '伏笔追踪：全书大纲登记的伏笔，加上每一章记忆里的埋设/推进/揭晓动作，折叠出每一条的最新状态与最后动作章；没登记却动过的会单独列出。',
    objectSchema({
      at_chapter: { type: 'integer', description: '截至第几章（含）；省略用最新已写章。' },
    }),
    '查伏笔状态',
    (book, args) => foreshadowingStatus(book, args),
  )), 'novel: novel_foreshadowing_status')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_memory_record',
    '重记一章的记忆（不重发正文）：正文被作者手改过、或核对发现记忆对不上时，读那一章的正文，把摘要 / 事件 / 状态变化 / 伏笔动作重交一次，来源版本会更新为当前正文。只动这一章。',
    objectSchema({
      chapter: { type: 'integer', description: '章节号。' },
      memory: {
        type: 'object',
        description: '本章记忆：summary 必填；events / state_changes / foreshadowing 可选。',
        properties: {
          summary: { type: 'string' },
          events: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] } },
          state_changes: { type: 'array', items: { type: 'object', properties: { character: { type: 'string' }, dimension: { type: 'string' }, operation: { type: 'string', enum: ['set', 'add', 'remove'] }, value: { type: 'string' } }, required: ['character', 'dimension', 'operation', 'value'] } },
          foreshadowing: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, action: { type: 'string', enum: ['plant', 'develop', 'reveal'] } }, required: ['id', 'action'] } },
        },
        required: ['summary'],
      },
    }, ['chapter', 'memory']),
    '重记本章记忆',
    (book, args) => withTrackingRefresh((target, next) => memoryRecord(target, { chapter: requireInteger(next, 'chapter'), memory: next.memory }), book, args),
  )), 'novel: novel_memory_record')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'project_memory_reconcile',
    '核对记忆：列出正文改过、记忆对不上的章，以及还没有记忆的已写章，并给出逐章重记的指引。它本身不改任何东西；照指引逐章读正文后用 novel_memory_record 更新。',
    objectSchema({}),
    '核对记忆',
    (book) => memoryReconcile(book),
  )), 'novel: project_memory_reconcile')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_list_entities',
    '列出登记表里已有的实体（人物、地点、势力、物件、概念）：名字、类型、别名、简介与是否候选。',
    objectSchema({}),
    '列出实体',
    (book) => listEntities(book),
  )), 'novel: novel_list_entities')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_entity_page',
    '看一个实体的登记信息与它在章记忆里出现的地方：名字、别名、类型、简介，以及哪些章的摘要提到它。',
    objectSchema({
      id: { type: 'string', description: '实体编号。' },
      name: { type: 'string', description: '实体名字或别名（与 id 二选一）。' },
    }),
    '看实体页',
    (book, args) => entityPage(book, args),
  )), 'novel: novel_entity_page')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_list_entity_candidates',
    '列出章记忆里反复出现、但登记表还不认得的名字（候选），附出现章节与次数；同时给已认得的实体、这本书可用的实体类型。整理旧章节的名字时先调它。',
    objectSchema({}),
    '列名字候选',
    (book) => entityCandidates(book),
  )), 'novel: novel_list_entity_candidates')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_submit_entity_proposals',
    '提交一批名字分类提议（待作者确认，不会立刻生效）：new_entity 新东西 / alias_of 已有实体的另一个叫法 / generic 泛称 / description 当时剧情里的描述。每项写依据 reason。',
    objectSchema({
      proposals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            action: { type: 'string', enum: ['new_entity', 'alias_of', 'generic', 'description'] },
            type: { type: 'string', description: 'new_entity 时的实体类型名（人物/地点/势力/物件/概念）。' },
            target: { type: 'string', description: 'alias_of 时指向的实体名字。' },
            reason: { type: 'string', description: '依据，会原样给作者看。' },
          },
          required: ['name', 'action', 'reason'],
        },
      },
    }, ['proposals']),
    '提交名字提议',
    (book, args) => submitEntityProposals(book, args),
  )), 'novel: novel_submit_entity_proposals')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_decide_entity_proposal',
    '按作者的决定落实一条名字提议：accept 会新建实体或加别名，dismiss 只记不采用。作者没表态之前不要调用。',
    objectSchema({
      id: { type: 'string', description: '提议编号。' },
      decision: { type: 'string', enum: ['accept', 'dismiss'] },
    }, ['id', 'decision']),
    '落实名字提议',
    (book, args) => decideEntityProposal(book, args),
  )), 'novel: novel_decide_entity_proposal')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_get_ontology',
    '读这本书的本体：实体类型、状态维度（单值/多值、取值形状、标记、终态）与关系种类。没有自己的本体时返回起步模板；写书里的状态与关系前先看它。',
    objectSchema({}),
    '读本书本体',
    (book) => getOntology(book),
  )), 'novel: novel_get_ontology')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_ontology_unclassified',
    '列出章记忆里用到、但本书本体还没有的维度（按名字分组，附条数与章节）。整理本体时先调它；total_facts 为 0 说明都归好了。',
    objectSchema({
      limit: { type: 'integer', description: '最多返回几组（默认 20）。' },
    }),
    '列待归类维度',
    (book, args) => unclassifiedDimensions(book, args),
  )), 'novel: novel_ontology_unclassified')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_ontology_propose',
    '提交一批本体改动（待作者确认）：加/改维度、加/改关系、加实体类型、停用维度。相关的改动放同一条，每条写依据 reason。',
    objectSchema({
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            op: { type: 'string', enum: ['upsert_dimension', 'upsert_relation', 'upsert_type', 'deprecate_dimension'] },
            dimension: { type: 'object', description: 'op=upsert_dimension 时的维度（id/label/type/multivalued/value/marker）。' },
            relation: { type: 'object', description: 'op=upsert_relation 时的关系（id/label/symmetric/multivalued/domain/range）。' },
            type: { type: 'object', description: 'op=upsert_type 时的类型（id/label/aliases）。' },
            id: { type: 'string', description: 'op=deprecate_dimension 时要停用的维度编号。' },
            replaced_by: { type: 'string', description: '停用后由哪个关系替代。' },
          },
          required: ['op'],
        },
      },
      reason: { type: 'string', description: '为什么这样归类，用作者能懂的话写。' },
      evidence: { type: 'string', description: '涉及哪些名字/记录、多少条。' },
    }, ['edits', 'reason']),
    '提交本体提议',
    (book, args) => proposeOntology(book, args),
  )), 'novel: novel_ontology_propose')

  ctx.effect(() => ctx.tools.register(toolDefinition(
    ctx,
    'novel_ontology_decide',
    '按作者的决定落实一条本体提议：accept 写成本书本体（版本 +1），dismiss 只记不采用。作者没表态之前不要调用。',
    objectSchema({
      id: { type: 'string', description: '提议编号。' },
      action: { type: 'string', enum: ['accept', 'dismiss'] },
    }, ['id', 'action']),
    '落实本体提议',
    (book, args) => decideOntology(book, args),
  )), 'novel: novel_ontology_decide')

  registerManuscriptGuard(ctx)

  for (const entry of REGISTERED_SKILLS) {
    const skillDir = join(PLUGIN_ROOT, 'skills', entry.dir)
    let raw
    try {
      raw = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
    } catch {
      continue
    }
    const { meta, body } = parseSkillFile(raw)
    const content = adaptSkillBody(entry.dir, `${rewriteSkillBody(body).trim()}\n`)
    ctx.effect(() => ctx.skills.register({
      name: String(meta.name ?? entry.dir),
      description: String(meta.description ?? meta.summary ?? entry.dir),
      whenToUse: typeof meta.summary === 'string' ? meta.summary : undefined,
      invocation: { modelInvocable: true, userInvocable: entry.userInvocable },
      source: 'custom',
      provider: 'novel-workbench',
      path: join(skillDir, 'SKILL.md'),
      resourceBase: { kind: 'directory', path: skillDir },
      content,
      metadata: {
        title: typeof meta.title === 'string' ? meta.title : undefined,
        permission: typeof meta.permission === 'string' ? meta.permission : 'read',
        origin: 'narracat-agent-core',
      },
    }), `novel: skill ${entry.dir}`)
  }

  // A short standing note about how this workbench behaves; it is not a rule
  // set that repeats tool descriptions.
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'novel-workbench',
    order: 300,
    text: SECTION,
  }), 'novel: workbench section')
}
