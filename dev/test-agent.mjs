// Unit check for the novel Agent half: tool registration, execution against the
// sample book, skill parsing/rewriting, and the read-only guarantee.
//
// Run: node dev/test-agent.mjs
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../novel-workbench/agent.js'
import { isBookDir, parseConfig } from '../novel-workbench/lib/project.js'

const samples = new URL('../demo', import.meta.url).pathname
const workspace = await mkdtemp(join(tmpdir(), 'nw-agent-'))
const book = join(workspace, 'S3')
await cp(join(samples, '雨港来信'), book, { recursive: true })

const defs = []
const skills = []
const sections = []
const guards = []
const ctx = {
  effect: (fn) => fn(),
  get: (name) => ({ workingDirectory: { get: (session) => session?.header?.cwd ?? book } })[name],
  tools: {
    register: (definition) => { defs.push(definition); return () => {} },
    guard: (guard) => { guards.push(guard); return () => {} },
  },
  skills: { register: (skill) => { skills.push(skill); return () => {} } },
  systemPrompt: { section: (section) => { sections.push(section); return () => {} } },
}
apply(ctx)

let failures = 0
function check(label, ok, detail) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 260))
  if (!ok) failures += 1
}
const byName = Object.fromEntries(defs.map((definition) => [definition.name, definition]))
const expectedTools = [
  'project_writing_status',
  'novel_journey',
  'novel_export_book',
  'novel_memory_brief',
  'novel_tracking_read',
  'novel_tracking_refresh',
  'novel_tracking_note',
  'project_content_read',
  'project_memory_object',
  'project_memory_query',
  'novel_get_premise_cards',
  'novel_get_arc',
  'novel_failed_reviews',
  'novel_build_writing_context_pack',
  'novel_check_prose_hygiene',
  'project_chapter_submit',
  'project_outline_submit',
  'novel_submit_review',
  'project_settings_submit',
  'project_book_info_submit',
  'novel_submit_premise',
  'project_revision_draft_open',
  'novel_get_review',
  'project_memory_status',
  'novel_character_statuses',
  'novel_chapter_summary',
  'novel_foreshadowing_status',
  'novel_memory_record',
  'project_memory_reconcile',
  'novel_list_entities',
  'novel_entity_page',
  'novel_list_entity_candidates',
  'novel_submit_entity_proposals',
  'novel_decide_entity_proposal',
  'novel_get_ontology',
  'novel_ontology_unclassified',
  'novel_ontology_propose',
  'novel_ontology_decide',
]
check('registers thirty-eight tools', defs.length === 38 && expectedTools.every((name) => byName[name]), defs.map((definition) => definition.name))
check('every tool has parameters/output/render', defs.every((definition) => definition.parameters?.type === 'object' && definition.output?.schema && typeof definition.output.render === 'function'))

const fakeExec = { agent: { session: { header: { cwd: book } } } }
async function call(name, args) {
  return await byName[name].execute(args, fakeExec)
}
const snapshotBefore = await readFile(join(book, 'manuscript', 'vol-01', 'ch-001.md'), 'utf8')
const hashBefore = createHash('sha256').update(snapshotBefore).digest('hex')
const statBefore = await stat(join(book, 'manuscript', 'vol-01', 'ch-001.md'))

const writeStatus = await call('project_writing_status', { aspect: 'write' })
check('writing status: book and next chapter', writeStatus.book.title === '雨港来信' && writeStatus.progress.next_chapter === 4, writeStatus.progress)

const outlineStatus = await call('project_writing_status', { aspect: 'outline' })
check('writing status: outline aspect', outlineStatus.outline.outlined_ahead_of_written.length === 1, outlineStatus.outline)

const settingsStatus = await call('project_writing_status', { aspect: 'settings' })
check('writing status: settings aspect', settingsStatus.settings.characters.length === 2, settingsStatus.settings)

const content = await call('project_content_read', { chapter: 1, max_chars: 200 })
check('content read: text + revision', content.has_text === true && typeof content.revision === 'string' && content.text.includes('雨停在水面上'), { words: content.words, revision: content.revision })

const missing = await call('project_content_read', { chapter: 4 })
check('content read: unwritten chapter', missing.has_text === false, missing.reason)

const character = await call('project_memory_object', { kind: 'character', names: ['林照'] })
check('memory object: character', character.objects.length === 1 && character.objects[0].portrait.length > 0, character.objects[0]?.profile_stage)

const foreshadowing = await call('project_memory_object', { kind: 'foreshadowing' })
check('memory object: foreshadowing', Array.isArray(foreshadowing.objects), foreshadowing.total)

const outlineObject = await call('project_memory_object', { kind: 'outline' })
check('memory object: outline', outlineObject.found === true && outlineObject.storylines.length === 1, outlineObject.storylines)

const query = await call('project_memory_query', { query: '信', limit: 5 })
check('memory query finds chapters', query.total > 0 && query.results.every((row) => row.excerpt.length > 0), query.results.map((row) => row.chapter))

const premise = await call('novel_get_premise_cards', {})
check('premise cards', premise.found === true && premise.cards.length >= 5, premise.cards.map((card) => card.card))

