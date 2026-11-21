/**
 * Entity registry and book ontology programs.
 *
 * The entity registry (`.narracat/entities/v1/registry.json`) is the book's name
 * book; the ontology (`ontology/v1/ontology.json`) declares which dimensions and
 * relations the memory ledger may use. This version ports the author-confirmed
 * workflow: the agent lists candidates, proposes classifications, and the author
 * decides; accepted proposals are applied here.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSnapshot, readBookFile, writeBookFile } from './project.js'

/** Plugin package root (for the starter ontology template). */
const PLUGIN_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

/** Registry file. */
const REGISTRY = '.narracat/entities/v1/registry.json'
/** Entity proposal file. */
const ENTITY_PROPOSALS = '.narracat/entities/v1/proposals.json'
/** Ontology file. */
const ONTOLOGY = '.narracat/ontology/v1/ontology.json'
/** Ontology proposal file. */
const ONTOLOGY_PROPOSALS = '.narracat/ontology/v1/proposals.json'

/** Read JSON or null. */
async function readJson(book, rel) {
  try {
    return JSON.parse((await readBookFile(book, rel)).text)
  } catch {
    return null
  }
}

/** Write JSON as an internal program. */
async function writeJson(book, rel, value) {
  return await writeBookFile(book, rel, JSON.stringify(value, null, 2), undefined, { internal: true })
}

