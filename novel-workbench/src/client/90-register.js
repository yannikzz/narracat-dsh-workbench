    return {
      inject: ['slots', 'locale', 'uiWorkspace', 'sidebarRightTabs', 'sessions', 'remote', 'remote.session', 'layout'],
      apply(ctx) {
        /** @type {Array<() => void>} */
        const disposers = []
        for (const [locale, dictionary] of Object.entries({ zh, en })) {
          try {
            disposers.push(ctx.locale.register(NS, locale, dictionary))
          } catch {
            // An older Client without incremental registration still renders the
            // built-in Chinese copy below.
          }
        }
        ctx.effect(() => () => { for (const dispose of disposers) dispose() }, 'novel-workbench: dictionaries')

        const translate = ctx.locale.bind(NS)
        const t = (key) => {
          const value = translate(key)
          return value === key ? (zh[key] ?? key) : value
        }

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'novel-workbench',
          locale: NS,
          inject: () => ({
            mode: 'page',
            t,
            writeChapter,
            runPrompt,
            openWritingSession,
            readWritingSessionId: readStoredSession,
            pickDirectory: async () => {
              const api = ctx.get('uiWorkspace')
              if (!api || typeof api.pickDirectory !== 'function') return null
              try {
                return await api.pickDirectory()
              } catch {
                return null
              }
            },
            startWritingSession: async (book) => {
              // Open a blank session rooted at this exact book. `session.create`
              // takes a Workspace or an explicit cwd, not both; a nested book
              // needs its own cwd or agent tools cannot tell books apart.
              if (!book) return { ok: false, error: t('session.unavailable') }
              try {
                const sessionId = await ensureSession(book, { fresh: true })
                openWritingSession(sessionId)
                openNovelPanelSoon()
                return { ok: true, sessionId }
              } catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) }
              }
            },
          }),
        }, NovelApp))

        // ---- background writing: one reusable session per book -------------
        /** In-memory fallback for the writing-session id when localStorage is absent. */
        const writingSessionFallback = new Map()
        const sessionKeyOf = (book) => `dsh.novel.write:${book.root}|${book.relDir}`
        const readStoredSession = (book) => {
          const fallback = writingSessionFallback.get(sessionKeyOf(book)) ?? null
          try {
            return globalThis.localStorage?.getItem(sessionKeyOf(book)) ?? fallback
          } catch {
            return fallback
          }
        }
        const storeSession = (book, sessionId) => {
          writingSessionFallback.set(sessionKeyOf(book), sessionId)
          try { globalThis.localStorage?.setItem(sessionKeyOf(book), sessionId) } catch { /* private mode */ }
        }
        const mintRequestId = () => (globalThis.crypto?.randomUUID?.()
          ?? `novel-${Date.now()}-${Math.random().toString(16).slice(2)}`)

        /** The Session target for one book: its own Workspace when the book is
         *  the workspace root, otherwise an explicit cwd so agent tools resolve
         *  exactly this book even in a multi-book workspace. */
        const targetOf = (book) => {
          const same = barePath(book.dir) === barePath(book.root)
          return same && book.workspaceId ? { workspaceId: book.workspaceId } : { cwd: book.dir }
        }

        /**
         * Reuse the book's writing Session, or create one rooted at the book.
         * Primary path: the remote session RPC with an explicit book cwd.
         * Fallback: the workspace UI service, for builds where that RPC is not
         * injected or rejects a nested book cwd. The agent tools still resolve
         * the book from the workspace, and the + button stops failing.
         */
        const ensureSession = async (book, options = {}) => {
          const remote = ctx.get('remote')
          const session = remote && remote.session
          const stored = options.fresh ? null : readStoredSession(book)
          let remoteError = null
          if (session && typeof session.create === 'function' && typeof session.prompt === 'function') {
            try {
              const created = await session.create({
                ...targetOf(book),
                ...(stored ? { sessionId: stored } : {}),
                agentPreset: 'novel',
              })
              // The DSH remote face returns RemoteResult<{ sessionId }>; some
              // builds unwrap it. Accept both shapes so a created Session is
              // not mistaken for a failure (and no orphan is left behind).
              if (created && created.ok === false) throw new Error(created.error?.message ?? t('write.noSession'))
              const sessionId = created?.sessionId ?? created?.value?.sessionId ?? stored
              if (sessionId) {
                storeSession(book, sessionId)
                return sessionId
              }
            } catch (error) {
              remoteError = error
            }
          }
          const workspaceUi = ctx.get('uiWorkspace')
          if (workspaceUi && typeof workspaceUi.connectWorkspace === 'function' && book.workspaceId) {
            const sessionId = stored ?? await workspaceUi.connectWorkspace(book.workspaceId, { agentPreset: 'novel' })
            if (!sessionId) throw new Error(t('write.noSession'))
            storeSession(book, sessionId)
            return sessionId
          }
          if (remoteError) throw remoteError
          throw new Error(t('write.unavailable'))
        }

        /**
         * Admit one prompt through the Client session face. `remote.session` is
         * not part of every client profile; `sessions.using()` + the binding's
         * ISession.prompt() is the supported path. The remote fallback stays for
         * hosts that expose only the RPC.
         * @param {string} sessionId - writing Session id.
         * @param {string} text - prompt text.
         * @returns {Promise<void>} resolves once the prompt is admitted.
         */
        const promptSession = async (sessionId, text) => {
          const sessions = ctx.get('sessions')
          if (sessions && typeof sessions.using === 'function') {
            await sessions.using(sessionId, { source: 'gateway' }, async (reference) => {
              await reference.ready
              const result = await reference.binding.session.prompt(
                [{ type: 'text', text }], 'queue', undefined, mintRequestId(),
              )
              if (!result || result.ok === false) {
                throw new Error(result?.error?.message ?? t('write.failed'))
              }
            })
            return
          }
          const remote = ctx.get('remote')
          if (remote?.session && typeof remote.session.prompt === 'function') {
            const result = await remote.session.prompt({
              requestId: mintRequestId(),
              sessionId,
              mode: 'queue',
              content: [{ type: 'text', text }],
            })
            if (result && result.ok === false) throw new Error(result.error?.message ?? t('write.failed'))
            return
          }
          throw new Error(t('write.unavailable'))
        }

        /**
         * Start writing one chapter in a background Session: reuse the book's
         * writing Session (linear writing keeps one conversation per book), or
         * create it, then admit the prompt without opening the Session.
         * @param {object} book - scanned book row.
         * @param {number} chapter - chapter to write.
         * @param {{ hasText?: boolean, hasOutline?: boolean }} [state] - chapter state.
         * @returns {Promise<{ sessionId: string }>} the writing Session.
         */
        const writeChapter = async (book, chapter, state = {}) => {
          const sessionId = await ensureSession(book)
          const prompt = state.hasText
            ? `第 ${chapter} 章已经有正文。我想改这一章：先打开改写稿，按我的要求改，改完保存好再告诉我；不要直接改正式正文。先问我最想改哪一点。`
            : state.hasOutline === false
              ? `写第 ${chapter} 章。本章还没有章纲：先补一份简短的章纲（场景、冲突、收束），再看本章资料动笔；写完保存好，告诉我结果。`
              : `写第 ${chapter} 章。先看这本书的写作现状和本章资料，按前面定下的写法写完、保存好，再告诉我结果。`
          await promptSession(sessionId, prompt)
          return { sessionId }
        }

        /**
         * Send one guided prompt into the book's writing Session and (optionally)
         * bring that Session on screen. Setup and outline need a conversation,
         * so the workbench uses this instead of a background write.
         */
        const runPrompt = async (book, prompt, options = {}) => {
          const sessionId = await ensureSession(book)
          await promptSession(sessionId, String(prompt ?? ''))
          if (options.open !== false) {
            openWritingSession(sessionId)
            openNovelPanelSoon()
          }
          return { sessionId }
        }

        /** Bring the writing Session on screen. */
        const openWritingSession = (sessionId) => {
          const workspaceUi = ctx.get('uiWorkspace')
          if (!workspaceUi || typeof workspaceUi.openSession !== 'function' || !sessionId) return
          workspaceUi.openSession(sessionId)
        }

        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'novel-workbench',
          order: 20,
          label: () => t('view.label'),
          locale: NS,
          inject: () => ({
            t,
            mode: 'session',
            writeChapter,
            runPrompt,
            openWritingSession,
            readWritingSessionId: readStoredSession,
            startWritingSession: async (book) => {
              if (!book) return { ok: false, error: t('session.unavailable') }
              try {
                const sessionId = await ensureSession(book, { fresh: true })
                openWritingSession(sessionId)
                openNovelPanelSoon()
                return { ok: true, sessionId }
              } catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) }
              }
            },
          }),
        }, NovelApp))

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'novel-workbench',
          order: 40,
          label: () => t('panel'),
          locale: NS,
          inject: () => ({ t }),
        }, PanelIcon))

        /** Open the right-sidebar novel panel once a Session is on screen. */
        const openNovelPanelSoon = () => {
          let tries = 0
          const attempt = () => {
            tries += 1
            const sidebar = ctx.get('sidebarRight')
            if (sidebar && typeof sidebar.openTab === 'function') {
              try {
                sidebar.openTab(NOVEL_PANEL_KIND)
                return
              } catch {
                // The Session may not be mounted yet; retry a few times.
              }
            }
            if (tries < 6) setTimeout(attempt, 400)
          }
          setTimeout(attempt, 300)
        }

        // Right-sidebar page type: the novel panel beside the conversation.
        ctx.effect(() => {
          const tabs = ctx.get('sidebarRightTabs')
          if (!tabs || typeof tabs.register !== 'function') return () => {}
          return tabs.register({
            id: NOVEL_PANEL_ID,
            kind: NOVEL_PANEL_KIND,
            priority: 'builtin',
            title: () => t('panel.tabTitle'),
          })
        }, 'novel: sidebar panel type')
        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: NOVEL_PANEL_ID,
          locale: NS,
          inject: () => ({
            t,
            openFull: (target) => {
              // The panel can ask the full workbench to open one section. The
              // request is consumed once by NovelApp when it next mounts.
              if (target) writePendingView({ ...target })
              const layout = ctx.get('layout')
              if (layout && typeof layout.selectPanel === 'function') layout.selectPanel('novel-workbench')
            },
          }),
        }, NovelSidebarPanel))
        ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: NOVEL_PANEL_ID,
          locale: NS,
          inject: () => ({ t }),
        }, PanelTitle))
        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'novel-panel',
          order: -6,
          label: () => t('panel.tabTitle'),
          locale: NS,
          inject: (sessionId) => ({
            t,
            sessionId,
            open: () => {
              const sidebar = ctx.get('sidebarRight')
              if (!sidebar || typeof sidebar.openTab !== 'function') return
              try {
                sidebar.openTab(NOVEL_PANEL_KIND)
              } catch (error) {
                console.warn('novel panel open failed', error)
              }
            },
          }),
        }, NovelPanelButton))
      },
    }
  },
})
