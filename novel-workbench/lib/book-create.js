/**
 * Create a new Narracat `.narracat` book from the workbench.
 *
 * A book is a directory, so "new book" is a small filesystem scaffold plus a
 * config file. This module owns the scaffold shape and the defaults a first
 * book needs; the HTTP route in `index.js` adds it to the DSH workspace
 * registry so the Agent can open a session rooted at the book.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { isBookDir } from './project.js'
import { MEMO_PATH, MEMO_STARTER } from './tracking.js'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

/** Where new books go when the author does not pick a folder. */
export const DEFAULT_LIBRARY_DIR = process.env.NARRACAT_LIBRARY_DIR
  ? resolve(process.env.NARRACAT_LIBRARY_DIR)
  : join(homedir(), 'Documents', 'Narracat')

/** Strip characters that break a folder name, and keep the name readable. */
export function safeFolderName(value) {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|\0]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 60)
  return cleaned.length > 0 ? cleaned : '未命名作品'
}

/** Expand `~` and resolve against the current directory. */
export function resolveParentDir(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw.length === 0) return resolve(DEFAULT_LIBRARY_DIR)
  if (raw === '~') return homedir()
  if (raw.startsWith('~/') || raw.startsWith('~\\')) return resolve(homedir(), raw.slice(2))
  return resolve(raw)
}

/** Pick a folder name that does not collide with an existing directory. */
async function availableFolder(parent, title) {
  const base = safeFolderName(title)
  for (let index = 1; index < 100; index += 1) {
    const name = index === 1 ? base : `${base} ${index}`
    const target = join(parent, name)
    try {
      await stat(target)
    } catch {
      return { name, target }
    }
  }
  throw new Error('同名作品太多了，请换一个书名。')
}

/** YAML string: quote when the value could be read as structure. */
function yamlString(value) {
  const text = String(value ?? '').trim()
  const reserved = /^(?:null|~|true|false|[-+]?\d+(?:\.\d+)?)$/i.test(text)
  const safe = /^[\w\u4e00-\u9fff][\w\u4e00-\u9fff .,!?，。！？、；：（）()《》·—-]*$/u.test(text)
  return safe && !reserved ? text : JSON.stringify(text)
}

/** Validate and normalise the fields the dialog / route accepts. */
export function normaliseBookInput(input) {
  const title = String(input?.title ?? '').replace(/\s+/g, ' ').trim()
  if (title.length === 0) throw new Error('请先给作品起一个名字。')
  if (Array.from(title).length > 80) throw new Error('书名太长了，请控制在 80 个字以内。')
  const genre = String(input?.genre ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
  const languageRaw = String(input?.language ?? 'zh-CN').trim() || 'zh-CN'
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(languageRaw)) throw new Error('语言要写成 zh-CN / en 这样的语言标记。')
  const language = languageRaw
  const idea = String(input?.idea ?? '').trim().slice(0, 4000)
  const planned = Number(input?.plannedChapters ?? input?.planned_chapters ?? 20)
  if (!Number.isInteger(planned) || planned < 1 || planned > 2000) {
    throw new Error('计划章数要填 1 到 2000 之间的整数。')
  }
  const words = Number(input?.wordsPerChapter ?? input?.words_per_chapter ?? 3000)
  if (!Number.isInteger(words) || words < 300 || words > 20000) {
    throw new Error('每章字数要填 300 到 20000 之间的整数。')
  }
  return { title, genre, language, idea, plannedChapters: planned, wordsPerChapter: words }
}

/** The config a new book starts with. Keep it flat and readable. */
export function buildConfigYaml(fields) {
  const lines = [
    `novel_id: ${randomUUID()}`,
    `title: ${yamlString(fields.title)}`,
    `genre: ${yamlString(fields.genre)}`,
    `language: ${fields.language}`,
    `automation_level: collaborative`,
    `estimated_total_chapters: ${fields.plannedChapters}`,
    `words_per_chapter: ${fields.wordsPerChapter}`,
    `style_profile: null`,
    `chapter_gate: off`,
    `chapter_gate_skips: 0`,
  ]
  return `${lines.join('\n')}\n`
}

/** The book's own instruction file: only the author's words, no template. */
function ideaInstructions(idea) {
  if (!idea) return null
  return `# 本书想法\n\n${idea}\n\n（开书时记下的一句话。写作中随时可以改；Agent 每轮会读到。）\n`
}

/** Create the directories a book needs before its first submission. */
async function scaffoldDirs(bookDir) {
  const dirs = [
    'bible/characters',
    'bible/world',
    'manuscript/vol-01',
    '.narracat/data/bible/characters',
    '.narracat/data/outline/vol-01',
    '.narracat/entities/v1',
    '.narracat/memory',
    '.narracat/staging',
    'tracking',
    'exports',
  ]
  for (const dir of dirs) await mkdir(join(bookDir, dir), { recursive: true })
}

/**
 * Create one book directory. The caller decides where and may register the
 * resulting folder as a DSH workspace.
 *
 * @param {object} input - title, genre, idea, plannedChapters, wordsPerChapter, parentDir.
 * @returns {Promise<{bookDir: string, folderName: string, parentDir: string, title: string}>} created book.
 */
export async function createBook(input) {
  const fields = normaliseBookInput(input)
  const parentDir = resolveParentDir(input?.parentDir ?? input?.parent_dir)
  // A book is a folder; putting one inside another book (or inside its hidden
  // state) would make both ambiguous. Walk up and refuse the first book found.
  let cursor = parentDir
  while (true) {
    if (await isBookDir(cursor)) throw new Error('不能把新作品建在另一本作品里面，请换一个位置。')
    if (cursor === dirname(cursor)) break
    cursor = dirname(cursor)
  }
  await mkdir(parentDir, { recursive: true })
  const { name, target } = await availableFolder(parentDir, fields.title)
  await mkdir(target, { recursive: false })
  await scaffoldDirs(target)
  await writeFile(join(target, '.narracat', 'config.yaml'), buildConfigYaml(fields), 'utf8')
  const relationships = '# 角色关系\n\n| 角色 A | 关系 | 角色 B | 备注 |\n|---|---|---|---|\n'
  await writeFile(join(target, 'bible', 'relationships.md'), relationships, 'utf8')
  await writeFile(join(target, MEMO_PATH), MEMO_STARTER, 'utf8')
  const instructions = ideaInstructions(fields.idea)
  if (instructions) await writeFile(join(target, 'AGENTS.md'), instructions, 'utf8')
  return { bookDir: target, folderName: name, parentDir, title: fields.title }
}

/** Whether `child` sits inside `parent` (used to prove a fallback root is safe). */
export function isInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child))
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

/** A readable label for a path in messages. */
export function shortPath(path) {
  const home = homedir()
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path
}