const arc = await call('novel_get_arc', { chapter: 2 })
check('arc by chapter', arc.found === true && arc.arc.arcId === 'V01-A01', arc.arc)

const reviews = await call('novel_failed_reviews', {})
check('failed reviews shape', Array.isArray(reviews.failed_chapters), reviews)

const pack = await call('novel_build_writing_context_pack', { chapter: 4 })
check('context pack: ok + paths', pack.ok === true && pack.pack_path.endsWith('ch-004.json') && pack.outline_path.includes('ch-004.json'), { pack_path: pack.pack_path, draft: pack.manuscript_path })
check('context pack: cast and prior briefs', pack.character_cards.length > 0 && pack.previous_chapter_briefs.length === 3, { cast: pack.character_cards.map((row) => row.name), prior: pack.previous_chapter_briefs.map((row) => row.chapter) })
const packFile = JSON.parse(await readFile(join(book, pack.pack_path), 'utf8'))
check('context pack written to disk', packFile.target_chapter === 4 && packFile.chapter_outline.chapter === 4)
check('context pack carries progress and open threads', packFile.progress?.written === 3 && Array.isArray(packFile.foreshadowing_open) && Array.isArray(packFile.recent_chapter_summaries), { progress: packFile.progress?.written, open: packFile.foreshadowing_open?.length })
check('context pack carries character states and author notes', Array.isArray(packFile.all_character_states) && typeof packFile.author_notes === 'string', { states: packFile.all_character_states?.length })

const journey = await call('novel_journey', {})
check('journey names the one next step', journey.stage === 'writing' && journey.action?.id === 'write-4', journey.action)
check('journey carries the health checklist', Array.isArray(journey.checklist) && journey.checklist.some((item) => item.id === 'memory-missing'), journey.checklist.map((item) => item.id))

const brief = await call('novel_memory_brief', { chapter: 4 })
check('memory brief carries progress and recent summaries', brief.ok === true && brief.progress?.written === 3 && brief.recent_chapters?.length === 3, { progress: brief.progress, recent: brief.recent_chapters?.map((row) => row.chapter) })
check('memory brief carries character states', Array.isArray(brief.character_states) && brief.character_states.length >= 0, brief.character_states?.map((row) => row.name))

const trackingRefresh = await call('novel_tracking_refresh', {})
check('tracking refresh writes the four sheets and memo', trackingRefresh.status === 'saved' && trackingRefresh.files?.some((file) => file.kind === 'progress') && trackingRefresh.files?.some((file) => file.kind === 'memo'), trackingRefresh.files?.map((file) => file.kind))
const progressSheet = await call('novel_tracking_read', { kind: 'progress' })
check('tracking read returns the progress sheet', progressSheet.kind === 'progress' && progressSheet.text.includes('# 进度') && progressSheet.text.includes('下一章'), progressSheet.text?.slice(0, 60))
const note = await call('novel_tracking_note', { note: '作者要求这一章不要揭晓写信人', chapter: 4 })
check('tracking note appends to the memo', note.status === 'saved' && String(note.note).includes('不要揭晓'), note)
const briefAfterNote = await call('novel_memory_brief', { chapter: 4 })
check('memory brief reads the author memo', String(briefAfterNote.author_notes).includes('不要揭晓'), briefAfterNote.author_notes?.slice(-80))

const rewritePack = await call('novel_build_writing_context_pack', { chapter: 1 })
check('published chapter points at a rewrite draft', rewritePack.ok === true && rewritePack.rewrite_required === true && rewritePack.draft_path === null && String(rewritePack.warnings.join(' ')).includes('改写稿'), { draft: rewritePack.draft_path, rewrite: rewritePack.rewrite_required })
const rewritePackFile = JSON.parse(await readFile(join(book, rewritePack.pack_path), 'utf8'))
check('rewrite context pack does not hand back the manuscript path', rewritePackFile.draft_path === null && rewritePackFile.revision_path === '.narracat/revisions/ch-001.md', { draft: rewritePackFile.draft_path, revision: rewritePackFile.revision_path })

const exported = await call('novel_export_book', { format: 'docx' })
check('agent can export the book', exported.status === 'saved' && exported.path.startsWith('exports/') && exported.path.endsWith('.docx'), exported)
if (exported.status === 'saved') {
  const bytes = await readFile(join(book, exported.path))
  check('agent export is a real docx', bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.length === exported.bytes, { size: bytes.length, bytes: exported.bytes })
  check('agent export returns the checklist', Array.isArray(exported.checklist) && exported.checklist.length > 0, exported.checklist?.map((item) => item.id))
}

const hygiene = await call('novel_check_prose_hygiene', { chapter: 1 })
check('prose hygiene', hygiene.has_text === true && Array.isArray(hygiene.clues) && hygiene.errors.length === 0, { words: hygiene.words, clues: hygiene.clues.length })

const afterHash = createHash('sha256').update(await readFile(join(book, 'manuscript', 'vol-01', 'ch-001.md'), 'utf8')).digest('hex')
const statAfter = await stat(join(book, 'manuscript', 'vol-01', 'ch-001.md'))
check('manuscript untouched', hashBefore === afterHash && statBefore.mtimeMs === statAfter.mtimeMs)

