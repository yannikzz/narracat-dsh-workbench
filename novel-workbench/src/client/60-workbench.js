    /** Drop trailing slashes for path comparisons. */
    function barePath(value) {
      return String(value ?? '').replace(/\/+$/, '')
    }

    /**
     * Pick the book that contains a Session's working directory.
     * @param {object[]} books - scanned books.
     * @param {string | undefined} cwd - Session working directory.
     * @returns {object | null} the best match.
     */
    function pickBookForCwd(books, cwd) {
      const target = barePath(cwd)
      if (target.length === 0) return books[0] ?? null
      return books.find((book) => barePath(book.dir) === target)
        ?? books.find((book) => target.startsWith(`${barePath(book.dir)}/`))
        ?? books.find((book) => barePath(book.root) === target)
        ?? books[0]
        ?? null
    }

    /**
     * Measure the workbench container and pick a layout tier.
     * @param {any} ref - container element ref.
     * @returns {'wide' | 'medium' | 'narrow'} tier.
     */
    function useContainerTier(ref) {
      const [tier, setTier] = useState('wide')
      useEffect(() => {
        const element = ref.current
        if (!element) return undefined
        const update = () => {
          const width = element.clientWidth || 0
          setTier(width >= 1180 ? 'wide' : width >= 900 ? 'medium' : 'narrow')
        }
        update()
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(update)
          observer.observe(element)
          return () => observer.disconnect()
        }
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
      }, [ref])
      return tier
    }

    /**
     * Reserve the macOS traffic-light gutter when the page touches the window's
     * left edge: the DSH sidebar is collapsed. Measuring our own root keeps this
     * right when the host sidebar expands again, without reading host internals.
     * @param {any} ref - page root ref.
     * @param {string} route - current route; re-measures after a route swap.
     * @returns {boolean} whether the titlebar inset is needed.
     */
    function useTitlebarInset(ref, route) {
      const [atLeft, setAtLeft] = useState(false)
      const measure = useCallback(() => {
        const element = ref.current
        if (!element || typeof element.getBoundingClientRect !== 'function') return
        setAtLeft(element.getBoundingClientRect().left <= 8)
      }, [ref])
      useLayoutEffect(() => { measure() }, [measure, route])
      useEffect(() => {
        const element = ref.current
        if (!element || typeof ResizeObserver !== 'function') return undefined
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        window.addEventListener('resize', measure)
        return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
      }, [measure, route])
      const hosted = typeof window !== 'undefined' && Boolean(window.__DSH_BOOT__)
      const mac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent || '')
      return hosted && mac && atLeft
    }

    /** Read one stored string. */
    function readStore(key) {
      try { return globalThis.localStorage?.getItem(key) ?? null } catch { return null }
    }

    /** Write one stored string. */
    function writeStore(key, value) {
      try {
        if (value === null) { globalThis.localStorage?.removeItem(key) } else { globalThis.localStorage?.setItem(key, value) }
      } catch { /* private mode */ }
    }

    /** Read one JSON value, ignoring malformed leftovers. */
    function readJsonStore(key) {
      const raw = readStore(key)
      if (!raw) return null
      try {
        const value = JSON.parse(raw)
        return value && typeof value === 'object' ? value : null
      } catch {
        return null
      }
    }

    /** Write one JSON value. */
    function writeJsonStore(key, value) {
      writeStore(key, value === null ? null : JSON.stringify(value))
    }

    /** One saved workbench view, normalized to the current category/selection vocabulary. */
    const SELECTION_KINDS = new Set(['chapter', 'character', 'outline', 'premise', 'memory', 'reviews', 'tracking'])
    const CHAPTER_VIEWS = new Set(['text', 'outline', 'review', 'memory'])
    const CHARACTER_VIEWS = new Set(['profile', 'state'])
    const TRACKING_TABS = new Set(['progress', 'summaries', 'foreshadowing', 'characters'])

    /**
     * Keep only the parts of a view that still mean something after a reload:
     * a known category, a known selection, and a known sub-view. File and world
     * selections are dropped because their paths can disappear.
     * @param {object | null | undefined} view - candidate view.
     * @returns {object} normalized view.
     */
    function sanitizeWorkbenchView(view) {
      const source = view && typeof view === 'object' ? view : {}
      let selection = null
      if (source.selection && typeof source.selection === 'object' && SELECTION_KINDS.has(source.selection.kind)) {
        selection = { kind: source.selection.kind }
        for (const key of ['chapter', 'name']) {
          if (source.selection[key] !== undefined && source.selection[key] !== null) selection[key] = source.selection[key]
        }
        if (selection.kind === 'chapter') {
          const number = Number(selection.chapter)
          if (Number.isInteger(number) && number > 0) selection.chapter = number
          else selection = null
        } else if (selection.kind === 'character') {
          selection.name = String(selection.name ?? '')
          if (!selection.name) selection = null
        }
      }
      let category = CATEGORIES.some((item) => item.id === source.category) ? source.category : 'overview'
      if (selection) {
        const kind = selection.kind
        category = kind === 'chapter' ? 'manuscript' : kind === 'character' ? 'settings' : kind === 'outline' || kind === 'premise' ? 'blueprint' : 'materials'
      }
      return {
        v: 1,
        category,
        selection,
        chapterView: CHAPTER_VIEWS.has(source.chapterView) ? source.chapterView : 'text',
        characterView: CHARACTER_VIEWS.has(source.characterView) ? source.characterView : 'profile',
        trackingTab: TRACKING_TABS.has(source.trackingTab) ? source.trackingTab : 'progress',
      }
    }

    /** Per-book page memory: leaving the workbench and coming back keeps the page. */
    const BOOK_VIEW_PREFIX = 'nw.view:'
    function readBookView(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${BOOK_VIEW_PREFIX}${bookKey}`)
      return value ? sanitizeWorkbenchView(value) : null
    }
    function writeBookView(bookKey, view) {
      if (!bookKey) return
      writeJsonStore(`${BOOK_VIEW_PREFIX}${bookKey}`, sanitizeWorkbenchView(view))
    }

    /** Right-sidebar panel memory: which chapter was open, and whether it was reading. */
    const PANEL_VIEW_PREFIX = 'nw.panel:'
    function readPanelView(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${PANEL_VIEW_PREFIX}${bookKey}`)
      if (!value) return null
      const chapter = Number(value.chapter)
      return {
        chapter: Number.isInteger(chapter) && chapter > 0 ? chapter : null,
        view: value.view === 'reader' ? 'reader' : 'board',
      }
    }
    function writePanelView(bookKey, value) {
      if (!bookKey) return
      writeJsonStore(`${PANEL_VIEW_PREFIX}${bookKey}`, {
        chapter: Number.isInteger(value?.chapter) ? value.chapter : null,
        view: value?.view === 'reader' ? 'reader' : 'board',
      })
    }

    /** A one-shot "open the full workbench at this section" request from the side panel. */
    const PENDING_VIEW_KEY = 'nw.pendingView'
    function readPendingView() {
      const value = readJsonStore(PENDING_VIEW_KEY)
      if (!value || typeof value !== 'object') return null
      if (value.at && Date.now() - Number(value.at) > 2 * 60 * 1000) return null
      return value
    }
    function writePendingView(target) {
      writeJsonStore(PENDING_VIEW_KEY, target ? { ...target, at: Date.now() } : null)
    }

    /**
     * One in-flight background write, stored per book. A page switch or a
     * component remount otherwise loses the writing scene even though the
     * Agent keeps running, which leaves only a disabled "写本章" button.
     */
    const WRITING_KEY_PREFIX = 'nw.write:'
    const WRITING_MAX_AGE = 45 * 60 * 1000
    function readWritingState(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`)
      if (!value || typeof value !== 'object') return null
      const chapter = Number(value.chapter)
      const startedAt = Number(value.startedAt)
      if (!Number.isInteger(chapter) || chapter <= 0 || !Number.isFinite(startedAt)) return null
      if (Date.now() - startedAt > WRITING_MAX_AGE) {
        writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, null)
        return null
      }
      const baseline = value.baseline && typeof value.baseline === 'object' ? value.baseline : {}
      return {
        bookKey,
        chapter,
        // A saved "starting" phase can no longer be observed directly; treat
        // it as running so the elapsed clock and the 4-second poll resume.
        state: 'running',
        startedAt,
        sessionId: typeof value.sessionId === 'string' ? value.sessionId : null,
        baseline: {
          hasText: Boolean(baseline.hasText),
          mtime: Number(baseline.mtime) || 0,
          words: Number(baseline.words) || 0,
        },
      }
    }
    function writeWritingState(bookKey, value) {
      if (!bookKey || !value) return
      writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, {
        chapter: value.chapter,
        startedAt: value.startedAt,
        sessionId: value.sessionId ?? null,
        baseline: value.baseline ?? null,
      })
    }
    function clearWritingState(bookKey) {
      if (!bookKey) return
      writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, null)
    }

    /**
     * The novel plugin's page: shelf, data loading, and the workbench shell.
     * @param {object} props - slot props plus t/writeChapter/session helpers.
     * @returns {any} the page.
     */
    function NovelApp(props) {
      const t = props.t
      const isSession = props.mode === 'session'
      const [books, setBooks] = useState([])
      const [libraryDir, setLibraryDir] = useState('')
      const [scanState, setScanState] = useState('loading')
      const [scanError, setScanError] = useState('')
      const [shelfKey, setShelfKey] = useState(() => readStore('nw.shelfKey'))
      // Returning to the page must not flash the shelf first: if the last exit
      // was a book, start on the book shell and let the scan fill it in.
      const initialViewRef = useRef({
        route: readStore('nw.route'),
        bookKey: readStore('nw.lastBook'),
      })
      const resumeBook = !isSession && initialViewRef.current.route === 'book' && Boolean(initialViewRef.current.bookKey)
      const [route, setRoute] = useState(isSession || resumeBook ? 'book' : 'shelf')
      const [bookKey, setBookKey] = useState(() => (resumeBook ? initialViewRef.current.bookKey : null))
      const [viewRestored, setViewRestored] = useState(false)
      const [openedBook, setOpenedBook] = useState(null)
      const [snapshot, setSnapshot] = useState(null)
      const [snapState, setSnapState] = useState('idle')
      const [snapError, setSnapError] = useState('')
      const [shelfSnapshot, setShelfSnapshot] = useState(null)
      const [category, setCategory] = useState('overview')
      const [selection, setSelection] = useState(null)
      const [chapterView, setChapterView] = useState('text')
      const [characterView, setCharacterView] = useState('profile')
      const [trackingTab, setTrackingTab] = useState('progress')
      const [trackingRefreshing, setTrackingRefreshing] = useState(false)
      const [file, setFile] = useState(null)
      const [fileState, setFileState] = useState('idle')
      const [fileError, setFileError] = useState('')
      const [draft, setDraft] = useState('')
      const [editing, setEditing] = useState(false)
      const [saving, setSaving] = useState(false)
      const [saveError, setSaveError] = useState('')
      const [saveNote, setSaveNote] = useState('')
      const [panelWish, setPanelWish] = useState(null)
      const [panelTab, setPanelTab] = useState(isSession ? 'chat' : 'context')
      const [directoryWish, setDirectoryWish] = useState(null)
      const [query, setQuery] = useState('')
      const [collapsed, setCollapsed] = useState({})
      const [confirm, setConfirm] = useState(null)
      const [toast, setToast] = useState(null)
      const [writing, setWriting] = useState(null)
      const [trackedSession, setTrackedSession] = useState(null)
      const [sessionError, setSessionError] = useState('')
      const [sessionOpening, setSessionOpening] = useState(false)
      const [exportOpen, setExportOpen] = useState(false)
      const [exportFormat, setExportFormat] = useState('docx')
      const [exportState, setExportState] = useState('idle')
      const [exportError, setExportError] = useState('')
      const [exportResult, setExportResult] = useState(null)
      const [draftRefresh, setDraftRefresh] = useState(0)
      const rootRef = useRef(null)
      const tier = useContainerTier(rootRef)
      const titlebarInset = useTitlebarInset(rootRef, route)
      const panelOpen = panelWish ?? tier === 'wide'
      const directoryOpen = directoryWish ?? tier !== 'narrow'
      const cacheRef = useRef(new Map())
      const saveRef = useRef(() => {})
      const fileSeqRef = useRef(0)
      const snapSeqRef = useRef(0)
      const bookKeyRef = useRef(null)
      const fileRef = useRef(null)
      const sawRunningRef = useRef(false)
      const pendingViewRef = useRef(readPendingView())
      const needsFileOpenRef = useRef(false)

      const useSessions = props.useSessions ?? (() => undefined)
      const useSessionStatus = props.useSessionStatus ?? (() => undefined)
      const useChat = props.useChat
      const useInput = props.useInput
      const sessionCwd = useSessions((state) => (props.sessionId ? state.byId[props.sessionId]?.cwd : undefined))

      const currentBook = useMemo(() => books.find((book) => book.key === bookKey)
        ?? (openedBook && openedBook.key === bookKey ? openedBook : null), [books, bookKey, openedBook])
      const shelfIndex = useMemo(() => {
        const found = books.findIndex((book) => book.key === shelfKey)
        return found >= 0 ? found : 0
      }, [books, shelfKey])
      const shelfBook = books[shelfIndex] ?? null
      const status = snapshot?.status ?? null
      const dirty = Boolean(file && editing && draft !== file.text)
      // Requests carry the book/file they were sent for; a late response must
      // never paint A's snapshot or A's draft onto B's page.
      bookKeyRef.current = currentBook?.key ?? null
      fileRef.current = file

      /** Load the shelf once, and on manual rescans. */
      const loadBooks = useCallback(async (preferKey) => {
        setScanState('loading')
        setScanError('')
        try {
          const value = await apiGet('books')
          const rows = (Array.isArray(value.books) ? value.books : []).map((book) => ({ ...book, key: `${book.root}|${book.relDir}` }))
          setBooks(rows)
          setLibraryDir(typeof value.libraryDir === 'string' ? value.libraryDir : '')
          setScanState('ready')
          setShelfKey((current) => {
            const wanted = preferKey ?? current
            if (wanted && rows.some((book) => book.key === wanted)) return wanted
            return rows[0]?.key ?? null
          })
          return rows
        } catch (error) {
          setBooks([])
          setScanState('error')
          setScanError(error instanceof Error ? error.message : String(error))
          return []
        }
      }, [])

      useEffect(() => { void loadBooks() }, [loadBooks])

      useEffect(() => { writeStore('nw.shelfKey', shelfKey) }, [shelfKey])

      /**
       * Restore the last page, or honor a one-shot target from the right-side
       * panel, once the shelf scan is ready. In a Session view the book still
       * follows the Session cwd; its last category/selection is restored.
       */
      useEffect(() => {
        if (viewRestored || scanState === 'loading') return
        if (scanState === 'error' || books.length === 0) {
          if (!isSession) setRoute('shelf')
          setViewRestored(true)
          return
        }
        const applyView = (view) => {
          const safe = sanitizeWorkbenchView(view)
          setCategory(safe.category)
          setSelection(safe.selection)
          setChapterView(safe.chapterView)
          setCharacterView(safe.characterView)
          setTrackingTab(safe.trackingTab)
        }
        const targetView = (target) => {
          switch (target.kind) {
            case 'premise': return { category: 'blueprint', selection: { kind: 'premise' } }
            case 'outline': return { category: 'blueprint', selection: { kind: 'outline' } }
            case 'chapter': return { category: 'manuscript', selection: { kind: 'chapter', chapter: target.chapter }, chapterView: target.view ?? 'text' }
            case 'character': return { category: 'settings', selection: { kind: 'character', name: target.name }, characterView: 'profile' }
            case 'manuscript': return { category: 'manuscript', selection: null }
            case 'settings': return { category: 'settings', selection: null }
            case 'tracking': return { category: 'materials', selection: { kind: 'tracking' }, trackingTab: target.tab ?? 'progress' }
            case 'memory': return { category: 'materials', selection: { kind: 'memory' } }
            case 'reviews': return { category: 'materials', selection: { kind: 'reviews' } }
            case 'export': return { category: 'overview', selection: null }
            default: return { category: 'overview', selection: null }
          }
        }

        const pending = pendingViewRef.current
        if (pending) {
          pendingViewRef.current = null
          writePendingView(null)
          const targetBook = books.find((book) => book.key === pending.bookKey)
            ?? books.find((book) => book.key === readStore('nw.lastBook'))
            ?? books[0]
          if (targetBook) {
            setOpenedBook(targetBook)
            setBookKey(targetBook.key)
            setShelfKey(targetBook.key)
            setRoute('book')
            if (!isSession) {
              writeStore('nw.route', 'book')
              writeStore('nw.lastBook', targetBook.key)
            }
            const base = readBookView(targetBook.key) ?? { category: 'overview' }
            applyView({ ...base, ...targetView(pending) })
            needsFileOpenRef.current = pending.kind === 'chapter' || pending.kind === 'character'
            if (pending.kind === 'export') setExportOpen(true)
            setViewRestored(true)
            return
          }
        }

        if (isSession) {
          setRoute('book')
          const match = pickBookForCwd(books, sessionCwd)
          if (match) {
            setBookKey(match.key)
            setShelfKey(match.key)
            const saved = readBookView(match.key)
            if (saved) {
              applyView(saved)
              needsFileOpenRef.current = saved.selection?.kind === 'chapter' || saved.selection?.kind === 'character'
            }
          }
          setViewRestored(true)
          return
        }

        const savedRoute = readStore('nw.route')
        const lastBookKey = readStore('nw.lastBook')
        const targetBook = savedRoute === 'book' && lastBookKey ? books.find((book) => book.key === lastBookKey) ?? null : null
        if (targetBook) {
          setOpenedBook(targetBook)
          setBookKey(targetBook.key)
          setShelfKey(targetBook.key)
          setRoute('book')
          const saved = readBookView(targetBook.key)
          if (saved) {
            applyView(saved)
            needsFileOpenRef.current = saved.selection?.kind === 'chapter' || saved.selection?.kind === 'character'
          }
        } else {
          setRoute('shelf')
        }
        setViewRestored(true)
      }, [books, isSession, scanState, sessionCwd, viewRestored])

      /** Remember the page per book; the main page's shelf/book route is remembered separately. */
      useEffect(() => {
        if (!viewRestored) return
        if (!isSession) {
          if (route === 'shelf') { writeStore('nw.route', 'shelf'); return }
          writeStore('nw.route', 'book')
        }
        if (!currentBook) return
        if (!isSession) writeStore('nw.lastBook', currentBook.key)
        writeBookView(currentBook.key, { category, selection, chapterView, characterView, trackingTab })
      }, [viewRestored, isSession, route, currentBook?.key, category, selection, chapterView, characterView, trackingTab])

      /** A restored chapter or character that no longer exists falls back to its directory. */
      useEffect(() => {
        if (!viewRestored || !snapshot || !selection) return
        if (selection.kind === 'chapter') {
          if (!(snapshot.chapters ?? []).some((row) => row.chapter === selection.chapter)) setSelection(null)
        } else if (selection.kind === 'character') {
          if (!(snapshot.characters ?? []).some((row) => row.name === selection.name)) setSelection(null)
        }
      }, [viewRestored, snapshot, selection])

      /** The shelf preview needs the selected book's synopsis and next chapter. */
      useEffect(() => {
        if (route !== 'shelf' || !shelfBook) { setShelfSnapshot(null); return undefined }
        const cached = cacheRef.current.get(shelfBook.key)
        if (cached) { setShelfSnapshot(cached); return undefined }
        let alive = true
        setShelfSnapshot(null)
        apiGet(`book?root=${encodeURIComponent(shelfBook.root)}&dir=${encodeURIComponent(shelfBook.relDir)}`)
          .then((value) => { if (!alive) return; cacheRef.current.set(shelfBook.key, value); setShelfSnapshot(value) })
          .catch(() => { if (alive) setShelfSnapshot(null) })
        return () => { alive = false }
      }, [route, shelfBook?.key])

      /** Load the open book's full snapshot. */
      const loadSnapshot = useCallback(async (book, quiet) => {
        if (!book) return null
        const seq = snapSeqRef.current + 1
        snapSeqRef.current = seq
        if (!quiet) { setSnapState('loading'); setSnapError('') }
        try {
          const value = await apiGet(`book?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
          if (seq !== snapSeqRef.current || book.key !== bookKeyRef.current) return null
          cacheRef.current.set(book.key, value)
          setSnapshot(value)
          setSnapState('ready')
          return value
        } catch (error) {
          if (seq !== snapSeqRef.current) return null
          if (!quiet) {
            setSnapError(error instanceof Error ? error.message : String(error))
            setSnapState('error')
          } else {
            // A silent refresh that fails must not leave a permanent spinner.
            setSnapState((current) => (current === 'loading' ? 'error' : current))
          }
          return null
        }
      }, [])

      useEffect(() => {
        if (route !== 'book' || !bookKey || !currentBook) return
        const cached = cacheRef.current.get(currentBook.key)
        if (cached) { setSnapshot(cached); setSnapState('ready'); return }
        void loadSnapshot(currentBook, false)
      }, [route, bookKey, currentBook, loadSnapshot])

      const resetFile = useCallback(() => {
        fileSeqRef.current += 1
        setFile(null); setFileState('idle'); setFileError(''); setDraft(''); setEditing(false); setSaveError(''); setSaveNote('')
      }, [])

      /** Save guard: ask before dropping an unsaved draft. */
      function guard(action) {
        if (!(editing && file && draft !== file.text)) { action(); return }
        setConfirm({
          title: t('workbench.discard.title'),
          body: t('workbench.discard.body'),
          keep: t('workbench.discard.keep'),
          leave: t('workbench.discard.leave'),
          onConfirm: () => {
            setConfirm(null)
            setEditing(false)
            setDraft(file?.text ?? '')
            action()
          },
        })
      }

      const openBook = useCallback((book) => {
        if (!book) return
        guard(() => {
          snapSeqRef.current += 1
          setOpenedBook(book)
          setBookKey(book.key)
          setShelfKey(book.key)
          setRoute('book')
          setCategory('overview')
          setSelection(null)
          setChapterView('text')
          setCharacterView('profile')
          setTrackingTab('progress')
          resetFile()
          setPanelTab(isSession ? 'chat' : 'context')
          setPanelWish(null)
          setDirectoryWish(null)
          setQuery('')
          const cached = cacheRef.current.get(book.key)
          if (cached) { setSnapshot(cached); setSnapState('ready') } else { setSnapshot(null); setSnapState('loading') }
        })
      }, [draft, editing, file, isSession, resetFile, tier])

      const handleCreated = useCallback(async (created) => {
        // Open the book immediately from the create response; the shelf scan can
        // take a moment to see a freshly registered Workspace. This keeps the
        // dialog from staying open with a scary "not refreshed" warning.
        const book = {
          key: `${created.root}|${created.dir}`,
          root: created.root,
          relDir: created.dir,
          title: created.title,
          workspaceId: created.workspaceId ?? null,
          writtenChapters: 0,
          totalChapters: null,
          wordsPerChapter: null,
        }
        openBook(book)
        setToast(fill(t('create.done'), { title: created.title }))
        const findCreated = (rows) => rows.find((row) => row.root === created.root && row.relDir === created.dir)
          ?? rows.find((row) => row.title === created.title && (!created.workspaceId || row.workspaceId === created.workspaceId))
          ?? rows.find((row) => row.root === created.root)
        // Retry the shelf scan in the background; a new Workspace may take a
        // tick to show up in the registry's list.
        let rows = await loadBooks(book.key)
        let found = findCreated(rows)
        for (const delay of [160, 320, 640]) {
          if (found) break
          await new Promise((resolve) => setTimeout(resolve, delay))
          rows = await loadBooks(book.key)
          found = findCreated(rows)
        }
        if (!found && created.warning) setToast(created.warning)
        return { ok: true }
      }, [loadBooks, openBook, t])

      const backToShelf = useCallback(() => {
        guard(() => {
          setRoute(isSession ? 'book' : 'shelf')
          if (!isSession) {
            if (bookKey) setShelfKey(bookKey)
            setSnapshot(null)
            setSnapState('idle')
            setSelection(null)
            resetFile()
          }
        })
      }, [bookKey, draft, editing, file, isSession, resetFile])

      const openPath = useCallback(async (path, options = {}) => {
        if (!currentBook || !path) { resetFile(); return }
        setFileState('loading')
        setFileError('')
        setSaveError('')
        setSaveNote('')
        const seq = fileSeqRef.current + 1
        fileSeqRef.current = seq
        const bookKey = currentBook.key
        try {
          const value = await apiGet(`file?root=${encodeURIComponent(currentBook.root)}&dir=${encodeURIComponent(currentBook.relDir)}&path=${encodeURIComponent(path)}`)
          if (seq !== fileSeqRef.current || bookKey !== bookKeyRef.current) return
          setFile(value)
          setDraft(value.text ?? '')
          setEditing(false)
          setFileState('ready')
          if (options.readOnly) setSaveNote(t('workbench.readonly'))
        } catch (error) {
          if (seq !== fileSeqRef.current) return
          setFile(null)
          setFileState('error')
          setFileError(error instanceof Error ? error.message : String(error))
        }
      }, [currentBook, resetFile, t])

      /** The restored/pending chapter or character loads its text once the snapshot is ready. */
      useEffect(() => {
        if (!needsFileOpenRef.current || !snapshot || !selection || !currentBook) return
        needsFileOpenRef.current = false
        if (selection.kind === 'chapter' && chapterView === 'text') {
          const row = (snapshot.chapters ?? []).find((item) => item.chapter === selection.chapter)
          if (row?.path) void openPath(row.path)
        } else if (selection.kind === 'character' && characterView === 'profile') {
          const row = (snapshot.characters ?? []).find((item) => item.name === selection.name)
          if (row?.path) void openPath(row.path)
        }
      }, [chapterView, characterView, currentBook, openPath, selection, snapshot])

      const chapterRow = useCallback((chapter) => (snapshot?.chapters ?? []).find((row) => row.chapter === chapter) ?? null, [snapshot])

      const openChapter = useCallback((row, view = 'text') => {
        if (!row) return
        guard(() => {
          setCategory('manuscript')
          setSelection({ kind: 'chapter', chapter: row.chapter, path: row.path ?? null })
          setChapterView(view)
          setPanelTab(isSession ? 'chat' : 'context')
          if (view === 'text' && row.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, isSession, openPath, resetFile])

      const changeChapterView = useCallback((view) => {
        if (!selection || selection.kind !== 'chapter') return
        const row = chapterRow(selection.chapter)
        guard(() => {
          setChapterView(view)
          if (view === 'text' && row?.path) void openPath(row.path)
          else resetFile()
        })
      }, [chapterRow, draft, editing, file, openPath, resetFile, selection])

      const openCharacter = useCallback((row) => {
        if (!row) return
        guard(() => {
          setCategory('settings')
          setSelection({ kind: 'character', name: row.name, path: row.path ?? null })
          setCharacterView('profile')
          if (row.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, openPath, resetFile])

      const changeCharacterView = useCallback((view) => {
        if (!selection || selection.kind !== 'character') return
        const row = (snapshot?.characters ?? []).find((item) => item.name === selection.name)
        guard(() => {
          setCharacterView(view)
          if (view === 'profile' && row?.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, openPath, resetFile, selection, snapshot])

      const openWorld = useCallback((row) => {
        if (!row) return
        guard(() => {
          setCategory('settings')
          setSelection({ kind: 'world', name: row.name, path: row.path })
          resetFile()
          void openPath(row.path)
        })
      }, [draft, editing, file, openPath, resetFile])

      const openFile = useCallback((path, label, kind = 'file') => {
        guard(() => {
          setSelection({ kind, path, label, name: label })
          resetFile()
          void openPath(path)
        })
      }, [draft, editing, file, openPath, resetFile])

      const openOutline = useCallback(() => {
        guard(() => { setCategory('blueprint'); setSelection({ kind: 'outline' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openPremise = useCallback(() => {
        guard(() => { setCategory('blueprint'); setSelection({ kind: 'premise' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openMemory = useCallback(() => {
        guard(() => { setCategory('materials'); setSelection({ kind: 'memory' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openTracking = useCallback((tab = 'progress') => {
        guard(() => {
          setCategory('materials')
          setSelection({ kind: 'tracking' })
          setTrackingTab(tab)
          resetFile()
        })
      }, [draft, editing, file, resetFile])
      const openReviews = useCallback(() => {
        guard(() => { setCategory('materials'); setSelection({ kind: 'reviews' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openMemo = useCallback(async () => {
        if (!currentBook) return
        if (!snapshot?.book?.memo) {
          try {
            await apiPost('tracking/refresh', { root: currentBook.root, dir: currentBook.relDir })
            await loadSnapshot(currentBook, true)
          } catch (error) {
            setToast(`${t('tracking.failed')}：${error instanceof Error ? error.message : String(error)}`)
            return
          }
        }
        openFile('tracking/写作备忘.md', t('tracking.memo'))
      }, [currentBook, loadSnapshot, openFile, snapshot?.book?.memo, t])

      const selectCategory = useCallback((id) => {
        if (id === 'overview') {
          guard(() => { setCategory('overview'); setSelection(null); resetFile() })
          return
        }
        setCategory(id)
        setDirectoryWish(true)
      }, [draft, editing, file, resetFile, tier])

      /**
       * Save the open file. Chapter editing stays on the page after a save so
       * the writing loop is not interrupted; every other editor keeps the old
       * save-and-close behaviour. `exit: true` forces the close.
       * @param {{ exit?: boolean }} [options] - whether to leave edit mode.
       */
      const save = useCallback(async (options = {}) => {
        if (!currentBook || !file || saving) return
        const exit = options.exit ?? selection?.kind !== 'chapter'
        const bookKey = currentBook.key
        const filePath = file.path
        setSaving(true)
        setSaveError('')
        setSaveNote('')
        try {
          const saved = await apiPut('file', {
            root: currentBook.root,
            dir: currentBook.relDir,
            path: file.path,
            text: draft,
            expectedMtime: file.mtime,
            expectedSize: file.size,
          })
          if (bookKey !== bookKeyRef.current || filePath !== fileRef.current?.path) return
          setFile((current) => (current ? { ...current, text: draft, mtime: saved.mtime, size: saved.size, truncated: false } : current))
          if (exit) setEditing(false)
          setSaveNote(t('workbench.saved'))
          void loadSnapshot(currentBook, true)
        } catch (error) {
          if (bookKey === bookKeyRef.current && filePath === fileRef.current?.path) {
            setSaveError(error instanceof Error ? error.message : String(error))
          }
        } finally {
          setSaving(false)
        }
      }, [currentBook, draft, file, loadSnapshot, saving, selection?.kind, t])
      saveRef.current = save

      /** Leave edit mode and drop the draft, asking first when it is dirty. */
      const cancelEditing = useCallback(() => {
        const close = () => {
          setEditing(false)
          setDraft(file?.text ?? '')
          setSaveError('')
          setSaveNote('')
        }
        if (!(editing && file && draft !== file.text)) { close(); return }
        setConfirm({
          title: t('workbench.discard.title'),
          body: t('workbench.discard.body'),
          keep: t('workbench.discard.keep'),
          leave: t('workbench.discard.leave'),
          onConfirm: () => { setConfirm(null); close() },
        })
      }, [draft, editing, file, t])

      /** Finish editing: save a dirty draft, then go back to the reading view. */
      const finishEditing = useCallback(() => {
        if (editing && file && draft !== file.text) { void save({ exit: true }); return }
        setEditing(false)
        setDraft(file?.text ?? '')
        setSaveError('')
        setSaveNote('')
      }, [draft, editing, file, save])
      const finishRef = useRef(() => {})
      finishRef.current = finishEditing

      useEffect(() => {
        if (!editing) return undefined
        const onKey = (event) => {
          if (event.isComposing) return
          if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 's') {
            event.preventDefault()
            saveRef.current()
            return
          }
          if (event.key === 'Escape' && !confirm && selection?.kind === 'chapter') {
            event.preventDefault()
            finishRef.current()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [editing, confirm, selection?.kind])

      useEffect(() => {
        if (!dirty) return undefined
        const onBefore = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', onBefore)
        return () => window.removeEventListener('beforeunload', onBefore)
      }, [dirty])

      /** Writing Session status + task polling. */
      useEffect(() => {
        if (!currentBook || !props.readWritingSessionId) { setTrackedSession(null); return }
        setTrackedSession(props.readWritingSessionId(currentBook))
      }, [currentBook, props.readWritingSessionId, draftRefresh])

      const trackedStatus = useSessionStatus((statuses) => (trackedSession ? statuses.get(trackedSession) : undefined))
      const trackedRunning = trackedStatus?.running === true
      const trackedWaiting = trackedStatus?.pendingInteraction !== undefined
      const runningNow = writing?.state === 'starting' || writing?.state === 'running' || trackedRunning

      const startWrite = useCallback(async (chapter) => {
        if (!currentBook || !props.writeChapter) return
        if (writing && (writing.state === 'starting' || writing.state === 'running')) return
        const row = chapterRow(chapter)
        const baseline = { hasText: Boolean(row?.hasText), mtime: row?.mtime ?? 0, words: row?.words ?? 0 }
        const bookKey = currentBook.key
        const base = { bookKey, chapter, baseline }
        // Persist immediately, before the first await: if the author leaves the
        // page in the starting moment, the chapter scene still comes back.
        const record = (next) => {
          setWriting(next)
          if (next.state === 'starting' || next.state === 'running') writeWritingState(bookKey, next)
          else clearWritingState(bookKey)
        }
        // Starting a write on the open chapter puts the page into its writing
        // scene; from the overview the current page is left untouched.
        if (selection?.kind === 'chapter' && selection.chapter === chapter) setChapterView('text')
        record({ ...base, state: 'starting', startedAt: Date.now() })
        try {
          const result = await props.writeChapter(currentBook, chapter, {
            hasText: baseline.hasText,
            hasOutline: Boolean(row?.hasOutline),
          })
          if (result?.sessionId) setTrackedSession(result.sessionId)
          record({ ...base, sessionId: result?.sessionId ?? null, state: 'running', startedAt: Date.now() })
          setDraftRefresh((value) => value + 1)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          record({ ...base, state: 'error', error: message })
          setToast(message)
        }
      }, [chapterRow, currentBook, props.writeChapter, selection, setToast, writing])

      /** Restore an in-flight write after the page was hidden or remounted. */
      useEffect(() => {
        const key = currentBook?.key ?? null
        setWriting((current) => {
          if (!key) return null
          if (current?.bookKey === key) return current
          const saved = readWritingState(key)
          return saved ? { ...saved, bookKey: key } : null
        })
      }, [currentBook?.key])

      /** Keep the recoverable phase on disk; remove it once the write ends. */
      useEffect(() => {
        if (!writing?.bookKey) return
        if (writing.state === 'starting' || writing.state === 'running') writeWritingState(writing.bookKey, writing)
        else clearWritingState(writing.bookKey)
      }, [writing])

      useEffect(() => {
        if (!currentBook || !writing || writing.state !== 'running') return undefined
        if (writing.bookKey && writing.bookKey !== currentBook.key) return undefined
        let alive = true
        let busy = false
        const startedAt = writing.startedAt ?? Date.now()
        const timer = setInterval(() => {
          if (!alive || busy) return
          busy = true
          apiGet(`book?root=${encodeURIComponent(currentBook.root)}&dir=${encodeURIComponent(currentBook.relDir)}`)
            .then((value) => {
              if (!alive) return
              const row = (value.chapters ?? []).find((item) => item.chapter === writing.chapter)
              const baseline = writing.baseline ?? { hasText: false, mtime: 0, words: 0 }
              const changed = Boolean(row?.hasText) && (!baseline.hasText
                || row.mtime !== baseline.mtime
                || row.words !== baseline.words)
              if (changed || Date.now() - startedAt > 10 * 60 * 1000) {
                setWriting((current) => (current ? { ...current, state: 'done' } : current))
                cacheRef.current.set(currentBook.key, value)
                setSnapshot(value)
                setDraftRefresh((token) => token + 1)
              }
            })
            .catch(() => {})
            .finally(() => { busy = false })
        }, 4000)
        // Browser timers have no unref; the test/preview runtime does. Without
        // this, a headless run that stays in the writing state would never exit.
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => { alive = false; clearInterval(timer) }
      }, [writing?.state, writing?.chapter, writing?.startedAt, currentBook])

      /**
       * Keep the open chapter's prose in sync with the snapshot. This is what
       * reveals a finished background write (new file or rewritten mtime),
       * including a session that ended without a persisted chapter record.
       * It also picks up an external edit on a manual rescan. Only the open
       * chapter's text view is touched, and an active editor is never replaced.
       */
      useEffect(() => {
        if (!currentBook || !snapshot || editing) return
        if (selection?.kind !== 'chapter' || chapterView !== 'text') return
        if (fileState === 'loading' || fileState === 'error') return
        const row = (snapshot.chapters ?? []).find((item) => item.chapter === selection.chapter)
        if (!row?.path) return
        if (file?.path === row.path && file?.mtime === row.mtime) return
        void openPath(row.path)
      }, [currentBook, snapshot, editing, selection, chapterView, fileState, file?.path, file?.mtime, openPath])

      /** A restored write whose chapter already changed while away is done. */
      useEffect(() => {
        if (!currentBook || !writing || writing.state !== 'running' || !snapshot) return
        if (writing.bookKey && writing.bookKey !== currentBook.key) return
        const row = (snapshot.chapters ?? []).find((item) => item.chapter === writing.chapter)
        const baseline = writing.baseline ?? { hasText: false, mtime: 0, words: 0 }
        const changed = Boolean(row?.hasText) && (!baseline.hasText
          || row.mtime !== baseline.mtime
          || row.words !== baseline.words)
        if (!changed) return
        setWriting((current) => (current && current.state === 'running' ? { ...current, state: 'done' } : current))
        setDraftRefresh((token) => token + 1)
      }, [currentBook, snapshot, writing])

      useEffect(() => {
        if (trackedRunning) { sawRunningRef.current = true; return }
        if (!sawRunningRef.current) return
        sawRunningRef.current = false
        setWriting((current) => (current && current.state === 'running' ? { ...current, state: 'done' } : current))
        if (currentBook) void loadSnapshot(currentBook, true)
      }, [trackedRunning, currentBook, loadSnapshot])

      const openExport = useCallback(() => {
        setExportOpen(true)
        setExportError('')
        setExportState('idle')
        setExportResult(null)
      }, [])

      const closeExport = useCallback(() => {
        if (exportState !== 'working') setExportOpen(false)
      }, [exportState])

      const runExport = useCallback(async () => {
        if (!currentBook) return
        setExportState('working')
        setExportError('')
        setExportResult(null)
        try {
          const result = await apiPost('export', {
            root: currentBook.root,
            dir: currentBook.relDir,
            format: exportFormat,
          })
          setExportResult(result)
          setExportState('done')
        } catch (error) {
          setExportError(error instanceof Error ? error.message : String(error))
          setExportState('error')
        }
      }, [currentBook, exportFormat])

      const refreshTrackingNow = useCallback(async () => {
        if (!currentBook || trackingRefreshing) return
        setTrackingRefreshing(true)
        try {
          await apiPost('tracking/refresh', { root: currentBook.root, dir: currentBook.relDir })
          await loadSnapshot(currentBook, true)
          setToast(t('tracking.done'))
        } catch (error) {
          setToast(`${t('tracking.failed')}：${error instanceof Error ? error.message : String(error)}`)
        } finally {
          setTrackingRefreshing(false)
        }
      }, [currentBook, loadSnapshot, t, trackingRefreshing])

      const runJourney = useCallback((action) => {
        if (!action) return
        if (action.kind === 'export') { openExport(); return }
        if (action.kind === 'write') { void startWrite(action.chapter); return }
        if (action.kind === 'agent') {
          if (!props.runPrompt) { setToast(t('write.unavailable')); return }
          const pending = props.runPrompt(currentBook, action.prompt, { open: true })
          if (pending && typeof pending.catch === 'function') {
            pending.catch((error) => setToast(error instanceof Error ? error.message : String(error)))
          }
        }
      }, [currentBook, openExport, props.runPrompt, startWrite, t])

      const startSession = useCallback(async () => {
        if (!props.startWritingSession) return
        setSessionError('')
        setSessionOpening(true)
        try {
          const result = await props.startWritingSession(currentBook)
          if (result && result.ok === false) setSessionError(result.error || t('workbench.failed'))
          else setDraftRefresh((value) => value + 1)
        } catch (error) {
          setSessionError(error instanceof Error ? error.message : String(error))
        } finally {
          setSessionOpening(false)
        }
      }, [currentBook, props.startWritingSession, t])

      useEffect(() => {
        if (!toast) return undefined
        const timer = setTimeout(() => setToast(null), 4200)
        return () => clearTimeout(timer)
      }, [toast])

      useEffect(() => {
        if (!confirm) return undefined
        const onKey = (event) => { if (event.key === 'Escape') setConfirm(null) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [confirm])

      const openSession = (sessionId) => {
        if (sessionId && typeof props.openWritingSession === 'function') props.openWritingSession(sessionId)
      }

      const app = {
        t, isSession, books, scanState, scanError, shelfBook, shelfIndex, shelfSnapshot,
        book: currentBook, snapshot, status, snapState, snapError,
        journey: snapshot?.journey ?? null,
        onJourney: runJourney,
        onOpenExport: openExport,
        trackingTab, trackingRefreshing,
        onOpenTracking: openTracking,
        onTrackingTab: setTrackingTab,
        onRefreshTracking: () => void refreshTrackingNow(),
        category, selection, chapterView, characterView, file, fileState, fileError,
        draft, editing, saving, saveError, saveNote, dirty, readOnly: Boolean((selection && isProtectedPath(selection.path)) || file?.truncated),
        panelOpen, panelTab, directoryOpen, tier, query, collapsed, writing, trackedSession,
        trackedRunning, trackedWaiting, runningNow, sessionError, sessionOpening,
        useChat, useInput, sessionId: props.sessionId,
        onShelfSelect: (index) => { setShelfSnapshot(null); setShelfKey(books[index]?.key ?? null) },
        onShelfOpen: () => openBook(shelfBook),
        onRescan: () => { void loadBooks(bookKey); if (route === 'book' && currentBook) void loadSnapshot(currentBook, false) },
        onBackShelf: backToShelf,
        onCategory: selectCategory,
        onOpenChapter: openChapter,
        onOpenCharacter: openCharacter,
        onOpenWorld: openWorld,
        onOpenFile: openFile,
        onOpenOutline: openOutline,
        onOpenPremise: openPremise,
        onOpenMemory: openMemory,
        onOpenReviews: openReviews,
        onOpenMemo: openMemo,
        onChapterView: changeChapterView,
        onCharacterView: changeCharacterView,
        onToggleGroup: (key) => setCollapsed((current) => ({ ...current, [key]: !current[key] })),
        onQuery: setQuery,
        onTogglePanel: () => setPanelWish(!panelOpen),
        onToggleDirectory: () => setDirectoryWish(!directoryOpen),
        onPanelTab: setPanelTab,
        onEdit: () => {
          if (!file) return
          if (isProtectedPath(file.path) || file.truncated) { setToast(file.truncated ? t('file.truncated') : t('workbench.readonly')); return }
          setEditing(true); setDraft(file.text); setSaveNote('')
        },
        onCancel: cancelEditing,
        onFinish: finishEditing,
        onSave: () => void save(),
        // A reload overwrites the draft with the server copy. Ask first when the
        // draft is dirty; otherwise a failed save would lose the only copy.
        onReload: () => {
          if (!file) return
          guard(() => { void openPath(file.path) })
        },
        onDraft: (value) => { setDraft(value); setSaveNote('') },
        onWrite: (chapter) => void startWrite(chapter),
        onNewSession: () => void startSession(),
        exportFormat, exportState, exportError, exportResult,
        onExportFormat: setExportFormat,
        onExport: () => void runExport(),
        onCloseExport: closeExport,
        onOpenSession: openSession,
        onConfirmKeep: () => setConfirm(null),
        onConfirmLeave: () => confirm?.onConfirm?.(),
        toast: toast ? { text: toast } : null,
        setToast,
      }

      if (route === 'shelf' && !isSession) {
        return e(ShelfPage, {
          t,
          books,
          selected: shelfIndex,
          snapshot: shelfSnapshot,
          loading: scanState === 'loading',
          error: scanState === 'error' ? scanError : '',
          libraryDir,
          pickDirectory: props.pickDirectory,
          onCreated: handleCreated,
          onSelect: app.onShelfSelect,
          onOpen: app.onShelfOpen,
          onRescan: app.onRescan,
          rootRef,
          titlebarInset,
        })
      }

      return e('div', { className: `nw-root${titlebarInset ? ' is-mac-titlebar' : ''}`, ref: rootRef },
        e('style', null, CSS),
        e(WorkbenchPage, { app }),
        confirm ? e('div', { className: 'nw-layer', onClick: (event) => { if (event.target === event.currentTarget) setConfirm(null) } },
          e('div', { className: 'nw-dialog', role: 'dialog', 'aria-modal': 'true' },
            e('h2', { className: 'nw-dialog-title' }, confirm.title),
            e('p', { className: 'nw-dialog-body' }, confirm.body),
            e('div', { className: 'nw-dialog-actions' },
              e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onConfirmKeep }, confirm.keep),
              e('button', { type: 'button', className: 'nw-btn is-primary', onClick: app.onConfirmLeave }, confirm.leave),
            ),
          ),
        ) : null,
        exportOpen ? e(ExportDialog, {
          t,
          book: currentBook,
          journey: snapshot?.journey ?? null,
          format: exportFormat,
          state: exportState,
          error: exportError,
          result: exportResult,
          onFormat: setExportFormat,
          onExport: () => void runExport(),
          onAgain: () => void runExport(),
          onClose: closeExport,
        }) : null,
        app.toast ? e('div', { className: 'nw-toast', role: 'status', 'aria-live': 'polite' }, e('span', { className: 'nw-dot is-done' }), app.toast.text) : null,
      )
    }

    /**
     * The workbench shell: app bar, rail, directory, content card, context panel.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the shell.
     */
    function WorkbenchPage({ app }) {
      const { t, book, snapshot, category } = app
      const cat = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0]
      const bookTitle = book?.title ?? t('panel.tabTitle')
      const status = app.status
      const writingLabel = app.writing?.chapter && app.trackedWaiting && app.runningNow
        ? fill(t('workbench.waiting'), { no: app.writing.chapter })
        : app.writing?.chapter && app.runningNow
          ? fill(t('workbench.writing'), { no: app.writing.chapter })
          : app.writing?.chapter && app.writing.state === 'done'
            ? fill(t('workbench.done'), { no: app.writing.chapter })
            : app.writing?.state === 'error'
              ? t('write.failed')
              // A restored write has a chapter; a session that is still running
              // without one (started before this build, or lost storage) still
              // deserves a status instead of a silent disabled button.
              : app.trackedRunning
                ? t('workbench.writingUnknown')
                : ''
      const writingTone = app.trackedWaiting ? 'is-waiting' : app.runningNow ? 'is-writing' : app.writing?.state === 'error' ? 'is-error' : 'is-done'

      // One next step per screen: the overview's journey card and a chapter's
      // own empty state own the write action. The app bar carries only status,
      // never a second copy of the same CTA.
      const appbar = e('header', { className: 'nw-appbar' },
        app.isSession ? null : e(IconButton, { glyph: 'home', size: 18, label: t('workbench.back'), tipAlign: 'start', onClick: app.onBackShelf }),
        e(IconButton, { glyph: 'panelLeft', label: t('workbench.directory'), onClick: app.onToggleDirectory, ariaExpanded: app.directoryOpen }),
        e('div', { className: 'nw-divider' }),
        e('div', { className: 'nw-appbar-title' }, bookTitle),
        e('div', { className: 'nw-appbar-sub' }, book?.genre || ''),
        e('div', { className: 'nw-spacer' }),
        writingLabel ? e('button', {
          type: 'button',
          className: `nw-pill ${writingTone}`,
          role: 'status',
          'aria-live': 'polite',
          title: t('write.open'),
          disabled: !(app.writing?.sessionId ?? app.trackedSession),
          onClick: () => app.onOpenSession(app.writing?.sessionId ?? app.trackedSession),
        },
          app.runningNow && !app.trackedWaiting
            ? e('span', { className: 'nw-eq', 'aria-hidden': true }, e('i'), e('i'), e('i'))
            : e('span', { className: 'nw-pill-dot' }),
          writingLabel,
        ) : null,
        app.sessionError ? e('span', { className: 'nw-session-error', title: app.sessionError }, app.sessionError) : null,
        e(IconButton, { glyph: 'plus', label: t('workbench.newSession'), className: 'nw-hide-narrow', disabled: app.sessionOpening, onClick: app.onNewSession }),
        e(IconButton, { glyph: 'refresh', label: t('shelf.rescan'), className: 'nw-hide-narrow', onClick: app.onRescan }),
        e(IconButton, { glyph: 'panelRight', label: t('workbench.contextPanel'), tipAlign: 'end', onClick: app.onTogglePanel, ariaExpanded: app.panelOpen }),
      )

      if (!book) {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            app.scanState === 'loading'
              ? e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
              : e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noBook')), e('p', { className: 'nw-empty-body' }, t('workbench.openFirst'))),
          ))),
        )
      }
      if (app.snapState === 'loading' && !snapshot) {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading')),
          ))),
        )
      }
      if (app.snapState === 'error') {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.snapError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onRescan }, t('state.retry'))),
          ))),
        )
      }

      return e('div', { className: 'nw-workbench' },
        appbar,
        e('div', { className: 'nw-body' },
          e('aside', { className: 'nw-rail' }, CATEGORIES.map((item) => e('button', {
            key: item.id,
            type: 'button',
            className: `nw-rail-item ${category === item.id ? 'is-active' : ''}`,
            onClick: () => app.onCategory(item.id),
            title: t(item.labelKey),
            'aria-current': category === item.id ? 'page' : undefined,
          }, icon(item.icon, 20), e('span', { className: 'nw-rail-label' }, t(item.labelKey))))),
          e('div', { className: 'nw-work' },
            e(Directory, { app }),
            e('section', { className: 'nw-content' },
              e(ContentHeader, { app }),
              e('div', { className: 'nw-cbody' }, e(ContentView, { app })),
            ),
          ),
          e(ContextPanel, { app }),
        ),
      )
    }

    /**
     * Content header: breadcrumb, title, view switch, actions.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the header.
     */
    function ContentHeader({ app }) {
      const { t, selection, chapterView, characterView, file, readOnly } = app
      const bookTitle = app.book?.title ?? ''
      const isChapterEditing = Boolean(app.editing && selection?.kind === 'chapter')
      let crumbs = t('nav.overview')
      let title = t('workbench.overview')
      let meta = ''
      /** @type {any[]} */
      let tools = []
      const iconButton = (key, glyph, label, onClick, disabled) => e(IconButton, {
        key, glyph, label, onClick, disabled, tipAlign: 'end',
      })
      const saveActions = (prefix) => [
        e('button', { key: `${prefix}-cancel`, type: 'button', className: 'nw-btn is-secondary is-sm', onClick: app.onCancel }, t('workbench.cancel')),
        e('button', { key: `${prefix}-save`, type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.saving, onClick: app.onSave }, app.saving ? t('workbench.saving') : t('workbench.save')),
      ]
      // The view switch stays a tab bar at every width. Narrow toolbars wrap
      // onto a second row and the tab strip scrolls horizontally; a select
      // would hide the relationship between the tabs and the page.
      const viewControls = (options, value, onChange) => e('div', { key: 'views', className: 'nw-seg' },
        options.map(([id, label]) => e('button', {
          key: id, type: 'button', className: value === id ? 'is-active' : '', onClick: () => onChange(id),
        }, label)))
      if (selection?.kind === 'chapter') {
        const chapter = (app.snapshot?.chapters ?? []).find((item) => item.chapter === selection.chapter)
        const chapterOutline = app.snapshot?.chapterOutlines?.[String(selection.chapter)]?.data
        // The body owns the write CTA while it shows the matching empty state
        // (blank chapter, or a chapter without an outline), and the writing
        // scene owns it while the Agent works. Repeating it in the toolbar
        // would put two write actions on one screen.
        const bodyOwnsWrite = (chapterView === 'text' && !chapter?.hasText)
          || (chapterView === 'outline' && !chapterOutline)
        const sceneHere = Boolean(app.writing && app.writing.chapter === selection.chapter
          && (app.runningNow || app.writing.state === 'error'))
        crumbs = `${t('nav.manuscript')} › ${fill(t('workbench.chapterNo'), { no: selection.chapter })}${app.editing ? ` · ${t('workbench.editing')}` : ''}`
        // The page carries the chapter title while editing; repeating it in the
        // toolbar would turn the writing page back into a form header.
        title = app.editing ? '' : chapter?.title || fill(t('workbench.chapterNo'), { no: selection.chapter })
        meta = app.editing ? '' : chapter?.hasText ? fill(t('workbench.words'), { n: (chapter.words ?? 0).toLocaleString() }) : ''
        const actions = app.editing
          ? [
            e('button', { key: 'cancel', type: 'button', className: 'nw-btn is-ghost is-sm', onClick: app.onCancel }, t('workbench.cancel')),
            e('button', { key: 'finish', type: 'button', className: 'nw-btn is-secondary is-sm', disabled: app.saving, onClick: app.onFinish }, t('workbench.finish')),
            e('button', { key: 'save', type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.saving, onClick: app.onSave }, app.saving ? t('workbench.saving') : t('workbench.save')),
          ]
          : [
            iconButton('edit', 'edit', t('workbench.edit'), app.onEdit, !file || readOnly),
            iconButton('reload', 'refresh', t('workbench.reload'), app.onReload, !file),
            bodyOwnsWrite || sceneHere ? null : e('button', { key: 'write', type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(selection.chapter) }, icon('spark', 14), chapter?.hasText ? t('chapter.rewrite') : t('chapter.write')),
          ].filter(Boolean)
        tools = [
          // Switching views mid-edit would drop the draft, so the switch is
          // hidden while the manuscript is open for editing.
          ...(app.editing ? [] : [viewControls(
            [['text', 'chapter.text'], ['outline', 'chapter.outline'], ['review', 'chapter.review'], ['memory', 'chapter.memory']].map(([id, key]) => [id, t(key)]),
            chapterView,
            app.onChapterView,
          )]),
          ...actions,
        ]
      } else if (selection?.kind === 'character') {
        const character = (app.snapshot?.characters ?? []).find((item) => item.name === selection.name)
        crumbs = `${t('nav.settings')} › ${t('workbench.people')} › ${selection.name}`
        title = selection.name
        meta = STAGE_LABELS[character?.identity?.profileStage] ?? character?.identity?.profileStage ?? ''
        const actions = app.editing
          ? saveActions('character')
          : [e('button', { key: 'edit', type: 'button', className: 'nw-btn is-primary is-sm', disabled: !file || readOnly, onClick: app.onEdit }, icon('edit', 14), t('workbench.edit'))]
        tools = [
          viewControls(
            [['profile', t('character.profile')], ['state', t('character.state')]],
            characterView,
            app.onCharacterView,
          ),
          ...actions,
        ]
      } else if (selection?.kind === 'outline') {
        crumbs = `${t('nav.blueprint')} › ${t('workbench.outline')}`
        title = t('workbench.outline')
      } else if (selection?.kind === 'premise') {
        crumbs = `${t('nav.blueprint')} › ${t('workbench.premise')}`
        title = t('workbench.premise')
      } else if (selection?.kind === 'memory') {
        crumbs = `${t('nav.materials')} › ${t('workbench.memory')}`
        title = t('workbench.memory')
      } else if (selection?.kind === 'reviews') {
        crumbs = `${t('nav.materials')} › ${t('workbench.reviews')}`
        title = t('workbench.reviews')
      } else if (selection?.kind === 'tracking') {
        crumbs = `${t('nav.materials')} › ${t('workbench.tracking')}`
        title = t('workbench.tracking')
        tools = [
          viewControls(
            [['progress', t('tracking.progress')], ['summaries', t('tracking.summaries')], ['foreshadowing', t('tracking.foreshadowing')], ['characters', t('tracking.characters')]],
            app.trackingTab,
            app.onTrackingTab,
          ),
          e('button', {
            key: 'refresh', type: 'button', className: 'nw-btn is-secondary is-sm',
            disabled: app.trackingRefreshing,
            onClick: app.onRefreshTracking,
          }, icon('refresh', 14), app.trackingRefreshing ? t('tracking.refreshing') : t('tracking.refresh')),
        ]
      } else if (selection?.kind === 'world') {
        crumbs = `${t('nav.settings')} › ${t('workbench.world')} › ${selection.name}`
        title = selection.name
        tools = app.editing
          ? saveActions('world')
          : [e('button', { key: 'edit', type: 'button', className: 'nw-btn is-primary is-sm', disabled: !file || readOnly, onClick: app.onEdit }, icon('edit', 14), t('workbench.edit'))]
      } else if (selection?.kind === 'file') {
        crumbs = selection.label || selection.path
        title = selection.name || selection.label || selection.path
        tools = app.editing
          ? saveActions('file')
          : [
            iconButton('edit', 'edit', t('workbench.edit'), app.onEdit, !file || readOnly),
            iconButton('reload', 'refresh', t('workbench.reload'), app.onReload, !file),
          ]
      }
      const isOverview = !selection
      return e('div', { className: `nw-ctoolbar${isChapterEditing ? ' is-editing' : ''}` },
        e('div', { className: 'nw-ctoolbar-lead' },
          e('div', { className: 'nw-crumbs' }, isOverview ? `${bookTitle} › ${t('workbench.overview')}` : crumbs),
          title ? e('div', { className: 'nw-ctitle' }, isOverview ? t('workbench.overview') : title) : null,
        ),
        meta ? e('span', { className: 'nw-muted nw-hide-narrow' }, meta) : null,
        app.saveError ? e('span', { className: 'nw-muted', style: { color: 'var(--nw-danger)' } }, app.saveError) : null,
        app.saveError ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: app.onReload }, t('workbench.reload')) : null,
        app.saveNote && !isChapterEditing ? e('span', { className: 'nw-muted' }, app.saveNote) : null,
        readOnly ? e('span', { className: 'nw-tag is-plain' }, file?.truncated ? t('file.truncated') : t('workbench.readonly')) : null,
        e('div', { className: 'nw-ctools' }, tools),
      )
    }

    /**
     * The book's directory column.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the directory.
     */
    function Directory({ app }) {
      const { t, snapshot, category, selection, query, collapsed } = app
      if (category === 'overview') return null
      if (!snapshot) return e('aside', { className: `nw-directory ${app.directoryOpen ? 'is-open' : ''}` })
      const chapters = snapshot.chapters ?? []
      const volumes = snapshot.volumes ?? []
      const characters = snapshot.characters ?? []
      const world = snapshot.settings?.world ?? []
      const other = snapshot.settings?.other ?? []
      const references = snapshot.settings?.references ?? []
      const groups = []
      const activeChapter = selection?.kind === 'chapter' ? selection.chapter : null
      const activeName = selection?.kind === 'character' || selection?.kind === 'world' ? selection.name : null
      const activePath = selection?.kind === 'file' || selection?.kind === 'world' ? selection.path : null
      // The chapter currently being written is marked in the list, so leaving
      // the chapter page still shows where the Agent is working.
      const writingChapter = app.runningNow && app.writing?.chapter ? app.writing.chapter : null
      const matches = (value) => !query || String(value ?? '').toLowerCase().includes(query.toLowerCase())
      const row = (key, label, meta, active, onClick, dot, metaClass = '') => e('button', {
        key,
        type: 'button',
        className: `nw-row ${active ? 'is-active' : ''}`,
        onClick,
        'aria-current': active ? 'page' : undefined,
      },
        e('span', { className: `nw-dot ${dot ?? 'is-idle'}` }),
        e('span', { className: 'nw-row-label' }, label),
        meta ? e('span', { className: `nw-row-meta ${metaClass}`.trim() }, meta) : null,
      )
      if (category === 'manuscript') {
        const known = new Set(volumes.map((volume) => volume.volumeNo))
        const loose = chapters.filter((chapter) => chapter.volume === null || !known.has(chapter.volume))
        const volumeGroups = volumes.map((volume) => ({
          key: `v${volume.volumeNo}`,
          label: `${fill(t('workbench.volume'), { no: volume.volumeNo })}${volume.title ? ` · ${volume.title}` : ''}`,
          rows: chapters.filter((chapter) => chapter.volume === volume.volumeNo),
        })).filter((group) => group.rows.length > 0)
        if (loose.length > 0) volumeGroups.push({ key: 'loose', label: t('workbench.loose'), rows: loose })
        for (const group of volumeGroups) {
          groups.push({
            key: group.key,
            label: group.label,
            rows: group.rows.filter((chapter) => matches(chapter.title) || matches(fill(t('workbench.chapterNo'), { no: chapter.chapter }))).map((chapter) => row(
              `ch${chapter.chapter}`,
              `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} ${chapter.title}`,
              writingChapter === chapter.chapter ? t('write.writingShort') : chapter.hasText ? String(chapter.words) : '',
              activeChapter === chapter.chapter,
              () => app.onOpenChapter(chapter, 'text'),
              writingChapter === chapter.chapter ? 'is-writing' : chapter.hasText ? (chapter.review?.verdict === 'fail' ? 'is-plan' : 'is-done') : chapter.hasOutline ? 'is-plan' : 'is-idle',
              writingChapter === chapter.chapter ? 'is-live' : '',
            )),
          })
        }
      } else if (category === 'blueprint') {
        groups.push({ key: 'book', label: t('workbench.book'), rows: [
          row('outline', t('workbench.outline'), '', selection?.kind === 'outline', app.onOpenOutline, 'is-done'),
          row('premise', t('workbench.premise'), '', selection?.kind === 'premise', app.onOpenPremise, snapshot.premise ? 'is-done' : 'is-idle'),
        ] })
      } else if (category === 'settings') {
        if (characters.length > 0) groups.push({ key: 'characters', label: t('workbench.people'), rows: characters.filter((item) => matches(item.name)).map((item) => row(
          `char${item.name}`, item.name, STAGE_LABELS[item.identity?.profileStage] ?? '', activeName === item.name, () => app.onOpenCharacter(item), item.path ? 'is-done' : 'is-plan',
        )) })
        if (world.length > 0) groups.push({ key: 'world', label: t('workbench.world'), rows: world.filter((item) => matches(item.name)).map((item) => row(
          `world${item.name}`, item.name, formatBytes(item.bytes), activeName === item.name, () => app.onOpenWorld(item), 'is-done',
        )) })
        if (other.length > 0) groups.push({ key: 'other', label: t('workbench.other'), rows: other.filter((item) => matches(item.name)).map((item) => row(
          `other${item.path}`, item.name, formatBytes(item.bytes), activePath === item.path, () => app.onOpenFile(item.path, item.name), 'is-done',
        )) })
        groups.push({ key: 'instructions', label: t('workbench.instructions'), rows: [
          row('agents', 'AGENTS.md', snapshot.book?.agents ? '✓' : '', selection?.kind === 'file' && selection.path === 'AGENTS.md', () => app.onOpenFile('AGENTS.md', t('workbench.instructions')), snapshot.book?.agents ? 'is-done' : 'is-idle'),
        ] })
      } else if (category === 'materials') {
        groups.push({ key: 'tracking', label: t('workbench.tracking'), rows: [
          row('track-progress', t('tracking.progress'), '', selection?.kind === 'tracking' && app.trackingTab === 'progress', () => app.onOpenTracking('progress'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-summaries', t('tracking.summaries'), '', selection?.kind === 'tracking' && app.trackingTab === 'summaries', () => app.onOpenTracking('summaries'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-foreshadowing', t('tracking.foreshadowing'), '', selection?.kind === 'tracking' && app.trackingTab === 'foreshadowing', () => app.onOpenTracking('foreshadowing'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-characters', t('tracking.characters'), '', selection?.kind === 'tracking' && app.trackingTab === 'characters', () => app.onOpenTracking('characters'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-memo', t('tracking.memo'), snapshot.book?.memo ? '✓' : '', selection?.kind === 'file' && selection.path === 'tracking/写作备忘.md', () => app.onOpenMemo(), snapshot.book?.memo ? 'is-done' : 'is-idle'),
        ] })
        groups.push({ key: 'resources', label: t('workbench.book'), rows: [
          row('memory', t('workbench.memory'), String(snapshot.memoryRecords?.length ?? 0), selection?.kind === 'memory', app.onOpenMemory, 'is-done'),
          row('reviews', t('workbench.reviews'), String(snapshot.reviews?.length ?? 0), selection?.kind === 'reviews', app.onOpenReviews, 'is-done'),
        ] })
        if (references.length > 0) groups.push({ key: 'references', label: t('workbench.references'), rows: references.filter((item) => matches(item.name)).map((item) => row(
          `ref${item.path}`, item.name, formatBytes(item.bytes), activePath === item.path, () => app.onOpenFile(item.path, item.name), 'is-done',
        )) })
      }
      const total = groups.reduce((sum, group) => sum + group.rows.length, 0)
      const catLabel = t(CATEGORIES.find((item) => item.id === category)?.labelKey ?? 'nav.overview')
      // No second "next step" row and no second rescan button here: the app bar
      // owns the one rescan action and the overview owns the one next step.
      return e('aside', { className: `nw-directory ${app.directoryOpen ? 'is-open' : ''}` },
        e('div', { className: 'nw-dir-head' },
          e('h2', null, catLabel),
          e('span', { className: 'nw-dir-count' }, category === 'manuscript' ? fill(t('workbench.chapters'), { n: chapters.length }) : fill(t('workbench.settingsCount'), { n: total })),
        ),
        e('div', { className: 'nw-dir-search' }, icon('search', 14), e('input', { value: query, placeholder: t('workbench.search'), onChange: (event) => app.onQuery(event.target.value) })),
        e('div', { className: 'nw-dir-list' },
          groups.length === 0 ? e('div', { className: 'nw-empty', style: { minHeight: 120, padding: 20 } }, e('span', { className: 'nw-muted' }, t('nav.emptySection'))) : null,
          groups.map((group) => {
            const isCollapsed = collapsed[group.key] === true
            return e('div', { className: 'nw-group', key: group.key },
              e('button', { type: 'button', className: 'nw-group-head', onClick: () => app.onToggleGroup(group.key) },
                icon(isCollapsed ? 'chevronRight' : 'chevronDown', 13),
                group.label,
                e('span', { className: 'nw-group-count' }, String(group.rows.length)),
              ),
              isCollapsed ? null : group.rows,
            )
          }),
        ),
      )
    }
