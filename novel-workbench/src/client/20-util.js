    /**
     * GET one API route.
     * @param {string} route - route below the API base.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiGet(route) {
      const response = await fetch(API + route, { credentials: 'same-origin', headers: { accept: 'application/json' } })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * PUT one API route.
     * @param {string} route - route below the API base.
     * @param {unknown} body - JSON body.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiPut(route, body) {
      const response = await fetch(API + route, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * POST one API route.
     * @param {string} route - route below the API base.
     * @param {unknown} body - JSON body.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiPost(route, body) {
      const response = await fetch(API + route, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * Fill `{name}` placeholders.
     * @param {string} template - copy with placeholders.
     * @param {Record<string, string | number>} values - replacements.
     * @returns {string} filled copy.
     */
    function fill(template, values) {
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match))
    }

    /**
     * Human-readable byte size.
     * @param {number | null | undefined} bytes - byte count.
     * @returns {string} formatted size.
     */
    function formatBytes(bytes) {
      if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return '—'
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    }

    /**
     * Human-readable relative timestamp.
     * @param {number | null | undefined} time - epoch milliseconds.
     * @returns {string} a short relative or absolute label.
     */
    function formatTime(time, t) {
      if (typeof time !== 'number' || !Number.isFinite(time) || time <= 0) return '—'
      const tr = typeof t === 'function' ? t : (key) => ({ 'time.justNow': 'just now', 'time.minutes': 'min ago', 'time.hours': 'h ago' })[key] ?? key
      const delta = Date.now() - time
      if (delta < 60_000) return tr('time.justNow')
      if (delta < 3_600_000) return `${Math.round(delta / 60_000)} ${tr('time.minutes')}`
      if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)} ${tr('time.hours')}`
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
