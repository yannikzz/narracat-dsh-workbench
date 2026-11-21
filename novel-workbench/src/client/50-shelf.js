    /**
     * Stable hash for a book's generated cover.
     * @param {string} value - book title + folder.
     * @returns {number} unsigned 32-bit hash.
     */
    function hashString(value) {
      let hash = 2166136261
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
      }
      return hash >>> 0
    }

    /**
     * Pick a deterministic cover treatment for one book.
     * @param {object} book - scanned book row.
     * @returns {{ bg: string, ink: string, accent: string, pattern: string, vertical: boolean, seal: string }} cover spec.
     */
    function coverSpec(book) {
      const seed = hashString(`${book?.title ?? ''}|${book?.relDir ?? ''}`)
      const palette = COVER_PALETTES[seed % COVER_PALETTES.length]
      const title = String(book?.title ?? '书')
      return {
        ...palette,
        vertical: ((seed >> 7) & 1) === 0,
        seal: Array.from(title)[0] ?? '书',
        seed,
      }
    }

    /**
     * Deterministic rain lines for a cover.
     * @param {number} seed - cover hash.
     * @returns {any[]} line elements.
     */
    function rainLines(seed) {
      const lines = []
      for (let index = 0; index < 22; index += 1) {
        const left = (index * 4.7 + (seed % 17)) % 96
        const top = (index * 7.3) % 22 - 8
        const height = 22 + ((index * 13 + seed) % 52)
        const opacity = 0.14 + ((index * 7) % 26) / 100
        lines.push(e('i', {
          key: index,
          style: { left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%`, height: `${height}%`, opacity: opacity.toFixed(2) },
        }))
      }
      return lines
    }

    /**
     * Generated book cover. Reused by the shelf, overview, and panel.
     * @param {{ book: object, spec?: object, className?: string }} props - book + optional spec.
     * @returns {any} the cover element.
     */
    function CoverArt(props) {
      const book = props.book
      const spec = props.spec ?? coverSpec(book)
      const art = spec.pattern === 'rain'
        ? e('div', { className: 'nw-rain' }, rainLines(spec.seed ?? coverSpec(book).seed))
        : spec.pattern === 'sun'
          ? [
            e('span', { className: 'nw-sun', key: 'sun' }),
            e('span', { className: 'nw-horizon', key: 'horizon' }),
          ]
          : [
            e('span', { className: 'nw-ring', key: 'ring' }),
            e('span', { className: 'nw-ring is-small', key: 'ring-small' }),
            e('svg', { className: 'nw-bird', viewBox: '0 0 60 30', 'aria-hidden': true, key: 'bird' }, e('path', { d: 'M2 24C12 12 20 9 29 16c7 5 14 6 29-4' })),
          ]
      return e('div', {
        className: `nw-cover ${props.className ?? ''}`,
        style: { '--cbg': spec.bg, '--cink': spec.ink, '--caccent': spec.accent },
      },
        e('div', { className: 'nw-cover-art' }, art),
        e('span', { className: 'nw-cover-mark' }, 'NARRA'),
        e('span', { className: `nw-cover-title ${spec.vertical ? 'is-vertical' : 'is-horizontal'}` }, book?.title ?? ''),
        e('span', { className: 'nw-cover-seal' }, spec.seal ?? '书'),
        e('div', { className: 'nw-cover-sheen' }),
        e('div', { className: 'nw-cover-grain' }),
        e('div', { className: 'nw-cover-spine' }),
        e('div', { className: 'nw-cover-edge' }),
      )
    }

    /**
     * Pointer tilt for the featured cover. Writes CSS variables directly so the
     * page does not re-render on every pointer move.
     * @param {any} galleryRef - gallery element ref.
     * @param {any} heroRef - featured card ref.
     * @param {boolean} enabled - skip when reduced motion or no book.
     */
    function useShelfTilt(galleryRef, heroRef, enabled) {
      useEffect(() => {
        const gallery = galleryRef.current
        if (!gallery || !enabled) return undefined
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
        const onMove = (event) => {
          const hero = heroRef.current
          if (!hero) return
          const rect = gallery.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return
          const x = (event.clientX - rect.left) / rect.width - 0.5
          hero.style.setProperty('--tilt', `${(x * 3.6).toFixed(2)}deg`)
        }
        const onLeave = () => {
          const hero = heroRef.current
          if (!hero) return
          hero.style.setProperty('--tilt', '0deg')
        }
        gallery.addEventListener('pointermove', onMove)
        gallery.addEventListener('pointerleave', onLeave)
        return () => {
          gallery.removeEventListener('pointermove', onMove)
          gallery.removeEventListener('pointerleave', onLeave)
        }
      }, [galleryRef, heroRef, enabled])
    }

    /**
     * The create-book dialog: a title, an optional sentence, a plan, and where
     * the folder goes. It creates the book and hands it back to the page.
     * @param {object} props - form state and callbacks.
     * @returns {any} the modal.
     */
    function CreateBookDialog(props) {
      const { t, form, setForm, creating, error, location } = props
      const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !creating) props.onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [creating, props.onClose])
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget && !creating) props.onClose() },
      },
        e('div', { className: 'nw-dialog is-wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('create.title') },
          e('h2', { className: 'nw-dialog-title' }, t('create.title')),
          e('p', { className: 'nw-dialog-body' }, t('create.lead')),
          e('div', { className: 'nw-form' },
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.name')),
              e('input', {
                className: 'nw-input', value: form.title, placeholder: t('create.nameHint'),
                autoFocus: true, onChange: set('title'),
              }),
            ),
            e('div', { className: 'nw-form-grid' },
              e('label', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('create.genre')),
                e('input', { className: 'nw-input', value: form.genre, placeholder: t('create.genreHint'), onChange: set('genre') }),
              ),
              e('label', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('create.words')),
                e('select', { className: 'nw-select', value: String(form.words), onChange: set('words') },
                  [1500, 2000, 3000, 4000, 5000].map((value) => e('option', { key: value, value: String(value) }, `${value.toLocaleString()} 字`)),
                ),
              ),
            ),
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.chapters')),
              e('input', { className: 'nw-input', type: 'number', min: 1, max: 2000, value: form.chapters, onChange: set('chapters') }),
            ),
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, `${t('create.idea')} · ${t('create.optional')}`),
              e('textarea', { className: 'nw-textarea', value: form.idea, placeholder: t('create.ideaHint'), onChange: set('idea') }),
            ),
            e('div', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.location')),
              e('div', { className: 'nw-path' },
                e('span', null, location || t('create.defaultLocation')),
                props.onChangeLocation
                  ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: props.onChangeLocation }, t('create.changeLocation'))
                  : null,
              ),
            ),
            error ? e('div', { className: 'nw-form-error' }, error) : null,
            e('p', { className: 'nw-form-note' }, t('create.hint')),
          ),
          e('div', { className: 'nw-dialog-actions' },
            e('button', { type: 'button', className: 'nw-btn is-secondary', disabled: creating, onClick: props.onClose }, t('create.cancel')),
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: creating, onClick: props.onSubmit }, creating ? t('create.creating') : t('create.submit')),
          ),
        ),
      )
    }

    /**
     * Contact-author popup: a short bio, the open-source GitHub link and the
     * two QR codes from the NarraCat website. Kept as one small dialog on the
     * shelf so it is one click away without becoming a permanent banner.
     * @param {{ t: Function, onClose: Function }} props - copy and close.
     * @returns {any} the modal.
     */
    function ContactAuthorDialog(props) {
      const { t, onClose } = props
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      const card = (src, alt, label) => e('figure', { className: 'nw-qr-card' },
        e('img', { className: 'nw-qr-img', src, alt }),
        e('figcaption', null,
          e('b', null, label),
          e('span', null, t('contact.scan')),
        ),
      )
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget) onClose() },
      },
        e('div', {
          className: 'nw-dialog nw-contact-dialog',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('contact.title'),
        },
          e(IconButton, {
            glyph: 'close',
            label: t('contact.close'),
            className: 'nw-contact-close',
            plain: true,
            tipAlign: 'end',
            autoFocus: true,
            onClick: onClose,
          }),
          e('div', { className: 'nw-contact-head' },
            e('img', { className: 'nw-contact-avatar', src: AUTHOR_AVATAR, alt: t('contact.avatarAlt') }),
            e('div', null,
              e('h2', { className: 'nw-contact-name' }, 'Yannik'),
              e('span', { className: 'nw-contact-role' }, t('contact.role')),
            ),
          ),
          e('p', { className: 'nw-contact-bio' }, t('contact.bio')),
          e('a', {
            className: 'nw-contact-github',
            href: AUTHOR_GITHUB,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, icon('external', 14), t('contact.github')),
          e('section', { className: 'nw-pro-card' },
            e('div', { className: 'nw-pro-copy' },
              e('h3', { className: 'nw-pro-title' }, t('contact.proTitle')),
              e('p', { className: 'nw-pro-body' }, t('contact.proBody')),
              e('p', { className: 'nw-pro-note' }, t('contact.proReq')),
            ),
            e('div', { className: 'nw-pro-actions' },
              e('a', { className: 'nw-pro-primary', href: NARRACAT_DOWNLOAD_MAC, target: '_blank', rel: 'noopener noreferrer' }, t('contact.downloadMac')),
              e('a', { className: 'nw-pro-primary', href: NARRACAT_DOWNLOAD_WIN, target: '_blank', rel: 'noopener noreferrer' }, t('contact.downloadWin')),
              e('a', { className: 'nw-pro-site', href: NARRACAT_SITE, target: '_blank', rel: 'noopener noreferrer' }, icon('external', 13), t('contact.visitSite')),
            ),
          ),
          e('div', { className: 'nw-contact-hint' }, t('contact.hint')),
          e('div', { className: 'nw-contact-qrs' },
            card(AUTHOR_QR_XHS, t('contact.qrAltXhs'), t('contact.xhs')),
            card(AUTHOR_QR_WECHAT, t('contact.qrAltWechat'), t('contact.wechat')),
          ),
          e('p', { className: 'nw-contact-foot' }, t('contact.foot')),
        ),
      )
    }

    /**
     * Shelf poster: one featured cover, a fan of side covers, and an index.
     * @param {object} props - t, books, selected, snapshot, callbacks, state.
     * @returns {any} the shelf page.
     */
    function ShelfPage(props) {
      const t = props.t
      const rootClass = `nw-root${props.titlebarInset ? ' is-mac-titlebar' : ''}`
      const rootProps = { className: rootClass, ref: props.rootRef }
      const books = Array.isArray(props.books) ? props.books : []
      const n = books.length
      const index = n === 0 ? 0 : Math.max(0, Math.min(n - 1, props.selected))
      const book = books[index] ?? null
      const spec = book ? coverSpec(book) : null
      const snapshot = props.snapshot ?? null
      const galleryRef = useRef(null)
      const heroRef = useRef(null)
      const activeIndexRef = useRef(null)
      useShelfTilt(galleryRef, heroRef, Boolean(book) && !props.loading && !props.error)

      useEffect(() => {
        const row = activeIndexRef.current
        if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
      }, [index, n])

      const [createOpen, setCreateOpen] = useState(false)
      const [createForm, setCreateForm] = useState({ title: '', genre: '', idea: '', chapters: 20, words: 3000, parent: '' })
      const [creating, setCreating] = useState(false)
      const [createError, setCreateError] = useState('')
      const [contactOpen, setContactOpen] = useState(false)
      const location = createForm.parent || props.libraryDir || ''
      const openCreate = () => {
        setCreateError('')
        setCreateForm((current) => ({ ...current, parent: current.parent || props.libraryDir || '' }))
        setCreateOpen(true)
      }
      const closeCreate = () => { if (!creating) setCreateOpen(false) }
      const submitCreate = async () => {
        if (!createForm.title.trim()) { setCreateError(t('create.required')); return }
        setCreating(true)
        setCreateError('')
        try {
          const created = await apiPost('create-book', {
            title: createForm.title.trim(),
            genre: createForm.genre.trim(),
            idea: createForm.idea.trim(),
            plannedChapters: Math.max(1, Math.min(2000, Number(createForm.chapters) || 20)),
            wordsPerChapter: Math.max(300, Math.min(20000, Number(createForm.words) || 3000)),
            parentDir: createForm.parent || undefined,
          })
          setCreateOpen(false)
          // The book exists now; refreshing the shelf and opening it continue in
          // the background, so the dialog never lingers behind a warning.
          try {
            await props.onCreated(created)
          } catch (error) {
            console.warn('novel: opening the created book failed', error)
          }
        } catch (error) {
          setCreateError(error instanceof Error ? error.message : String(error))
        } finally {
          setCreating(false)
        }
      }
      const pickLocation = async () => {
        const picked = await props.pickDirectory?.()
        if (picked) setCreateForm((current) => ({ ...current, parent: picked }))
      }
      const contactDialog = contactOpen ? e(ContactAuthorDialog, { t, onClose: () => setContactOpen(false) }) : null
      const dialog = createOpen
        ? e(CreateBookDialog, {
          t,
          form: createForm,
          setForm: setCreateForm,
          creating,
          error: createError,
          location,
          onChangeLocation: props.pickDirectory ? pickLocation : null,
          onSubmit: submitCreate,
          onClose: closeCreate,
        })
        : null

      useEffect(() => {
        // A dialog owns the keyboard while it is open; otherwise Enter on its
        // buttons would also trigger the shelf's open-book shortcut and unmount
        // the dialog with its form.
        if (!book || props.loading || props.error || createOpen || contactOpen) return undefined
        const onKey = (event) => {
          const target = event.target
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
          if (event.metaKey || event.ctrlKey || event.altKey) return
          if (event.key === 'ArrowLeft') { event.preventDefault(); props.onSelect((index - 1 + n) % n) }
          else if (event.key === 'ArrowRight') { event.preventDefault(); props.onSelect((index + 1) % n) }
          else if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); props.onOpen() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [book, index, n, props.loading, props.error, props.onSelect, props.onOpen, createOpen, contactOpen])

      const lastWheel = useRef(0)
      const onWheel = (event) => {
        if (!book) return
        if (Math.abs(event.deltaY) < 16 && Math.abs(event.deltaX) < 16) return
        const now = Date.now()
        if (now - lastWheel.current < 480) return
        lastWheel.current = now
        const forward = (event.deltaX || event.deltaY) > 0
        props.onSelect((index + (forward ? 1 : -1) + n) % n)
      }

      const written = book?.writtenChapters ?? 0
      const total = book?.totalChapters ?? 0
      const status = !book || written === 0
        ? t('shelf.status.empty')
        : total > 0 && written >= total
          ? t('shelf.status.done')
          : t('shelf.status.writing')
      const synopsis = snapshot?.outline?.synopsis
        || snapshot?.premise?.cards?.find((card) => card?.card === 'core_hook')?.fields?.[0]?.value
        || t('shelf.noSynopsis')
      const words = snapshot?.status?.totalWords
      const next = snapshot?.status?.nextChapter
      const journeyAction = snapshot?.journey?.action ?? null
      const cta = journeyAction?.kind === 'write' && next
        ? fill(t('shelf.continue'), { no: next })
        : journeyAction?.label ?? t('shelf.open')
      const left = n > 1 ? (index - 1 + n) % n : null
      const right = n > 2 ? (index + 1) % n : null
      const number = String(index + 1).padStart(2, '0')
      const accent = spec?.accent ?? '#9a958d'

      const bar = e('header', { className: 'nw-topbar' },
        e('div', { className: 'nw-brand' },
          e('img', { className: 'nw-logo', src: NARRACAT_LOGO, alt: 'NarraCat' }),
          e('span', { className: 'nw-brand-name' }, t('brand.name')),
          e('span', { className: 'nw-brand-dot' }),
        ),
        e('div', { className: 'nw-spacer' }),
        e('div', { className: 'nw-topbar-actions' },
          e('a', { className: 'nw-pro-entry nw-hide-narrow', href: NARRACAT_SITE, target: '_blank', rel: 'noopener noreferrer' }, icon('external', 13), t('contact.proEntry')),
          e('button', { type: 'button', className: 'nw-contact-entry', onClick: () => setContactOpen(true) }, icon('users', 13), t('contact.entry')),
          e('button', { type: 'button', className: 'nw-rescan', onClick: props.onRescan }, icon('refresh', 13), t('shelf.rescan')),
        ),
      )

      if (props.loading && n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-loading' }, e('span', { className: 'nw-spinner' }), t('shelf.loading')),
          ),
          dialog,
          contactDialog,
        )
      }
      if (props.error && n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-empty' },
              e('div', { className: 'nw-shelf-empty-inner' },
                e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
                e('h1', { className: 'nw-shelf-empty-title' }, t('shelf.error')),
                e('p', { className: 'nw-shelf-empty-body' }, String(props.error)),
                e('div', { className: 'nw-actions' }, e('button', { type: 'button', className: 'nw-cta', onClick: props.onRescan }, t('shelf.rescan'), e('span', { className: 'nw-cta-arrow' }, '→'))),
              ),
            ),
          ),
          dialog,
          contactDialog,
        )
      }
      if (n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-empty' },
              e('div', { className: 'nw-shelf-empty-inner' },
                e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
                e('h1', { className: 'nw-shelf-empty-title' }, t('shelf.empty.title')),
                e('p', { className: 'nw-shelf-empty-body' }, t('shelf.empty.body')),
                e('div', { className: 'nw-meta', style: { marginTop: 18 } }, t('shelf.empty.hint')),
                e('div', { className: 'nw-actions', style: { marginTop: 30, display: 'flex', alignItems: 'center', gap: 14 } },
                  e('button', { type: 'button', className: 'nw-cta', onClick: openCreate }, t('shelf.newBook'), e('span', { className: 'nw-cta-arrow' }, '→')),
                ),
              ),
            ),
          ),
          dialog,
          contactDialog,
        )
      }

      const side = (sideIndex, className) => {
        if (sideIndex === null) return null
        const sideBook = books[sideIndex]
        return e('button', {
          key: `side-${sideBook.key}-${className}`,
          type: 'button',
          className: `nw-card is-side ${className}`,
          onClick: () => props.onSelect(sideIndex),
          'aria-label': `${t('shelf.open')} ${sideBook.title}`,
        },
          e(CoverArt, { book: sideBook }),
          e('span', { className: 'nw-card-caption' }, sideBook.title),
        )
      }

      return e('div', rootProps, e('style', null, CSS),
        e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
          bar,
          e('main', { className: 'nw-stage' },
            e('section', { className: 'nw-copy' },
              e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
              e('h1', { key: `title-${book.key}`, className: 'nw-book-title' }, book.title),
              e('p', { key: `synopsis-${book.key}`, className: 'nw-synopsis' }, synopsis),
              e('div', { className: 'nw-meta' },
                e('span', null, book.genre || '—'),
                e('span', { className: 'nw-meta-dot' }),
                e('span', null, `${written} / ${total || '?'} 章`),
                words ? e('span', { className: 'nw-meta-dot' }) : null,
                words ? e('span', null, fill(t('workbench.words'), { n: words.toLocaleString() })) : null,
                e('span', { className: 'nw-meta-dot' }),
                e('span', null, status),
              ),
              e('div', { className: 'nw-actions' },
                e('button', { type: 'button', className: 'nw-cta', onClick: props.onOpen }, cta, e('span', { className: 'nw-cta-arrow' }, '→')),
                e('button', { type: 'button', className: 'nw-newbook', onClick: openCreate }, icon('plus', 13), t('shelf.newBook')),
              ),
            ),
            e('div', { className: 'nw-index' },
              e('div', { className: 'nw-index-head' }, e('span', null, t('shelf.index')), e('span', null, String(n).padStart(2, '0'))),
              e('div', { className: 'nw-index-list' }, books.map((row, rowIndex) => e('button', {
                key: row.key,
                type: 'button',
                ref: rowIndex === index ? activeIndexRef : undefined,
                className: `nw-irow ${rowIndex === index ? 'is-active' : ''}`,
                onClick: () => props.onSelect(rowIndex),
                style: { '--nw-accent': coverSpec(row).accent },
              },
                e('span', { className: 'nw-irow-num' }, String(rowIndex + 1).padStart(2, '0')),
                e('span', { className: 'nw-irow-title' }, row.title),
                e('span', { className: 'nw-irow-meta' }, `${row.writtenChapters ?? 0} / ${row.totalChapters || '?'}`),
                e('span', { className: 'nw-irow-arrow' }, '↗'),
              ))),
            ),
            e('section', { className: 'nw-gallery', ref: galleryRef, onWheel },
              e('div', { className: 'nw-glow' }),
              e('div', { key: `number-${number}`, className: 'nw-big-number' }, number),
              e('span', { className: 'nw-hairline' }),
              e('div', { className: 'nw-fan' },
                side(left, 'is-left'),
                e('button', {
                  key: `hero-${book.key}`,
                  type: 'button',
                  className: 'nw-card is-hero',
                  ref: heroRef,
                  onClick: props.onOpen,
                  'aria-label': `${t('shelf.openWorkbench')} · ${book.title}`,
                },
                  e(CoverArt, { book, spec }),
                  e('div', { className: 'nw-open-veil' }, e('span', null, t('shelf.openWorkbench')), e('span', null, '↗')),
                ),
                side(right, 'is-right'),
              ),
              e('div', { className: 'nw-gallery-hint' }, fill(t('shelf.switchHint'), { n })),
            ),
          ),
          e('div', { className: 'nw-footer' }, e('span', null, t('brand.upper')), e('button', { type: 'button', className: 'nw-footer-contact', onClick: () => setContactOpen(true) }, t('contact.entry')), e('span', null, `${number} / ${String(n).padStart(2, '0')}`)),
        ),
        dialog,
        contactDialog,
      )
    }
