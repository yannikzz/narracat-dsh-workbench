/**
 * Build a readable `.docx` from book prose without external dependencies.
 *
 * The part set is the minimum Word accepts: content types, package and document
 * relationships, styles, core/app properties, and the document body. Chinese
 * text uses an east-asian serif; every paragraph is a normal paragraph with a
 * two-character first-line indent, and chapters start on a new page.
 */

import { makeZip } from './zip.js'

/** XML text escape. */
export function xml(value) {
  return String(value ?? '')
    // XML 1.0 forbids most C0 controls and the two non-characters; Word
    // reports the whole file as corrupt if any survive.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** One w:r run with the book's serif. */
function run(text, options = {}) {
  const props = [
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Songti SC" w:cs="Times New Roman"/>',
    options.bold ? '<w:b/><w:bCs/>' : '',
    options.color ? `<w:color w:val="${options.color}"/>` : '',
    options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : '',
  ].join('')
  const space = text.startsWith(' ') || text.endsWith(' ') ? ' xml:space="preserve"' : ''
  return `<w:r><w:rPr>${props}</w:rPr><w:t${space}>${xml(text)}</w:t></w:r>`
}

/** One paragraph with optional style, alignment, indent and page break. */
function paragraph(text, options = {}) {
  const spacing = options.spacing || options.after
    ? `<w:spacing${options.spacing ? ` w:line="${options.spacing}" w:lineRule="auto"` : ''}${options.after ? ` w:after="${options.after}"` : ''}/>`
    : ''
  const props = [
    options.style ? `<w:pStyle w:val="${options.style}"/>` : '',
    options.pageBreak ? '<w:pageBreakBefore/>' : '',
    spacing,
    options.indent ? '<w:ind w:firstLineChars="200"/>' : '',
    options.align ? `<w:jc w:val="${options.align}"/>` : '',
  ].join('')
  return `<w:p><w:pPr>${props}</w:pPr>${text ? run(text, options) : ''}</w:p>`
}

/** Page geometry: A4 with 2.54cm margins. */
const SECTION = [
  '<w:sectPr>',
  '<w:pgSz w:w="11906" w:h="16838"/>',
  '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>',
  '<w:cols w:space="720"/>',
  '</w:sectPr>',
].join('')

/** The document body: a title page, then one page per chapter. */
function documentXml(book) {
  const parts = []
  parts.push(paragraph(book.title, { style: 'BookTitle', align: 'center', size: 56, after: 360 }))
  if (book.synopsis) parts.push(paragraph(book.synopsis, { align: 'center', size: 24, color: '666666', after: 720 }))
  const meta = [book.genre, book.totalChapters ? `计划 ${book.totalChapters} 章` : '', `${book.writtenChapters} 章 · ${Number(book.words ?? 0).toLocaleString()} 字`]
    .filter(Boolean)
    .join(' · ')
  if (meta) parts.push(paragraph(meta, { align: 'center', size: 20, color: '888888', after: 1200 }))
  for (const chapter of book.chapters) {
    const heading = chapter.title
      ? `第${chapter.number}章　${chapter.title}`
      : `第${chapter.number}章`
    parts.push(paragraph(heading, { style: 'ChapterTitle', pageBreak: true, size: 34, after: 360 }))
    for (const text of chapter.paragraphs) {
      parts.push(paragraph(text, { indent: true, spacing: 360 }))
    }
  }
  parts.push(SECTION)
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${parts.join('')}</w:body>
</w:document>`
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

const PACKAGE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Songti SC" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="BookTitle"><w:name w:val="Book Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="2400" w:after="360"/><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="56"/><w:szCs w:val="56"/><w:b/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ChapterTitle"><w:name w:val="Chapter Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="600" w:after="360"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:sz w:val="34"/><w:szCs w:val="34"/><w:b/></w:rPr></w:style>
</w:styles>`

const CORE = (book) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xml(book.title)}</dc:title>
<dc:creator>Narracat · 叙述猫</dc:creator>
<cp:lastModifiedBy>Narracat · 叙述猫</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`

const APP = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>Narracat · 叙述猫</Application>
</Properties>`

/**
 * Build the DOCX byte buffer.
 * @param {{title: string, synopsis?: string, genre?: string, totalChapters?: number|null, writtenChapters: number, words: number, chapters: Array<{number: number, title: string, paragraphs: string[]}>}} book - export model.
 * @returns {Buffer} the `.docx` file.
 */
export function buildDocx(book) {
  return makeZip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: PACKAGE_RELS },
    { name: 'word/document.xml', data: documentXml(book) },
    { name: 'word/_rels/document.xml.rels', data: DOCUMENT_RELS },
    { name: 'word/styles.xml', data: STYLES },
    { name: 'docProps/core.xml', data: CORE(book) },
    { name: 'docProps/app.xml', data: APP },
  ])
}