check('registers sixteen skills', skills.length === 16, skills.map((skill) => skill.name))
check('skill content rewritten', skills.every((skill) => !skill.content.includes('${CLAUDE_PLUGIN_ROOT}') && !skill.content.includes('mcp__narracat_memory__')), skills.map((skill) => skill.name))
check('skill resource base is a directory', skills.every((skill) => skill.resourceBase?.kind === 'directory'), skills[0]?.resourceBase)
check('status skill is user-invocable', skills.find((skill) => skill.name === 'status')?.invocation.userInvocable === true)
check('craft skill is not user-invocable', skills.find((skill) => skill.name === 'novel-web-craft')?.invocation.userInvocable === false)
check('workbench section registered', sections.length === 1 && sections[0].text.includes('Narracat · 叙述猫'), sections[0]?.name)

// ---- submission pipeline --------------------------------------------------
const pad3 = (value) => String(value).padStart(3, '0')

check('guard registered', guards.length === 1)
const guard = guards[0]
function guardFor(path) {
  return guard({ name: 'write', agent: { session: { header: { cwd: book } } }, arguments: { path } })
}
check('guard blocks manuscript writes', Boolean(guardFor('manuscript/vol-01/ch-001.md')?.reason))
check('guard blocks memory writes', Boolean(guardFor('.narracat/memory/ch-001.json')?.reason))
check('guard allows staging drafts', guardFor('.narracat/staging/ch-004.md') === undefined)
check('guard blocks config writes', Boolean(guardFor('.narracat/config.yaml')?.reason))
check('guard blocks AGENTS.md writes', Boolean(guardFor('AGENTS.md')?.reason))
check('guard blocks export writes', Boolean(guardFor('exports/ch-001.html')?.reason))
check('guard allows deep-review reports', guardFor('reviews/ch-001-deep-review.md') === undefined)

// A workspace holding two books must not disable the manuscript guard.
const multi = join(workspace, 'multi')
for (const name of ['A', 'B']) {
  await mkdir(join(multi, name, '.narracat'), { recursive: true })
  await writeFile(join(multi, name, '.narracat', 'config.yaml'), `title: ${name}\n`)
}
const guardIn = (cwd, path) => guard({ name: 'write', agent: { session: { header: { cwd } } }, arguments: { path } })
check('guard blocks manuscript writes in a multi-book workspace', Boolean(guardIn(multi, 'A/manuscript/ch-001.md')?.reason), guardIn(multi, 'A/manuscript/ch-001.md'))
check('guard blocks memory writes in a multi-book workspace', Boolean(guardIn(multi, 'B/.narracat/memory/ch-001.json')?.reason), guardIn(multi, 'B/.narracat/memory/ch-001.json'))
check('guard still allows staging in a multi-book workspace', guardIn(multi, 'A/.narracat/staging/ch-001.md') === undefined, guardIn(multi, 'A/.narracat/staging/ch-001.md'))
check('guard fails closed when the book cannot be resolved', Boolean(guardIn(workspace, 'deep/book/.narracat/config.yaml')?.reason))

const missingMemory = await call('project_chapter_submit', { chapter: 4 })
check('submit without draft stops', missingMemory.status === 'stopped' && missingMemory.code === 'no_draft', missingMemory)

const draftText = `第四章 再去旧渡口\n\n${'雨落在旧渡口的石阶上，他把木牌翻过来又放下。'.repeat(36)}\n\n${'她说明早还会来，信里的字迹与木牌上的刻痕一样。'.repeat(14)}\n`
await mkdir(join(book, '.narracat', 'staging'), { recursive: true })
await writeFile(join(book, '.narracat', 'staging', `ch-${pad3(4)}.md`), draftText, 'utf8')
const words = (draftText.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g) ?? []).length
check('draft length is in target range', words >= 900 && words <= 1100, words)

// A draft path whose file name names another chapter must not publish.
await writeFile(join(book, '.narracat', 'staging', 'ch-005.md'), draftText, 'utf8')
const mismatch = await call('project_chapter_submit', { chapter: 4, path: '.narracat/staging/ch-005.md', memory: { summary: '这一章至少十二个字用来通过摘要长度检查。' } })
check('draft from another chapter is refused', mismatch.status === 'stopped' && mismatch.code === 'draft_chapter_mismatch', mismatch)
const reviewMismatch = await call('novel_submit_review', { chapter: 4, path: '.narracat/staging/ch-005.md', issues: [] })
check('review of another chapter draft is refused', reviewMismatch.status === 'stopped' && reviewMismatch.code === 'draft_chapter_mismatch', reviewMismatch)

const noMemory = await call('project_chapter_submit', { chapter: 4 })
check('submit without memory returns', noMemory.status === 'returned' && noMemory.issues.some((issue) => issue.code === 'memory_missing'), noMemory.issues?.map((issue) => issue.code))