/** Random hex id. */
function randomId(prefix) {
  return `${prefix}:${createHash('sha256').update(`${prefix}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12)}`
}

/** Load the registry with a stable empty shape. */
async function loadRegistry(book) {
  const registry = (await readJson(book, REGISTRY)) ?? { schemaVersion: 1, entities: [], merges: [] }
  if (!Array.isArray(registry.entities)) registry.entities = []
  if (!Array.isArray(registry.merges)) registry.merges = []
  return registry
}

/** Names and aliases already known to the registry. */
function knownNames(registry) {
  const names = new Set()
  for (const entity of registry.entities ?? []) {
    if (typeof entity?.name === 'string') names.add(entity.name)
    for (const alias of Array.isArray(entity?.aliases) ? entity.aliases : []) {
      if (typeof alias?.name === 'string') names.add(alias.name)
      else if (typeof alias === 'string') names.add(alias)
    }
  }
  return names
}

/** The starter ontology shipped with the plugin. */
function starterOntology() {
  try {
    return JSON.parse(readFileSync(join(PLUGIN_ROOT, 'templates', 'ontology-novel-starter.json'), 'utf8'))
  } catch {
    return { schema_version: 1, types: [], dimensions: [], relations: [], redirects: [] }
  }
}

/** Load the effective ontology: the book file, else the starter template. */
async function loadOntology(book) {
  const file = await readJson(book, ONTOLOGY)
  if (file && typeof file === 'object') return { source: 'file', revision: Number.isInteger(file.revision) ? file.revision : 0, ontology: file }
  return { source: 'template', revision: 0, ontology: starterOntology() }
}

/** Dimension lookup by id, label and aliases. */
function dimensionIndex(ontology) {
  const index = new Map()
  for (const dimension of Array.isArray(ontology?.dimensions) ? ontology.dimensions : []) {
    if (dimension?.deprecated === true) continue
    const id = typeof dimension?.id === 'string' ? dimension.id : ''
    const bare = id.replace(/^dim:/, '')
    for (const key of [id, bare, bare.toLowerCase(), dimension?.label, ...(Array.isArray(dimension?.aliases) ? dimension.aliases : [])]) {
      if (typeof key === 'string' && key.length > 0) index.set(key, dimension)
    }
  }
  return index
}

/** Human labels for the entity types the book understands. */
function entityTypes(ontology) {
  return (Array.isArray(ontology?.types) ? ontology.types : []).map((type) => type?.label ?? type?.id ?? '').filter(Boolean)
}

/**
 * `novel_list_entities`: every registered entity.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} entities body.
 */
export async function listEntities(book) {
  const registry = await loadRegistry(book)
  return {
    entities: (registry.entities ?? []).map((entity) => ({
      id: entity.id,
      type: entity.type,
      name: entity.name ?? null,
      aliases: (Array.isArray(entity.aliases) ? entity.aliases : []).map((alias) => (typeof alias === 'string' ? alias : alias?.name)).filter(Boolean),
      summary: entity.summary ?? '',
      candidate: entity.candidate ?? null,
      has_page: Boolean(entity.sourceUnit),
    })),
    merges: registry.merges?.length ?? 0,
    hint: (registry.entities ?? []).length === 0 ? '登记表还是空的。' : undefined,
  }
}

/**
 * `novel_entity_page`: one entity plus the chapters its memory mentions it in.
 * @param {string} book - real book directory.
 * @param {{ id?: string, name?: string }} args - selector.
 * @returns {Promise<object>} entity body.
 */
export async function entityPage(book, args) {
  const registry = await loadRegistry(book)
  const id = typeof args.id === 'string' ? args.id : ''
  const name = typeof args.name === 'string' ? args.name : ''
  const entity = (registry.entities ?? []).find((item) => (id && item.id === id) || (name && (item.name === name
    || (Array.isArray(item.aliases) ? item.aliases.some((alias) => (typeof alias === 'string' ? alias : alias?.name) === name) : false))))
  if (!entity) return { found: false, id, name, hint: '登记表里没有这个实体。' }
  const snapshot = await buildSnapshot(book)
  const names = [entity.name, ...(Array.isArray(entity.aliases) ? entity.aliases.map((alias) => (typeof alias === 'string' ? alias : alias?.name)) : [])].filter(Boolean)
  const mentions = []
  for (const record of snapshot.memoryRecords ?? []) {
    if (names.some((value) => record.summary.includes(value))) mentions.push({ chapter: record.chapter, summary: record.summary.slice(0, 120) })
  }
  return {
    found: true,
    entity: {
      id: entity.id,
      type: entity.type,
      name: entity.name ?? null,
      aliases: names.slice(1),
      summary: entity.summary ?? '',
      source_unit: entity.sourceUnit ?? null,
      candidate: entity.candidate ?? null,
    },
    mentions,
  }
}

/**
 * `novel_list_entity_candidates`: names used in chapter memory that the registry
 * does not know yet.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} candidates body.
 */
export async function entityCandidates(book) {
  const registry = await loadRegistry(book)
  const known = knownNames(registry)
  const snapshot = await buildSnapshot(book)
  const characterNames = new Set((snapshot.characters ?? []).map((row) => row.name))
  // A name the author dismissed (or already has a pending proposal for) is not
  // a fresh candidate; otherwise it would be proposed again on every scan.
  const proposalFile = await readJson(book, ENTITY_PROPOSALS)
  const latest = new Map()
  for (const proposal of Array.isArray(proposalFile?.proposals) ? proposalFile.proposals : []) {
    if (typeof proposal?.name === 'string' && proposal.name.length > 0) latest.set(proposal.name, proposal.status)
  }
  const suppressed = new Set([...latest.entries()].filter(([, status]) => status === 'dismissed' || status === 'pending').map(([name]) => name))
  /** @type {Map<string, { name: string, occurrences: number, chapters: number[] }>} */
  const seen = new Map()
  for (const record of snapshot.memoryRecords ?? []) {
    const touch = (name) => {
      if (typeof name !== 'string' || name.trim().length === 0) return
      if (known.has(name) || characterNames.has(name) || suppressed.has(name)) return
      const current = seen.get(name) ?? { name, occurrences: 0, chapters: [] }
      current.occurrences += 1
      if (!current.chapters.includes(record.chapter)) current.chapters.push(record.chapter)
      seen.set(name, current)
    }
    for (const change of record.state_changes ?? []) touch(change?.character)
  }
  const ontology = (await loadOntology(book)).ontology
  const knownEntities = [...new Set([...known, ...characterNames])]
  return {
    candidates: [...seen.values()].sort((left, right) => right.occurrences - left.occurrences),
    known_entities: knownEntities.slice(0, 100),
    entity_types: entityTypes(ontology),
    old_labels_not_proposed: [],
    hint: seen.size === 0 ? '记忆里没有还需要整理的名字。' : undefined,
  }
}

/**
 * `novel_submit_entity_proposals`: classify candidate names, pending author decision.
 * @param {string} book - real book directory.
 * @param {{ proposals: object[] }} args - proposals.
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function submitEntityProposals(book, args) {
  const proposals = Array.isArray(args.proposals) ? args.proposals : null
  if (!proposals || proposals.length === 0) {
    return { status: 'returned', issues: [{ step: 'entities', code: 'proposals_missing', message: '没有要提交的名字分类', hint: 'proposals 每项写 {name, action: new_entity|alias_of|generic|description, type?, target?, reason}。' }] }
  }
  const issues = []
  for (const [index, proposal] of proposals.entries()) {
    if (typeof proposal?.name !== 'string' || proposal.name.trim().length === 0) {
      issues.push({ step: 'entities', code: 'name_invalid', field: `proposals[${index}].name`, message: '缺少名字', hint: 'name 写候选名字本身。' })
      continue
    }
    if (!['new_entity', 'alias_of', 'generic', 'description'].includes(proposal.action)) {
      issues.push({ step: 'entities', code: 'action_invalid', field: `proposals[${index}].action`, message: '分类只能是 new_entity / alias_of / generic / description', hint: 'new_entity 是书里真实存在的新东西；alias_of 是已有实体的另一个叫法；generic 是泛称；description 是当时剧情里的描述。' })
    }
    if (proposal.action === 'alias_of' && (typeof proposal.target !== 'string' || proposal.target.trim().length === 0)) {
      issues.push({ step: 'entities', code: 'target_missing', field: `proposals[${index}].target`, message: 'alias_of 要写它指的是谁', hint: 'target 写所指实体的名字。' })
    }
    if (typeof proposal.reason !== 'string' || proposal.reason.trim().length === 0) {
      issues.push({ step: 'entities', code: 'reason_missing', field: `proposals[${index}].reason`, message: '每条分类都要写依据', hint: 'reason 引用具体的事实或章节，会原样给作者看。' })
    }
  }
  if (issues.length > 0) return { status: 'returned', issues }
  const file = (await readJson(book, ENTITY_PROPOSALS)) ?? { schemaVersion: 1, proposals: [] }
  if (!Array.isArray(file.proposals)) file.proposals = []
  const created = proposals.map((proposal) => ({
    id: randomId('prop'),
    name: proposal.name.trim(),
    action: proposal.action,
    type: proposal.type ?? null,
    target: proposal.target ?? null,
    reason: proposal.reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }))
  file.proposals.push(...created)
  try {
    await writeJson(book, ENTITY_PROPOSALS, file)
  } catch (error) {
    return { status: 'stopped', step: 'entities', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return {
    status: 'saved',
    path: ENTITY_PROPOSALS,
    proposals: created.map((proposal) => ({ id: proposal.id, name: proposal.name, action: proposal.action })),
    hint: '提议已存成待确认；先用 ask_user_question 问作者，再按作者决定调 novel_decide_entity_proposal。',
  }
}

/**
 * `novel_decide_entity_proposal`: apply the author's accept/dismiss decision.
 * @param {string} book - real book directory.
 * @param {{ id: string, decision: 'accept' | 'dismiss' }} args - decision.
 * @returns {Promise<object>} stopped / saved.
 */
export async function decideEntityProposal(book, args) {
  const id = String(args.id ?? '')
  const decision = args.decision
  if (!['accept', 'dismiss'].includes(decision)) return { status: 'stopped', step: 'entities', code: 'decision_invalid', reason: 'decision 只能是 accept 或 dismiss。' }
  const file = await readJson(book, ENTITY_PROPOSALS)
  const proposal = file?.proposals?.find((item) => item?.id === id)
  if (!proposal) return { status: 'stopped', step: 'entities', code: 'not_found', reason: `没有找到待确认的名字提议 ${id}。` }
  if (proposal.status !== 'pending') return { status: 'stopped', step: 'entities', code: 'already_decided', reason: '这条提议已经处理过了。' }
  const registry = await loadRegistry(book)
  let entity = null
  const now = new Date().toISOString()
  if (decision === 'accept') {
    if (proposal.action === 'new_entity') {
      const ontology = (await loadOntology(book)).ontology
      const types = Array.isArray(ontology?.types) ? ontology.types : []
      const wanted = String(proposal.type ?? '').trim()
      const matched = types.find((type) => type?.id === wanted || type?.label === wanted
        || (Array.isArray(type?.aliases) ? type.aliases.includes(wanted) : false))
      entity = {
        id: randomId('entity'),
        type: matched?.id ?? 'type:concept',
        name: proposal.name,
        aliases: [],
        summary: '',
        source_unit: null,
        createdAt: now,
        updatedAt: now,
      }
      registry.entities.push(entity)
    } else if (proposal.action === 'alias_of') {
      const target = registry.entities.find((item) => item?.name === proposal.target
        || (Array.isArray(item?.aliases) ? item.aliases.some((alias) => (typeof alias === 'string' ? alias : alias?.name) === proposal.target) : false))
      if (!target) return { status: 'stopped', step: 'entities', code: 'target_not_found', reason: `找不到提议指向的实体「${proposal.target}」。` }
      if (!Array.isArray(target.aliases)) target.aliases = []
      if (!target.aliases.some((alias) => (typeof alias === 'string' ? alias : alias?.name) === proposal.name)) {
        target.aliases.push({ name: proposal.name, source: 'author', sinceChapter: null })
      }
      target.updatedAt = now
      entity = target
    }
    proposal.status = 'accepted'
  } else {
    proposal.status = 'dismissed'
  }
  proposal.decidedAt = now
  try {
    await writeJson(book, ENTITY_PROPOSALS, file)
    if (decision === 'accept' && (proposal.action === 'new_entity' || proposal.action === 'alias_of')) {
      await writeJson(book, REGISTRY, registry)
    }
  } catch (error) {
    return { status: 'stopped', step: 'entities', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return {
    status: 'saved',
    decision,
    proposal_id: id,
    action: proposal.action,
    ...(entity ? { entity: { id: entity.id, type: entity.type, name: entity.name, aliases: (entity.aliases ?? []).map((alias) => (typeof alias === 'string' ? alias : alias?.name)).filter(Boolean) } } : {}),
  }
}

/** Validate ontology edits and return readable issues. */
function validateOntologyEdits(edits) {
  const issues = []
  if (!Array.isArray(edits) || edits.length === 0) {
    issues.push({ step: 'ontology', code: 'edits_missing', message: '没有本体改动', hint: 'edits 每项写 {op: upsert_dimension|upsert_relation|upsert_type|deprecate_dimension, ...}。' })
    return issues
  }
  for (const [index, edit] of edits.entries()) {
    const op = edit?.op
    if (!['upsert_dimension', 'upsert_relation', 'upsert_type', 'deprecate_dimension'].includes(op)) {
      issues.push({ step: 'ontology', code: 'op_invalid', field: `edits[${index}].op`, message: '不认识的本体改动', hint: 'op 只能是 upsert_dimension / upsert_relation / upsert_type / deprecate_dimension。' })
      continue
    }
    if (op === 'upsert_dimension' && (typeof edit.dimension?.id !== 'string' || typeof edit.dimension?.label !== 'string')) {
      issues.push({ step: 'ontology', code: 'dimension_invalid', field: `edits[${index}].dimension`, message: '维度要有 id 与 label', hint: 'id 以 dim: 开头，label 用作者能懂的名字。' })
    }
    if (op === 'upsert_relation' && (typeof edit.relation?.id !== 'string' || typeof edit.relation?.label !== 'string')) {
      issues.push({ step: 'ontology', code: 'relation_invalid', field: `edits[${index}].relation`, message: '关系要有 id 与 label', hint: 'id 以 rel: 开头。' })
    }
    if (op === 'upsert_type' && (typeof edit.type?.id !== 'string' || typeof edit.type?.label !== 'string')) {
      issues.push({ step: 'ontology', code: 'type_invalid', field: `edits[${index}].type`, message: '类型要有 id 与 label', hint: 'id 以 type: 开头。' })
    }
    if (op === 'deprecate_dimension' && typeof edit.id !== 'string') {
      issues.push({ step: 'ontology', code: 'id_missing', field: `edits[${index}].id`, message: '停用维度要写 id', hint: 'id 写要停用的维度编号。' })
    }
  }
  return issues
}

/** Apply validated edits to one ontology copy. */
function applyOntologyEdits(ontology, edits) {
  const next = JSON.parse(JSON.stringify(ontology))
  next.types = Array.isArray(next.types) ? next.types : []
  next.dimensions = Array.isArray(next.dimensions) ? next.dimensions : []
  next.relations = Array.isArray(next.relations) ? next.relations : []
  next.redirects = Array.isArray(next.redirects) ? next.redirects : []
  const upsert = (list, item) => {
    const at = list.findIndex((entry) => entry?.id === item.id)
    if (at >= 0) list[at] = { ...list[at], ...item, source: 'author' }
    else list.push({ ...item, source: 'author' })
  }
  for (const edit of edits) {
    if (edit.op === 'upsert_dimension') upsert(next.dimensions, edit.dimension)
    else if (edit.op === 'upsert_relation') upsert(next.relations, edit.relation)
    else if (edit.op === 'upsert_type') upsert(next.types, edit.type)
    else if (edit.op === 'deprecate_dimension') {
      const dimension = next.dimensions.find((entry) => entry?.id === edit.id)
      if (dimension) {
        dimension.deprecated = true
        if (typeof edit.replaced_by === 'string') dimension.replaced_by = edit.replaced_by
      }
    }
  }
  next.schema_version = Number.isInteger(next.schema_version) ? next.schema_version : 1
  return next
}

/**
 * `novel_get_ontology`: the book ontology, or the starter template.
 * @param {string} book - real book directory.
 * @returns {Promise<object>} ontology body.
 */
export async function getOntology(book) {
  const loaded = await loadOntology(book)
  return {
    source: loaded.source,
    revision: loaded.revision,
    ontology: loaded.ontology,
    hint: loaded.source === 'template' ? '这本书还没有自己的本体，现在用的是起步模板；作者确认提议后才会写成这本书的本体。' : undefined,
  }
}

/**
 * `novel_ontology_unclassified`: memory dimensions the ontology does not declare.
 * @param {string} book - real book directory.
 * @param {{ limit?: number }} args - cap.
 * @returns {Promise<object>} unclassified body.
 */
export async function unclassifiedDimensions(book, args = {}) {
  const limit = Math.min(Math.max(Number(args.limit ?? 20), 1), 100)
  const snapshot = await buildSnapshot(book)
  const index = dimensionIndex((await loadOntology(book)).ontology)
  /** @type {Map<string, { dimension: string, count: number, chapters: number[] }>} */
  const seen = new Map()
  let totalFacts = 0
  for (const record of snapshot.memoryRecords ?? []) {
    for (const change of record.state_changes ?? []) {
      const dimension = typeof change?.dimension === 'string' ? change.dimension : ''
      if (dimension.length === 0) continue
      if (index.has(dimension)) continue
      totalFacts += 1
      const current = seen.get(dimension) ?? { dimension, count: 0, chapters: [] }
      current.count += 1
      if (!current.chapters.includes(record.chapter)) current.chapters.push(record.chapter)
      seen.set(dimension, current)
    }
  }
  const groups = [...seen.values()].sort((left, right) => right.count - left.count).slice(0, limit)
  return {
    unclassified: groups,
    total_facts: totalFacts,
    unclassified_facts: totalFacts,
    remaining_groups: Math.max(0, seen.size - groups.length),
    hint: groups.length === 0 ? '记忆里的状态维度都已经归进本书本体。' : undefined,
  }
}

/**
 * `novel_ontology_propose`: queue ontology edits for the author's decision.
 * @param {string} book - real book directory.
 * @param {{ edits: object[], reason: string }} args - proposal.
 * @returns {Promise<object>} returned / stopped / saved.
 */
export async function proposeOntology(book, args) {
  const issues = validateOntologyEdits(args.edits)
  if (issues.length > 0) return { status: 'returned', issues }
  if (typeof args.reason !== 'string' || args.reason.trim().length < 4) {
    return { status: 'returned', issues: [{ step: 'ontology', code: 'reason_missing', message: '每条提议都要写依据', hint: 'reason 用作者能懂的话写为什么，会原样给作者看。' }] }
  }
  const file = (await readJson(book, ONTOLOGY_PROPOSALS)) ?? { schemaVersion: 1, proposals: [] }
  if (!Array.isArray(file.proposals)) file.proposals = []
  const proposal = {
    id: randomId('onto'),
    edits: args.edits,
    reason: args.reason,
    evidence: args.evidence ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  file.proposals.push(proposal)
  try {
    await writeJson(book, ONTOLOGY_PROPOSALS, file)
  } catch (error) {
    return { status: 'stopped', step: 'ontology', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return {
    status: 'saved',
    path: ONTOLOGY_PROPOSALS,
    proposal_id: proposal.id,
    hint: '提议已排队；先用 ask_user_question 问作者，再按作者决定调 novel_ontology_decide。',
  }
}

/**
 * `novel_ontology_decide`: apply or dismiss one ontology proposal.
 * @param {string} book - real book directory.
 * @param {{ id: string, action: 'accept' | 'dismiss' }} args - decision.
 * @returns {Promise<object>} stopped / saved.
 */
export async function decideOntology(book, args) {
  const id = String(args.id ?? '')
  const action = args.action
  if (!['accept', 'dismiss'].includes(action)) return { status: 'stopped', step: 'ontology', code: 'action_invalid', reason: 'action 只能是 accept 或 dismiss。' }
  const file = await readJson(book, ONTOLOGY_PROPOSALS)
  const proposal = file?.proposals?.find((item) => item?.id === id)
  if (!proposal) return { status: 'stopped', step: 'ontology', code: 'not_found', reason: `没有找到待确认的本体提议 ${id}。` }
  if (proposal.status !== 'pending') return { status: 'stopped', step: 'ontology', code: 'already_decided', reason: '这条提议已经处理过了。' }
  let revision = null
  if (action === 'accept') {
    const loaded = await loadOntology(book)
    const next = applyOntologyEdits(loaded.ontology, proposal.edits)
    revision = loaded.revision + 1
    next.revision = revision
    try {
      await writeJson(book, ONTOLOGY, next)
    } catch (error) {
      return { status: 'stopped', step: 'ontology', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
    }
  }
  proposal.status = action === 'accept' ? 'accepted' : 'dismissed'
  proposal.decidedAt = new Date().toISOString()
  try {
    await writeJson(book, ONTOLOGY_PROPOSALS, file)
  } catch (error) {
    return { status: 'stopped', step: 'ontology', code: 'write_failed', reason: String(error instanceof Error ? error.message : error) }
  }
  return { status: 'saved', action, proposal_id: id, revision }
}
