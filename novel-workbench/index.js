/**
 * Novel workbench — Host half.
 *
 * Serves a small same-origin JSON API over the Narracat `.narracat` project
 * layout so the browser half can browse a book and edit its text files. The
 * routes are auth-fenced by the composition's `connection` service (login
 * cookie + Host/Origin fence) and every path is re-resolved inside a
 * registered Workspace, inside a book directory.
 *
 * @module narracat-dsh-workbench
 */

import { realpath } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import {
  ApiError,
  bookStamp,
  buildSnapshot,
  isBookDir,
  MAX_READ_BYTES,
  MAX_WRITE_BYTES,
  readBookFile,
  resolveBook,
  scanRoot,
  writeBookFile,
} from './lib/project.js'
import { createBook, DEFAULT_LIBRARY_DIR, isInside, shortPath } from './lib/book-create.js'
import { computeJourney } from './lib/journey.js'
import { trackingModel } from './lib/tracking.js'
import { refreshTracking } from './lib/tracking-store.js'
import { exportBook, readExportFile } from './lib/export.js'

/** Base path every route below shares. Prefix routes take no trailing slash. */
const BASE = '/novel-workbench/api'
/** Body cap for one JSON request; the editor sends text up to MAX_WRITE_BYTES. */
const MAX_BODY_BYTES = MAX_WRITE_BYTES + 64 * 1024
/** How many registered Workspaces one scan inspects. */
const MAX_WORKSPACES = 8

/** Cordis plugin name. */
export const name = 'novel-workbench'
/** The HTTP carrier this plugin contributes routes to. */
export const inject = ['webServer']

/**
 * Answer one request with JSON.
 * @param {import('node:http').ServerResponse} res - the response.
 * @param {number} status - HTTP status.
 * @param {unknown} body - JSON-serializable body.
 */
function sendJson(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}

/**
 * Read a bounded request body as UTF-8 text.
 * @param {import('node:http').IncomingMessage} req - the request.
 * @param {number} limit - byte cap.
 * @returns {Promise<string>} the body.
 */
async function readBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new ApiError(413, 'too-large', '请求体过大')
    chunks.push(chunk)
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
  } catch {
    throw new ApiError(400, 'bad-utf8', '请求体不是合法的 UTF-8')
  }
}

/**
 * Require JSON and return one plain object body.
 * @param {import('node:http').IncomingMessage} req - the request.
 * @param {number} limit - byte cap.
 * @returns {Promise<Record<string, unknown>>} the decoded object.
 */
async function readJsonBody(req, limit) {
  const type = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') throw new ApiError(415, 'unsupported-media-type', '请用 application/json 提交')
  let value
  try {
    value = JSON.parse(await readBody(req, limit))
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(400, 'bad-json', '请求体不是合法 JSON')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'bad-body', '请求体必须是 JSON 对象')
  return value
}

/**
 * The Workspaces this profile knows, or null when the registry is absent.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @returns {Array<{ id: string, path: string }> | null} workspace records.
 */
function workspaceList(ctx) {
  const registry = ctx.get('workspaceRegistry')
  if (!registry || typeof registry.list !== 'function') return null
  try {
    return registry.list().map((workspace) => ({ id: String(workspace.id ?? ''), path: String(workspace.path ?? '') }))
  } catch {
    return []
  }
}

/**
 * The Workspace paths this profile knows, or null when the registry is absent.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @returns {string[] | null} absolute workspace paths.
 */
function workspacePaths(ctx) {
  const workspaces = workspaceList(ctx)
  return workspaces === null ? null : workspaces.map((workspace) => workspace.path)
}

/**
 * Refuse a root that is not one of the profile's Workspaces.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {string} root - requested absolute root.
 * @returns {string} the root to use.
 */
function assertRootAllowed(ctx, root) {
  const known = workspacePaths(ctx)
  if (known === null) throw new ApiError(503, 'no-workspace-registry', '当前组合没有工作区登记表，无法校验作品目录')
  if (known.includes(root)) return root
  throw new ApiError(403, 'root-not-a-workspace', '只能打开已登记的工作区')
}

/**
 * The auth fence: ask the composition's connection service, or fall back to a
 * conservative localhost check when it is unavailable.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {import('node:http').IncomingMessage} req - the request.
 * @returns {number | undefined} 401 or 403 to refuse, undefined to serve.
 */
function rejectRequest(ctx, req) {
  const connection = ctx.get('connection')
  if (connection && typeof connection.requestRejection === 'function') {
    return connection.requestRejection({ headers: req.headers })
  }
  const host = String(req.headers.host ?? '')
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return 403
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin.length > 0) {
    try {
      if (new URL(origin).host !== host) return 403
    } catch {
      return 403
    }
  }
  return undefined
}