const saved = await call('project_chapter_submit', {
  chapter: 4,
  memory: {
    summary: '林照再去旧渡口，确认信与木牌出自同一人；约定明早再见。',
    events: [{ description: '林照在石阶上翻看木牌' }, { description: '雨衣女人说明早还会来' }],
    state_changes: [{ character: '林照', dimension: 'inventory', operation: 'add', value: '木牌' }],
    foreshadowing: [{ id: 'letter-line', action: 'develop' }],
  },
})
check('submit saves the chapter', saved.status === 'saved' && saved.word_count === words, { status: saved.status, issues: saved.issues, words: saved.word_count, target: saved.path })
check('chapter save refreshes tracking sheets', saved.tracking?.status === 'saved' && saved.tracking.files?.length >= 4, saved.tracking?.status ?? saved.tracking_warning)
check('manuscript published', saved.path === 'manuscript/vol-01/ch-004.md', saved.path)
const published = await readFile(join(book, saved.path), 'utf8')
check('published text matches draft', published === draftText)
const stagingAfter = await stat(join(book, '.narracat', 'staging', `ch-${pad3(4)}.md`)).then(() => true).catch(() => false)
check('staging draft removed', stagingAfter === false)
const memoryFile = JSON.parse(await readFile(join(book, saved.memory_path), 'utf8'))
check('memory record written', memoryFile.chapter === 4 && memoryFile.summary.length > 10 && memoryFile.state_changes.length === 1, memoryFile.summary)
const journal = JSON.parse(await readFile(join(book, '.narracat', 'submissions', `ch-${pad3(4)}.json`), 'utf8'))
check('journal records the save', journal.last_result === 'saved' && journal.attempts === 2, journal)

const reread = await call('project_content_read', { chapter: 4 })
check('published chapter is readable', reread.has_text === true && reread.word_count !== 0, reread.words)

// Attempt accounting on an unwritten chapter.
await writeFile(join(book, '.narracat', 'staging', `ch-${pad3(5)}.md`), '第五章 短稿\n\n太短。\n', 'utf8')
let lastReturned = null
for (let attempt = 0; attempt < 3; attempt += 1) {
  lastReturned = await call('project_chapter_submit', { chapter: 5, memory: { summary: '这一章还没写完，先试提交以验证字数检查。' } })
}
check('short chapter returns with word issue', lastReturned.status === 'returned' && lastReturned.issues.some((issue) => issue.code === 'word_below'), lastReturned.issues?.map((issue) => issue.code))
const exhausted = await call('project_chapter_submit', { chapter: 5, memory: { summary: '这一章还没写完，先试提交以验证次数上限。' } })
check('attempts exhausted stops', exhausted.status === 'stopped' && exhausted.code === 'attempts_exhausted', exhausted)
const approved = await call('project_chapter_submit', { chapter: 5, memory: { summary: '这一章还没写完，先试提交以验证作者同意后放行。' }, author_approved_retry: true, author_quote: '再试一次吧' })
check('author-approved retry is accepted', approved.status === 'returned' || approved.status === 'saved', approved.status)

// Outline submission.
const outlineSaved = await call('project_outline_submit', { layer: 'chapters', payload: { chapters: [{ chapter: 5, title: '第五日', beats: ['林照在渡口等到一个人', '两人认出彼此'] }] } })
check('chapter outline saved', outlineSaved.status === 'saved' && outlineSaved.written[0].path.endsWith('ch-005.json'), outlineSaved)
const outlineAgain = await call('project_outline_submit', { layer: 'chapters', payload: { chapters: [{ chapter: 5, title: '第五日', beats: ['重复'] }] } })
check('existing outline returns', outlineAgain.status === 'returned' && outlineAgain.issues.some((issue) => issue.code === 'chapter_exists'), outlineAgain.issues?.map((issue) => issue.code))
const volumeSaved = await call('project_outline_submit', { layer: 'volume', payload: { volumes: [{ volume_no: 2, title: '第二卷', arc_list: [{ arc_id: 'V02-A01', title: '归途', chapter_start: 5, chapter_end: 10 }] }] } })
check('volume merged into outline', volumeSaved.status === 'saved' && volumeSaved.volumes === 2, volumeSaved)
const characterSaved = await call('project_outline_submit', { layer: 'character', payload: { name: '雨衣女人', importance: 'minor', proposed_chapter: 5 } })
check('new character becomes candidate', characterSaved.status === 'saved' && characterSaved.decision === 'candidate' && typeof characterSaved.character_uid === 'string', characterSaved)
const registry = JSON.parse(await readFile(join(book, '.narracat', 'entities', 'v1', 'registry.json'), 'utf8'))
check('registry records the candidate', registry.entities.some((entity) => entity.name === '雨衣女人' && entity.candidate), registry.entities.map((entity) => entity.name))

// Review submission.
const reviewSaved = await call('novel_submit_review', {
  chapter: 2,
  issues: [{ severity: 'blocker', where: '第 2 段', what: '与第 1 章的雨停时间矛盾', fix_hint: '改成傍晚雨停之后' }],
})
check('review saved with computed verdict', reviewSaved.status === 'saved' && reviewSaved.verdict === 'fail' && reviewSaved.blockers === 1, reviewSaved)
const staleReview = await call('novel_submit_review', { chapter: 2, source_revision: 'deadbeefdeadbeef', issues: [] })
check('stale review returns', staleReview.status === 'returned' && staleReview.issues.some((issue) => issue.code === 'stale_source'), staleReview)
const failedAfter = await call('novel_failed_reviews', {})
check('failed review is listed', failedAfter.failed_chapters.includes(2), failedAfter.failed_chapters)

