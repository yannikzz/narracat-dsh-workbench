/**
 * Export a finished (or unfinished) book to one shareable file.
 *
 * Formats: Word (`.docx`), print-ready HTML, Markdown, plain text. Exports are
 * derived files under `exports/`; they never touch the manuscript. The same
 * checklist the overview shows is returned with every export so the author sees
 * what is still open before sending the book out.
 */

import { mkdir, open, readFile, realpath, rename, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { buildSnapshot, countWords, readBookFile, resolveBookFile, visibleText, ApiError } from './project.js'
import { computeChecklist } from './journey.js'
import { buildDocx } from './docx.js'
import { safeFolderName } from './book-create.js'

/** Formats the API accepts. */
export const EXPORT_FORMATS = ['docx', 'html', 'md', 'txt']

const CONTENT_TYPES = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
}

/** Drop the manuscript's own title line so the export does not show it twice. */
function stripTitleLine(text) {
  const lines = visibleText(text).split('\n')
  const first = lines.findIndex((line) => line.trim().length > 0)
  if (first >= 0) {
    const line = lines[first].trim()
    if (line.startsWith('#') || /^第[零一二三四五六七八九十百千0-9]+章/.test(line)) lines.splice(first, 1)
  }
  return lines.join('\n')
}

/** Split prose into paragraphs; a single newline is enough in a manuscript. */
function paragraphsOf(text) {
  return stripTitleLine(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/** HTML escape. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** A local timestamp for the filename. */
function stamp(date = new Date()) {
  const pad = (value, width = 2) => String(value).padStart(width, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}`
}


/** Write one export atomically so a concurrent download never sees a half file. */
async function writeExport(path, buffer) {
  const tmp = `${path}.nw-${process.pid}-${randomUUID()}.tmp`
  try {
    const handle = await open(tmp, 'w')
    try {
      await handle.writeFile(buffer)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(tmp, path)
  } catch (error) {
    await rm(tmp, { force: true }).catch(() => {})
    throw error
  }
}

/** Read every published chapter into one export model. */
async function buildModel(book) {
  const snapshot = await buildSnapshot(book)
  const rows = (snapshot.chapters ?? []).filter((row) => row.hasText && row.path)
  const chapters = []
  for (const row of rows) {
    const text = visibleText((await readBookFile(book, row.path, { full: true })).text)
    chapters.push({
      number: row.chapter,
      title: row.title || '',
      words: countWords(text),
      paragraphs: paragraphsOf(text),
    })
  }
  return {
    snapshot,
    title: snapshot.book.title || '未命名作品',
    synopsis: snapshot.outline?.synopsis || '',
    genre: snapshot.book.genre || '',
    totalChapters: snapshot.book.totalChapters ?? null,
    writtenChapters: chapters.length,
    words: chapters.reduce((sum, chapter) => sum + chapter.words, 0),
    chapters,
  }
}

/** Markdown export. */
function renderMarkdown(model) {
  const header = [`# ${model.title}`, '']
  if (model.synopsis) header.push(`> ${model.synopsis.replace(/\n+/g, ' ')}`, '')
  const meta = [model.genre, model.totalChapters ? `计划 ${model.totalChapters} 章` : '', `${model.writtenChapters} 章 · ${model.words.toLocaleString()} 字`]
    .filter(Boolean)
    .join(' · ')
  if (meta) header.push(meta, '')
  header.push('---', '')
  const body = []
  for (const chapter of model.chapters) {
    const heading = chapter.title ? `## 第${chapter.number}章　${chapter.title}` : `## 第${chapter.number}章`
    body.push(heading, '', ...chapter.paragraphs.flatMap((paragraph) => [paragraph, '']))
  }
  return `${[...header, ...body].join('\n').trimEnd()}\n`
}

/** Plain-text export. */
function renderText(model) {
  const lines = [model.title, '']
  if (model.synopsis) lines.push(model.synopsis, '')
  for (const chapter of model.chapters) {
    lines.push('', chapter.title ? `第${chapter.number}章　${chapter.title}` : `第${chapter.number}章`, '')
    lines.push(...chapter.paragraphs.flatMap((paragraph) => [paragraph, '']))
  }
  return `${lines.join('\n').trimEnd()}\n`
}

/** Print-ready HTML: open in a browser and print/save as PDF. */
function renderHtml(model) {
  const meta = [model.genre, model.totalChapters ? `计划 ${model.totalChapters} 章` : '', `${model.writtenChapters} 章 · ${model.words.toLocaleString()} 字`]
    .filter(Boolean)
    .join(' · ')
  const chapters = model.chapters.map((chapter) => {
    const heading = chapter.title ? `第${chapter.number}章　${chapter.title}` : `第${chapter.number}章`
    const body = chapter.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')
    return `<section class="chapter">\n<h2>${escapeHtml(heading)}</h2>\n${body}\n</section>`
  }).join('\n')
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(model.title)}</title>
<style>
:root{color-scheme:light dark}
html{background:#f3f1ec}
body{margin:0;padding:48px 16px;font-family:"Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC",serif;color:#22201c;line-height:1.95}
.book{max-width:38em;margin:0 auto;background:#fffdf9;padding:72px 64px;box-shadow:0 20px 60px rgba(30,25,15,.10);border-radius:2px}
h1{font-size:2.6em;margin:0 0 .3em;font-weight:600;letter-spacing:.06em;text-align:center}
.synopsis{text-align:center;color:#5c574f;margin:0 auto 1.2em;max-width:30em;font-size:.98em}
.meta{text-align:center;color:#8b857a;font-size:.82em;letter-spacing:.04em;margin-bottom:3em}
.chapter{page-break-before:always}
.chapter:first-of-type{page-break-before:auto}
h2{font-size:1.35em;margin:2.4em 0 1.2em;font-weight:600;text-align:center;letter-spacing:.04em}
p{margin:0 0 .55em;text-indent:2em;text-align:justify}
.footer{margin-top:4em;text-align:center;color:#a39c90;font-size:.75em}
@media print{html,body{background:#fff}body{padding:0}.book{box-shadow:none;max-width:none;padding:0}.chapter{page-break-before:always}}
</style>
</head>
<body>
<main class="book">
<h1>${escapeHtml(model.title)}</h1>
${model.synopsis ? `<p class="synopsis">${escapeHtml(model.synopsis)}</p>` : ''}
<p class="meta">${escapeHtml(meta)}</p>
${chapters}
<p class="footer">由 Narracat · 叙述猫导出</p>
</main>
</body>
</html>
`
}

/** Render one format. */
function render(model, format) {
  if (format === 'docx') {
    return {
      data: buildDocx({
        title: model.title,
        synopsis: model.synopsis,
        genre: model.genre,
        totalChapters: model.totalChapters,
        writtenChapters: model.writtenChapters,
        words: model.words,
        chapters: model.chapters,
      }),
      ext: 'docx',
    }
  }
  if (format === 'html') return { data: renderHtml(model), ext: 'html' }
  if (format === 'md') return { data: renderMarkdown(model), ext: 'md' }
  return { data: renderText(model), ext: 'txt' }
}

/**
 * Export the book to `exports/`.
 *
 * @param {string} book - real book directory.
 * @param {{ format?: string }} [options] - output format; defaults to docx.
 * @returns {Promise<object>} the saved export plus the completion checklist.
 */
export async function exportBook(book, options = {}) {
  const format = String(options.format ?? 'docx').toLowerCase()
  if (!EXPORT_FORMATS.includes(format)) throw new ApiError(400, 'bad-format', '导出格式只支持 Word / HTML / Markdown / TXT。')
  // macOS temp paths are symlinked through /var; resolve once so every read and
  // the export directory compare against the same real path.
  const realBook = await realpath(book)
  const model = await buildModel(realBook)
  if (model.chapters.length === 0) throw new ApiError(422, 'no-text', '这本书还没有正文，先把第一章写出来再导出。')
  const { data, ext } = render(model, format)
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
  await mkdir(join(realBook, 'exports'), { recursive: true })
  const filename = `${safeFolderName(model.title)}_${stamp()}.${ext}`
  const rel = `exports/${filename}`
  await writeExport(join(realBook, rel), buffer)
  return {
    status: 'saved',
    format,
    path: rel,
    filename,
    bytes: buffer.length,
    words: model.words,
    chapters: model.chapters.length,
    complete: Boolean(model.totalChapters && model.writtenChapters >= model.totalChapters),
    checklist: computeChecklist(model.snapshot),
  }
}

/**
 * Read one exported file back for the browser download route.
 * @param {string} book - real book directory.
 * @param {string} relPath - `exports/<name>.<ext>`.
 * @returns {Promise<{ buffer: Buffer, filename: string, contentType: string }>} download payload.
 */
export async function readExportFile(book, relPath) {
  const normalized = String(relPath ?? '').split('\\').join('/').replace(/^\/+/, '')
  if (!/^exports\/[^/]+\.(docx|html|md|txt)$/i.test(normalized)) {
    throw new ApiError(403, 'bad-export-path', '只能下载 exports/ 里的导出文件。')
  }
  const resolved = await resolveBookFile(book, normalized, { write: false, binary: true })
  let buffer
  try {
    buffer = await readFile(resolved.abs)
  } catch {
    throw new ApiError(404, 'no-export', '导出文件不存在，可能已经被移走。')
  }
  const ext = normalized.split('.').pop().toLowerCase()
  return {
    buffer,
    filename: normalized.slice('exports/'.length),
    contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
  }
}