/**
 * Route one request.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {import('node:http').IncomingMessage} req - the request.
 * @param {import('node:http').ServerResponse} res - the response.
 * @returns {Promise<void>} after the response is written.
 */
async function handle(ctx, req, res) {
  const rejection = rejectRequest(ctx, req)
  if (rejection !== undefined) {
    sendJson(res, rejection, { ok: false, error: { code: 'unauthorized', message: '未授权' } })
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  const rawRoute = url.pathname.startsWith(`${BASE}/`) ? url.pathname.slice(BASE.length + 1) : ''
  const route = rawRoute.endsWith('/') && rawRoute.length > 1 ? rawRoute.slice(0, -1) : rawRoute
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && route === 'books') {
      const workspaces = workspaceList(ctx)
      if (workspaces === null) {
        throw new ApiError(503, 'no-workspace-registry', '当前组合没有工作区登记表，无法定位作品')
      }
      /** @type {Map<string, object>} one card per real book directory */
      const byDir = new Map()
      for (const workspace of workspaces.slice(0, MAX_WORKSPACES)) {
        try {
          for (const book of await scanRoot(workspace.path)) {
            const row = { ...book, workspaceId: workspace.id || null }
            const previous = byDir.get(row.dir)
            // A book may be reachable from both its parent Workspace and its own
            // Workspace; prefer the row whose root is the book itself, so a
            // writing Session is rooted exactly at the book.
            if (!previous || (row.root === row.dir && previous.root !== previous.dir)) byDir.set(row.dir, row)
          }
        } catch {
          // One unreadable Workspace must not hide the others.
        }
      }
      sendJson(res, 200, { ok: true, books: [...byDir.values()], workspaceCount: workspaces.length, libraryDir: DEFAULT_LIBRARY_DIR })
      return
    }
    if (method === 'GET' && route === 'book') {
      const root = assertRootAllowed(ctx, String(url.searchParams.get('root') ?? ''))
      const dir = String(url.searchParams.get('dir') ?? '')
      const resolved = await resolveBook(root, dir)
      const snapshot = await buildSnapshot(resolved.book)
      snapshot.journey = computeJourney(snapshot)
      snapshot.tracking = trackingModel(snapshot)
      snapshot.stamp = (await bookStamp(resolved.book)).stamp
      sendJson(res, 200, snapshot)
      return
    }
    if (method === 'GET' && route === 'stamp') {
      // Content-free change fingerprint for the live right-sidebar panel.
      const root = assertRootAllowed(ctx, String(url.searchParams.get('root') ?? ''))
      const resolved = await resolveBook(root, String(url.searchParams.get('dir') ?? ''))
      const stamp = await bookStamp(resolved.book)
      sendJson(res, 200, { ok: true, ...stamp })
      return
    }
    if (method === 'POST' && route === 'create-book') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)
      const registry = ctx.get('workspaceRegistry')
      let parentDir = typeof body.parentDir === 'string' && body.parentDir.trim().length > 0 ? body.parentDir : undefined
      if (!registry && parentDir === undefined) {
        const known = workspacePaths(ctx) ?? []
        if (known.length > 0) parentDir = join(known[0], 'books')
      }
      let created
      try {
        created = await createBook({ ...body, parentDir })
      } catch (error) {
        throw new ApiError(400, 'create-failed', error instanceof Error ? error.message : String(error))
      }
      // The registered Workspace (and /books) reports real paths. On macOS a
      // parent such as /tmp is a symlink to /private/tmp, so return the real
      // book path; otherwise the shelf cannot match the new book and /book
      // rejects the root it just created.
      let realBookDir = created.bookDir
      try {
        realBookDir = await realpath(created.bookDir)
      } catch {
        // keep the requested path when realpath cannot resolve it
      }
      const known = workspaceList(ctx) ?? []
      const containing = await (async () => {
        for (const workspace of known) {
          let realWorkspace = workspace.path
          try {
            realWorkspace = await realpath(workspace.path)
          } catch {
            // keep the registered spelling when it cannot be resolved
          }
          if (workspace.path === realBookDir || realWorkspace === realBookDir) continue
          if (isInside(realWorkspace, realBookDir)) return { ...workspace, realPath: realWorkspace }
        }
        return null
      })()
      let root = realBookDir
      let dir = '.'
      let workspaceId = containing?.id ?? null
      let warning = ''
      if (containing) {
        // The author chose a folder inside an existing Workspace: do not add a
        // second, nested Workspace for the same directory. Keep the registered
        // spelling as `root` (that is what /books scans) but compute the
        // relative directory against its real path.
        root = containing.path
        dir = relative(containing.realPath, realBookDir).split(sep).join('/')
      } else if (registry && typeof registry.create === 'function') {
        try {
          let workspace = null
          if (typeof registry.resolveByPath === 'function') workspace = await registry.resolveByPath(realBookDir)
          if (!workspace) workspace = await registry.create(realBookDir, created.title)
          workspaceId = workspace?.id ? String(workspace.id) : null
        } catch (error) {
          warning = `作品已经建好（${shortPath(realBookDir)}），但没能自动加入工作区：${error instanceof Error ? error.message : String(error)}。请用 DSH 打开这个目录。`
        }
      } else {
        warning = '当前组合没有工作区登记表，作品建在了已有工作区的 books/ 下。'
      }
      sendJson(res, 200, {
        ok: true,
        root,
        dir,
        workspaceId,
        title: created.title,
        folderName: created.folderName,
        parentDir: created.parentDir,
        path: shortPath(realBookDir),
        warning,
      })
      return
    }
    if (method === 'POST' && route === 'tracking/refresh') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)
      const root = assertRootAllowed(ctx, String(body.root ?? ''))
      const resolved = await resolveBook(root, String(body.dir ?? ''))
      const result = await refreshTracking(resolved.book)
      sendJson(res, 200, { ok: true, ...result })
      return
    }
    if (method === 'POST' && route === 'export') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)
      const root = assertRootAllowed(ctx, String(body.root ?? ''))
      const resolved = await resolveBook(root, String(body.dir ?? ''))
      const result = await exportBook(resolved.book, { format: body.format })
      const query = `root=${encodeURIComponent(root)}&dir=${encodeURIComponent(String(body.dir ?? ''))}&path=${encodeURIComponent(result.path)}`
      sendJson(res, 200, { ok: true, ...result, download: `${BASE}/export-file?${query}` })
      return
    }
    if (method === 'GET' && route === 'export-file') {
      const root = assertRootAllowed(ctx, String(url.searchParams.get('root') ?? ''))
      const resolved = await resolveBook(root, String(url.searchParams.get('dir') ?? ''))
      const file = await readExportFile(resolved.book, String(url.searchParams.get('path') ?? ''))
      res.writeHead(200, {
        'content-type': file.contentType,
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        'content-length': file.buffer.length,
        'cache-control': 'no-store',
      })
      res.end(file.buffer)
      return
    }
    if (method === 'GET' && route === 'file') {
      const root = assertRootAllowed(ctx, String(url.searchParams.get('root') ?? ''))
      const dir = String(url.searchParams.get('dir') ?? '')
      const resolved = await resolveBook(root, dir)
      const file = await readBookFile(resolved.book, String(url.searchParams.get('path') ?? ''))
      sendJson(res, 200, { ok: true, ...file })
      return
    }
    if (method === 'PUT' && route === 'file') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)
      const root = assertRootAllowed(ctx, String(body.root ?? ''))
      const resolved = await resolveBook(root, String(body.dir ?? ''))
      if (typeof body.text !== 'string') throw new ApiError(400, 'bad-body', '缺少文件内容')
      const saved = await writeBookFile(resolved.book, String(body.path ?? ''), body.text, body.expectedMtime, { expectedSize: body.expectedSize })
      sendJson(res, 200, { ok: true, ...saved })
      return
    }
    if (method === 'GET' && route === 'health') {
      sendJson(res, 200, { ok: true, readLimit: MAX_READ_BYTES, writeLimit: MAX_WRITE_BYTES })
      return
    }
    sendJson(res, 404, { ok: false, error: { code: 'not-found', message: '没有这个接口' } })
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(res, error.status, { ok: false, error: { code: error.code, message: error.message } })
      return
    }
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { ok: false, error: { code: 'bad-json', message: '请求体不是合法 JSON' } })
      return
    }
    console.error('novel-workbench: unexpected failure', error)
    sendJson(res, 500, { ok: false, error: { code: 'internal', message: '服务器内部错误' } })
  }
}

/**
 * Mount the workbench API.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: (req, res) => {
      handle(ctx, req, res).catch((error) => {
        console.error('novel-workbench: request failed', error)
        if (!res.headersSent) {
          sendJson(res, 500, { ok: false, error: { code: 'internal', message: '服务器内部错误' } })
        }
      })
    },
  }), 'novel-workbench: api routes')
}

// Referenced so a future tool half can share the same reader without importing
// the route module's private helpers.
export { isBookDir }