// ---- authoring programs --------------------------------------------------
const settingsSaved = await call('project_settings_submit', {
  objects: [
    { kind: 'character', op: 'create', name: '雨衣女人', markdown: '# 雨衣女人\n\n旧渡口的常客，雨夜才出现。\n\n（留白）', structured: { gender: '女', age: '三十上下', portrait: '灰雨衣，帽檐压得低，说话很轻。', profile_stage: 'sketch', aliases: ['雨衣女人'] } },
    { kind: 'world', op: 'create', name: '旧船票', markdown: '# 旧船票\n\n旧渡口停航前的凭证，背面刻着木牌上的记号。\n' },
    { kind: 'relationships', op: 'append', rows: [{ a: '林照', relation: '相识', b: '雨衣女人', note: '旧渡口初见' }] },
  ],
})
check('settings batch saved', settingsSaved.status === 'saved' && settingsSaved.saved.length === 3, settingsSaved)
const identityAfter = JSON.parse(await readFile(join(book, '.narracat', 'data', 'bible', 'characters', '雨衣女人.json'), 'utf8'))
check('character identity written', identityAfter.name === '雨衣女人' && identityAfter.portrait.length > 0 && identityAfter.character_uid, identityAfter)
check('character profile written', (await readFile(join(book, 'bible', 'characters', '雨衣女人.md'), 'utf8')).includes('旧渡口'))
check('world setting written', (await readFile(join(book, 'bible', 'world', '旧船票.md'), 'utf8')).includes('旧船票'))
check('relationship appended', (await readFile(join(book, 'bible', 'relationships.md'), 'utf8')).includes('雨衣女人'))

const duplicateCharacter = await call('project_settings_submit', { objects: [{ kind: 'character', op: 'create', name: '雨衣女人', markdown: '# 重复' }] })
check('duplicate character returns', duplicateCharacter.status === 'returned' && duplicateCharacter.issues.some((issue) => issue.code === 'already_exists'), duplicateCharacter.issues?.map((issue) => issue.code))

const updateCharacter = await call('project_settings_submit', { objects: [{ kind: 'character', op: 'update', name: '雨衣女人', markdown: '# 雨衣女人\n\n旧渡口的常客，雨夜才出现。她认得木牌。\n', structured: { aliases: ['雨衣女人', '灰衣人'] } }] })
check('character update merges fields', updateCharacter.status === 'saved', updateCharacter)

const badOpIdentityBefore = JSON.parse(await readFile(join(book, '.narracat', 'data', 'bible', 'characters', '雨衣女人.json'), 'utf8'))
const badOp = await call('project_settings_submit', { objects: [{ kind: 'character', op: 'set', name: '雨衣女人', markdown: '# 雨衣女人\n\n试图覆盖。' }] })
const badOpIdentityAfter = JSON.parse(await readFile(join(book, '.narracat', 'data', 'bible', 'characters', '雨衣女人.json'), 'utf8'))
check('character set/append op is refused', badOp.status === 'returned' && badOp.issues?.some((issue) => issue.code === 'op_invalid'), badOp.issues)
check('refused op leaves the identity untouched', badOpIdentityAfter.character_uid === badOpIdentityBefore.character_uid && badOpIdentityAfter.aliases.length === badOpIdentityBefore.aliases.length, { before: badOpIdentityBefore.aliases, after: badOpIdentityAfter.aliases })
const identityUpdated = JSON.parse(await readFile(join(book, '.narracat', 'data', 'bible', 'characters', '雨衣女人.json'), 'utf8'))
check('update keeps uid and adds alias', identityUpdated.character_uid === identityAfter.character_uid && identityUpdated.aliases.includes('灰衣人') && identityUpdated.gender === '女', identityUpdated)

const badSettings = await call('project_settings_submit', { objects: [{ kind: 'world', op: 'create', name: '坏设定', markdown: '' }] })
check('invalid settings batch returns', badSettings.status === 'returned' && badSettings.issues.length > 0, badSettings.issues?.map((issue) => issue.code))
const badWorldExists = await stat(join(book, 'bible', 'world', '坏设定.md')).then(() => true).catch(() => false)
check('invalid batch writes nothing', badWorldExists === false)

const bookInfo = await call('project_book_info_submit', { title: '雨港来信（修订书名）', words_per_chapter: 1100 })
check('book info saved', bookInfo.status === 'saved' && bookInfo.changed.includes('title'), bookInfo)
const configText = await readFile(join(book, '.narracat', 'config.yaml'), 'utf8')
check('config keeps other keys', configText.includes('雨港来信（修订书名）') && configText.includes('words_per_chapter: 1100') && configText.includes('novel_id:'), configText.split('\n').slice(0, 4))

