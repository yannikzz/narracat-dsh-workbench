    /** One titled panel section. */
    function PanelSection({ title, children }) {
      if (!children) return null
      return e('section', { className: 'nw-sec' }, e('h4', null, title), children)
    }

    /** One label/value row. */
    function PanelKv({ label, value }) {
      if (value === null || value === undefined || value === '') return null
      return e('div', { className: 'nw-kv' }, e('dt', null, label), e('dd', null, value))
    }

    /**
     * Right context panel. In a Session view it also hosts the live transcript.
     * @param {{ app: object }} props - page model.
     * @returns {any} the panel.
     */
    function ContextPanel({ app }) {
      const t = app.t
      const isChat = app.isSession && app.panelTab === 'chat'
      const selection = app.selection
      const snapshot = app.snapshot
      const title = !selection
        ? t('panel.book')
        : selection.kind === 'chapter'
          ? t('panel.chapter')
          : selection.kind === 'character'
            ? t('panel.character')
            : selection.kind === 'world' || selection.kind === 'file'
              ? t('panel.file')
              : selection.kind === 'outline'
                ? t('workbench.outline')
                : selection.kind === 'premise'
                  ? t('workbench.premise')
                  : selection.kind === 'memory'
                    ? t('workbench.memory')
                    : selection.kind === 'tracking'
                      ? t('workbench.tracking')
                      : t('workbench.reviews')

      const sections = []
      if (!selection) {
        const status = app.status
        sections.push(e(PanelSection, { key: 'book', title: t('workbench.book') },
          e('dl', null,
            e(PanelKv, { label: t('aside.title'), value: app.book?.title }),
            e(PanelKv, { label: t('aside.genre'), value: app.book?.genre || '—' }),
            e(PanelKv, { label: t('aside.stage'), value: `${status?.writtenChapters ?? 0} / ${app.book?.totalChapters ?? '?'}` }),
            e(PanelKv, { label: t('aside.words'), value: (status?.totalWords ?? 0).toLocaleString() }),
            e(PanelKv, { label: t('aside.next'), value: status?.nextChapter ? fill(t('workbench.chapterNo'), { no: status.nextChapter }) : '—' }),
            e(PanelKv, { label: t('aside.memory'), value: `${snapshot?.book?.memory?.records ?? 0} 章` }),
            e(PanelKv, { label: t('aside.updated'), value: formatTime(app.book?.updatedAt, app.t) }),
          ),
        ),)
        sections.push(e(PanelSection, { key: 'path', title: t('panel.path') },
          e('div', { className: 'nw-muted', style: { fontSize: 11, wordBreak: 'break-all' } }, app.book?.dir ?? ''),
        ))
      } else if (selection.kind === 'chapter') {
        const chapter = (snapshot?.chapters ?? []).find((row) => row.chapter === selection.chapter)
        const outline = snapshot?.chapterOutlines?.[String(selection.chapter)]?.data
        const record = (snapshot?.memoryRecords ?? []).find((row) => row.chapter === selection.chapter)
        sections.push(e(PanelSection, { key: 'chapter', title: t('panel.chapter') },
          e('dl', null,
            e(PanelKv, { label: t('aside.words'), value: `${chapter?.words ?? 0}${app.book?.wordsPerChapter ? ` / ${app.book.wordsPerChapter}` : ''}` }),
            e(PanelKv, { label: t('chapter.volume'), value: chapter?.volume === null || chapter?.volume === undefined ? '—' : String(chapter.volume) }),
            e(PanelKv, { label: t('chapter.review'), value: chapter?.review ? (chapter.review.verdict === 'fail' ? fill(t('chapter.reviewFail'), { n: chapter.review.blockers || chapter.review.issues }) : t('chapter.reviewPass')) : t('chapter.reviewNone') }),
            e(PanelKv, { label: t('chapter.memory'), value: chapter?.hasMemory ? (chapter.memoryFresh === false ? t('memory.outdated') : t('memory.fresh')) : t('chapter.noMemory') }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, chapter?.path ?? '—') }),
          ),
        ))
        if (outline) {
          const beatItems = Array.isArray(outline.beats)
            ? outline.beats
            : Array.isArray(outline.scenes)
              ? outline.scenes.map((scene) => `${scene.location ?? ''}${scene.pressure_point ? ` · ${scene.pressure_point}` : ''}`)
              : []
          const castNames = Array.from(new Set([
            ...(outline.pov_character?.name ? [outline.pov_character.name] : []),
            ...(Array.isArray(outline.characters) ? outline.characters.map((person) => person.name) : []),
            ...(Array.isArray(outline.scenes) ? outline.scenes.flatMap((scene) => (Array.isArray(scene.characters) ? scene.characters.map((person) => person.name) : [])) : []),
          ].filter(Boolean)))
          sections.push(e(PanelSection, { key: 'outline', title: t('chapter.outlineGist') },
            beatItems.length > 0
              ? e('ul', { className: 'nw-beats' }, beatItems.map((beat, index) => e('li', { key: index }, beat)))
              : e('div', { className: 'nw-muted' }, '—'),
            castNames.length > 0 ? e('div', { className: 'nw-tags', style: { marginTop: 10 } }, castNames.map((name, index) => e('span', { key: index, className: 'nw-tag' }, name))) : null,
            Array.isArray(outline.state_changes) && outline.state_changes.length > 0 ? e('ul', { className: 'nw-beats', style: { marginTop: 10 } }, outline.state_changes.map((change, index) => e('li', { key: index }, `${change.character?.name ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`))) : null,
            Array.isArray(outline.foreshadowing_touch) && outline.foreshadowing_touch.length > 0 ? e('div', { className: 'nw-tags', style: { marginTop: 10 } }, outline.foreshadowing_touch.map((item, index) => e('span', { key: index, className: 'nw-tag' }, `${item.id ?? ''} ${foreshadowingLabel(item.action)}`))) : null,
          ))
        }
        sections.push(e(PanelSection, { key: 'memory', title: t('chapter.memory') },
          record
            ? [
              e('div', { key: 'tag', className: 'nw-tags', style: { marginBottom: 8 } }, e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('memory.outdated') : t('memory.fresh'))),
              e('div', { key: 'summary', className: 'nw-muted' }, record.summary || '—'),
            ]
            : e('div', { className: 'nw-muted' }, t('panel.noMemory')),
        ))
      } else if (selection.kind === 'character') {
        const character = (snapshot?.characters ?? []).find((item) => item.name === selection.name)
        const identity = character?.identity ?? null
        const folded = snapshot?.characterStates?.[selection.name] ?? {}
        sections.push(e(PanelSection, { key: 'character', title: t('panel.character') },
          e('dl', null,
            e(PanelKv, { label: t('character.stage'), value: STAGE_LABELS[identity?.profileStage] ?? identity?.profileStage ?? '—' }),
            e(PanelKv, { label: t('character.aliases'), value: identity?.aliases?.length ? identity.aliases.join('、') : '—' }),
            e(PanelKv, { label: t('character.gender'), value: identity?.gender || '—' }),
            e(PanelKv, { label: t('character.age'), value: identity?.age || '—' }),
            e(PanelKv, { label: t('character.identity'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, identity?.path ?? '—') }),
          ),
        ))
        if (identity?.portrait) sections.push(e(PanelSection, { key: 'portrait', title: t('character.portrait') }, e('div', { className: 'nw-muted' }, identity.portrait)))
        if (Object.keys(folded).length > 0) {
          sections.push(e(PanelSection, { key: 'state', title: t('character.current') },
            e('dl', null, Object.entries(folded).map(([dimension, state], index) => e(PanelKv, {
              key: index,
              label: dimension,
              value: `${Array.isArray(state.value) ? state.value.join('、') : state.value}${state.chapter ? ` · ${fill(t('workbench.chapterNo'), { no: state.chapter })}` : ''}`,
            }))),
          ))
        }
      } else if (selection.kind === 'outline') {
        sections.push(e(PanelSection, { key: 'outline', title: t('workbench.outline') },
          e('dl', null,
            e(PanelKv, { label: t('outline.volumes'), value: String((snapshot?.volumes ?? []).length) }),
            e(PanelKv, { label: t('outline.storylines'), value: String((snapshot?.outline?.storylines ?? []).length) }),
            e(PanelKv, { label: t('outline.mysteries'), value: String((snapshot?.outline?.mysteries ?? []).length) }),
            e(PanelKv, { label: t('outline.foreshadowing'), value: String((snapshot?.outline?.foreshadowing ?? []).length) }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, snapshot?.outline?.path ?? '—') }),
          ),
        ))
      } else if (selection.kind === 'premise') {
        sections.push(e(PanelSection, { key: 'premise', title: t('workbench.premise') },
          e('dl', null,
            e(PanelKv, { label: t('workbench.premise'), value: String(snapshot?.premise?.cards?.length ?? 0) }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, snapshot?.premise?.path ?? '—') }),
          ),
        ))
      } else if (selection.kind === 'memory') {
        const memory = snapshot?.book?.memory ?? {}
        sections.push(e(PanelSection, { key: 'memory', title: t('workbench.memory') },
          e('dl', null,
            e(PanelKv, { label: t('memory.records'), value: String(memory.records ?? 0) }),
            e(PanelKv, { label: t('memory.missing'), value: String(snapshot?.status?.memory?.missing?.length ?? 0) }),
            e(PanelKv, { label: t('memory.stale'), value: String(snapshot?.status?.memory?.stale?.length ?? 0) }),
            e(PanelKv, { label: t('memory.db'), value: memory.dbBytes === null || memory.dbBytes === undefined ? t('memory.none') : formatBytes(memory.dbBytes) }),
          ),
        ))
      } else if (selection.kind === 'reviews') {
        const reviews = snapshot?.reviews ?? []
        sections.push(e(PanelSection, { key: 'reviews', title: t('workbench.reviews') },
          e('dl', null,
            e(PanelKv, { label: t('workbench.reviews'), value: String(reviews.length) }),
            e(PanelKv, { label: t('reviews.fail'), value: String(reviews.filter((review) => review.verdict === 'fail').length) }),
          ),
        ))
      } else if (selection.kind === 'world' || selection.kind === 'file') {
        sections.push(e(PanelSection, { key: 'file', title: t('panel.file') },
          e('dl', null,
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, selection.path ?? '—') }),
            e(PanelKv, { label: t('panel.size'), value: app.file ? formatBytes(app.file.size) : '—' }),
            isProtectedPath(selection.path) ? e(PanelKv, { label: t('workbench.readonly'), value: '✓' }) : null,
          ),
        ))
      }

      return e('aside', { className: `nw-panel ${app.panelOpen ? 'is-open' : ''}` },
        e('div', { className: 'nw-panel-head' },
          app.isSession
            ? e('div', { className: 'nw-panel-tabs' },
              e('button', { type: 'button', className: `nw-panel-tab ${app.panelTab === 'context' ? 'is-active' : ''}`, onClick: () => app.onPanelTab('context') }, t('panel.sections')),
              e('button', { type: 'button', className: `nw-panel-tab ${app.panelTab === 'chat' ? 'is-active' : ''}`, onClick: () => app.onPanelTab('chat') }, t('workbench.chat')),
            )
            : e('div', { className: 'nw-panel-title' }, title),
          e('div', { className: 'nw-spacer' }),
          e(IconButton, { glyph: 'close', label: t('workbench.close'), tipAlign: 'end', onClick: app.onTogglePanel }),
        ),
        isChat ? e(ChatBoard, { app }) : e('div', { className: 'nw-panel-body' }, sections),
      )
    }

    /**
     * Live Session transcript for the Session view. The host composer below the
     * view remains the only input.
     * @param {{ app: object }} props - page model with useChat.
     * @returns {any} the transcript.
     */
    function ChatBoard({ app }) {
      const t = app.t
      const useChat = app.useChat ?? (() => [])
      const nodes = useChat((snapshot) => snapshot?.legacy?.nodes ?? [])
      const partial = useChat((snapshot) => snapshot?.legacy?.partial ?? null)
      const running = useChat((snapshot) => snapshot?.legacy?.runningCalls ?? [])
      const scroller = useRef(null)
      useEffect(() => {
        const element = scroller.current
        if (element) element.scrollTop = element.scrollHeight
      }, [nodes, partial, running])
      const textOf = (blocks) => (Array.isArray(blocks) ? blocks : [])
        .map((block) => (block?.type === 'text' ? String(block.text ?? '') : ''))
        .filter(Boolean)
        .join('\n')
      const rows = []
      for (const node of (Array.isArray(nodes) ? nodes : []).slice(-200)) {
        if (node?.kind === 'user') rows.push({ key: `u${node.seq}`, role: t('chat.you'), tone: 'is-user', text: textOf(node.content) })
        else if (node?.kind === 'assistant') {
          const parts = []
          for (const block of Array.isArray(node.blocks) ? node.blocks : []) {
            if (block?.kind === 'text') parts.push(String(block.text ?? ''))
            else if (block?.kind === 'tool-call') parts.push(`〔${t('chat.tool')}: ${block.name ?? ''}〕`)
          }
          const text = parts.filter(Boolean).join('\n')
          if (text) rows.push({ key: `a${node.seq}`, role: t('chat.agent'), tone: '', text })
        } else if (node?.kind === 'tool-call') {
          const name = node?.data?.root?.name
          if (name) rows.push({ key: `t${node.seq}`, role: t('chat.tool'), tone: 'is-tool', text: String(name) })
        } else if (node?.kind === 'steering') {
          const text = textOf(node.content)
          if (text) rows.push({ key: `s${node.seq}`, role: t('chat.you'), tone: 'is-user', text })
        }
      }
      const partialText = (Array.isArray(partial?.blocks) ? partial.blocks : [])
        .filter((block) => block?.kind === 'text')
        .map((block) => String(block.text ?? ''))
        .join('')
      const runningNames = (Array.isArray(running) ? running : []).map((call) => call?.name).filter(Boolean)
      return e('div', { className: 'nw-chat' },
        e('div', { className: 'nw-chat-scroll', ref: scroller },
          rows.length === 0 && !partialText && runningNames.length === 0
            ? e('div', { className: 'nw-chat-empty' }, t('chat.empty'))
            : rows.map((row) => e('div', { key: row.key, className: `nw-chat-row ${row.tone}` },
              e('div', { className: 'nw-chat-role' }, row.role),
              e('div', { className: 'nw-chat-text' }, row.text),
            )),
          partialText ? e('div', { className: 'nw-chat-row' },
            e('div', { className: 'nw-chat-role' }, `${t('chat.agent')} · ${t('chat.streaming')}`),
            e('div', { className: 'nw-chat-text' }, partialText),
          ) : null,
          runningNames.length > 0 ? e('div', { className: 'nw-chat-row is-tool' },
            e('div', { className: 'nw-chat-role' }, t('chat.tool')),
            e('div', { className: 'nw-chat-text' }, `${t('chat.running')}: ${runningNames.join('、')}`),
          ) : null,
        ),
        e('div', { className: 'nw-chat-hint' }, t('chat.hint')),
      )
    }

    // ---- right-sidebar novel panel -----------------------------------------
    // A stage-aware "book cockpit": every stage answers what exists, what is
    // missing, and what the author can do next, without assuming any chapter is
    // written yet. It is designed for a narrow, resizable column.

    /** Stage names, in the panel's more concrete wording. */
    const PANEL_STAGE_KEYS = {
      setup: 'panel.stage.setup',
      outline: 'panel.stage.outline',
      prepare: 'panel.stage.prepare',
      writing: 'panel.stage.writing',
      done: 'panel.stage.done',
    }
    const PANEL_STEP_KEYS = ['panel.step.setup', 'panel.step.outline', 'panel.step.writing', 'panel.step.done']
    /** The four premise cards worth checking first. */
    const PREMISE_CORE = ['core_hook', 'central_dramatic_question', 'protagonist_desire', 'antagonistic_force']
    /** All nine premise cards, in a reading order for the checklist. */
    const PREMISE_ORDER = [
      'genre_contract', 'core_hook', 'golden_finger', 'protagonist_desire', 'antagonistic_force',
      'central_dramatic_question', 'world_rules', 'narrator_voice', 'blank_declaration',
    ]

    /** Which board the book is on. `prepare` is outline-ready but text-less. */
    function panelStage(snapshot) {
      const journey = snapshot?.journey
      if (!journey) return 'setup'
      if (journey.stage === 'setup' || journey.stage === 'outline' || journey.stage === 'done') return journey.stage
      if ((snapshot?.status?.writtenChapters ?? 0) === 0) return 'prepare'
      return 'writing'
    }

    /** Localized copy with a Chinese fallback for keys a build may not have. */
    function panelCopy(t, key, fallback) {
      const value = t(key)
      return value === key ? fallback : value
    }

    /** Display name for one premise card. */
    function premiseCardLabel(t, id) {
      return panelCopy(t, `premise.card.${id}`, CARD_LABELS[id] ?? id)
    }

    /** One field's text from one premise card. */
    function premiseField(cards, cardId, fieldKey) {
      const card = (Array.isArray(cards) ? cards : []).find((row) => row?.card === cardId)
      const field = (Array.isArray(card?.fields) ? card.fields : []).find((row) => row?.key === fieldKey)
      return String(field?.value ?? '').trim()
    }

    /** The first non-empty value of one premise card. */
    function premiseCardValue(cards, cardId) {
      const card = (Array.isArray(cards) ? cards : []).find((row) => row?.card === cardId)
      const field = (Array.isArray(card?.fields) ? card.fields : []).find((row) => String(row?.value ?? '').trim().length > 0)
      return field ? String(field.value).trim() : ''
    }

    /** Whether a premise card has any content. */
    function premiseCardFilled(cards, cardId) {
      return premiseCardValue(cards, cardId).length > 0
    }

    /** A compact signature of the snapshot, for fallback change detection. */
    function panelSnapshotSignature(snapshot) {
      return JSON.stringify({
        stamp: snapshot?.stamp ?? '',
        updatedAt: snapshot?.book?.updatedAt ?? 0,
        status: snapshot?.status ?? null,
        chapters: (snapshot?.chapters ?? []).map((row) => [row.chapter, row.mtime, row.words, row.hasText, row.hasOutline, row.review?.verdict ?? '']),
        premise: snapshot?.premise?.cards ?? null,
        outline: snapshot?.outline
          ? [snapshot.outline.title, snapshot.outline.synopsis, snapshot.outline.storylines?.length ?? 0,
            snapshot.outline.raw?.volumes?.length ?? 0, snapshot.outline.raw?.volume_plan?.length ?? 0,
            snapshot.outline.mysteries?.length ?? 0, snapshot.outline.foreshadowing?.length ?? 0]
          : null,
        characters: (snapshot?.characters ?? []).map((row) => [row.name, row.identity?.profileStage ?? '']),
        world: (snapshot?.settings?.world ?? []).map((row) => row.name),
        reviews: (snapshot?.reviews ?? []).map((row) => [row.chapter, row.verdict]),
      })
    }

    /** A calm HH:MM label for the live sync line. */
    function panelClock(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    /** One section in the panel's scrolling board. */
    function P2Sec(props) {
      return e('section', { className: 'nw-section' },
        e('div', { className: 'nw-sec-head' },
          e('h2', null, props.title),
          props.extra ?? null,
        ),
        props.children,
      )
    }

    /** Small "open in the full workbench" link. */
    function P2Link({ label, onClick }) {
      return e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick },
        e('span', null, label), icon('chevronRight', 13),
      )
    }

    /** Four compact book facts. */
    function P2Stats({ rows }) {
      return e('div', { className: 'nw-stats3 nw-p2-stats' }, rows.map((row) => e('button', {
        key: row.key,
        type: 'button',
        className: 'nw-bigstat',
        onClick: row.onClick,
        disabled: typeof row.onClick !== 'function',
        title: row.title ?? row.label,
      },
        e('b', null, String(row.value)),
        e('span', null, row.label),
      )))
    }

    /** The four journey steps, with the current one highlighted. */
    function P2Steps({ t, index }) {
      return e('div', { className: 'nw-jsteps nw-p2-steps', 'aria-label': t('journey.next') },
        PANEL_STEP_KEYS.map((key, step) => e('div', {
          key,
          className: `nw-jstep nw-p2-step ${step < index ? 'is-done' : step === index ? 'is-active' : ''}`,
        },
          e('i', { className: 'nw-jstep-dot' }),
          e('span', { className: 'nw-p2-step-label' }, t(key)),
          step < PANEL_STEP_KEYS.length - 1 ? e('i', { className: 'nw-jstep-line' }) : null,
        )),
      )
    }

    /** A checked/unchecked row used by the setup, prepare and done boards. */
    function P2CheckRow({ done, label, detail, onClick, content, tone, static: isStatic }) {
      const toneClass = tone ?? (done ? 'is-done' : 'is-idle')
      const Tag = isStatic ? 'div' : 'button'
      return e(Tag, {
        type: isStatic ? undefined : 'button',
        className: `nw-check-row nw-p2-checkrow ${toneClass} ${content ? 'is-content' : ''} ${isStatic ? 'is-static' : ''}`,
        onClick: isStatic ? undefined : onClick,
      },
        e('i', { className: `nw-dot ${toneClass}` }),
        e('b', { className: 'nw-p2-checkrow-label' }, label),
        detail ? e('span', { className: 'nw-p2-checkrow-detail' }, detail) : null,
      )
    }

    /** One chapter row in the recent list. */
    function P2ChapterRow({ t, row, active, onClick }) {
      const tone = row.hasText ? (row.review?.verdict === 'fail' ? 'is-warn' : 'is-done') : row.hasOutline ? 'is-plan' : 'is-idle'
      return e('button', {
        type: 'button',
        className: `nw-rrow nw-p2-chrow ${active ? 'is-active' : ''}`,
        onClick,
        title: row.title,
      },
        e('span', { className: 'nw-rrow-no' }, fill(t('chapter'), { no: row.chapter })),
        e('span', { className: 'nw-rrow-title' }, row.title || ''),
        e('span', { className: 'nw-rrow-words' }, row.hasText
          ? fill(t('chapter.words'), { n: (row.words ?? 0).toLocaleString() })
          : row.hasOutline ? t('panel.hasOutline') : ''),
        e('i', { className: `nw-dot ${tone}` }),
      )
    }

    /** Header: identity, stage, progress, sync state and tools. */
    function P2Header(props) {
      const t = props.t
      return e('header', { className: 'nw-p2-head' },
        e('div', { className: 'nw-p2-head-inner' },
        props.book ? e('div', { className: 'nw-ov-cover nw-p2-cover' }, e(CoverArt, { book: props.book })) : null,
        e('div', { className: 'nw-ov-main nw-p2-id' },
          e('div', { className: 'nw-p2-titlerow' },
            e('h1', { className: 'nw-ov-title nw-p2-title', title: props.book?.title ?? '' }, props.book?.title ?? t('panel.tabTitle')),
            props.stageLabel ? e('span', {
              className: `nw-tag ${props.stage === 'writing' || props.stage === 'done' || props.stage === 'prepare' ? 'is-success' : 'is-plain'}`,
            }, props.stageLabel) : null,
          ),
          e('div', { className: 'nw-ov-meta nw-p2-meta' },
            props.meta.map((part, index) => e('span', { key: index }, part)),
            props.busy
              ? e('span', { className: 'nw-p2-live is-busy' }, e('i', { className: 'nw-p2-pulse' }), props.waiting ? t('panel.waitingShort') : t('panel.busyShort'))
              : props.flash
                ? e('span', { className: 'nw-p2-live is-fresh' }, e('i', { className: 'nw-p2-dot is-done' }), t('panel.updatedFlash'))
                : props.updatedAt
                  ? e('span', { className: 'nw-p2-synced' }, fill(t('panel.synced'), { time: panelClock(props.updatedAt) }))
                  : null,
          ),
          e(P2Steps, { t, index: props.stepIndex }),
        ),
        e('div', { className: 'nw-p2-tools' },
          e(IconButton, {
            glyph: 'refresh',
            label: t('panel.refreshHint'),
            className: props.refreshing ? 'is-spinning' : '',
            disabled: props.refreshing,
            onClick: props.onRefresh,
          }),
          e(IconButton, { glyph: 'external', label: t('panel.openBoard'), tipAlign: 'end', onClick: props.onOpenFull }),
        ),
        ),
      )
    }

    /** The one next step, always visible at the top of the board. */
    function P2Next(props) {
      const t = props.t
      const action = props.action
      if (!action) return null
      const isExport = action.kind === 'export'
      const disabled = props.busy || props.waiting
      const secondary = props.secondary
      return e('section', { className: 'nw-journey nw-p2-next' },
        e('div', { className: 'nw-journey-kicker' }, `${t('panel.nextStep')} · ${props.stageLabel}`),
        e('h2', { className: 'nw-journey-title' }, action.title),
        e('p', { className: 'nw-journey-desc' }, action.description),
        e('div', { className: 'nw-journey-actions' },
          e('button', {
            type: 'button',
            className: 'nw-btn is-primary is-sm',
            disabled,
            onClick: isExport ? props.onExport : () => props.onPrompt(action.prompt ?? t('panel.askNext')),
          }, icon(isExport ? 'external' : 'spark', 14), props.waiting ? t('panel.waitingShort') : action.label),
          secondary ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: secondary.onClick }, secondary.label) : null,
        ),
        props.waiting
          ? e('div', { className: 'nw-journey-hints' }, e('div', { className: 'nw-journey-hint is-waiting' }, t('panel.waiting')))
          : props.busy
            ? e('div', { className: 'nw-journey-hints' }, e('div', { className: 'nw-journey-hint' }, e('i', { className: 'nw-p2-pulse' }), t('panel.busy')))
            : null,
      )
    }

    /** The board for a book that has not finished its premise cards. */
    function panelSetup(app) {
      const t = app.t
      const cards = app.snapshot?.premise?.cards ?? []
      const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id))
      const missing = PREMISE_ORDER.filter((id) => !premiseCardFilled(cards, id))
      const genre = premiseField(cards, 'genre_contract', 'subgenre')
      const tone = premiseField(cards, 'genre_contract', 'emotional_tone')
      const core = PREMISE_CORE.map((id) => ({
        id,
        label: premiseCardLabel(t, id),
        value: premiseCardValue(cards, id),
        done: filled.includes(id),
      }))
      const main = [
        e(P2Sec, {
          key: 'premise',
          title: t('panel.setup.title'),
          extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'premise' }) }),
        },
          e('div', { className: 'nw-progress' },
            e('div', { className: 'nw-bar' }, e('i', { style: { width: `${Math.round((filled.length / PREMISE_ORDER.length) * 100)}%` } })),
            e('div', { className: 'nw-progress-labels' },
              e('span', null, fill(t('panel.setup.progress'), { done: filled.length, total: PREMISE_ORDER.length })),
              e('span', null, t('panel.setup.phase')),
            ),
          ),
          e('div', { className: 'nw-p2-crows' }, core.map((row) => e(P2CheckRow, {
            key: row.id,
            done: row.done,
            content: true,
            label: row.label,
            detail: row.done ? row.value : t('panel.setup.notSet'),
            onClick: () => app.openFull({ kind: 'premise' }),
          }))),
          missing.length > 0
            ? e('p', { className: 'nw-p2-hint' }, fill(t('panel.setup.missing'), {
              list: missing.slice(0, 3).map((id) => premiseCardLabel(t, id)).join('、') + (missing.length > 3 ? ` ${fill(t('panel.more'), { n: missing.length - 3 })}` : ''),
            }))
            : e('p', { className: 'nw-p2-hint is-good' }, t('panel.setup.ready')),
          e('p', { className: 'nw-p2-note' }, t('panel.setup.hint')),
        ),
      ]
      const aside = []
      if (genre || tone) {
        aside.push(e(P2Sec, { key: 'contract', title: t('panel.setup.contract') },
          genre ? e('p', { className: 'nw-p2-quote' }, genre) : null,
          tone ? e('p', { className: 'nw-p2-note' }, tone) : null,
        ))
      }
      aside.push(e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })))
      return { main, aside }
    }

    /** The board for a book with a premise but no outline yet. */
    function panelOutline(app) {
      const t = app.t
      const outline = app.snapshot?.outline
      const volumes = app.snapshot?.volumes ?? []
      const storylines = outline?.storylines ?? []
      const mysteries = outline?.mysteries ?? []
      const foreshadowing = outline?.foreshadowing ?? []
      const cards = app.snapshot?.premise?.cards ?? []
      const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id))
      const main = [
        e(P2Sec, {
          key: 'outline',
          title: t('panel.outline.title'),
          extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'outline' }) }),
        },
          e('p', { className: `nw-p2-synopsis ${outline?.synopsis ? '' : 'is-empty'}` }, outline?.synopsis || t('panel.outline.noSynopsis')),
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('panel.outline.volumes')} ${volumes.length}`),
            e('span', null, `${t('panel.outline.storylines')} ${storylines.length}`),
            e('span', null, `${t('panel.outline.mysteries')} ${mysteries.length}`),
            e('span', null, `${t('panel.outline.foreshadowing')} ${foreshadowing.length}`),
          ),
          volumes.length > 0
            ? volumes.slice(0, 4).map((volume) => e('div', { key: volume.volumeNo, className: 'nw-outline-volume' },
              e('h3', null, volume.title || fill(t('workbench.volume'), { no: volume.volumeNo })),
              volume.chapterStart
                ? e('div', { className: 'nw-muted' }, `${volume.chapterStart}–${volume.chapterEnd ?? '?'}`)
                : null,
              volume.synopsis ? e('p', { className: 'nw-muted' }, volume.synopsis) : null,
            ))
            : e('p', { className: 'nw-muted' }, t('panel.outline.noVolume')),
          filled.length < 5
            ? e('p', { className: 'nw-p2-hint' }, fill(t('panel.outline.premisePartial'), { done: filled.length, total: PREMISE_ORDER.length }))
            : null,
        ),
      ]
      const chapterRows = [1, 2, 3].map((chapter) => {
        const data = app.snapshot?.chapterOutlines?.[String(chapter)]?.data
        return e(P2CheckRow, {
          key: chapter,
          done: Boolean(data),
          label: fill(t('panel.outline.chapterN'), { no: chapter }),
          detail: data ? (data.title || t('panel.ready')) : t('panel.missing'),
          onClick: () => app.openFull({ kind: 'chapter', chapter, view: 'outline' }),
        })
      })
      const aside = [
        e(P2Sec, {
          key: 'chapters',
          title: t('panel.outline.chapterOutlines'),
          extra: e(P2Link, { label: t('panel.outline.allChapters'), onClick: () => app.openFull({ kind: 'manuscript' }) }),
        },
          e('div', { className: 'nw-p2-crows' }, chapterRows),
          e('p', { className: 'nw-p2-note' }, fill(t('panel.outline.chapterCount'), { n: Object.keys(app.snapshot?.chapterOutlines ?? {}).length })),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The board for an outline-ready book that has not written chapter one. */
    function panelPrepare(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const characters = snapshot?.characters ?? []
      const world = snapshot?.settings?.world ?? []
      const firstOutline = snapshot?.chapterOutlines?.['1']?.data ?? null
      const beats = Array.isArray(firstOutline?.beats) ? firstOutline.beats : []
      const checks = [
        { key: 'outline', done: Boolean(snapshot?.outline), label: t('panel.prepare.outline'), detail: snapshot?.outline ? t('panel.ready') : t('panel.missing') },
        { key: 'chapter', done: Boolean(firstOutline), label: fill(t('panel.prepare.chapterOutline'), { no: 1 }), detail: firstOutline ? t('panel.ready') : t('panel.missing') },
        { key: 'cast', done: characters.length > 0, label: fill(t('panel.prepare.castCount'), { n: characters.length }), detail: characters.length > 0 ? t('panel.ready') : t('panel.prepare.missing') },
        { key: 'world', done: world.length > 0, label: fill(t('panel.prepare.worldCount'), { n: world.length }), detail: world.length > 0 ? t('panel.ready') : t('panel.prepare.missing') },
      ]
      const writingRow = app.writingNow ? (chapters.find((row) => row.chapter === app.writingNow.chapter) ?? null) : null
      const main = [
        app.writingNow ? e(P2WritingNow, { key: 'writing', t, app, chapter: writingRow }) : null,
        e(P2Sec, { key: 'prepare', title: t('panel.prepare.title') },
          e('div', { className: 'nw-p2-crows' }, checks.map((row) => e(P2CheckRow, { ...row }))),
          firstOutline
            ? e('div', { className: 'nw-reading nw-p2-reading nw-p2-firstchapter' },
              e('div', { className: 'nw-reading-kicker' }, t('panel.prepare.firstChapter')),
              e('h3', { className: 'nw-reading-title' }, firstOutline.title || fill(t('chapter'), { no: 1 })),
              beats.length > 0
                ? e('ol', { className: 'nw-reading-list' }, beats.slice(0, 3).map((beat, index) => e('li', { key: index }, beat)))
                : e('p', { className: 'nw-muted' }, firstOutline.what_changes || firstOutline.opening || ''),
              e('div', { className: 'nw-p2-inline-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: 1, view: 'outline' }) }, t('panel.prepare.openOutline')),
                e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.openReader(1) }, t('panel.prepare.read')),
              ),
            )
            : e('p', { className: 'nw-p2-hint' }, t('panel.prepare.noChapterOutline')),
          e('p', { className: 'nw-p2-note' }, t('panel.prepare.hint')),
        ),
      ]
      const aside = [
        e(P2Sec, { key: 'cast', title: t('panel.prepare.cast'), extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'settings' }) }) },
          characters.length > 0
            ? e('div', { className: 'nw-tags' }, characters.slice(0, 8).map((character) => e('button', {
              key: character.name,
              type: 'button',
              className: 'nw-tag is-link',
              onClick: () => app.openFull({ kind: 'character', name: character.name }),
            }, character.name, character.identity?.profileStage ? e('em', null, STAGE_LABELS[character.identity.profileStage] ?? '') : null)))
            : e('div', { className: 'nw-p2-empty-inline' },
              e('span', { className: 'nw-muted' }, t('panel.prepare.castEmpty')),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(t('panel.promptCast')) }, t('panel.prepare.addCast')),
            ),
        ),
        e(P2Sec, { key: 'world', title: t('panel.prepare.world'), extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'settings' }) }) },
          world.length > 0
            ? e('div', { className: 'nw-tags' }, world.slice(0, 8).map((entry) => e('button', {
              key: entry.name,
              type: 'button',
              className: 'nw-tag is-link',
              onClick: () => app.openFull({ kind: 'settings' }),
            }, entry.name)))
            : e('div', { className: 'nw-p2-empty-inline' },
              e('span', { className: 'nw-muted' }, t('panel.prepare.worldEmpty')),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(t('panel.promptWorld')) }, t('panel.prepare.addWorld')),
            ),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The issues worth surfacing once the book is being written. */
    function writingIssues(app) {
      const t = app.t
      const snapshot = app.snapshot
      const status = snapshot?.status ?? {}
      const issues = []
      const missing = status.memory?.missing ?? []
      const stale = status.memory?.stale ?? []
      const failed = (snapshot?.reviews ?? []).filter((review) => review.verdict === 'fail')
      const unresolved = Object.values(snapshot?.foreshadowingStates ?? {}).filter((state) => state?.last_action !== 'reveal').length
      const written = new Set((snapshot?.chapters ?? []).filter((row) => row.hasText).map((row) => row.chapter))
      const last = (snapshot?.chapters ?? []).reduce((max, row) => (row.hasText ? Math.max(max, row.chapter) : max), 0)
      const gaps = []
      for (let chapter = 1; chapter <= last; chapter += 1) if (!written.has(chapter)) gaps.push(chapter)
      if (missing.length > 0) issues.push({ key: 'memory-missing', label: fill(t('panel.writing.memoryMissing'), { n: missing.length }), tone: 'is-warn', target: { kind: 'tracking', tab: 'progress' } })
      if (stale.length > 0) issues.push({ key: 'memory-stale', label: fill(t('panel.writing.memoryStale'), { n: stale.length }), tone: 'is-warn', target: { kind: 'tracking', tab: 'summaries' } })
      if (failed.length > 0) issues.push({ key: 'review', label: fill(t('panel.writing.reviewFail'), { n: failed.length }), tone: 'is-warn', target: { kind: 'reviews' } })
      if (gaps.length > 0) issues.push({ key: 'gap', label: fill(t('panel.writing.gaps'), { n: gaps.length }), tone: 'is-warn', target: { kind: 'manuscript' } })
      if (unresolved > 0) issues.push({ key: 'foreshadowing', label: fill(t('panel.writing.foreshadowing'), { n: unresolved }), tone: 'is-info', target: { kind: 'tracking', tab: 'foreshadowing' } })
      return issues.slice(0, 4)
    }

    /** The board while chapters are being written. */
    function panelWriting(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const status = snapshot?.status ?? {}
      const action = snapshot?.journey?.action ?? null
      const nextChapter = action?.chapter ?? status.nextChapter ?? 1
      const nextRow = chapters.find((row) => row.chapter === nextChapter) ?? null
      // Recent chapters means "the writing frontier": next, last written, then
      // neighbors. A 200-outline book must not bury chapter one under chapter ten.
      const recent = []
      const addRecent = (number) => {
        if (recent.length >= 6 || !Number.isInteger(number) || number <= 0) return
        const row = chapters.find((item) => item.chapter === number)
        if (row && !recent.some((item) => item.chapter === row.chapter)) recent.push(row)
      }
      addRecent(nextChapter)
      addRecent(status.lastWrittenChapter)
      for (let distance = 1; recent.length < 6 && distance <= 30; distance += 1) {
        addRecent(nextChapter + distance)
        addRecent(nextChapter - distance)
      }
      for (const row of chapters.slice().sort((left, right) => left.chapter - right.chapter)) addRecent(row.chapter)
      recent.sort((left, right) => left.chapter - right.chapter)
      const memories = (snapshot?.memoryRecords ?? []).slice().sort((left, right) => right.chapter - left.chapter)
      const latestMemory = memories[0] ?? null
      const issues = writingIssues(app)
      const issueBody = issues.length > 0
        ? e('div', { className: 'nw-p2-crows' }, issues.map((issue) => e(P2CheckRow, {
          key: issue.key,
          tone: issue.tone,
          label: issue.label,
          onClick: () => app.openFull(issue.target),
        })))
        : e('p', { className: 'nw-p2-hint is-good' }, t('panel.writing.noAttention'))
      const target = snapshot?.book?.wordsPerChapter
      const nextTags = []
      if (nextRow?.hasText) nextTags.push(`${(nextRow.words ?? 0).toLocaleString()}${target ? ` / ${target.toLocaleString()}` : ''} ${t('workbench.wordUnit')}`)
      nextTags.push(nextRow?.hasText ? t('panel.writing.hasText') : nextRow?.hasOutline ? t('panel.hasOutline') : t('panel.missing'))
      if (nextRow?.hasMemory) nextTags.push(nextRow.memoryFresh === false ? t('memory.outdated') : t('memory.fresh'))
      const writingRow = app.writingNow ? (chapters.find((row) => row.chapter === app.writingNow.chapter) ?? nextRow) : null
      const main = [
        app.writingNow ? e(P2WritingNow, { key: 'writing', t, app, chapter: writingRow }) : null,
        e(P2Sec, {
          key: 'focus',
          title: t('panel.writing.title'),
        },
          e('button', { type: 'button', className: 'nw-reading nw-p2-reading nw-p2-focus', onClick: () => app.openReader(nextChapter) },
            e('div', { className: 'nw-reading-kicker' }, `${t('panel.writing.nextChapter')} · ${nextChapter}`),
            e('h3', { className: 'nw-reading-title' }, nextRow?.title || fill(t('chapter'), { no: nextChapter })),
            e('div', { className: 'nw-tags' }, nextTags.map((tag, index) => e('span', { key: index, className: 'nw-tag is-plain nw-p2-meta-tag' }, tag))),
          ),
          latestMemory
            ? e('div', { className: 'nw-check nw-p2-memo' },
              e('div', { className: 'nw-check-title nw-p2-memo-head' },
                e('span', null, fill(t('panel.writing.lastSummary'), { no: latestMemory.chapter })),
                e('span', { className: `nw-tag ${latestMemory.fresh === false ? 'is-warn' : 'is-success'}` }, latestMemory.fresh === false ? t('memory.outdated') : t('memory.fresh')),
              ),
              e('p', { className: 'nw-track-sum-body' }, latestMemory.summary || '—'),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: latestMemory.chapter, view: 'memory' }) }, t('panel.writing.openMemory')),
            )
            : e('p', { className: 'nw-muted' }, t('panel.writing.noSummary')),
        ),
        e('div', { key: 'issues', className: 'nw-p2-only-narrow' },
          e(P2Sec, { title: t('panel.writing.attention') }, issueBody),
        ),
        e(P2Sec, { key: 'recent', title: t('panel.recent'), extra: e(P2Link, { label: t('panel.writing.viewAll'), onClick: () => app.openFull({ kind: 'manuscript' }) }) },
          recent.length > 0
            ? e('div', { className: 'nw-recent' }, recent.map((row) => e(P2ChapterRow, {
              key: row.chapter,
              t,
              row,
              active: app.selected === row.chapter,
              onClick: () => app.openReader(row.chapter),
            })))
            : e('p', { className: 'nw-p2-note' }, t('panel.noChapters')),
        ),
      ]
      const aside = [
        e('div', { key: 'issues-wide', className: 'nw-p2-only-wide' },
          e(P2Sec, { title: t('panel.writing.attention') }, issueBody),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The board once the planned book is complete. */
    function panelDone(app) {
      const t = app.t
      const snapshot = app.snapshot
      const journey = snapshot?.journey
      const progress = journey?.progress ?? {}
      const checklist = (journey?.checklist ?? []).filter((item) => item.level !== 'good')
      const reviews = snapshot?.reviews ?? []
      const status = snapshot?.status ?? {}
      const memory = snapshot?.book?.memory ?? {}
      const main = [
        e(P2Sec, { key: 'done', title: t('panel.done.title') },
          e(P2Stats, { rows: panelStats(app) }),
          e('div', { className: 'nw-journey-actions' },
            e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.openFull({ kind: 'export' }) }, icon('external', 14), t('panel.done.export')),
          ),
          e('p', { className: 'nw-muted' }, t('panel.done.exportHint')),
        ),
        e(P2Sec, { key: 'check', title: t('panel.done.check') },
          checklist.length > 0
            ? e('div', { className: 'nw-p2-crows' }, checklist.slice(0, 5).map((item) => e(P2CheckRow, {
              key: item.id,
              tone: `is-${item.level}`,
              label: item.label,
              static: true,
            })))
            : e('p', { className: 'nw-p2-hint is-good' }, t('panel.done.clean')),
        ),
      ]
      const aside = [
        e(P2Sec, { key: 'reviews', title: t('panel.done.reviews') },
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('reviews.pass')} ${reviews.filter((review) => review.verdict !== 'fail').length}`),
            e('span', null, `${t('reviews.fail')} ${reviews.filter((review) => review.verdict === 'fail').length}`),
          ),
          e('p', { className: 'nw-p2-note' }, t('panel.done.reviewHint')),
        ),
        e(P2Sec, { key: 'memory', title: t('panel.done.memory') },
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('memory.records')} ${memory.records ?? 0}`),
            e('span', null, `${t('memory.stale')} ${status.memory?.stale?.length ?? 0}`),
          ),
        ),
      ]
      return { main, aside }
    }

    /** Four stage-aware book facts. */
    function panelStats(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const characters = snapshot?.characters ?? []
      const world = snapshot?.settings?.world ?? []
      const memory = snapshot?.book?.memory ?? {}
      const foreshadowing = Object.values(snapshot?.foreshadowingStates ?? {}).filter((state) => state?.last_action !== 'reveal').length
      if (app.stage === 'setup' || app.stage === 'outline') {
        const cards = snapshot?.premise?.cards ?? []
        const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id)).length
        return [
          { key: 'premise', value: `${filled}/${PREMISE_ORDER.length}`, label: t('panel.stat.premise'), onClick: () => app.openFull({ kind: 'premise' }) },
          { key: 'cast', value: characters.length, label: t('panel.stat.cast'), onClick: () => app.openFull({ kind: 'settings' }) },
          { key: 'world', value: world.length, label: t('panel.stat.world'), onClick: () => app.openFull({ kind: 'settings' }) },
          { key: 'chapters', value: chapters.length, label: t('panel.stat.chapterOutlines'), onClick: () => app.openFull({ kind: 'manuscript' }) },
        ]
      }
      if (app.stage === 'done') {
        return [
          { key: 'chapters', value: chapters.filter((row) => row.hasText).length, label: t('panel.stat.written'), onClick: () => app.openFull({ kind: 'manuscript' }) },
          { key: 'reviews', value: snapshot?.reviews?.length ?? 0, label: t('panel.stat.reviews'), onClick: () => app.openFull({ kind: 'reviews' }) },
          { key: 'memory', value: memory.records ?? 0, label: t('panel.stat.memory'), onClick: () => app.openFull({ kind: 'memory' }) },
          { key: 'foreshadowing', value: foreshadowing, label: t('panel.stat.foreshadowing'), onClick: () => app.openFull({ kind: 'tracking', tab: 'foreshadowing' }) },
        ]
      }
      return [
        { key: 'cast', value: characters.length, label: t('panel.stat.cast'), onClick: () => app.openFull({ kind: 'settings' }) },
        { key: 'world', value: world.length, label: t('panel.stat.world'), onClick: () => app.openFull({ kind: 'settings' }) },
        { key: 'memory', value: memory.records ?? 0, label: t('panel.stat.memory'), onClick: () => app.openFull({ kind: 'memory' }) },
        { key: 'foreshadowing', value: foreshadowing, label: t('panel.stat.foreshadowing'), onClick: () => app.openFull({ kind: 'tracking', tab: 'foreshadowing' }) },
      ]
    }

    /** The chapter brief shown when a planned chapter has no prose yet. */
    function P2ChapterBrief({ app, chapter, outline }) {
      const t = app.t
      const beats = Array.isArray(outline?.beats) ? outline.beats : []
      const cast = Array.isArray(outline?.characters) ? outline.characters.map((person) => person?.name).filter(Boolean) : []
      return e('div', { className: 'nw-reading nw-p2-reading' },
        e('div', { className: 'nw-reading-kicker' }, outline ? t('panel.reader.outlineGist') : t('panel.reader.noOutline')),
        e('h2', { className: 'nw-reading-title' }, outline?.title || chapter?.title || fill(t('chapter'), { no: app.selected })),
        e('p', { className: 'nw-muted' }, outline ? t('panel.reader.briefHint') : t('panel.reader.noOutlineHint')),
        beats.length > 0
          ? e('section', { className: 'nw-section' },
            e('h2', null, t('panel.reader.beats')),
            e('ol', { className: 'nw-reading-list' }, beats.slice(0, 4).map((beat, index) => e('li', { key: index }, beat))),
          )
          : null,
        e(Field, { label: t('chapter.whatChanges'), value: outline?.what_changes }),
        e(Field, { label: t('chapter.want'), value: outline?.protagonist_wants }),
        e(Field, { label: t('chapter.obstacle'), value: outline?.obstacle }),
        e(Field, { label: t('chapter.stakes'), value: outline?.at_stake }),
        e(Field, { label: t('chapter.readerGets'), value: outline?.reader_gets }),
        e(Field, { label: t('chapter.endingNote'), value: outline?.chapter_end || outline?.ending_note }),
        cast.length > 0
          ? e('div', { className: 'nw-tags', style: { marginTop: 12 } }, cast.map((name) => e('span', { key: name, className: 'nw-tag' }, name)))
          : null,
        e('div', { className: 'nw-p2-inline-actions' },
          e('button', { type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.busy, onClick: () => app.sendPrompt(fill(t('panel.promptWriteChapter'), { no: app.selected })) }, icon('spark', 14), t('panel.reader.writeThis')),
          outline
            ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.sendPrompt(fill(t('panel.askChapter'), { no: app.selected })) }, t('panel.promptChapter'))
            : e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.sendPrompt(fill(t('panel.promptPlanChapter'), { no: app.selected })) }, t('panel.reader.planThis')),
          e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: app.selected, view: 'outline' }) }, t('panel.reader.openOutline')),
        ),
      )
    }

    /** The workbench writing wait, reused in the sidebar at panel scale. */
    function P2WritingNow({ t, app, chapter }) {
      if (!app.writingNow || !chapter) return null
      const writing = app.writingNow
      return e('section', { className: 'nw-p2-writing' },
        e(WritingScene, {
          app: {
            t,
            writing,
            runningNow: true,
            trackedWaiting: app.waiting === true,
            trackedSession: writing.sessionId ?? app.sessionId,
            onOpenSession: () => {},
            onWrite: () => {},
            onChapterView: () => {},
          },
          chapter,
          compact: true,
        }),
      )
    }

    /** Full-width reader for one chapter, including outline briefs for unwritten ones. */
    function P2Reader(props) {
      const t = props.t
      const app = props.app
      const chapter = app.chapter
      const outline = app.chapterOutline
      if (!chapter) {
        return e('div', { className: 'nw-p2-reader' },
          e('div', { className: 'nw-p2-readerbar' },
            e(IconButton, { glyph: 'chevronLeft', size: 16, label: t('panel.reader.back'), tipAlign: 'start', onClick: app.onBack }),
            e('div', { className: 'nw-p2-readertitle' }, e('div', { className: 'nw-p2-reader-name' }, t('panel.noChapter'))),
          ),
          e('div', { className: 'nw-p2-readerscroll' }, e('p', { className: 'nw-p2-note' }, t('panel.reader.empty'))),
        )
      }
      const target = app.book?.wordsPerChapter
      const review = chapter.review
      const meta = []
      if (chapter.hasText) meta.push(fill(t('chapter.words'), { n: (chapter.words ?? 0).toLocaleString() }))
      if (target) meta.push(fill(t('chapter.target'), { n: target.toLocaleString() }))
      if (chapter.hasOutline) meta.push(t('panel.hasOutline'))
      if (review) meta.push(review.verdict === 'fail' ? fill(t('chapter.reviewFail'), { n: review.blockers || review.issues }) : t('chapter.reviewPass'))
      if (chapter.hasMemory) meta.push(chapter.memoryFresh === false ? t('memory.outdated') : t('memory.fresh'))
      const paragraphs = chapter.hasText && app.text !== null ? splitManuscript(app.text).paragraphs : []
      const previous = app.neighbors?.previous ?? null
      const next = app.neighbors?.next ?? null
      return e('div', { className: 'nw-p2-reader' },
        e('div', { className: 'nw-p2-readerbar' },
          e(IconButton, { glyph: 'chevronLeft', size: 16, label: t('panel.reader.back'), tipAlign: 'start', onClick: app.onBack }),
          e('div', { className: 'nw-p2-readertitle' },
            e('div', { className: 'nw-p2-reader-no' }, fill(t('chapter'), { no: chapter.chapter })),
            e('div', { className: 'nw-p2-reader-name', title: chapter.title }, chapter.title || ''),
          ),
          e('div', { className: 'nw-p2-readertools' },
            e(IconButton, { glyph: 'chevronLeft', label: t('panel.reader.prev'), disabled: !previous, onClick: previous ? () => app.openReader(previous) : undefined }),
            e(IconButton, { glyph: 'chevronRight', label: t('panel.reader.next'), disabled: !next, onClick: next ? () => app.openReader(next) : undefined }),
            e(IconButton, { glyph: 'external', label: t('panel.openBoard'), tipAlign: 'end', onClick: () => app.openFull({ kind: 'chapter', chapter: chapter.chapter, view: chapter.hasText ? 'text' : 'outline' }) }),
          ),
        ),
        e('div', { className: 'nw-p2-readerscroll' },
          e('div', { className: 'nw-tags nw-p2-readermeta' }, meta.map((item, index) => e('span', { key: index, className: 'nw-tag is-plain nw-p2-meta-tag' }, item))),
          e(P2WritingNow, { t, app, chapter }),
          chapter.hasText
            ? app.textLoading || (app.text === null && !app.textError)
              ? e('div', { className: 'nw-p2-readerstate' }, e('span', { className: 'nw-spinner' }), t('panel.reader.loading'))
              : app.textError
                ? e('div', { className: 'nw-p2-readerstate is-error' },
                  e('span', null, app.textError),
                  e('button', { type: 'button', className: 'nw-p2-inline-link', onClick: app.onReloadText }, t('panel.reader.retry')),
                )
                : e('article', { className: 'nw-reading nw-p2-reading' },
                  e('h2', { className: 'nw-reading-title' }, chapter.title || fill(t('chapter'), { no: chapter.chapter })),
                  paragraphs.length > 0
                    ? paragraphs.map((paragraph, index) => e('p', { key: index }, paragraph))
                    : e('p', { className: 'nw-muted' }, t('panel.reader.emptyFile')),
                  e('div', { className: 'nw-p2-inline-actions' },
                    e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', disabled: app.busy, onClick: () => app.sendPrompt(fill(t('panel.promptRewrite'), { no: chapter.chapter })) }, icon('edit', 14), t('panel.reader.rewrite')),
                    e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(fill(t('panel.askChapter'), { no: chapter.chapter })) }, t('panel.promptChapter')),
                  ),
                )
            : e(P2ChapterBrief, { app, chapter, outline }),
        ),
      )
    }

    /** The sticky prompt row under the board. */
    function P2Footer(props) {
      const t = props.t
      const app = props.app
      const prompts = []
      if (app.stage === 'setup') {
        prompts.push({ key: 'setup', label: t('panel.promptContinueSetup'), prompt: t('panel.promptContinueSetupText') })
        prompts.push({ key: 'missing', label: t('panel.askMissingShort'), prompt: t('panel.askMissing') })
      } else if (app.stage === 'outline') {
        prompts.push({ key: 'outline', label: t('panel.promptContinueOutline'), prompt: t('panel.promptContinueOutlineText') })
        prompts.push({ key: 'missing', label: t('panel.askMissingShort'), prompt: t('panel.askMissing') })
      } else if (app.stage === 'prepare') {
        prompts.push({ key: 'prepare', label: t('panel.promptContinuePrepare'), prompt: t('panel.promptContinuePrepareText') })
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
      } else if (app.stage === 'writing') {
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
        prompts.push({ key: 'chapter', label: t('panel.promptChapter'), prompt: fill(t('panel.askChapter'), { no: app.selected ?? app.snapshot?.status?.nextChapter ?? 1 }) })
      } else {
        prompts.push({ key: 'done', label: t('panel.promptDone'), prompt: t('panel.promptDoneText') })
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
      }
      return e('div', { className: 'nw-p2-foot' },
        e('div', { className: 'nw-p2-foot-inner' },
          prompts.map((item) => e('button', {
            key: item.key,
            type: 'button',
            className: 'nw-btn is-secondary is-sm',
            disabled: app.busy || app.waiting,
            onClick: () => app.sendPrompt(item.prompt),
          }, item.label)),
        ),
      )
    }

    /**
     * The compact novel panel in the right sidebar.
     * @param {object} props - slot props plus t/openFull/inputActions.
     * @returns {any} the panel.
     */
    function NovelSidebarPanel(props) {
      const t = props.t
      const sessionId = props.sessionId
      const cwd = props.useSessions ? props.useSessions((state) => state.byId[sessionId]?.cwd) : undefined
      const useSessionStatus = props.useSessionStatus ?? (() => undefined)
      const tracked = useSessionStatus((statuses) => (sessionId ? statuses.get(sessionId) : undefined))
      const useChat = props.useChat ?? (() => 0)
      const runningCalls = useChat((state) => state?.legacy?.runningCalls?.length ?? 0)
      const hasPartial = useChat((state) => (state?.legacy?.partial ? 1 : 0))
      // The last user turn tells us whether this busy turn is a write (the
      // panel otherwise only knows that the Agent is running). The plugin's
      // write prompts all start with 写第 N 章 / 第 N 章已经有正文.
      const lastUserText = useChat((state) => {
        const nodes = Array.isArray(state?.legacy?.nodes) ? state.legacy.nodes : []
        for (let index = nodes.length - 1; index >= 0; index -= 1) {
          const node = nodes[index]
          if (node?.kind !== 'user') continue
          return (Array.isArray(node.content) ? node.content : [])
            .map((block) => (block?.type === 'text' ? String(block.text ?? '') : ''))
            .filter(Boolean)
            .join(' ')
        }
        return ''
      })
      const busy = tracked?.running === true || runningCalls > 0 || hasPartial > 0
      const waiting = tracked?.pendingInteraction !== undefined

      const [books, setBooks] = useState([])
      const [phase, setPhase] = useState('loading')
      const [error, setError] = useState('')
      const [snapshot, setSnapshot] = useState(null)
      const [selected, setSelected] = useState(null)
      const [view, setView] = useState('board')
      const [text, setText] = useState(null)
      const [textError, setTextError] = useState('')
      const [textLoading, setTextLoading] = useState(false)
      const [textReload, setTextReload] = useState(0)
      const [reload, setReload] = useState(0)
      const [refreshing, setRefreshing] = useState(false)
      const [updatedAt, setUpdatedAt] = useState(null)
      const [flash, setFlash] = useState(false)
      const [notice, setNotice] = useState('')
      const [stampMode, setStampMode] = useState('book')
      const [persistedWriting, setPersistedWriting] = useState(null)

      const seqRef = useRef(0)
      const stampRef = useRef('')
      const signatureRef = useRef('')
      const loadedRef = useRef(false)
      const cwdRef = useRef(cwd)
      const flashTimerRef = useRef(null)
      const sawRunningRef = useRef(false)

      const book = books[0] ?? null
      /** Read the workbench's persisted write (chat-started writes have none). */
      useEffect(() => {
        if (!book?.key || !busy) { setPersistedWriting(null); return }
        setPersistedWriting(readWritingState(book.key))
      }, [book?.key, busy])
      const chapters = snapshot?.chapters ?? []
      const chapter = selected === null ? null : chapters.find((row) => row.chapter === selected) ?? null
      const chapterOutline = selected === null ? null : snapshot?.chapterOutlines?.[String(selected)]?.data ?? null
      const neighbors = useMemo(() => {
        const rows = chapters.slice().sort((left, right) => left.chapter - right.chapter)
        const index = rows.findIndex((row) => row.chapter === selected)
        return {
          previous: index > 0 ? rows[index - 1].chapter : null,
          next: index >= 0 && index < rows.length - 1 ? rows[index + 1].chapter : null,
        }
      }, [chapters, selected])

      /** Choose a sensible chapter when the panel opens: what was open, else the next one. */
      const pickChapter = useCallback((body, preferred) => {
        const rows = body?.chapters ?? []
        if (preferred && rows.some((row) => row.chapter === preferred)) return preferred
        const next = body?.status?.nextChapter
        if (rows.some((row) => row.chapter === next)) return next
        const written = rows.filter((row) => row.hasText).slice(-1)[0]
        return written?.chapter ?? rows[0]?.chapter ?? null
      }, [])

      const flashUpdated = useCallback(() => {
        setFlash(true)
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        const timer = setTimeout(() => setFlash(false), 3500)
        if (timer && typeof timer.unref === 'function') timer.unref()
        flashTimerRef.current = timer
      }, [])

      /** Full load: the shelf listing, then the matching book's snapshot. */
      const loadBook = useCallback(async () => {
        const seq = seqRef.current + 1
        seqRef.current = seq
        if (!loadedRef.current) {
          setPhase('loading')
          setError('')
        }
        try {
          const listing = await apiGet('books')
          if (seq !== seqRef.current) return null
          const rows = (Array.isArray(listing.books) ? listing.books : []).map((row) => ({ ...row, key: `${row.root}|${row.relDir}` }))
          const match = pickBookForCwd(rows, cwd)
          if (!match) {
            setBooks([])
            setSnapshot(null)
            setPhase('empty')
            return null
          }
          setBooks([match])
          const body = await apiGet(`book?root=${encodeURIComponent(match.root)}&dir=${encodeURIComponent(match.relDir)}`)
          if (seq !== seqRef.current) return null
          stampRef.current = typeof body.stamp === 'string' ? body.stamp : ''
          setStampMode(stampRef.current ? 'stamp' : 'book')
          signatureRef.current = panelSnapshotSignature(body)
          setSnapshot(body)
          setPhase('ready')
          setUpdatedAt(Date.now())
          if (!loadedRef.current) {
            loadedRef.current = true
            const stored = readPanelView(match.key)
            setView(stored?.view === 'reader' ? 'reader' : 'board')
            setSelected(pickChapter(body, stored?.chapter))
          } else {
            setSelected((current) => (current !== null && (body.chapters ?? []).some((row) => row.chapter === current) ? current : pickChapter(body, current)))
          }
          return body
        } catch (cause) {
          if (seq !== seqRef.current) return null
          setError(cause instanceof Error ? cause.message : String(cause))
          setPhase((current) => (current === 'ready' ? current : 'error'))
          return null
        }
      }, [cwd, pickChapter])

      /** Quiet refresh of the open book, or a manual one with a visible spinner. */
      const refreshSnapshot = useCallback(async (reason = 'manual') => {
        if (!book) return null
        const quiet = reason === 'auto'
        if (!quiet) setRefreshing(true)
        try {
          const body = await apiGet(`book?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
          const signature = panelSnapshotSignature(body)
          const changed = signature !== signatureRef.current
          if (typeof body.stamp === 'string' && body.stamp) {
            stampRef.current = body.stamp
            setStampMode('stamp')
          }
          signatureRef.current = signature
          if (changed || !quiet) {
            setSnapshot(body)
            setPhase('ready')
            setSelected((current) => (current !== null && (body.chapters ?? []).some((row) => row.chapter === current) ? current : pickChapter(body, current)))
          }
          if (changed) {
            setUpdatedAt(Date.now())
            flashUpdated()
          } else if (!quiet) {
            setUpdatedAt(Date.now())
          }
          return body
        } catch (cause) {
          if (!quiet) {
            setError(cause instanceof Error ? cause.message : String(cause))
            setNotice(t('panel.refreshFailed'))
          }
          return null
        } finally {
          if (!quiet) setRefreshing(false)
        }
      }, [book, flashUpdated, pickChapter, t])

      /** Initial load and manual reload. */
      useEffect(() => {
        if (cwdRef.current !== cwd) {
          cwdRef.current = cwd
          loadedRef.current = false
          setSnapshot(null)
          setSelected(null)
          setView('board')
        }
        void loadBook()
        return () => { seqRef.current += 1 }
      }, [cwd, loadBook, reload])

      /** Persist the chapter the author was reading, per book. */
      useEffect(() => {
        if (!book || phase !== 'ready' || selected === null) return
        writePanelView(book.key, { chapter: selected, view })
      }, [book?.key, phase, selected, view])

      /** Turn-end is the strongest "the Agent just finished" signal. */
      useEffect(() => {
        if (busy) { sawRunningRef.current = true; return }
        if (!sawRunningRef.current) return
        sawRunningRef.current = false
        void refreshSnapshot('auto')
      }, [busy, refreshSnapshot])

      /** Cheap stamp polling catches writes from another session or another process. */
      useEffect(() => {
        if (!book || phase !== 'ready') return undefined
        if (typeof document === 'undefined' || typeof window === 'undefined') return undefined
        let alive = true
        let busy = false
        let timer = null
        const check = async () => {
          if (!alive || busy || document.visibilityState === 'hidden') return
          // The workbench writes this key when a background write starts; a
          // cheap read keeps the panel's wait card in sync without polling state.
          setPersistedWriting(readWritingState(book.key))
          busy = true
          try {
            if (stampMode === 'stamp') {
              const value = await apiGet(`stamp?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
              if (!alive) return
              const stamp = String(value.stamp ?? '')
              if (!stamp) return
              if (stampRef.current && stamp !== stampRef.current) {
                stampRef.current = stamp
                await refreshSnapshot('auto')
              } else if (!stampRef.current) {
                stampRef.current = stamp
              }
            } else {
              await refreshSnapshot('auto')
            }
          } catch {
            if (alive && stampMode === 'stamp') setStampMode('book')
          } finally {
            busy = false
          }
        }
        timer = setInterval(() => { void check() }, stampMode === 'stamp' ? 4000 : 15000)
        const onVisible = () => { if (document.visibilityState === 'visible') void check() }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)
        return () => {
          alive = false
          if (timer) clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisible)
          window.removeEventListener('focus', onVisible)
        }
      }, [book, phase, stampMode, refreshSnapshot])

      /** The reader fetches the chapter's prose, and refetches when the file moves. */
      useEffect(() => {
        if (view !== 'reader' || !book || !chapter?.path || !chapter.hasText) {
          setText(null)
          setTextError('')
          setTextLoading(false)
          return undefined
        }
        let alive = true
        setTextLoading(true)
        setTextError('')
        apiGet(`file?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}&path=${encodeURIComponent(chapter.path)}`)
          .then((value) => { if (alive) setText(value.text ?? '') })
          .catch((cause) => {
            if (!alive) return
            setText(null)
            setTextError(cause instanceof Error ? cause.message : String(cause))
          })
          .finally(() => { if (alive) setTextLoading(false) })
        return () => { alive = false }
      }, [view, book, chapter?.path, chapter?.mtime, chapter?.hasText, textReload])

      useEffect(() => () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      }, [])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(''), 3600)
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => clearTimeout(timer)
      }, [notice])

      const sendPrompt = useCallback((prompt) => {
        const actions = props.inputActions
        if (!actions || typeof actions.setDraft !== 'function' || typeof actions.submit !== 'function') {
          setNotice(t('panel.sendFailed'))
          return false
        }
        actions.setDraft(String(prompt ?? ''))
        actions.submit()
        setNotice('')
        return true
      }, [props.inputActions, t])

      const openFull = useCallback((target) => {
        if (typeof props.openFull === 'function') props.openFull(target ?? undefined)
      }, [props.openFull])

      const openReader = useCallback((number) => {
        if (number === null || number === undefined) return
        setSelected(Number(number))
        setView('reader')
      }, [])

      const stage = panelStage(snapshot)
      const stageLabel = panelCopy(t, PANEL_STAGE_KEYS[stage], { setup: '立项', outline: '大纲', prepare: '开写准备', writing: '写正文', done: '完本' }[stage] ?? '')
      const journey = snapshot?.journey ?? null
      const status = snapshot?.status ?? {}
      const written = status.writtenChapters ?? 0
      const total = snapshot?.book?.totalChapters ?? null
      const meta = []
      if (book?.genre) meta.push(book.genre)
      if (stage === 'setup') {
        meta.push(fill(t('panel.setup.progress'), { done: PREMISE_ORDER.filter((id) => premiseCardFilled(snapshot?.premise?.cards ?? [], id)).length, total: PREMISE_ORDER.length }))
      } else if (stage === 'outline') {
        meta.push(fill(t('panel.outline.meta'), { volumes: (snapshot?.volumes ?? []).length, chapters: Object.keys(snapshot?.chapterOutlines ?? {}).length }))
      } else if (stage === 'prepare') {
        meta.push(fill(t('panel.prepare.meta'), {
          chapters: Object.keys(snapshot?.chapterOutlines ?? {}).length,
          cast: (snapshot?.characters ?? []).length,
          world: (snapshot?.settings?.world ?? []).length,
        }))
      } else {
        meta.push(`${written}/${total ?? '?'} ${t('workbench.chapterUnit')}`)
        meta.push(`${(status.totalWords ?? 0).toLocaleString()} ${t('workbench.wordUnit')}`)
      }
      const stepIndex = journey?.lifecycle ?? (stage === 'prepare' ? 2 : stage === 'setup' ? 0 : stage === 'outline' ? 1 : 3)
      // A background write started from the workbench has a persisted chapter
      // record. A write started from the chat has none, so infer it from the
      // last user prompt, with the next unwritten chapter as a fallback.
      const persisted = busy && persistedWriting ? persistedWriting : null
      const promptMatch = /写第\s*(\d+)\s*章/.exec(String(lastUserText ?? ''))
        ?? /第\s*(\d+)\s*章\s*已经有正文/.exec(String(lastUserText ?? ''))
      const promptedChapter = promptMatch ? Number(promptMatch[1]) : null
      const inferredChapter = !persisted && busy && selected !== null
        ? (promptedChapter
          // A prompt names the chapter; never fall through to the next chapter
          // when the author asked to rewrite a different one.
          ? (promptedChapter === selected ? promptedChapter : null)
          : (selected === status.nextChapter && chapter && !chapter.hasText ? selected : null))
        : null
      const writingChapter = persisted?.chapter ?? inferredChapter ?? null
      const writingNow = Boolean(writingChapter && writingChapter === selected && (busy || waiting))
      const writingNowState = writingNow ? {
        chapter: writingChapter,
        state: 'running',
        startedAt: persisted?.startedAt ?? Date.now(),
        sessionId: persisted?.sessionId ?? sessionId,
        baseline: persisted?.baseline ?? { hasText: Boolean(chapter?.hasText), mtime: chapter?.mtime ?? 0, words: chapter?.words ?? 0 },
      } : null
      const app = {
        t, snapshot, book, stage, stageLabel, status, journey, selected, chapter, chapterOutline, neighbors,
        text, textLoading, textError, busy, waiting, writingNow: writingNowState,
        openFull, openReader, sendPrompt,
        onBack: () => setView('board'),
        onReloadText: () => setTextReload((value) => value + 1),
      }
      const secondary = {
        setup: { label: t('panel.openPremise'), onClick: () => openFull({ kind: 'premise' }) },
        outline: { label: t('panel.openOutline'), onClick: () => openFull({ kind: 'outline' }) },
        prepare: { label: t('panel.openSettings'), onClick: () => openFull({ kind: 'settings' }) },
        writing: { label: t('panel.openStatus'), onClick: () => openFull({ kind: 'tracking', tab: 'progress' }) },
        done: { label: t('panel.openDone'), onClick: () => openFull({ kind: 'export' }) },
      }[stage]
      const sections = snapshot ? (stage === 'setup' ? panelSetup(app) : stage === 'outline' ? panelOutline(app) : stage === 'prepare' ? panelPrepare(app) : stage === 'writing' ? panelWriting(app) : panelDone(app)) : { main: [], aside: [] }
      const header = e(P2Header, {
        t,
        book,
        stage,
        stageLabel: snapshot ? stageLabel : '',
        stepIndex,
        meta,
        busy,
        waiting,
        flash,
        updatedAt,
        refreshing,
        onRefresh: () => setReload((value) => value + 1),
        onOpenFull: () => openFull(null),
      })
      const stateBody = phase === 'loading' && !snapshot
        ? e('div', { className: 'nw-p2-skeleton' },
          e('div', { className: 'nw-p2-skeleton-card' }),
          e('div', { className: 'nw-p2-skeleton-line is-wide' }),
          e('div', { className: 'nw-p2-skeleton-line' }),
          e('div', { className: 'nw-p2-skeleton-line is-short' }),
        )
        : phase === 'empty'
          ? e('div', { className: 'nw-p2-empty' },
            e('div', { className: 'nw-p2-empty-mark' }, icon('book', 22)),
            e('h2', null, t('panel.empty')),
            e('p', null, t('panel.emptyHint')),
            e('div', { className: 'nw-p2-inline-actions' },
              e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => openFull(null) }, t('panel.openBoard')),
              e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => setReload((value) => value + 1) }, t('state.retry')),
            ),
          )
          : phase === 'error' && !snapshot
            ? e('div', { className: 'nw-p2-empty is-error' },
              e('div', { className: 'nw-p2-empty-mark' }, icon('alert', 22)),
              e('h2', null, t('state.error')),
              e('p', null, error),
              e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => setReload((value) => value + 1) }, t('state.retry')),
            )
            : view === 'reader'
              ? e(P2Reader, { t, app })
              : [
                e('div', { key: 'scroll', className: 'nw-p2-scroll' },
                  e('div', { className: 'nw-p2-grid' },
                    e('div', { className: 'nw-p2-main' },
                      e(P2Next, {
                        t,
                        stageLabel,
                        action: journey?.action ?? null,
                        busy,
                        waiting,
                        secondary,
                        onPrompt: sendPrompt,
                        onExport: () => openFull({ kind: 'export' }),
                      }),
                      sections.main,
                    ),
                    e('aside', { className: 'nw-p2-aside' }, sections.aside),
                  ),
                ),
                e(P2Footer, { key: 'foot', t, app }),
              ]
      return e('div', { className: 'nw-root' }, e('style', null, CSS),
        e('div', { className: 'nw-p2' },
          header,
          stateBody,
          notice ? e('div', { className: 'nw-p2-notice' }, notice) : null,
        ),
      )
    }

    /** Title chip for the right-sidebar novel panel tab. */
    function PanelTitle(props) {
      const t = props.t
      return e('span', null, t('panel.tabTitle'))
    }

    /** Sidebar entry glyph. */
    function PanelIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20
      return e('img', { className: 'nw-panel-logo', src: NARRACAT_LOGO, width: size, height: size, alt: 'NarraCat' })
    }

    /**
     * Header utility that opens the novel panel. Hidden when the Session's
     * workspace has no book.
     * @param {object} props - slot props plus t/sessionId/open.
     * @returns {any} the button or null.
     */
    function NovelPanelButton(props) {
      const t = props.t
      const cwd = props.useSessions ? props.useSessions((state) => state.byId[props.sessionId]?.cwd) : undefined
      const [hasBook, setHasBook] = useState(null)
      useEffect(() => {
        let alive = true
        apiGet('books')
          .then((value) => {
            if (!alive) return
            const target = barePath(cwd)
            setHasBook((Array.isArray(value.books) ? value.books : []).some((book) => barePath(book.root) === target || barePath(book.dir) === target || (target.length > 0 && target.startsWith(`${barePath(book.dir)}/`))))
          })
          .catch(() => { if (alive) setHasBook(true) })
        return () => { alive = false }
      }, [cwd])
      if (hasBook === false) return null
      return e('button', {
        type: 'button',
        title: t('panel.openHint'),
        'aria-label': t('panel.tabTitle'),
        onClick: () => { if (typeof props.open === 'function') props.open() },
        style: {
          height: 26, padding: '0 9px', borderRadius: 7, border: '1px solid var(--dsw-alias-border-l1)',
          background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 12, cursor: 'pointer',
        },
      }, t('panel.tabTitle'))
    }
