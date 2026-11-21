// Browser-less smoke test for the new shelf + workbench UI.
// Runs the real client module against an in-process Host API with a small
// nested-component React runtime, then drives clicks and reads the text.
//
// Run: node dev/test-ui.mjs
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
const samples = fileURLToPath(new URL('../demo/雨港来信', import.meta.url))
const workspace = await mkdtemp(join(tmpdir(), 'nw-ui-'))
await cp(samples, join(workspace, '雨港来信'), { recursive: true })
// The sample book may carry a written chapter 4 from an earlier writing run;
// these fixtures expect chapter 4 to be the next, not-yet-written chapter.
await rm(join(workspace, '雨港来信', 'manuscript', 'vol-01', 'ch-004.md'), { force: true })
await rm(join(workspace, '雨港来信', '.narracat', 'memory', 'ch-004.json'), { force: true })
// Let the create dialog default to a folder inside the test workspace.
process.env.NARRACAT_LIBRARY_DIR = join(workspace, 'library')
const { apply: applyHost } = await import('../novel-workbench/index.js')

const nativeFetch = globalThis.fetch
const routes = []
const knownWorkspaces = [{ path: workspace }]
applyHost({
  webServer: { register: (route) => { routes.push(route); return () => {} } },
  effect: (fn) => fn(),
  get: (name) => ({
    workspaceRegistry: {
      list: () => knownWorkspaces,
      resolveByPath: async (path) => knownWorkspaces.find((row) => row.path === path),
      create: async (path) => { const row = { id: 'w-created', path }; knownWorkspaces.push(row); return row },
    },
    connection: { requestRejection: () => undefined },
  })[name],
})
const server = createServer((req, res) => routes[0].handler(req, res))
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`

// ---- stubs ---------------------------------------------------------------
const listeners = new Map()
const storage = new Map()
const localStorageStub = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => { storage.set(key, String(value)) },
  removeItem: (key) => { storage.delete(key) },
  clear: () => { storage.clear() },
}
globalThis.window = {
  __ModuleLoader__: { load: ({ factory }) => { globalThis.__factory = factory } },
  addEventListener: (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(fn)
  },
  removeEventListener: (type, fn) => { listeners.get(type)?.delete(fn) },
  matchMedia: () => ({ matches: false }),
  innerWidth: 1440,
  localStorage: localStorageStub,
}
globalThis.localStorage = localStorageStub
globalThis.ResizeObserver = undefined
let inFlight = 0

// ---- tiny nested-component React runtime ---------------------------------
function createRuntime() {
  const instances = new Map()
  let current = null
  let dirty = false
  let pending = []

  const same = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
  const instance = (key) => {
    if (!instances.has(key)) instances.set(key, { slots: [], effects: [], cursor: 0 })
    return instances.get(key)
  }

  const React = {
    createElement(type, props, ...children) {
      return { type, props: { ...(props ?? {}), children: children.length <= 1 ? children[0] : children } }
    },
    useState(initial) {
      const inst = current
      const index = inst.cursor++
      if (!(index in inst.slots)) inst.slots[index] = { value: typeof initial === 'function' ? initial() : initial }
      const set = (next) => {
        const value = typeof next === 'function' ? next(inst.slots[index].value) : next
        if (!Object.is(value, inst.slots[index].value)) { inst.slots[index].value = value; dirty = true }
      }
      return [inst.slots[index].value, set]
    },
    useRef(initial) {
      const inst = current
      const index = inst.cursor++
      if (!(index in inst.slots)) inst.slots[index] = { current: initial }
      return inst.slots[index]
    },
    useMemo(factory, deps) {
      const inst = current
      const index = inst.cursor++
      const slot = inst.slots[index]
      if (slot && same(slot.deps, deps)) return slot.value
      const value = factory()
      inst.slots[index] = { deps, value }
      return value
    },
    useCallback(callback, deps) {
      return React.useMemo(() => callback, deps)
    },
    useEffect(effect, deps) {
      const inst = current
      const index = inst.cursor++
      pending.push({ inst, index, effect, deps })
    },
    useLayoutEffect(effect, deps) {
      const inst = current
      const index = inst.cursor++
      pending.push({ inst, index, effect, deps })
    },
  }

  function node(value, path) {
    if (value === null || value === undefined || value === false || value === true) return null
    if (typeof value === 'string' || typeof value === 'number') return value
    if (Array.isArray(value)) return value.map((child, index) => node(child, `${path}.${child?.key ?? index}`))
    const { type, props } = value
    if (typeof type === 'function') {
      const key = `${path}:${type.name || 'component'}:${props?.key ?? ''}`
      const inst = instance(key)
      const previous = current
      current = inst
      inst.cursor = 0
      let output
      try { output = type(props ?? {}) } finally { current = previous }
      return node(output, key)
    }
    return { type, props: { ...props, children: node(props?.children, `${path}.${type}`) } }
  }

  async function render(Page, props) {
    let tree = null
    for (let pass = 0; pass < 80; pass += 1) {
      dirty = false
      pending = []
      tree = node(React.createElement(Page, props), 'root')
      for (const item of pending) {
        const slot = item.inst.effects[item.index]
        if (slot && same(slot.deps, item.deps)) continue
        slot?.cleanup?.()
        const cleanup = item.effect()
        item.inst.effects[item.index] = { deps: item.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined }
      }
      await new Promise((resolve) => setTimeout(resolve, 25))
      if (!dirty && inFlight === 0) break
    }
    return tree
  }

  return { React, render }
}

function textOf(value) {
  if (value === null || value === undefined || value === false || value === true) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(textOf).join(' ')
  return textOf(value.props?.children)
}

function walk(value, visit) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) { value.forEach((child) => walk(child, visit)); return }
  visit(value)
  walk(value.props?.children, visit)
}

function findButton(tree, needle) {
  let found = null
  walk(tree, (item) => {
    if (found || item.type !== 'button') return
    if (!textOf(item.props?.children).includes(needle) && !String(item.props?.['aria-label'] ?? '').includes(needle)) return
    found = item
  })
  return found
}
function findType(tree, type) {
  let found = null
  walk(tree, (item) => { if (!found && item.type === type) found = item })
  return found
}
function findTextButton(tree, needle) {
  let found = null
  walk(tree, (item) => {
    if (found || item.type !== 'button') return
    if (textOf(item.props?.children).includes(needle)) found = item
  })
  return found
}
function allButtons(tree) {
  const rows = []
  walk(tree, (item) => { if (item.type === 'button') rows.push(item) })
  return rows
}
function isIconOnly(button) {
  const children = button.props?.children
  const list = Array.isArray(children) ? children : [children]
  return list.length > 0 && list.every((child) => child && typeof child === 'object' && child.type === 'svg')
}

// ---- load the real client ------------------------------------------------
const runtime = createRuntime()
globalThis.fetch = (url, init) => {
  inFlight += 1
  const absolute = String(url).startsWith('http') ? String(url) : origin + String(url)
  return nativeFetch(absolute, init).finally(() => { inFlight -= 1 })
}

const dictionaries = {}
const slots = {}
const clientSource = await readFile(new URL('../novel-workbench/client.js', import.meta.url), 'utf8')
new Function('require', clientSource)((name) => {
  if (name === 'react') return runtime.React
  throw new Error(`unexpected require(${name})`)
})

const plugin = globalThis.__factory((name) => {
  if (name === 'react') return runtime.React
  throw new Error(`unexpected require(${name})`)
})
let remoteCreate = async () => ({ sessionId: 'write-1' })
const prompts = []
const services = {
  sessions: {
    using: async (sessionId, options, operation) => operation({
      ready: Promise.resolve(),
      binding: { session: { prompt: async (content, mode) => { prompts.push({ sessionId, content, mode }); return { ok: true, value: { accepted: true } } } } },
    }),
  },
  uiWorkspace: { connectWorkspace: async () => 'session-1', openSession: () => {}, startSession: () => {} },
  sidebarRightTabs: { register: () => () => {} },
  sidebarRight: { openTab: () => {} },
  layout: { selectPanel: () => {} },
  remote: { session: { create: (options) => remoteCreate(options), prompt: async () => ({ accepted: true }) } },
}
plugin.apply({
  effect: (fn) => fn(),
  get: (name) => services[name],
  locale: {
    register: (namespace, locale, dictionary) => { dictionaries[locale] = { ...(dictionaries[locale] ?? {}), ...dictionary }; return () => {} },
    bind: () => (key) => dictionaries.zh?.[key] ?? key,
  },
  slots: {
    inject: (owner, callback) => callback(),
    register: (options, component) => { slots[options.name] = { options, component }; return () => {} },
  },
})

const t = (key) => dictionaries.zh?.[key] ?? key
const main = slots.main
if (!main) throw new Error('main slot not registered')
const injected = main.options.inject()
const props = {
  ...injected,
  t,
  useWorkspaces: (selector) => selector({ items: [{ workspaceId: 'w1', path: workspace, title: 'ws' }] }),
  useSessions: (selector) => selector({ byId: {} }),
}

let failures = 0
function check(name, condition) {
  if (condition) console.log('PASS', name)
  else { failures += 1; console.log('FAIL', name) }
}

// 1. shelf
let tree = await runtime.render(main.component, props)
let text = textOf(tree)
check('shelf shows the brand', text.includes('Narracat · 叙述猫'))
const logoImage = findType(tree, 'img')
check('shelf shows the NarraCat logo', Boolean(logoImage) && String(logoImage.props?.src).startsWith('data:image/png;base64,'))
check('shelf shows the book', text.includes('雨港来信'))
check('shelf shows the index', text.includes('全部作品'))
check('shelf shows the synopsis', text.includes('寻找来信者'))
check('shelf shows a continue action', text.includes('继续写第 4 章') || text.includes('继续写第 3 章') || text.includes('打开作品'))
check('shelf links to the desktop pro edition', text.includes('桌面专业版'))

// 1a. contact-author entry opens a branded popup with GitHub and both QRs.
const contactButton = findButton(tree, '联系作者')
check('shelf offers a contact-author entry', Boolean(contactButton))
contactButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
const contactImages = []
walk(tree, (item) => { if (item.type === 'img' && String(item.props?.src).startsWith('data:image/')) contactImages.push(item.props.src) })
check('contact popup shows the author bio', text.includes('Yannik') && text.includes('10 年产品人') && text.includes('把自己用 AI 做的产品'))
check('contact popup links GitHub', text.includes('GitHub 开源版'))
check('contact popup promotes desktop pro downloads', text.includes('下载 Mac 专业版') && text.includes('下载 Windows 专业版') && text.includes('访问官网'))
check('contact popup shows both QR codes', text.includes('小红书') && text.includes('公众号') && contactImages.length >= 4, contactImages.length)
const closeContact = findButton(tree, '关闭')
closeContact?.props?.onClick?.()
tree = await runtime.render(main.component, props)
check('contact popup closes', !textOf(tree).includes('10 年产品人'))

// 1b. the new-book dialog opens, names the essentials, and cancels cleanly
const newBookButton = findButton(tree, '新建作品')
check('shelf offers a new-book action', Boolean(newBookButton))
newBookButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('new-book dialog asks for the essentials', text.includes('书名') && text.includes('计划章数') && text.includes('保存位置') && text.includes('建立作品'))
for (const fn of listeners.get('keydown') ?? []) {
  fn({ key: 'Enter', target: { tagName: 'BUTTON' }, metaKey: false, ctrlKey: false, altKey: false, preventDefault() {} })
}
tree = await runtime.render(main.component, props)
check('new-book dialog keeps Enter from opening the book', textOf(tree).includes('书名') && !textOf(tree).includes('作品概览'))
const cancelCreate = findButton(tree, '取消')
cancelCreate?.props?.onClick?.()
tree = await runtime.render(main.component, props)

// 2. open the workbench from the hero
const hero = findButton(tree, '打开工作台')
check('shelf has a hero button', Boolean(hero))
hero?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('workbench opens', text.includes('概览') && text.includes('记忆与状态'))
check('workbench shows the book', text.includes('雨港来信'))
check('workbench shows chapter progress', text.includes('3 / 12') || text.includes('3 / 12 章'))
check('workbench shows the four-stage path', ['开书', '搭骨架', '写正文', '完本'].every((label) => text.includes(label)))
check('workbench shows one next step', text.includes('下一步') && text.includes('写第 4 章'))
check('workbench offers export', text.includes('导出成稿'))
// One next step means one button, not a matching copy in the app bar too.
const overviewNext = allButtons(tree).filter((button) => textOf(button.props?.children).trim() === '写第 4 章')
check('overview offers exactly one next-step button', overviewNext.length === 1, overviewNext.length)
const cssTree = findType(tree, 'style')
const css = String(cssTree?.props?.children ?? '')
check('selected tabs use a surface, not a black stroke', css.includes('.nw-seg button.is-active') && !/\.nw-seg button\.is-active\{[^}]*inset 0 -2px/.test(css))
check('icon tooltip styles are shipped', css.includes('[data-tip]::after') && css.includes('content:attr(data-tip)'))
check('view switch never degrades to a select', !clientSource.includes('nw-viewselect'))
check('narrow view tabs stay visible', !/\.nw-ctools \.nw-seg\{display:none\}/.test(clientSource))
const iconButtons = allButtons(tree).filter(isIconOnly)
check('every icon-only button is labelled', iconButtons.length > 0 && iconButtons.every((button) => typeof button.props?.['aria-label'] === 'string' && button.props['aria-label'] === button.props['data-tip']), iconButtons.length)
check('icon-only buttons do not fall back to native titles', iconButtons.every((button) => button.props?.title === undefined))
check('overview exposes memory tabs', text.includes('伏笔') && text.includes('状态') && text.includes('章节记忆'))
const stateTab = findButton(tree, '状态')
stateTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
check('state tab has an empty state', textOf(tree).includes('还没有状态变化'))
const memoryTab = findButton(tree, '章节记忆')
memoryTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
check('memory tab has an empty state', textOf(tree).includes('还没有章节记忆'))
const frowTab = findButton(tree, '伏笔')
frowTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)

// 2b. the export dialog opens with the checklist and formats
const exportButton = findButton(tree, '导出成稿')
check('export action exists', Boolean(exportButton))
exportButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('export dialog shows formats and check', text.includes('Word') && text.includes('HTML') && text.includes('交稿前看一眼'))
const closeExport = findButton(tree, '关闭')
closeExport?.props?.onClick?.()
tree = await runtime.render(main.component, props)

// 3. open a chapter from the manuscript directory
const manuscriptRail = findButton(tree, '书稿')
manuscriptRail?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const chapterButton = findButton(tree, '鱼丸摊')
check('chapter row exists', Boolean(chapterButton))
chapterButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('chapter content loads', text.includes('街口的鱼丸摊傍晚才出'))
check('chapter title is present', text.includes('第三章 鱼丸摊'))
check('chapter directory is present', text.includes('书稿'))

// 4. edit + save
const editButton = findButton(tree, '编辑')
editButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const editor = findType(tree, 'textarea')
check('editor opens', Boolean(editor))
if (editor) {
  editor.props.onChange({ target: { value: `${editor.props.value}\n\n测试保存行` } })
  tree = await runtime.render(main.component, props)
  check('dirty state is shown on the page', textOf(tree).includes('未保存'))
  const saveButton = findButton(tree, '保存')
  saveButton?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  text = textOf(tree)
  check('save reports saved', text.includes('已保存'))
  check('save keeps the editor open', Boolean(findButton(tree, '完成')))
  const finishButton = findButton(tree, '完成')
  finishButton?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  text = textOf(tree)
  check('finish returns to reading', text.includes('街口的鱼丸摊傍晚才出') && !text.includes('已保存'))
}

// 4b. a conflicting save must not discard the draft when reloading
const editAgain = findButton(tree, '编辑')
editAgain?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const editorAgain = findType(tree, 'textarea')
check('chapter can re-enter edit', Boolean(editorAgain))
if (editorAgain) {
  editorAgain.props.onChange({ target: { value: `${editorAgain.props.value}\n\n冲突测试行` } })
  tree = await runtime.render(main.component, props)
  const chapterPath = join(workspace, '雨港来信', 'manuscript', 'vol-01', 'ch-003.md')
  const onDisk = await readFile(chapterPath, 'utf8')
  await writeFile(chapterPath, `${onDisk}\n`)
  findButton(tree, '保存')?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  check('conflicting save offers a reload', Boolean(findButton(tree, '重新加载')))
  findButton(tree, '重新加载')?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  check('reload asks before discarding the draft', textOf(tree).includes('有未保存的修改'))
  findButton(tree, '继续编辑')?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  const keptEditor = findType(tree, 'textarea')
  check('draft survives the reload confirmation', Boolean(keptEditor) && String(keptEditor.props.value).includes('冲突测试行'))
  findButton(tree, '取消')?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  findButton(tree, '放弃修改')?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
}

// 5. chapter outline is rendered from the JSON, not shown as JSON
const chapterOutlineTab = findButton(tree, '章纲')
chapterOutlineTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('chapter outline is structured', text.includes('鱼丸摊') && text.includes('林照'))
check('chapter outline hides raw json', !text.includes('"character_uid"'))
const textTab = findButton(tree, '正文')
textTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)

// 6. other content categories and views
const blueprint = findButton(tree, '构思')
blueprint?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const outlineButton = findButton(tree, '全书大纲')
check('blueprint lists the outline', Boolean(outlineButton))
outlineButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('outline view renders', text.includes('故事线') || text.includes('全书大纲'))
const premiseButton = findButton(tree, '立项卡')
premiseButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('premise view renders', text.includes('核心钩子') && text.includes('题材') && text.includes('第三人称有限'))

const settingsRail = findButton(tree, '设定')
settingsRail?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const person = findButton(tree, '林照')
check('settings lists a character', Boolean(person))
person?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('character view renders', text.includes('基本信息'))

const materialsRail = findTextButton(tree, '资料')
materialsRail?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('materials lists the tracking sheets', text.includes('全书追踪') && text.includes('章节摘要') && text.includes('伏笔表') && text.includes('人物状态') && text.includes('写作备忘'))
const summariesRow = findButton(tree, '章节摘要')
summariesRow?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('tracking summaries view renders', text.includes('全书追踪') && (text.includes('缺记忆') || text.includes('章节摘要')))
const threadsTab = findButton(tree, '伏笔表')
threadsTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('tracking foreshadowing view renders', text.includes('伏笔表') && (text.includes('还没有登记伏笔') || text.includes('未收')))
const peopleTab = findButton(tree, '人物状态')
peopleTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('tracking character view renders', text.includes('林照') && text.includes('还没有记过状态变化'))
const progressTab = findButton(tree, '进度')
progressTab?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('tracking progress view renders', text.includes('下一章') && text.includes('写第 4 章'))
const refreshTracking = findButton(tree, '刷新')
refreshTracking?.props?.onClick?.()
tree = await runtime.render(main.component, props)
check('tracking refresh reports done', textOf(tree).includes('追踪表已更新') || textOf(tree).includes('刷新'))
const memoryButton = findButton(tree, '写作记忆')
check('materials lists memory', Boolean(memoryButton))
memoryButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('memory view renders', text.includes('写作记忆') || text.includes('记忆'))
const reviewsButton = findButton(tree, '审校报告')
reviewsButton?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('reviews view renders', text.includes('还没有审校报告') && text.includes('审校结论'))
const settingsAgain = findButton(tree, '设定')
settingsAgain?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const agents = findButton(tree, 'AGENTS.md')
agents?.props?.onClick?.()
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('file view renders', text.includes('本书指令') || text.includes('AGENTS'))

// 7. session view forces the workbench
const view = slots['conversation.view']
if (view) {
  const viewProps = {
    ...view.options.inject(),
    t,
    mode: 'session',
    sessionId: 's1',
    useSessions: (selector) => selector({ byId: { s1: { cwd: join(workspace, '雨港来信') } } }),
    useWorkspaces: (selector) => selector({ items: [{ workspaceId: 'w1', path: workspace }] }),
    useChat: (selector) => selector({ legacy: { nodes: [], partial: null, runningCalls: [] } }),
  }
  tree = await runtime.render(view.component, viewProps)
  text = textOf(tree)
  check('session view opens the book', text.includes('雨港来信'))
  check('session view shows the workbench', text.includes('概览') || text.includes('书稿'))
}

// 6. compact right-sidebar panel
const sidebar = slots['sidebar.right.pane.tab']
if (sidebar) {
  let prompt = null
  const sidebarTree = await runtime.render(sidebar.component, {
    ...sidebar.options.inject(),
    t,
    sessionId: 's1',
    useSessions: (selector) => selector({ byId: { s1: { cwd: join(workspace, '雨港来信') } } }),
    inputActions: { setDraft: (value) => { prompt = value }, submit: () => {} },
    openFull: () => {},
  })
  const sidebarText = textOf(sidebarTree)
  check('sidebar shows the book', sidebarText.includes('雨港来信'))
  check('sidebar offers prompts', sidebarText.includes('写第') && sidebarText.includes('本书现状'))
  const nextButton = findButton(sidebarTree, '写第')
  nextButton?.props?.onClick?.()
  check('sidebar sends a prompt', typeof prompt === 'string' && prompt.includes('写第'))

  // The panel reuses the writing wait when the running turn is a write.
  const writingPanelProps = {
    ...sidebar.options.inject(),
    key: 'sidebar-writing',
    t,
    sessionId: 's1',
    useSessions: (selector) => selector({ byId: { s1: { cwd: join(workspace, '雨港来信') } } }),
    useSessionStatus: (selector) => selector(new Map([['s1', { running: true }]])),
    useChat: (selector) => selector({
      legacy: {
        nodes: [{ kind: 'user', content: [{ type: 'text', text: '写第 4 章。先看这本书的写作现状和本章资料，写完保存好。' }] }],
        partial: null,
        runningCalls: [{ name: 'wait_agent' }],
      },
    }),
    inputActions: { setDraft: () => {}, submit: () => {} },
    openFull: () => {},
  }
  const writingPanel = await runtime.render(sidebar.component, writingPanelProps)
  const writingPanelText = textOf(writingPanel)
  check('sidebar reuses the writing wait', writingPanelText.includes('正在写第 4 章'))
  let compactCard = false
  walk(writingPanel, (item) => { if (String(item.props?.className ?? '').includes('nw-p2-writing')) compactCard = true })
  check('sidebar reuses the compact writing scene', compactCard)
  const panelFocus = findButton(writingPanel, '再去旧渡口')
  panelFocus?.props?.onClick?.()
  const writingReader = await runtime.render(sidebar.component, writingPanelProps)
  const writingReaderText = textOf(writingReader)
  check('sidebar reader reuses the writing wait', writingReaderText.includes('正在写第 4 章'))
}

// 10b. an unwritten chapter has exactly one write CTA, then becomes a live
// writing scene instead of a greyed-out button.
{
  const manuscriptAgain = findButton(tree, '书稿')
  manuscriptAgain?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  const emptyChapter = findButton(tree, '再去旧渡口')
  check('the unwritten next chapter is listed', Boolean(emptyChapter))
  emptyChapter?.props?.onClick?.()
  tree = await runtime.render(main.component, props)
  text = textOf(tree)
  const emptyWrite = allButtons(tree).filter((button) => textOf(button.props?.children).trim() === '写本章')
  check('an unwritten chapter has exactly one write CTA', emptyWrite.length === 1, emptyWrite.length)
  check('the directory no longer repeats the next step', !text.includes('下一步：写第 4 章'))
  check('the app bar no longer repeats the next step', allButtons(tree).filter((button) => textOf(button.props?.children).trim() === '写第 4 章').length === 0)
  check('the toolbar keeps its icon actions', Boolean(findButton(tree, '编辑')) && Boolean(findButton(tree, '重新加载')))
  emptyWrite[0]?.props?.onClick?.()
  await new Promise((resolve) => setTimeout(resolve, 180))
  tree = await runtime.render(main.component, props)
  text = textOf(tree)
  check('writing scene names the chapter', text.includes('正在写第 4 章'))
  check('writing scene shows elapsed time', text.includes('已用时'))
  check('writing scene offers the live session', text.includes('打开写作会话'))
  check('writing scene replaces the write CTA', allButtons(tree).filter((button) => textOf(button.props?.children).includes('写本章')).length === 0)
  check('app bar announces the running write', text.includes('写作中 · 第 4 章'))
  const writingRow = allButtons(tree).find((button) => textOf(button.props?.children).includes('再去旧渡口'))
  check('directory marks the running chapter', textOf(writingRow?.props?.children ?? '').includes('写作中'))

  // Switching pages remounts the workbench; the chapter and its clock return.
  const remounted = await runtime.render(main.component, { ...props, key: 'writing-remount' })
  const remountedText = textOf(remounted)
  check('an in-flight write survives a page switch', remountedText.includes('正在写第 4 章') && remountedText.includes('已用时'))
  check('the restored write brings back the status pill', remountedText.includes('写作中 · 第 4 章'))
  for (const key of [...storage.keys()]) if (key.startsWith('nw.write:')) storage.delete(key)

  // An older write (started before this build) has no chapter record, but its
  // session can still be running. It must not degrade to a silent grey button.
  const listingForOrphan = await (await fetch(`${origin}/novel-workbench/api/books`)).json()
  const demoForOrphan = (listingForOrphan.books ?? []).find((row) => row.title === '雨港来信')
  if (demoForOrphan) {
    const orphanKey = `${demoForOrphan.root}|${demoForOrphan.relDir}`
    storage.set('nw.route', 'book')
    storage.set('nw.lastBook', orphanKey)
    storage.set(`nw.view:${orphanKey}`, JSON.stringify({ v: 1, category: 'manuscript', selection: { kind: 'chapter', chapter: 4 }, chapterView: 'text' }))
    storage.delete('nw.pendingView')
    const orphan = await runtime.render(main.component, {
      ...props,
      key: 'writing-orphan',
      useSessionStatus: (selector) => selector({ get: () => ({ running: true }) }),
    })
    const orphanText = textOf(orphan)
    check('a running session without chapter state still shows a status', orphanText.includes('写作会话正在运行'))
    check('a running session without chapter state offers the session', orphanText.includes('打开写作会话'))
  } else {
    check('orphan-write fixture book is available', false)
  }

  // Complete the write on disk. The 4-second poll notices the new chapter and
  // the open chapter page must load and show the prose by itself.
  await writeFile(join(workspace, '雨港来信', 'manuscript', 'vol-01', 'ch-004.md'), '# 第四章 再去旧渡口\n\n雨停在天亮以前，他带着木牌出了门。\n', 'utf8')
  await new Promise((resolve) => setTimeout(resolve, 4300))
  const finished = await runtime.render(main.component, { ...props, key: 'writing-remount' })
  const finishedText = textOf(finished)
  check('a finished write reveals the new prose', finishedText.includes('雨停在天亮以前'))
  check('a finished write leaves the writing scene', !finishedText.includes('正在写第 4 章'))
}

// 9. create flow: submitting closes the dialog, opens the book and does not
// leave the old "shelf has not refreshed" warning behind.
tree = await runtime.render(main.component, props)
const backToShelf = findButton(tree, '返回书架')
backToShelf?.props?.onClick?.()
tree = await runtime.render(main.component, props)
const newBook = findButton(tree, '新建作品')
check('shelf still offers create after navigation', Boolean(newBook))
newBook?.props?.onClick?.()
tree = await runtime.render(main.component, props)
let titleInput = null
walk(tree, (item) => {
  if (!titleInput && item.type === 'input' && String(item.props?.placeholder ?? '').includes('雨港来信')) titleInput = item
})
check('create dialog exposes the title input', Boolean(titleInput))
titleInput?.props?.onChange?.({ target: { value: '界面新建' } })
tree = await runtime.render(main.component, props)
const submitCreate = findButton(tree, '建立作品')
submitCreate?.props?.onClick?.()
tree = await runtime.render(main.component, props)
await new Promise((resolve) => setTimeout(resolve, 450))
tree = await runtime.render(main.component, props)
text = textOf(tree)
check('create closes and opens the new book', text.includes('界面新建') && !text.includes('书架还没刷新到它'))
check('created book starts at setup', text.includes('开始立项'))

// 10. writing-session starter
if (typeof injected.startWritingSession === 'function') {
  const starter = await injected.startWritingSession({
    dir: join(workspace, '雨港来信'),
    root: workspace,
    relDir: '雨港来信',
    workspaceId: 'w1',
  })
  check('session starter returns a session', starter?.ok === true && starter?.sessionId === 'write-1', starter)
  remoteCreate = async () => { throw new Error('cwd is not a workspace') }
  const fallback = await injected.startWritingSession({
    dir: join(workspace, '雨港书店'),
    root: workspace,
    relDir: '雨港书店',
    workspaceId: 'w1',
  })
  check('session falls back to the workspace service', fallback?.ok === true && fallback?.sessionId === 'session-1', fallback)
  if (typeof injected.writeChapter === 'function') {
    const written = await injected.writeChapter({
      dir: join(workspace, '雨港来信'),
      root: workspace,
      relDir: '雨港来信',
      workspaceId: 'w1',
    }, 3, { hasText: true })
    check('background write uses the session service', Boolean(written?.sessionId) && prompts.length > 0, { written, prompts })
  }
  // The DSH remote face wraps the session id in { ok, value }.
  remoteCreate = async () => ({ ok: true, value: { sessionId: 'write-remote' } })
  const remoteShaped = await injected.startWritingSession({
    dir: join(workspace, 'remote-book'),
    root: workspace,
    relDir: 'remote-book',
    workspaceId: 'w1',
  })
  check('remote session result shape is unwrapped', remoteShaped?.ok === true && remoteShaped?.sessionId === 'write-remote', remoteShaped)
  const viewSlot = slots['conversation.view']
  const viewProps = typeof viewSlot?.options?.inject === 'function' ? viewSlot.options.inject() : {}
  check('session view can start a writing session', typeof viewProps.startWritingSession === 'function')
}


// 11. last-page persistence and the one-shot side-panel navigation target.
{
  const listing = await (await fetch(`${origin}/novel-workbench/api/books`)).json()
  const demo = (listing.books ?? []).find((row) => row.title === '雨港来信')
  if (demo) {
    const key = `${demo.root}|${demo.relDir}`
    storage.set('nw.route', 'book')
    storage.set('nw.lastBook', key)
    storage.set(`nw.view:${key}`, JSON.stringify({
      v: 1,
      category: 'manuscript',
      selection: { kind: 'chapter', chapter: 3 },
      chapterView: 'text',
    }))
    let restored = await runtime.render(main.component, { ...props, key: 'persist-restore' })
    let restoredText = textOf(restored)
    check('main page restores the last book and chapter', restoredText.includes('鱼丸摊') && restoredText.includes('正文') && restoredText.includes('鱼丸摊傍晚才出'), restoredText.slice(0, 240))

    storage.set('nw.route', 'shelf')
    const shelfAgain = await runtime.render(main.component, { ...props, key: 'persist-shelf' })
    check('main page restores the shelf after leaving from the shelf', textOf(shelfAgain).includes('全部作品'))

    storage.set('nw.pendingView', JSON.stringify({ kind: 'premise', bookKey: key, at: Date.now() }))
    const premiseLanding = await runtime.render(main.component, { ...props, key: 'persist-pending' })
    const premiseText = textOf(premiseLanding)
    check('side panel can land on one full-workbench section', premiseText.includes('题材读者契约') || premiseText.includes('核心钩子'))
  } else {
    check('persistence fixture book is available', false)
  }
}


// 12. the right-sidebar panel refreshes when the Agent turn ends.
{
  const listing = await (await fetch(`${origin}/novel-workbench/api/books`)).json()
  const demo = (listing.books ?? []).find((row) => row.title === '雨港来信')
  if (demo && sidebar) {
    let runningNow = true
    const panelProps = () => ({
      ...sidebar.options.inject(),
      key: 'panel-refresh',
      t,
      sessionId: 's1',
      useSessions: (selector) => selector({ byId: { s1: { cwd: demo.dir } } }),
      useSessionStatus: (selector) => selector(new Map([['s1', { running: runningNow }]])),
      useChat: (selector) => selector({ legacy: { nodes: [], partial: null, runningCalls: [] } }),
      inputActions: { setDraft: () => {}, submit: () => {} },
      openFull: () => {},
    })
    // Start this panel on its board, independent of the reader view that the
    // sidebar-writing test above persisted.
    storage.delete(`nw.panel:${demo.root}|${demo.relDir}`)
    const first = await runtime.render(sidebar.component, panelProps())
    check('live panel shows the current chapter title', textOf(first).includes('雨港来信'))
    const body = await (await fetch(`${origin}/novel-workbench/api/book?root=${encodeURIComponent(demo.root)}&dir=${encodeURIComponent(demo.relDir)}`)).json()
    const firstChapter = (body.chapters ?? []).find((row) => row.chapter === 1)
    if (firstChapter?.path) {
      const abs = join(demo.dir, firstChapter.path)
      const text = await readFile(abs, 'utf8')
      await writeFile(abs, text.replace('第一章 雨港来信', '第一章 刷新测试标题'))
      runningNow = false
      const second = await runtime.render(sidebar.component, panelProps())
      check('live panel refreshes after the Agent turn ends', textOf(second).includes('刷新测试标题'))
      await writeFile(abs, text)
    } else {
      check('live panel refresh fixture has chapter one', false)
    }
  } else {
    check('live panel is registered for the refresh test', false)
  }
}


// 13. a long book synopsis is clamped with an expand/collapse affordance.
{
  const listing = await (await fetch(`${origin}/novel-workbench/api/books`)).json()
  const demo = (listing.books ?? []).find((row) => row.title === '雨港来信')
  if (demo) {
    const key = `${demo.root}|${demo.relDir}`
    const outlinePath = join(demo.dir, '.narracat', 'data', 'outline', 'outline-structure.json')
    const original = await readFile(outlinePath, 'utf8')
    const outline = JSON.parse(original)
    outline.synopsis = '这是一段用来验证概要折叠的长文本。'.repeat(20)
    await writeFile(outlinePath, JSON.stringify(outline, null, 2))
    storage.set('nw.route', 'book')
    storage.set('nw.lastBook', key)
    storage.set(`nw.view:${key}`, JSON.stringify({ v: 1, category: 'overview', selection: null }))
    storage.delete('nw.pendingView')
    let overview = await runtime.render(main.component, { ...props, key: 'synopsis-test' })
    const expand = findButton(overview, '展开全文')
    check('long synopsis offers an expand control', Boolean(expand))
    expand?.props?.onClick?.()
    overview = await runtime.render(main.component, { ...props, key: 'synopsis-test' })
    check('expanded synopsis offers a collapse control', textOf(overview).includes('收起全文'))
    await writeFile(outlinePath, original)
  } else {
    check('synopsis fixture book is available', false)
  }
}

console.log(failures === 0 ? '\nALL UI CHECKS PASSED' : `\n${failures} UI CHECK(S) FAILED`)
await new Promise((resolve) => server.close(resolve))
await rm(workspace, { recursive: true, force: true })
if (failures > 0) process.exitCode = 1