const tricky = await call('project_book_info_submit', { title: '雨港: 来信 #1', genre: '悬疑: 推理', language: 'en' })
check('book info quotes YAML-unsafe values', tricky.status === 'saved', tricky)
const trickyConfig = parseConfig(await readFile(join(book, '.narracat', 'config.yaml'), 'utf8'))
check('book info round-trips colon and hash', trickyConfig.title === '雨港: 来信 #1' && trickyConfig.genre === '悬疑: 推理' && trickyConfig.language === 'en', { title: trickyConfig.title, genre: trickyConfig.genre, language: trickyConfig.language })
const badLanguage = await call('project_book_info_submit', { language: 'zh-CN\nreview_required: true' })
check('book info rejects an injected language', badLanguage.status === 'returned' && badLanguage.issues?.some((issue) => issue.field === 'language'), badLanguage)

const premiseRead = await call('novel_get_premise_cards', {})
check('premise revision exposed', premiseRead.found === true && Number.isInteger(premiseRead.revision), premiseRead.revision)
const premiseSaved = await call('novel_submit_premise', {
  payload: { cards: [{ card: 'core_hook', fields: [{ key: 'hook', value: '旧渡口每夜来信，写信的人就在镇上。', certainty: 'canon' }] }] },
  merge_cards: true,
  expected_revision: premiseRead.revision,
})
check('premise merged with lock', premiseSaved.status === 'saved' && premiseSaved.revision === premiseRead.revision + 1, premiseSaved)
const premiseStale = await call('novel_submit_premise', {
  payload: { cards: [{ card: 'core_hook', fields: [{ key: 'hook', value: '过期版本', certainty: 'canon' }] }] },
  merge_cards: true,
  expected_revision: premiseRead.revision,
})
check('stale premise revision returns', premiseStale.status === 'returned' && premiseStale.issues.some((issue) => issue.code === 'stale_revision'), premiseStale.issues?.map((issue) => issue.code))
const premiseFile = JSON.parse(await readFile(join(book, '.narracat', 'data', 'bible', 'premise-cards.json'), 'utf8'))
check('premise merge keeps other cards', premiseFile.cards.length > 1 && premiseFile.cards.some((card) => card.card === 'central_dramatic_question'), premiseFile.cards.map((card) => card.card))

// Revision draft + review freshness.
const reviewBefore = await call('novel_get_review', { chapter: 2 })
check('review read with freshness', reviewBefore.found === true && reviewBefore.verdict === 'fail' && reviewBefore.fresh === true, { verdict: reviewBefore.verdict, fresh: reviewBefore.fresh })

const revision = await call('project_revision_draft_open', { chapter: 2 })
check('revision draft opened', revision.status === 'saved' && revision.path === '.narracat/revisions/ch-002.md' && revision.words > 0, revision)
const revisionText = await readFile(join(book, revision.path), 'utf8')
await writeFile(join(book, revision.path), `${revisionText}\n\n（改写测试追加一句。）\n`, 'utf8')
const rewriteSaved = await call('project_chapter_submit', {
  chapter: 2,
  path: revision.path,
  memory: { summary: '改写第 2 章：补了雨停时间的一句交代，其余不变。', events: [{ description: '第 2 章补了一句雨停时间的交代' }] },
})
check('revision publishes over manuscript', rewriteSaved.status === 'saved' && rewriteSaved.path === 'manuscript/vol-01/ch-002.md', { status: rewriteSaved.status, issues: rewriteSaved.issues })
const reviewAfter = await call('novel_get_review', { chapter: 2 })
check('review goes stale after rewrite', reviewAfter.found === true && reviewAfter.fresh === false, { fresh: reviewAfter.fresh, reviewed: reviewAfter.reviewed_source_revision, current: reviewAfter.current_revision })
const memoryAfterRewrite = JSON.parse(await readFile(join(book, '.narracat', 'memory', 'ch-002.json'), 'utf8'))
check('rewrite records memory', memoryAfterRewrite.chapter === 2 && memoryAfterRewrite.summary.includes('改写'), memoryAfterRewrite.summary)

// ---- file-backed memory ledger ------------------------------------------
const memStatus = await call('project_memory_status', {})
check('memory status lists records and gaps', memStatus.recorded_chapters.includes(4) && memStatus.missing_written_chapters.includes(1), memStatus)

const states = await call('novel_character_statuses', { names: ['林照'] })
check('folded character state', states.characters[0].state.inventory?.value === '木牌' && states.characters[0].state.inventory.chapter === 4, states.characters[0].state)

const summaries = await call('novel_chapter_summary', { from: 2, to: 4 })
check('chapter summaries', summaries.summaries.some((row) => row.chapter === 2) && summaries.summaries.some((row) => row.chapter === 4), summaries.summaries.map((row) => row.chapter))

const shadows = await call('novel_foreshadowing_status', {})
check('foreshadowing actions folded', shadows.unregistered.includes('letter-line'), shadows.unregistered)

const reconcile = await call('project_memory_reconcile', {})
check('reconcile lists missing chapters', reconcile.status === 'needs_review' && reconcile.missing_chapters.includes(1), reconcile)

