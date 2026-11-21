    /** Display names for the nine premise cards. */
    const CARD_LABELS = {
      genre_contract: '题材读者契约',
      core_hook: '核心钩子',
      golden_finger: '金手指与爽点引擎',
      protagonist_desire: '主角欲望与代价',
      antagonistic_force: '对抗力量',
      central_dramatic_question: '中心戏剧问题',
      world_rules: '世界规则可冲突性',
      narrator_voice: '叙述人称',
      blank_declaration: '留白声明',
    }

    /** Human labels for premise card field keys. */
    const PREMISE_FIELD_LABELS = {
      subgenre: '题材', emotional_tone: '情绪基调', hook: '钩子', question: '问题', world_rule: '世界规则',
      archetype: '叙述原型', tone: '语调', pacing: '节奏', address: '叙述人称', style_keywords: '风格关键词',
    }

    /** Human labels for common premise enum values. */
    const PREMISE_VALUES = {
      third_limited: '第三人称有限', third_person_limited: '第三人称有限', third_omniscient: '第三人称全知',
      first_person: '第一人称', second_person: '第二人称', omniscient: '全知视角', limited: '有限视角',
    }

    /** Profile stages. */
    const STAGE_LABELS = { stub: '简档', sketch: '速写', full: '完整' }

    /** Human labels for common state dimensions when the book has no vocabulary. */
    const DIMENSION_FALLBACK = {
      location: '位置', inventory: '持有物', possession: '持有物', relationship: '关系', knowledge: '认知',
      status: '状态', goal: '目标', emotion: '情绪', health: '身体', ability: '能力', reputation: '名声',
      appearance: '外观', identity: '身份',
    }

    /**
     * Display name for a state dimension. The book's state-vocabulary wins.
     * @param {object} app - page model with snapshot.
     * @param {string} key - dimension key.
     * @returns {string} human label.
     */
    function dimensionLabel(app, key) {
      if (!key) return '—'
      const row = (app.snapshot?.stateVocabulary?.dimensions ?? []).find((dimension) => dimension.key === key || dimension.predicate === key)
      return row?.display_name || row?.displayName || DIMENSION_FALLBACK[key] || key
    }

    /** Human label for a state operation. */
    function operationLabel(value) {
      if (!value) return ''
      return ({ add: '获得', remove: '失去', set: '变为', increase: '增加', decrease: '减少', update: '更新' })[value] ?? value
    }

    /** Human label for a foreshadowing action. */
    function foreshadowingLabel(value) {
      if (!value) return ''
      return ({ plant: '埋设', advance: '推进', payoff: '揭晓', mention: '提及', resolve: '收束' })[value] ?? value
    }

    /** Paths the raw editor must not write. */
    function isProtectedPath(path) {
      const value = String(path ?? '')
      return /^\.narracat\/memory\.db(-wal|-shm)?$/.test(value)
        || /^\.narracat\/(content|documents|materials\/originals|project-memory|units|manuscript-(revisions|drafts)|migration-backups|memory|submissions)\//.test(value)
        || /^\.narracat\/data\/reviews\//.test(value)
        || /^tracking\/(进度|章节摘要|伏笔表|人物状态)\.md$/.test(value)
        || /\.lock$/.test(value)
        || /\.tmp$/.test(value)
    }

    /**
     * Split a manuscript into a title line and paragraphs.
     * @param {string} text - raw markdown.
     * @returns {{ title: string, paragraphs: string[] }} parts.
     */
    function splitManuscript(text) {
      const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n')
      const first = lines.findIndex((line) => line.trim().length > 0)
      let title = ''
      if (first >= 0) {
        const line = lines[first].trim()
        if (line.startsWith('#') || /^第[零一二三四五六七八九十百千0-9]+章/.test(line)) {
          title = line.replace(/^#+\s*/, '')
          lines.splice(first, 1)
        }
      }
      const body = lines.join('\n').trim()
      return { title, paragraphs: body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) }
    }

    /**
     * Split a draft for the manuscript editor. Unlike `splitManuscript`, the
     * body keeps every blank line, and the heading marker (`#`, `##`, …) is
     * returned so saving can round-trip the file without rewriting the title
     * line. A first line that is not a heading is treated as prose.
     * @param {string} text - raw draft.
     * @returns {{ title: string, body: string, heading: string }} parts.
     */
    function splitEditDraft(text) {
      const source = String(text ?? '').replace(/\r\n?/g, '\n')
      const lines = source.split('\n')
      const first = lines.findIndex((line) => line.trim().length > 0)
      if (first < 0) return { title: '', body: '', heading: '' }
      const trimmed = lines[first].trim()
      const marker = trimmed.match(/^(#{1,6})\s+/)
      const isHeading = Boolean(marker) || /^第[零一二三四五六七八九十百千0-9]+章/.test(trimmed)
      if (!isHeading) return { title: '', body: source, heading: '' }
      // Drop exactly the one separator line the format uses; any extra blank
      // lines the author typed stay in the body.
      const rest = lines.slice(first + 1)
      if (rest[0] === '') rest.shift()
      return {
        title: trimmed.replace(/^#{1,6}\s*/, ''),
        body: rest.join('\n'),
        heading: marker ? marker[1] : '',
      }
    }

    /** Rebuild a draft from the editor's title and body without touching prose. */
    function joinEditDraft(title, body, heading) {
      const head = String(title ?? '').trim()
      const text = String(body ?? '')
      if (!head) return text
      return `${heading ? `${heading} ` : ''}${head}\n\n${text}`
    }

    /** Count CJK characters and Latin word runs the same way the Host does. */
    function countDraftWords(text) {
      const source = String(text ?? '')
      const cjk = source.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu)
      const latin = source
        .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu, ' ')
        .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)
      return (cjk ? cjk.length : 0) + (latin ? latin.length : 0)
    }

    /** m:ss clock for the writing scene. */
    function formatElapsed(ms) {
      const total = Math.max(0, Math.floor(Number(ms) / 1000))
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }

    /** Decorative prose-line widths, grouped like paragraphs. */
    const WRITING_LINES = [
      [100, 97, 74],
      [94, 100, 88, 56],
      [98, 91, 70, 48],
    ]

    /**
     * The chapter page while the Agent writes. It replaces the old
     * disabled-button page with a live writing surface: what is happening,
     * how long it has taken, a way to watch the session, and placeholder prose
     * that keeps the page from looking stuck.
     * @param {{ app: object, chapter: object }} props - page model and chapter.
     * @returns {any} the writing scene.
     */
    function WritingScene({ app, chapter, compact }) {
      const t = app.t
      const writing = app.writing ?? {}
      const waiting = app.trackedWaiting === true
      const failed = writing.state === 'error'
      const starting = writing.state === 'starting'
      const rewrite = Boolean(writing.baseline?.hasText)
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        // The compact sidebar card has no clock; skipping the tick keeps the
        // panel from re-rendering every second while the Agent works.
        if (failed || compact) return undefined
        const timer = setInterval(() => setNow(Date.now()), 1000)
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => clearInterval(timer)
      }, [failed, compact])
      const startedAt = Number(writing.startedAt) || now
      const elapsed = formatElapsed(now - startedAt)
      const sessionId = writing.sessionId ?? app.trackedSession ?? null
      const title = failed
        ? t('chapter.writingError')
        : rewrite ? fill(t('chapter.rewritingTitle'), { no: chapter.chapter }) : fill(t('chapter.writingTitle'), { no: chapter.chapter })
      const subtitle = failed
        ? (writing.error || t('chapter.writingErrorHint'))
        : waiting
          ? (compact ? t('panel.writingNowWaiting') : t('chapter.writingWaitingHint'))
          : compact
            ? (rewrite ? t('panel.writingNowRewriteHint') : t('panel.writingNowHint'))
            : (rewrite ? t('chapter.writingEditHint') : t('chapter.writingHint'))
      const meta = starting
        ? t('chapter.writingStarting')
        : failed ? t('chapter.writingErrorHint') : fill(t('chapter.writingElapsed'), { time: elapsed })
      return e('div', {
        className: `nw-writing ${compact ? 'is-compact' : ''} ${failed ? 'is-error' : waiting ? 'is-waiting' : ''}`.trim(),
        'aria-busy': failed ? undefined : 'true',
      },
        e('div', { className: 'nw-writing-head' },
          e('span', { className: 'nw-writing-mark', 'aria-hidden': true }, icon(failed ? 'alert' : 'spark', 18)),
          e('div', { className: 'nw-writing-copy' },
            e('h2', { className: 'nw-writing-title', role: 'status', 'aria-live': 'polite' },
              title,
              !failed && !waiting ? e('span', { className: 'nw-writing-dots', 'aria-hidden': true }, e('i'), e('i'), e('i')) : null,
            ),
            e('p', { className: 'nw-writing-sub' }, subtitle),
          ),
        ),
        failed ? null : e('div', { className: 'nw-writing-bar', role: 'progressbar', 'aria-label': title }, e('i')),
        compact ? null : e('div', { className: 'nw-writing-meta' },
          e('span', { className: 'nw-writing-clock', 'aria-hidden': starting || failed ? 'true' : undefined }, meta),
          starting || failed ? null : e('span', { className: 'nw-writing-sep', 'aria-hidden': true }, '·'),
          starting || failed ? null : e('span', null, waiting ? t('chapter.writingWaiting') : t('chapter.writingAside')),
        ),
        compact ? null : e('div', { className: 'nw-writing-actions' },
          failed
            ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.onWrite(chapter.chapter) }, icon('refresh', 14), t('chapter.writingRetry'))
            : waiting
              ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', disabled: !sessionId, onClick: () => app.onOpenSession(sessionId) }, icon('arrowRight', 14), t('chapter.writingAnswer'))
              : sessionId
                ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenSession(sessionId) }, icon('external', 14), t('chapter.writingOpen'))
                : null,
          failed && sessionId
            ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenSession(sessionId) }, icon('external', 14), t('chapter.writingOpen'))
            : null,
          !failed && chapter.hasOutline
            ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.onChapterView('outline') }, icon('chevronRight', 14), t('chapter.openOutline'))
            : null,
        ),
        failed ? null : e('div', { className: 'nw-skel', 'aria-hidden': true },
          (compact ? WRITING_LINES.slice(0, 2) : WRITING_LINES).map((paragraph, paragraphIndex) => e('p', { key: paragraphIndex },
            paragraph.map((width, lineIndex) => e('i', {
              key: lineIndex,
              style: { width: `${width}%`, animationDelay: `${(paragraphIndex * 3 + lineIndex) * 0.16}s` },
            })),
          )),
        ),
      )
    }

    /**
     * Minimal markdown renderer for the book's prose files.
     * @param {{ text: string, className?: string }} props - raw markdown.
     * @returns {any} the rendered blocks.
     */
    function MarkdownBody(props) {
      const lines = String(props.text ?? '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let insertedAfterTitle = false
      let paragraph = []
      let list = []
      let listKey = 0
      const flushParagraph = () => {
        if (paragraph.length === 0) return
        blocks.push(e('p', { key: `p${blocks.length}` }, paragraph.join(' ')))
        paragraph = []
      }
      const flushList = () => {
        if (list.length === 0) return
        blocks.push(e('ul', { key: `ul${listKey += 1}`, className: 'nw-md-list' }, list.map((item, index) => e('li', { key: index }, item))))
        list = []
      }
      for (const raw of lines) {
        const line = raw.replace(/\s+$/, '')
        if (line.trim().length === 0) { flushParagraph(); flushList(); continue }
        if (line.startsWith('# ')) {
          flushParagraph(); flushList()
          blocks.push(e('h1', { key: `h1${blocks.length}`, className: 'nw-reading-title' }, line.slice(2).trim()))
          if (!insertedAfterTitle && props.afterTitle) { blocks.push(e('div', { key: 'after-title' }, props.afterTitle)); insertedAfterTitle = true }
          continue
        }
        if (line.startsWith('## ')) { flushParagraph(); flushList(); blocks.push(e('h2', { key: `h2${blocks.length}` }, line.slice(3).trim())); continue }
        if (line.startsWith('### ')) { flushParagraph(); flushList(); blocks.push(e('h3', { key: `h3${blocks.length}` }, line.slice(4).trim())); continue }
        if (line.startsWith('> ')) { flushParagraph(); flushList(); blocks.push(e('blockquote', { key: `q${blocks.length}`, className: 'nw-quote' }, line.slice(2).trim())); continue }
        if (/^[-*]\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^[-*]\s+/, '')); continue }
        if (/^\d+\.\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^\d+\.\s+/, '')); continue }
        paragraph.push(line.trim())
      }
      flushParagraph()
      flushList()
      return e('div', { className: `nw-reading ${props.className ?? ''}` }, blocks.length > 0 ? blocks : e('p', { className: 'nw-muted' }, '—'))
    }

    /**
     * One value row in a structured view.
     * @param {{ label: string, value: any }} props - label and value.
     * @returns {any} the row.
     */
    function Field({ label, value }) {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null
      return e('div', { className: 'nw-field' },
        e('div', { className: 'nw-field-label' }, label),
        e('div', { className: 'nw-field-value' }, Array.isArray(value) ? value.map((item, index) => e('div', { key: index }, String(item))) : String(value)),
      )
    }


    /**
     * A visible warning when the raw-file API had to truncate a large file.
     * Editing is disabled in that state so saving cannot silently lose content.
     * @param {{ app: object }} props - page model.
     * @returns {any} the notice or null.
     */
    function TruncatedNotice({ app }) {
      if (!app.file?.truncated) return null
      return e('p', { className: 'nw-muted' }, app.t('file.truncated'))
    }

    /** Format choices for the export dialog. */
    const EXPORT_FORMATS = [
      ['docx', 'export.docx'],
      ['html', 'export.html'],
      ['md', 'export.md'],
      ['txt', 'export.txt'],
    ]

    /**
     * Export one finished (or unfinished) book, with the same health checklist
     * the overview shows. The download link is a same-origin API route.
     * @param {object} props - dialog state and callbacks.
     * @returns {any} the modal.
     */
    function ExportDialog(props) {
      const { t, book, journey, format, state, error, result, onFormat, onExport, onAgain, onClose } = props
      const checklist = journey?.checklist ?? []
      const working = state === 'working'
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !working) onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose, working])
      const written = journey?.progress?.written ?? 0
      const href = result && book
        ? API + `export-file?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}&path=${encodeURIComponent(result.path)}`
        : ''
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget && !working) onClose() },
      },
        e('div', { className: 'nw-dialog is-wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('export.title') },
          e('h2', { className: 'nw-dialog-title' }, t('export.title')),
          e('p', { className: 'nw-dialog-body' }, t('export.lead')),
          result
            ? e('div', { className: 'nw-export-done' },
              e('h3', null, fill(t('export.done'), { chapters: result.chapters, words: (result.words ?? 0).toLocaleString() })),
              e('p', null, fill(t('export.path'), { path: result.path })),
              e('div', { className: 'nw-download' },
                icon('save', 16),
                e('a', { href, download: result.filename }, fill(t('export.download'), { name: result.filename })),
              ),
              e('div', { className: 'nw-check', style: { marginTop: 8 } },
                e('div', { className: 'nw-check-title' }, t('export.checkTitle')),
                checklist.length === 0
                  ? e('div', { className: 'nw-check-row' }, t('export.checkClean'))
                  : checklist.map((item) => e('div', { key: item.id, className: 'nw-check-row' },
                    e('i', { className: `nw-health-dot is-${item.level}` }),
                    e('span', null, e('b', null, item.label), item.detail ? ` · ${item.detail}` : ''),
                  )),
              ),
              e('div', { className: 'nw-dialog-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: onAgain }, t('export.again')),
                e('button', { type: 'button', className: 'nw-btn is-primary', onClick: onClose }, t('export.close')),
              ),
            )
            : e('div', { className: 'nw-export' },
              e('div', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('export.format')),
                e('div', { className: 'nw-choice-row' },
                  EXPORT_FORMATS.map(([id, key]) => e('button', {
                    key: id, type: 'button',
                    className: `nw-choice ${format === id ? 'is-active' : ''}`,
                    disabled: working,
                    onClick: () => onFormat(id),
                  }, t(key))),
                ),
              ),
              e('div', { className: 'nw-check' },
                e('div', { className: 'nw-check-title' }, t('export.checkTitle')),
                checklist.length === 0
                  ? e('div', { className: 'nw-check-row' }, t('export.checkClean'))
                  : checklist.map((item) => e('div', { key: item.id, className: 'nw-check-row' },
                    e('i', { className: `nw-health-dot is-${item.level}` }),
                    e('span', null, e('b', null, item.label), item.detail ? ` · ${item.detail}` : ''),
                  )),
              ),
              written === 0 ? e('div', { className: 'nw-form-note' }, t('export.noText')) : null,
              error ? e('div', { className: 'nw-form-error' }, error) : null,
              e('div', { className: 'nw-dialog-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary', disabled: working, onClick: onClose }, t('export.close')),
                e('button', {
                  type: 'button', className: 'nw-btn is-primary',
                  disabled: working || written === 0,
                  onClick: onExport,
                }, working ? t('export.working') : t('export.button')),
              ),
            ),
        ),
      )
    }

    /**
     * The book synopsis: two lines at rest, the full text on demand. It spans
     * the whole hero width so its edges line up with the cards below.
     * @param {{ text: string, t: Function }} props - synopsis copy.
     * @returns {any} the summary block, or null when there is no synopsis.
     */
    function BookSynopsis({ text, t }) {
      const value = String(text ?? '').trim()
      const [open, setOpen] = useState(false)
      const [clipped, setClipped] = useState(() => value.length > 150)
      const ref = useRef(null)
      useEffect(() => {
        setOpen(false)
        setClipped(value.length > 150)
      }, [value])
      useLayoutEffect(() => {
        const element = ref.current
        if (!element || open) return undefined
        const measure = () => {
          const next = element.scrollHeight > element.clientHeight + 1
          setClipped((current) => (current === next ? current : next))
        }
        measure()
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(measure)
          observer.observe(element)
          return () => observer.disconnect()
        }
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
      }, [value, open])
      if (!value) return null
      return e('div', { className: `nw-ov-summary ${open ? 'is-open' : ''}` },
        e('p', { className: 'nw-ov-desc', ref }, value),
        clipped || open ? e('button', {
          type: 'button',
          className: 'nw-ov-more',
          'aria-expanded': open,
          onClick: () => setOpen((current) => !current),
        }, open ? t('overview.collapse') : t('overview.expand'), icon(open ? 'chevronDown' : 'chevronRight', 13)) : null,
      )
    }

    /**
     * The book's overview page.
     * @param {{ app: object }} props - page model.
     * @returns {any} the overview.
     */
    function OverviewView({ app }) {
      const t = app.t
      const { book, snapshot, status } = app
      const chapters = snapshot?.chapters ?? []
      const journey = snapshot?.journey ?? null
      const action = journey?.action ?? null
      const steps = journey?.stages ?? []
      const stageIndex = journey?.lifecycle ?? 0
      const checklist = journey?.checklist ?? []
      const openItems = checklist.filter((item) => item.level !== 'good')
      const written = status?.writtenChapters ?? book?.writtenChapters ?? 0
      const total = book?.totalChapters ?? 0
      const pct = total > 0 ? Math.min(100, Math.round((written / total) * 100)) : 0
      const nextRow = chapters.find((row) => row.chapter === action?.chapter) ?? null
      const memory = snapshot?.book?.memory ?? {}
      const memoryMissing = status?.memory?.missing?.length ?? 0
      const synopsis = snapshot?.outline?.synopsis || ''
      const [memoryTab, setMemoryTab] = useState(null)
      const foreshadowRegistry = Array.isArray(snapshot?.outline?.foreshadowing) ? snapshot.outline.foreshadowing : []
      const foreshadowStates = snapshot?.foreshadowingStates ?? {}
      const foreshadowRows = Array.from(new Set([
        ...foreshadowRegistry.map((row) => row.id).filter(Boolean),
        ...Object.keys(foreshadowStates),
      ])).map((id) => ({
        id,
        entry: foreshadowRegistry.find((row) => row.id === id) ?? {},
        state: foreshadowStates[id] ?? null,
      }))
      const characterStates = snapshot?.characterStates ?? {}
      const stateSubjects = Object.entries(characterStates).filter(([, dimensions]) => dimensions && typeof dimensions === 'object')
      const stateCount = stateSubjects.reduce((sum, [, dimensions]) => sum + Object.keys(dimensions).length, 0)
      const memoryRecords = snapshot?.memoryRecords ?? []
      const memoryCounts = { foreshadowing: foreshadowRows.length, states: stateCount, memory: memoryRecords.length }
      const defaultTab = memoryCounts.foreshadowing > 0 ? 'foreshadowing' : memoryCounts.states > 0 ? 'states' : memoryCounts.memory > 0 ? 'memory' : 'foreshadowing'
      const activeTab = memoryTab ?? defaultTab
      const STATUS_KEYS = { planned: 'overview.statusPlanned', planted: 'overview.statusPlanted', developing: 'overview.statusDeveloping', revealed: 'overview.statusRevealed' }
      const STATUS_TONES = { planned: 'is-plain', planted: 'is-done', developing: 'is-warn', revealed: 'is-success' }
      const renderForeshadowing = () => foreshadowRows.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noForeshadowing'))
        : e('div', { className: 'nw-frow-list' }, foreshadowRows.map(({ id, entry, state }) => {
          const status = state?.last_action === 'reveal' ? 'revealed' : state?.last_action === 'develop' ? 'developing' : state?.last_action === 'plant' ? 'planted' : 'planned'
          const typeLabel = entry.type === 'small' ? t('overview.typeSmall') : entry.type === 'medium' ? t('overview.typeMedium') : entry.type === 'major' ? t('overview.typeMajor') : (entry.type ?? '')
          const targetRaw = String(entry.target_reveal ?? '')
          const targetVolume = /^vol-(\d+)$/.exec(targetRaw)
          const targetText = targetVolume
            ? fill(t('overview.revealVolume'), { no: Number(targetVolume[1]) })
            : /^\d+$/.test(targetRaw) ? fill(t('overview.revealTarget'), { no: Number(targetRaw) }) : targetRaw
          const meta = [
            entry.planted_chapter ? fill(t('overview.plantedCh'), { no: entry.planted_chapter }) : '',
            targetText,
            state?.chapter ? fill(t('overview.lastTouched'), { no: state.chapter }) : '',
            typeLabel,
            entry.theme_link ?? '',
          ].filter(Boolean)
          return e('div', { key: id, className: 'nw-frow' },
            e('div', { className: 'nw-frow-id' }, id),
            e('div', { className: 'nw-frow-main' },
              e('p', { className: 'nw-frow-desc' }, entry.description || '—'),
              meta.length > 0 ? e('div', { className: 'nw-frow-meta' }, meta.map((item, index) => e('span', { key: index }, item))) : null,
            ),
            e('span', { className: `nw-tag ${STATUS_TONES[status]}` }, t(STATUS_KEYS[status])),
          )
        }))
      const renderStates = () => stateSubjects.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noStates'))
        : e('div', { className: 'nw-states' }, stateSubjects.map(([name, dimensions]) => e('div', { key: name, className: 'nw-state-row' },
          e('div', { className: 'nw-state-name' }, name),
          e('div', { className: 'nw-state-dims' }, Object.entries(dimensions).map(([dimension, state]) => e('span', { key: dimension, className: 'nw-state-chip' },
            e('span', { className: 'nw-state-key' }, dimensionLabel(app, dimension)),
            e('span', { className: 'nw-state-value' }, Array.isArray(state.value) ? state.value.join('、') : String(state.value ?? '—')),
            state.chapter ? e('span', { className: 'nw-state-ch' }, fill(t('workbench.chapterNo'), { no: state.chapter })) : null,
          ))),
        )))
      const renderMemory = () => memoryRecords.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noMemory'))
        : e('div', { className: 'nw-recent' }, memoryRecords.map((record) => e('button', {
          key: record.chapter, type: 'button', className: 'nw-rrow nw-memory-row',
          onClick: () => app.onOpenChapter((snapshot.chapters ?? []).find((row) => row.chapter === record.chapter) ?? { chapter: record.chapter }, 'memory'),
        },
          e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: record.chapter })),
          e('span', { className: 'nw-rrow-title' }, record.summary || '—'),
          e('span', { className: `nw-tag ${record.fresh ? 'is-success' : 'is-warn'}` }, record.fresh ? t('memory.fresh') : t('memory.outdated')),
          e('span', { className: 'nw-rrow-words' }, fill(t('overview.stateCount'), { n: record.state_changes?.length ?? 0 })),
        )))
      const isNew = written === 0 && chapters.length === 0
      return e('div', { className: 'nw-ov' },
        steps.length > 0 ? e('div', { className: 'nw-jsteps', 'aria-label': t('journey.next') },
          steps.map((step, index) => e('div', {
            key: step.id,
            className: `nw-jstep ${index < stageIndex ? 'is-done' : index === stageIndex ? 'is-active' : ''}`,
          },
            e('i', { className: 'nw-jstep-dot' }),
            step.label,
            index < steps.length - 1 ? e('i', { className: 'nw-jstep-line' }) : null,
          )),
        ) : null,
        e('section', { className: 'nw-ov-hero' },
          e('div', { className: 'nw-ov-cover' }, e(CoverArt, { book })),
          e('div', { className: 'nw-ov-main' },
            e('h1', { className: 'nw-ov-title' }, book?.title ?? ''),
            e('div', { className: 'nw-ov-meta' },
              e('span', { className: 'nw-tag is-success' }, written > 0 ? t('shelf.status.writing') : t('shelf.status.empty')),
              book?.genre ? e('span', { className: 'nw-tag' }, book.genre) : null,
            ),
            e('div', { className: 'nw-progress' },
              e('div', { className: 'nw-bar' }, e('i', { style: { width: `${pct}%` } })),
              e('div', { className: 'nw-progress-labels' },
                e('span', null, fill(t('overview.progress'), { done: written, total: total || '?' })),
                e('span', null, `${pct}%`),
              ),
            ),
          ),
          e(BookSynopsis, { text: synopsis, t }),
        ),
        action ? e('section', { className: 'nw-journey' },
          e('div', { className: 'nw-journey-kicker' }, `${t('journey.next')} · ${journey.stageLabel}`),
          e('h2', { className: 'nw-journey-title' }, action.title),
          e('p', { className: 'nw-journey-desc' }, action.description),
          e('div', { className: 'nw-journey-actions' },
            e('button', {
              type: 'button', className: 'nw-btn is-primary',
              disabled: app.runningNow || app.trackedWaiting,
              onClick: () => app.onJourney(action),
            }, icon(action.kind === 'write' ? 'edit' : 'spark', 15), action.label),
            written > 0 && action.kind !== 'export' ? e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onOpenExport }, t('journey.export')) : null,
            nextRow ? e('button', { type: 'button', className: 'nw-btn is-ghost', onClick: () => app.onOpenChapter(nextRow, 'text') }, fill(t('overview.openChapter'), { no: nextRow.chapter })) : null,
          ),
          (journey?.hints ?? []).length > 0 ? e('div', { className: 'nw-journey-hints' },
            journey.hints.map((hint, index) => e('div', { key: index, className: 'nw-journey-hint' }, hint)),
          ) : null,
        ) : null,
        isNew ? null : e('div', { className: 'nw-stats3' },
          e('div', { className: 'nw-bigstat' }, e('b', null, String(written), e('em', null, `/ ${total || '?'}`)), e('span', null, t('overview.written'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, (status?.totalWords ?? 0).toLocaleString()), e('span', null, t('overview.words'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(memory.records ?? 0), e('em', null, memoryMissing > 0 ? ` · ${fill(t('overview.memoryMissing'), { n: memoryMissing })}` : '')), e('span', null, t('overview.memory'))),
        ),
        checklist.length > 0 && written > 0 ? e('div', { className: 'nw-health' },
          e('div', { className: 'nw-health-head' },
            icon('check', 13),
            e('span', null, t('journey.health')),
            e('button', { type: 'button', onClick: app.onOpenExport }, openItems.length > 0
              ? `${fill(t('overview.items'), { n: openItems.length })} · ${t('export.detail') ?? '查看'}`
              : (t('export.detail') ?? '查看')),
          ),
          openItems.length === 0
            ? e('div', { className: 'nw-health-row' }, e('i', { className: 'nw-health-dot is-good' }), t('journey.healthGood'))
            : openItems.slice(0, 2).map((item) => e('div', { key: item.id, className: 'nw-health-row' },
              e('i', { className: `nw-health-dot is-${item.level}` }),
              e('span', null, item.label),
            )),
          openItems.length > 2 ? e('div', { className: 'nw-health-note', style: { marginLeft: 14 } }, fill(t('journey.healthMore'), { n: openItems.length - 2 })) : null,
        ) : null,
        e('section', { className: 'nw-section nw-memsection' },
          e('div', { className: 'nw-sec-head' },
            e('h2', null, t('overview.memoryTitle')),
            e('div', { className: 'nw-seg nw-memtabs', role: 'tablist', 'aria-label': t('overview.memoryTitle') },
              [
                ['foreshadowing', t('overview.tabForeshadowing')],
                ['states', t('overview.tabStates')],
                ['memory', t('overview.tabMemory')],
              ].map(([id, label]) => e('button', {
                key: id, type: 'button', role: 'tab', 'aria-selected': activeTab === id, className: activeTab === id ? 'is-active' : '',
                onClick: () => setMemoryTab(id),
              }, label, e('span', { className: 'nw-memcount' }, String(memoryCounts[id] ?? 0)))),
            ),
          ),
          activeTab === 'foreshadowing' ? renderForeshadowing() : activeTab === 'states' ? renderStates() : renderMemory(),
        ),
        e('section', { className: 'nw-section' },
          e('h2', null, t('overview.info')),
          e('div', { className: 'nw-info' },
            e('dl', null,
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.path')), e('dd', { style: { fontSize: 11, color: 'var(--nw-text-3)' } }, book?.dir ?? '')),
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.target')), e('dd', null, book?.wordsPerChapter ? fill(t('workbench.words'), { n: book.wordsPerChapter }) : '—')),
            ),
            e('dl', null,
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.instructions')), e('dd', null, snapshot?.book?.agents ? t('overview.hasInstructions') : t('overview.noInstructions'))),
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.updated')), e('dd', null, formatTime(book?.updatedAt, t))),
            ),
          ),
        ),
      )
    }

    /**
     * Chapter content: text, outline, review, or memory.
     * @param {{ app: object }} props - page model.
     * @returns {any} the chapter view.
     */
    function ChapterView({ app }) {
      const t = app.t
      const titleRef = useRef(null)
      const bodyRef = useRef(null)
      useEffect(() => {
        if (!app.editing) return
        const titleEl = titleRef.current
        const bodyEl = bodyRef.current
        // Land keyboard users somewhere visible: an empty title first, else the
        // body at its start. The page owns the focus cue, not a box outline.
        const target = titleEl && !String(titleEl.value ?? '').trim() ? titleEl : bodyEl
        if (!target || typeof target.focus !== 'function') return
        target.focus()
        if (target === bodyEl) {
          try { bodyEl.setSelectionRange(0, 0) } catch { /* not a text control in tests */ }
        }
      }, [app.editing])
      const chapter = (app.snapshot?.chapters ?? []).find((row) => row.chapter === app.selection?.chapter)
      if (!chapter) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      // While the Agent writes this chapter, the page itself becomes the wait
      // state. It takes precedence over the empty state and the loading spinner.
      const writingHere = Boolean(app.writing && app.writing.chapter === chapter.chapter
        && (app.runningNow || app.writing.state === 'error'))
      if (app.chapterView === 'text' && writingHere && !app.editing) return e(WritingScene, { app, chapter })
      if (app.chapterView === 'outline') return e(ChapterOutlineView, { app, chapter })
      if (app.chapterView === 'review') return e(ChapterReviewView, { app, chapter })
      if (app.chapterView === 'memory') return e(ChapterMemoryView, { app, chapter })
      if (!chapter.path) {
        // A running session with no chapter attached can happen after an
        // upgrade from a build without persisted writing state, or if storage
        // was unavailable. Show a real status instead of only a disabled CTA.
        const unknownWrite = app.runningNow && !app.writing
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noText')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
          unknownWrite ? e('div', { className: 'nw-writing-strip' },
            e('span', { className: 'nw-eq', 'aria-hidden': true }, e('i'), e('i'), e('i')),
            e('span', null, t('workbench.writingUnknown')),
            e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', disabled: !app.trackedSession, onClick: () => app.onOpenSession(app.trackedSession) }, t('write.open')),
          ) : null,
          e('div', { className: 'nw-empty-actions' },
            chapter.hasOutline ? e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: () => app.onChapterView('outline') }, t('chapter.openOutline')) : null,
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(chapter.chapter) }, icon('spark', 14), unknownWrite ? t('write.writingShort') : t('chapter.write')),
          ),
        )
      }
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (app.editing) {
        const { title, body, heading } = splitEditDraft(app.draft)
        const words = countDraftWords(app.draft)
        return e('div', { className: 'nw-page-edit' },
          e('article', { className: 'nw-reading nw-reading-edit' },
            e('div', { className: 'nw-reading-kicker' },
              e('span', null, fill(t('workbench.words'), { n: words.toLocaleString() })),
              app.dirty
                ? e('span', { className: 'nw-edit-state', role: 'status', 'aria-live': 'polite' }, e('i'), t('workbench.unsaved'))
                : app.saveNote ? e('span', { className: 'nw-edit-state is-saved', role: 'status', 'aria-live': 'polite' }, app.saveNote) : null,
            ),
            e('input', {
              className: 'nw-edit-title',
              ref: titleRef,
              value: title,
              placeholder: t('workbench.untitled'),
              spellCheck: false,
              'aria-label': t('chapter.title'),
              onChange: (event) => app.onDraft(joinEditDraft(event.target.value, body, heading)),
            }),
            e('textarea', {
              className: 'nw-editor nw-editor-page',
              ref: bodyRef,
              value: body,
              spellCheck: false,
              'aria-label': t('chapter.text'),
              onChange: (event) => app.onDraft(joinEditDraft(title, event.target.value, heading)),
            }),
          ),
        )
      }
      const { title: manuscriptTitle, paragraphs } = splitManuscript(app.file?.text ?? '')
      const heading = manuscriptTitle || `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} ${chapter.title}`
      return e('article', { className: 'nw-reading' },
        e('div', { className: 'nw-reading-kicker' },
          e('span', null, fill(t('workbench.words'), { n: (chapter.words ?? 0).toLocaleString() })),
          chapter.hasOutline ? e('span', null, `· ${t('chapter.outline')}`) : null,
          chapter.hasMemory ? e('span', null, `· ${t('chapter.memory')}`) : null,
          e('span', { className: 'nw-spacer' }),
          e('span', null, formatTime(chapter.mtime, t)),
        ),
        e('h1', { className: 'nw-reading-title' }, heading),
        e(TruncatedNotice, { app }),
        paragraphs.map((paragraph, index) => e('p', { key: index }, paragraph)),
      )
    }

    /** Chapter outline view. */
    function ChapterOutlineView({ app, chapter }) {
      const t = app.t
      const outline = app.snapshot?.chapterOutlines?.[String(chapter.chapter)]?.data
      if (!outline) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noOutline')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
          e('div', { className: 'nw-empty-actions' },
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(chapter.chapter) }, icon('spark', 14), t('chapter.write')),
          ),
        )
      }
      const scenes = Array.isArray(outline.scenes) ? outline.scenes : []
      const storylineNames = new Map((app.snapshot?.outline?.storylines ?? []).map((line) => [line.id, line.name]))
      const storylineItems = Array.isArray(outline.storyline_focus) ? outline.storyline_focus : outline.storyline_focus ? [outline.storyline_focus] : []
      const storyline = storylineItems.map((item) => (typeof item === 'string' ? (storylineNames.get(item) ?? item) : (item?.name ?? item?.id ?? ''))).filter(Boolean).join('、')
      const cast = Array.isArray(outline.characters) ? outline.characters : []
      const sceneCast = scenes.flatMap((scene) => (Array.isArray(scene.characters) ? scene.characters : []))
      const castNames = Array.from(new Set([
        ...(outline.pov_character?.name ? [outline.pov_character.name] : []),
        ...cast.map((person) => person.name),
        ...sceneCast.map((person) => person.name),
      ].filter(Boolean)))
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, outline.title || chapter.title),
        e(Field, { label: t('chapter.valueShift'), value: outline.value_shift }),
        e(Field, { label: t('chapter.emotionalStakes'), value: outline.emotional_stakes }),
        e(Field, { label: t('chapter.dramaticFocus'), value: outline.dramatic_focus }),
        e(Field, { label: t('chapter.storylineFocus'), value: storyline }),
        e(Field, { label: t('chapter.pov'), value: outline.pov_character?.name }),
        e(Field, { label: t('chapter.opening'), value: outline.opening }),
        e(Field, { label: t('chapter.whatChanges'), value: outline.what_changes }),
        e(Field, { label: t('chapter.want'), value: outline.protagonist_wants }),
        e(Field, { label: t('chapter.obstacle'), value: outline.obstacle }),
        e(Field, { label: t('chapter.stakes'), value: outline.at_stake }),
        e(Field, { label: t('chapter.readerGets'), value: outline.reader_gets }),
        Array.isArray(outline.beats) && outline.beats.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.beats')), e('ol', { className: 'nw-reading-list' }, outline.beats.map((beat, index) => e('li', { key: index }, beat)))) : null,
        scenes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.scenes')),
          scenes.map((scene, index) => e('div', { key: index, className: 'nw-scene' },
            e('div', { className: 'nw-scene-head' }, scene.location ?? ''),
            Array.isArray(scene.characters) && scene.characters.length > 0
              ? e('div', { className: 'nw-tags', style: { marginTop: 6 } }, scene.characters.map((person, personIndex) => e('span', { key: personIndex, className: 'nw-tag' }, person.name ?? '')))
              : null,
            scene.pressure_point ? e('p', { className: 'nw-scene-text' }, scene.pressure_point) : null,
          )),
        ) : null,
        castNames.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.cast')), e('div', { className: 'nw-tags' }, castNames.map((name, index) => e('span', { key: index, className: 'nw-tag' }, name)))) : null,
        Array.isArray(outline.state_changes) && outline.state_changes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.stateChanges')), e('ul', { className: 'nw-reading-list' }, outline.state_changes.map((change, index) => e('li', { key: index }, `${change.character?.name ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`)))) : null,
        Array.isArray(outline.foreshadowing_touch) && outline.foreshadowing_touch.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.foreshadowing')), e('div', { className: 'nw-tags' }, outline.foreshadowing_touch.map((item, index) => e('span', { key: index, className: 'nw-tag' }, `${item.id ?? ''} ${foreshadowingLabel(item.action)}`)))) : null,
        e(Field, { label: t('chapter.mustKnow'), value: outline.reader_must_know }),
        e(Field, { label: t('chapter.heldBack'), value: outline.held_back }),
        e(Field, { label: t('chapter.endingNote'), value: outline.ending_note || outline.chapter_end }),
        chapter.outlinePath ? e('div', { style: { marginTop: 28 } }, e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenFile(chapter.outlinePath, t('action.inspectRaw')) }, icon('external', 14), t('action.inspectRaw'))) : null,
      )
    }

    /** Chapter review view. */
    function ChapterReviewView({ app, chapter }) {
      const t = app.t
      const review = chapter.review
      if (!review) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noReview')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
        )
      }
      const failed = review.verdict === 'fail'
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} · ${t('chapter.review')}`),
        e('div', { className: 'nw-ov-meta' },
          e('span', { className: `nw-tag ${failed ? 'is-warn' : 'is-success'}` }, failed ? t('reviews.fail') : t('reviews.pass')),
          e('span', { className: 'nw-tag' }, fill(t('reviews.issues'), { n: review.issues })),
          review.blockers ? e('span', { className: 'nw-tag is-warn' }, `blockers ${review.blockers}`) : null,
        ),
        review.wordCount ? e('p', { className: 'nw-muted', style: { marginTop: 18 } }, fill(t('workbench.words'), { n: review.wordCount })) : null,
        review.path ? e('div', { style: { marginTop: 24 } }, e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenFile(review.path, t('chapter.review')) }, icon('external', 14), t('action.inspectRaw'))) : null,
      )
    }

    /** Chapter memory view. */
    function ChapterMemoryView({ app, chapter }) {
      const t = app.t
      const record = (app.snapshot?.memoryRecords ?? []).find((item) => item.chapter === chapter.chapter)
      if (!record) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noMemory')),
          e('p', { className: 'nw-empty-body' }, t('panel.noMemory')),
        )
      }
      return e('div', { className: 'nw-reading' },
        e('div', { className: 'nw-ov-meta' },
          e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('chapter.memoryStale') : t('chapter.memoryFresh')),
          record.word_count ? e('span', { className: 'nw-tag' }, fill(t('workbench.words'), { n: record.word_count })) : null,
        ),
        e('h1', { className: 'nw-reading-title' }, `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} · ${t('chapter.memory')}`),
        record.summary ? e('p', null, record.summary) : null,
        Array.isArray(record.events) && record.events.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.events')), e('ul', { className: 'nw-reading-list' }, record.events.map((event, index) => e('li', { key: index }, event.description ?? String(event))))) : null,
        Array.isArray(record.state_changes) && record.state_changes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.stateChanges')), e('ul', { className: 'nw-reading-list' }, record.state_changes.map((change, index) => e('li', { key: index }, `${change.character ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`)))) : null,
        Array.isArray(record.foreshadowing) && record.foreshadowing.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.foreshadowing')), e('ul', { className: 'nw-reading-list' }, record.foreshadowing.map((item, index) => e('li', { key: index }, `${item.id ?? ''} ${foreshadowingLabel(item.action)} ${item.note ?? ''}`)))) : null,
        record.source_revision ? e('p', { className: 'nw-muted', style: { marginTop: 20 } }, `source ${record.source_revision}`) : null,
      )
    }

    /** Character content: profile markdown or folded state. */
    function CharacterView({ app }) {
      const t = app.t
      const character = (app.snapshot?.characters ?? []).find((item) => item.name === app.selection?.name)
      if (!character) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      if (app.characterView === 'state') {
        const folded = app.snapshot?.characterStates?.[character.name] ?? {}
        const initial = character.identity?.initialStates ?? []
        return e('div', { className: 'nw-reading' },
          e('h1', { className: 'nw-reading-title' }, `${character.name} · ${t('character.state')}`),
          initial.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('character.initial')), e('dl', null, initial.map((state, index) => e('div', { key: index, className: 'nw-kv' }, e('dt', null, dimensionLabel(app, state.dimension)), e('dd', null, String(state.value ?? '')))))) : null,
          Object.keys(folded).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('character.current')), e('dl', null, Object.entries(folded).map(([dimension, state], index) => e('div', { key: index, className: 'nw-kv' }, e('dt', null, dimensionLabel(app, dimension)), e('dd', null, `${Array.isArray(state.value) ? state.value.join('、') : state.value}${state.chapter ? ` · ${fill(t('workbench.chapterNo'), { no: state.chapter })}` : ''}`))))) : e('p', { className: 'nw-muted' }, t('panel.noMemory')),
        )
      }
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (app.editing) return e('div', { className: 'nw-editor-wrap' }, e('textarea', { className: 'nw-editor', value: app.draft, spellCheck: false, disabled: app.saving, onChange: (event) => app.onDraft(event.target.value) }))
      if (!app.file) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, character.name),
          e('p', { className: 'nw-empty-body' }, character.identity?.portrait || t('aside.noIdentity')),
        )
      }
      return e('div', null, e(TruncatedNotice, { app }), e(MarkdownBody, {
        text: app.file.text,
        afterTitle: character.identity?.portrait ? e('p', { className: 'nw-quote' }, character.identity.portrait) : null,
      }))
    }

    /** Structured outline view. */
    function OutlineView({ app }) {
      const t = app.t
      const outline = app.snapshot?.outline
      if (!outline) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('outline.empty')), e('p', { className: 'nw-empty-body' }, t('workbench.openFirst')))
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, outline.title || t('workbench.outline')),
        outline.synopsis ? e('p', null, outline.synopsis) : null,
        (app.snapshot?.volumes ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.volumes')),
          (app.snapshot.volumes ?? []).map((volume) => e('div', { key: volume.volumeNo, className: 'nw-outline-volume' },
            e('h3', null, `${fill(t('workbench.volume'), { no: volume.volumeNo })}${volume.title ? ` · ${volume.title}` : ''}`),
            volume.synopsis ? e('p', { className: 'nw-muted' }, volume.synopsis) : null,
            (volume.arcs ?? []).map((arc) => e('div', { key: arc.arcId, className: 'nw-outline-arc' },
              e('strong', null, arc.title || arc.arcId),
              arc.chapterStart ? e('span', { className: 'nw-muted' }, ` · ${fill(t('workbench.chapterNo'), { no: arc.chapterStart })}–${arc.chapterEnd ?? '?'}`) : null,
              arc.synopsis ? e('p', { className: 'nw-muted' }, arc.synopsis) : null,
            )),
          )),
        ) : null,
        (outline.storylines ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.storylines')), e('div', { className: 'nw-tags' }, outline.storylines.map((line, index) => e('span', { key: index, className: 'nw-tag' }, `${line.name ?? line.id ?? ''}${line.type ? ` · ${line.type}` : ''}`)))) : null,
        (outline.mysteries ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.mysteries')), e('ul', { className: 'nw-reading-list' }, outline.mysteries.map((mystery, index) => e('li', { key: index }, `${mystery.question ?? ''}${mystery.truth ? ` → ${mystery.truth}` : ''}${mystery.reveal ? `（第 ${mystery.reveal} 章）` : ''}`)))) : null,
        (outline.foreshadowing ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.foreshadowing')), e('ul', { className: 'nw-reading-list' }, outline.foreshadowing.map((item, index) => e('li', { key: index }, `${item.id ?? ''} ${item.description ?? ''}${item.planted_chapter ? ` · 埋于第 ${item.planted_chapter} 章 → ${item.target_reveal ?? '?'}` : ''}`)))) : null,
      )
    }

    /** Premise cards view. */
    function PremiseView({ app }) {
      const t = app.t
      const premise = app.snapshot?.premise
      if (!premise || premise.cards.length === 0) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('premise.empty')))
      return e('div', { className: 'nw-ov' },
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('workbench.premise')),
          e('div', { className: 'nw-premise-grid' }, premise.cards.map((card, index) => e('div', { key: card.card ?? index, className: 'nw-premise-card' },
            e('h3', null, CARD_LABELS[card.card] ?? String(card.card ?? '')),
            (card.fields ?? []).map((field, fieldIndex) => e('div', { key: fieldIndex, className: 'nw-premise-field' },
              e('div', { className: 'nw-premise-key' }, `${PREMISE_FIELD_LABELS[field.key] ?? String(field.key ?? '')}${field.certainty ? ` · ${t(`premise.certainty.${field.certainty}`)}` : ''}`),
              e('div', { className: 'nw-premise-value' }, String((field.key === 'address' ? (PREMISE_VALUES[field.value] ?? field.value) : field.value) ?? '')),
              field.note ? e('div', { className: 'nw-muted' }, field.note) : null,
            )),
          ))),
        ),
      )
    }

    /** Memory overview. */
    function MemoryView({ app }) {
      const t = app.t
      const records = app.snapshot?.memoryRecords ?? []
      const missing = app.snapshot?.status?.memory?.missing ?? []
      const stale = app.snapshot?.status?.memory?.stale ?? []
      return e('div', { className: 'nw-ov' },
        e('div', { className: 'nw-stats3' },
          e('div', { className: 'nw-bigstat' }, e('b', null, String(records.length)), e('span', null, t('memory.records'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(missing.length)), e('span', null, t('memory.missing'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(stale.length)), e('span', null, t('memory.stale'))),
        ),
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('memory.list')),
          records.length === 0 ? e('p', { className: 'nw-muted' }, t('memory.none')) : e('div', { className: 'nw-recent' }, records.map((record) => e('button', {
            key: record.chapter, type: 'button', className: 'nw-memory-row', onClick: () => app.onOpenChapter((app.snapshot.chapters ?? []).find((row) => row.chapter === record.chapter) ?? { chapter: record.chapter }, 'memory'),
          },
            e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: record.chapter })),
            e('span', { className: 'nw-rrow-title' }, record.summary || '—'),
            e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('memory.outdated') : t('memory.fresh')),
          ))),
        ),
      )
    }

    /** Reviews overview. */
    function ReviewsView({ app }) {
      const t = app.t
      const reviews = app.snapshot?.reviews ?? []
      if (reviews.length === 0) return e('div', { className: 'nw-empty' },
        e('h2', { className: 'nw-empty-title' }, t('reviews.empty')),
        e('p', { className: 'nw-empty-body' }, t('reviews.emptyBody')),
      )
      return e('div', { className: 'nw-ov' },
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('workbench.reviews')),
          e('div', { className: 'nw-recent' }, reviews.map((review) => e('button', {
            key: review.chapter, type: 'button', className: 'nw-rrow', onClick: () => app.onOpenChapter((app.snapshot.chapters ?? []).find((row) => row.chapter === review.chapter) ?? { chapter: review.chapter }, 'review'),
          },
            e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: review.chapter })),
            e('span', { className: 'nw-rrow-title' }, review.path ?? ''),
            e('span', { className: `nw-tag ${review.verdict === 'fail' ? 'is-warn' : 'is-success'}` }, review.verdict === 'fail' ? t('reviews.fail') : t('reviews.pass')),
            e('span', { className: 'nw-rrow-words' }, fill(t('reviews.issues'), { n: review.issues })),
          ))),
        ),
      )
    }

    /** Generic text/JSON file view. */
    function FileView({ app }) {
      const t = app.t
      const file = app.file
      const readOnly = isProtectedPath(app.selection?.path)
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (!file) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      if (app.editing && !readOnly) {
        const mono = /\.(json|ya?ml|csv|tsv)$/i.test(file.path)
        return e('div', { className: 'nw-editor-wrap' }, e('textarea', { className: `nw-editor ${mono ? 'is-mono' : ''}`, value: app.draft, spellCheck: false, disabled: app.saving, onChange: (event) => app.onDraft(event.target.value) }))
      }
      const body = /\.(json|ya?ml|csv|tsv)$/i.test(file.path)
        ? e('div', { className: 'nw-reading' }, e('pre', { className: 'nw-pre' }, file.text))
        : e(MarkdownBody, { text: file.text })
      return e('div', null, e(TruncatedNotice, { app }), body)
    }

    /** One status chip for a tracking row. */
    function trackingTag(t, level, label) {
      const cls = level === 'good' ? 'is-success' : level === 'warn' ? 'is-warn' : ''
      return e('span', { className: `nw-tag ${cls}` }, label)
    }

    /**
     * The four visible memory sheets: progress, summaries, foreshadowing and
     * character states. Read-only projection of the structured memory.
     * @param {{ app: object }} props - page model.
     * @returns {any} the tracking view.
     */
    function TrackingView({ app }) {
      const t = app.t
      const tracking = app.snapshot?.tracking
      if (!tracking) {
        // The toolbar already owns the one refresh action; the empty state
        // explains instead of offering a second copy of it.
        return e('div', { className: 'nw-track' },
          e('div', { className: 'nw-empty' },
            e('h2', { className: 'nw-empty-title' }, t('workbench.tracking')),
            e('p', { className: 'nw-empty-body' }, t('tracking.empty')),
          ),
        )
      }
      const tab = app.trackingTab ?? 'progress'
      if (tab === 'summaries') {
        const groups = new Map()
        for (const row of tracking.summaries ?? []) {
          const key = row.volume === null ? t('workbench.loose') : fill(t('workbench.volume'), { no: row.volume })
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key).push(row)
        }
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, t('tracking.generated')),
          groups.size === 0 ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noSummaries'))) : null,
          [...groups.entries()].map(([group, rows]) => e('section', { key: group, className: 'nw-track-section' },
            e('h3', null, group),
            rows.map((row) => e('article', { key: row.chapter, className: 'nw-track-sum' },
              e('header', { className: 'nw-track-sum-head' },
                e('b', null, fill(t('tracking.chapterNo'), { no: row.chapter })),
                e('span', { className: 'nw-track-sum-title' }, row.title),
                e('em', null, fill(t('tracking.wordCount'), { n: row.words })),
                row.missing ? trackingTag(t, 'warn', t('tracking.missing')) : row.stale ? trackingTag(t, 'warn', t('tracking.stale')) : null,
              ),
              e('p', { className: 'nw-track-sum-body' }, row.summary || '—'),
              row.events.length > 0 ? e('ul', { className: 'nw-track-events' }, row.events.map((event, index) => e('li', { key: index }, event))) : null,
            )),
          )),
        )
      }
      if (tab === 'foreshadowing') {
        const open = tracking.openForeshadowing?.length ?? 0
        const overdue = tracking.foreshadowing.filter((item) => item.status === '逾期').length
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, `${t('tracking.generated')} · ${t('tracking.open')} ${open} · ${t('tracking.overdue')} ${overdue}`),
          tracking.foreshadowing.length === 0
            ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noForeshadowing')))
            : e('div', { className: 'nw-track-table-wrap' },
              e('table', { className: 'nw-track-table' },
                e('thead', null, e('tr', null,
                  e('th', null, 'ID'), e('th', null, '伏笔'), e('th', null, '埋设'), e('th', null, '计划回收'), e('th', null, '状态'), e('th', null, '最近动作'), e('th', null, '依据章'),
                )),
                e('tbody', null, tracking.foreshadowing.map((item) => e('tr', { key: item.id },
                  e('td', { className: 'nw-track-mono' }, item.id),
                  e('td', null, item.description),
                  e('td', null, item.planted ?? '—'),
                  e('td', null, item.target ?? '—'),
                  e('td', null, trackingTag(t, item.level, item.status)),
                  e('td', null, item.lastActionLabel || '—'),
                  e('td', null, item.lastChapter ?? '—'),
                ))),
              ),
            ),
        )
      }
      if (tab === 'characters') {
        const people = tracking.characters ?? []
        const chapterRows = new Map((app.snapshot?.chapters ?? []).map((row) => [row.chapter, row]))
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, t('tracking.generated')),
          people.length === 0 ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noCharacters'))) : null,
          e('div', { className: 'nw-track-people' }, people.map((person) => {
            const characterRow = (app.snapshot?.characters ?? []).find((row) => row.name === person.name)
            return e(characterRow?.path ? 'button' : 'div', {
              key: person.name,
              type: characterRow?.path ? 'button' : undefined,
              className: `nw-track-person ${characterRow?.path ? 'is-link' : ''}`,
              onClick: characterRow?.path ? () => app.onOpenCharacter(characterRow) : undefined,
            },
              e('div', { className: 'nw-track-person-head' },
                e('b', null, person.name),
                e('span', { className: 'nw-tag' }, STAGE_LABELS[person.stage] ?? person.stage ?? '—'),
                e('span', { className: 'nw-spacer' }),
                person.lastChanged ? e('span', { className: 'nw-muted' }, fill(t('tracking.chapterNo'), { no: person.lastChanged })) : null,
              ),
              person.current.length === 0
                ? e('p', { className: 'nw-muted' }, '还没有记过状态变化。')
                : e('div', { className: 'nw-track-states' }, person.current.slice(0, 8).map((state) => e('span', { key: state.dimension, className: 'nw-track-state' },
                  e('em', null, state.label),
                  String(Array.isArray(state.value) ? state.value.join('、') : state.value ?? '空'),
                ))),
              person.recent.length > 0 ? e('div', { className: 'nw-track-recent' },
                e('span', { className: 'nw-muted' }, t('tracking.lastChange')),
                person.recent.slice(0, 3).map((change, index) => e('div', { key: index, className: 'nw-track-change' }, `第 ${change.chapter} 章 · ${change.label} · ${change.value ?? ''}`)),
              ) : null,
            )
          })),
        )
      }
      const progress = tracking.progress
      const action = app.journey?.action ?? null
      const checklist = tracking.checklist ?? []
      return e('div', { className: 'nw-track' },
        e('p', { className: 'nw-track-note' }, t('tracking.generated')),
        e('section', { className: 'nw-track-hero' },
          e('div', { className: 'nw-track-hero-num' }, e('b', null, String(progress.written)), e('span', null, progress.total ? ` / ${progress.total} 章` : ' 章')),
          e('p', null, `${Number(progress.words ?? 0).toLocaleString()} 字 · 下一章 第 ${progress.nextChapter} 章 · 记忆 ${progress.memory.recorded} 章`),
          e('div', { className: 'nw-bar' }, e('i', { style: { width: `${progress.percent}%` } })),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.volumes')),
          (progress.volumes ?? []).length === 0
            ? e('p', { className: 'nw-muted' }, '还没有分卷。')
            : progress.volumes.map((volume) => e('div', { key: volume.title, className: 'nw-track-vol' },
              e('span', null, volume.title),
              e('b', null, `${volume.written}/${volume.total}`),
              e('div', { className: 'nw-bar' }, e('i', { style: { width: `${volume.percent}%` } })),
            )),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.next')),
          e('p', { className: 'nw-track-next' }, progress.nextStep || '继续写下一章'),
          progress.nextDescription ? e('p', { className: 'nw-muted' }, progress.nextDescription) : null,
          action ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.onJourney(action) }, action.label) : null,
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.issues')),
          checklist.length === 0
            ? e('p', { className: 'nw-muted' }, t('journey.healthGood'))
            : checklist.filter((item) => item.level !== 'good').map((item) => e('div', { key: item.id, className: 'nw-track-issue' },
              e('i', { className: `nw-health-dot is-${item.level}` }),
              e('span', null, item.label),
              item.detail ? e('em', null, item.detail) : null,
            )),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.recent')),
          (tracking.summaries ?? []).slice(-6).reverse().map((row) => e('div', { key: row.chapter, className: 'nw-track-recent-row' },
            e('span', { className: 'nw-track-mono' }, fill(t('tracking.chapterNo'), { no: row.chapter })),
            e('span', { className: 'nw-track-recent-title' }, row.title),
            e('span', { className: 'nw-muted' }, fill(t('tracking.wordCount'), { n: row.words })),
            row.missing ? trackingTag(t, 'warn', t('tracking.missing')) : row.stale ? trackingTag(t, 'warn', t('tracking.stale')) : null,
          )),
        ),
      )
    }

    /**
     * Route the current selection to its content view.
     * @param {{ app: object }} props - page model.
     * @returns {any} the view.
     */
    function ContentView({ app }) {
      if (!app.selection) return e(OverviewView, { app })
      switch (app.selection.kind) {
        case 'chapter': return e(ChapterView, { app })
        case 'character': return e(CharacterView, { app })
        case 'outline': return e(OutlineView, { app })
        case 'premise': return e(PremiseView, { app })
        case 'memory': return e(MemoryView, { app })
        case 'reviews': return e(ReviewsView, { app })
        case 'tracking': return e(TrackingView, { app })
        case 'world':
        case 'file': return e(FileView, { app })
        default: return e(OverviewView, { app })
      }
    }