const recorded = await call('novel_memory_record', {
  chapter: 1,
  memory: {
    summary: '林照在渡口石阶缝里拾到一封写给自己的信，决定明早再来。',
    state_changes: [{ character: '林照', dimension: 'inventory', operation: 'add', value: '信笺' }],
  },
})
check('memory record written directly', recorded.status === 'saved' && recorded.fresh === true, recorded)
const memStatus2 = await call('project_memory_status', {})
check('status reflects the new record', memStatus2.recorded_chapters.includes(1) && !memStatus2.missing_written_chapters.includes(1), memStatus2.missing_written_chapters)

// Simulate an author editing the manuscript outside the pipeline.
const ch1Path = join(book, 'manuscript', 'vol-01', 'ch-001.md')
const ch1Original = await readFile(ch1Path, 'utf8')
await writeFile(ch1Path, `${ch1Original}\n\n（作者手改一句。）\n`, 'utf8')
const staleStatus = await call('project_memory_status', {})
check('edited manuscript makes memory stale', staleStatus.stale_chapters.includes(1), staleStatus.stale_chapters)
const reconcileAfterEdit = await call('project_memory_reconcile', {})
check('reconcile points at stale chapter', reconcileAfterEdit.stale_chapters.includes(1), reconcileAfterEdit)
const reRecorded = await call('novel_memory_record', { chapter: 1, memory: { summary: '林照拾到信，决定明早再来；作者补了一句环境。', state_changes: [{ character: '林照', dimension: 'inventory', operation: 'add', value: '信笺' }] } })
check('re-record clears staleness', reRecorded.status === 'saved' && reRecorded.fresh === true, reRecorded)
const reconcileClean = await call('project_memory_reconcile', {})
check('memory returns to current', !reconcileClean.stale_chapters.includes(1), reconcileClean)

// ---- optional review gate ------------------------------------------------
const gateOn = await call('project_book_info_submit', { review_required: true })
check('review gate switched on', gateOn.status === 'saved' && gateOn.changed.includes('review_required'), gateOn)
const ch6Draft = `第六章 夜航\n\n${'渡船在雨夜里慢慢靠岸，他把木牌按在胸口。'.repeat(56)}\n`
await writeFile(join(book, '.narracat', 'staging', `ch-${pad3(6)}.md`), ch6Draft, 'utf8')
const gateReturned = await call('project_chapter_submit', { chapter: 6, memory: { summary: '林照夜航去对岸，带着木牌找写信的人。' } })
check('gate blocks un-reviewed draft', gateReturned.status === 'returned' && gateReturned.issues.some((issue) => issue.code === 'review_required'), gateReturned.issues?.map((issue) => issue.code))
const draftReview = await call('novel_submit_review', { chapter: 6, path: `.narracat/staging/ch-${pad3(6)}.md`, issues: [] })
check('draft review saved', draftReview.status === 'saved' && draftReview.verdict === 'pass', draftReview)
const gateSaved = await call('project_chapter_submit', { chapter: 6, memory: { summary: '林照夜航去对岸，带着木牌找写信的人；对岸有人等他。', events: [{ description: '林照夜航去对岸' }, { description: '对岸有人等他' }] } })
check('gate opens after passing review', gateSaved.status === 'saved' && gateSaved.path.endsWith('ch-006.md'), { status: gateSaved.status, path: gateSaved.path, issues: gateSaved.issues })

// ---- entities and ontology -----------------------------------------------
await call('novel_memory_record', {
  chapter: 6,
  memory: {
    summary: '林照夜航到对岸，撑船人收下船钱，指给他一间亮灯的屋子。',
    state_changes: [{ character: '撑船人', dimension: 'inventory', operation: 'add', value: '船钱' }],
  },
})
const candidates = await call('novel_list_entity_candidates', {})
check('entity candidates found', candidates.candidates.some((row) => row.name === '撑船人'), candidates.candidates)
check('candidate response carries known entities and types', candidates.known_entities.includes('林照') && candidates.entity_types.length > 0, { known: candidates.known_entities.slice(0, 3), types: candidates.entity_types })

const proposed = await call('novel_submit_entity_proposals', {
  proposals: [
    { name: '撑船人', action: 'new_entity', type: '人物', reason: '第 6 章撑船的人，收下船钱指路，后文可能再出现。' },
    { name: '亮灯的屋子', action: 'description', reason: '第 6 章当场的描述，不是固定名字。' },
  ],
})
check('entity proposals saved', proposed.status === 'saved' && proposed.proposals.length === 2, proposed)
const accepted = await call('novel_decide_entity_proposal', { id: proposed.proposals[0].id, decision: 'accept' })
check('entity proposal accepted', accepted.status === 'saved' && accepted.entity?.name === '撑船人', accepted)
const dismissed = await call('novel_decide_entity_proposal', { id: proposed.proposals[1].id, decision: 'dismiss' })
check('entity proposal dismissed', dismissed.status === 'saved' && dismissed.decision === 'dismiss', dismissed)
const entities = await call('novel_list_entities', {})
check('registry lists the accepted entity', entities.entities.some((entity) => entity.name === '撑船人'), entities.entities.map((entity) => entity.name))
check('accepted entity keeps its proposed type', entities.entities.find((entity) => entity.name === '撑船人')?.type === 'type:person', entities.entities.find((entity) => entity.name === '撑船人'))
const page = await call('novel_entity_page', { name: '撑船人' })
check('entity page found', page.found === true && page.entity.name === '撑船人', page.entity)

const ontology = await call('novel_get_ontology', {})
check('ontology falls back to template', ontology.source === 'template' && ontology.ontology.dimensions.length > 0, { source: ontology.source, dimensions: ontology.ontology.dimensions.length })
const unclassified = await call('novel_ontology_unclassified', {})
check('unclassified dimensions found', unclassified.unclassified.some((row) => row.dimension === 'inventory'), unclassified.unclassified)
const ontologyProposal = await call('novel_ontology_propose', {
  edits: [{ op: 'upsert_dimension', dimension: { id: 'dim:inventory', label: '持有物', type: 'type:person', multivalued: true, value: { kind: 'free' } } }],
  reason: '各章反复记「拿了什么、丢了什么」，需要一条「持有物」维度。',
  evidence: '第 4、6 章的记忆里都用到 inventory。',
})
check('ontology proposal saved', ontologyProposal.status === 'saved' && typeof ontologyProposal.proposal_id === 'string', ontologyProposal)
const ontologyApplied = await call('novel_ontology_decide', { id: ontologyProposal.proposal_id, action: 'accept' })
check('ontology accepted and revision bumped', ontologyApplied.status === 'saved' && ontologyApplied.revision === 1, ontologyApplied)
const ontologyAfter = await call('novel_get_ontology', {})
check('book ontology written', ontologyAfter.source === 'file' && ontologyAfter.ontology.dimensions.some((dimension) => dimension.id === 'dim:inventory'), { source: ontologyAfter.source, revision: ontologyAfter.revision })
const unclassifiedAfter = await call('novel_ontology_unclassified', {})
check('inventory no longer unclassified', !unclassifiedAfter.unclassified.some((row) => row.dimension === 'inventory'), unclassifiedAfter.unclassified)
check('unclassified fact count reaches zero', unclassifiedAfter.total_facts === 0, unclassifiedAfter.total_facts)
const badOntology = await call('novel_ontology_propose', { edits: [], reason: '空提议' })
check('empty ontology proposal returns', badOntology.status === 'returned', badOntology.issues)

const bookStillValid = await isBookDir(book)
check('book still valid', bookStillValid)

// Author "at least N words" requirement must still be checked, not ignored.
await writeFile(join(book, '.narracat', 'staging', 'ch-007.md'), '第七章 短稿\n\n只有一句话。\n', 'utf8')
const minOnly = await call('project_chapter_submit', {
  chapter: 7,
  memory: { summary: '这一章至少十二个字用来通过摘要长度检查。', events: [{ description: '短稿里只写了一句话' }] },
  word_requirement: { min: 5000, author_quote: '至少五千字' },
})
check('min-only word requirement still blocks a short draft', minOnly.status === 'returned' && minOnly.issues?.some((issue) => issue.code === 'word_below'), minOnly.issues)
const badRange = await call('project_chapter_submit', {
  chapter: 7,
  memory: { summary: '这一章至少十二个字用来通过摘要长度检查。', events: [{ description: '短稿里只写了一句话' }] },
  word_requirement: { min: 500, max: 100 },
})
check('invalid word range returns an issue', badRange.status === 'returned' && badRange.issues?.some((issue) => issue.code === 'word_requirement_invalid'), badRange.issues)
await rm(join(book, '.narracat', 'staging', 'ch-007.md'), { force: true })

// A failed memory write must not be reported as a clean save.
await call('project_book_info_submit', { review_required: false })
await writeFile(join(book, '.narracat', 'staging', 'ch-008.md'), `第八章 故障测试\n\n${'雨'.repeat(1050)}\n`, 'utf8')
await mkdir(join(book, '.narracat', 'memory', 'ch-008.json'), { recursive: true })
const partial = await call('project_chapter_submit', {
  chapter: 8,
  memory: { summary: '林照在雨里等了一夜，没有等到写信的人。', events: [{ description: '林照在雨里等了一夜' }] },
})
check('failed memory write returns a partial stop', partial.status === 'stopped' && partial.code === 'memory_write_failed' && partial.published === true, partial)
check('failed memory write keeps the draft', await stat(join(book, '.narracat', 'staging', 'ch-008.md')).then(() => true).catch(() => false))
await rm(join(book, '.narracat', 'memory', 'ch-008.json'), { recursive: true, force: true })

// Packaged contracts must not point at tools this build does not register.
const intakeContract = await readFile(new URL('../novel-workbench/docs/contracts/new-character-intake.md', import.meta.url), 'utf8')
const outlineContract = await readFile(new URL('../novel-workbench/docs/contracts/outline-planning.md', import.meta.url), 'utf8')
check('new-character contract uses the current submit tool', !intakeContract.includes('novel_list_candidate_characters') && intakeContract.includes('project_outline_submit'))
check('outline contract uses the current submit tool', !outlineContract.includes('novel_submit_outline') && outlineContract.includes('project_outline_submit'))

await rm(workspace, { recursive: true, force: true })
console.log(failures === 0 ? '\nAGENT CHECKS PASSED' : `\n${failures} AGENT CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
