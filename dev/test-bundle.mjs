// Bundle manifest sanity: the loader patch must parse and every row it inserts
// must exist. This catches the class of indentation error that made the whole
// plugin silently disappear from the profile.
//
// Run: node dev/test-bundle.mjs
import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'

let failures = 0
function check(label, ok, detail) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 300))
  if (!ok) failures += 1
}

const raw = await readFile(new URL('../novel-workbench/cordis.patch.yml', import.meta.url), 'utf8')
const lines = raw.split(/\r?\n/)
const insertIds = lines.map((line) => /^\s*-\s+id:\s*([A-Za-z0-9_.-]+)/.exec(line)?.[1]).filter(Boolean)
check('patch inserts the host and preset rows', insertIds.includes('novel-workbench') && insertIds.includes('preset-novel'), insertIds)

// YAML block scalars: every non-empty line inside `prefix: |` must be indented
// deeper than the key that opened it.
let blockIndent = null
let bad = []
for (const [index, line] of lines.entries()) {
  if (blockIndent !== null) {
    if (line.trim().length === 0) continue
    const indent = line.length - line.trimStart().length
    if (indent <= blockIndent) {
      // Leaving the block is fine only when the next line is a YAML key/list at
      // the same or lower level, e.g. `- id:`.
      if (/^\s*-\s+/.test(line) || /^\s*[A-Za-z][\w-]*:/.test(line)) blockIndent = null
      else bad.push({ line: index + 1, text: line.slice(0, 60), indent, need: blockIndent + 1 })
    }
    continue
  }
  const match = /^(\s*)prefix:\s*\|/.exec(line)
  if (match) blockIndent = match[1].length
}
check('the preset prefix block is indented as YAML', bad.length === 0, bad)

const pkg = JSON.parse(await readFile(new URL('../novel-workbench/package.json', import.meta.url), 'utf8'))
check('bundle version is current', pkg.version === '1.0.10', pkg.version)
check('bundle is publishable', pkg.name === 'narracat-dsh-workbench' && pkg.private !== true && pkg.license === 'MIT', { name: pkg.name, private: pkg.private, license: pkg.license })
check('bundle declares DSH compatibility', typeof pkg.engines?.dsh === 'string' && pkg.engines.dsh.length > 0, pkg.engines)
check('bundle exports host, agent and client', pkg.exports?.['.'] === './index.js' && pkg.exports?.['./agent'] === './agent.js' && pkg.exports?.['./client'] === './client.js', pkg.exports)

const client = await readFile(new URL('../novel-workbench/client.js', import.meta.url), 'utf8')
check('client carries create/export/tracking actions', client.includes("apiPost('create-book'") && client.includes("apiPost('export'") && client.includes("apiPost('tracking/refresh'"), { create: client.includes('create-book'), export: client.includes("apiPost('export'"), tracking: client.includes('tracking/refresh') })

const index = await readFile(new URL('../novel-workbench/index.js', import.meta.url), 'utf8')
check('host exposes create/export/tracking routes', index.includes("route === 'create-book'") && index.includes("route === 'export'") && index.includes("route === 'tracking/refresh'"), null)

// The shipped client.js must be exactly the build of src/client/*.js; stale
// generated code is invisible in unit tests that import client.js directly.
const fragments = ['00-head.js', '10-copy.js', '12-logo.js', '13-contact.js', '15-copy-extra.js', '20-util.js', '30-css.js', '40-icons.js', '50-shelf.js', '60-workbench.js', '70-views.js', '80-panel.js', '90-register.js']
const built = fragments.map((name) => `// ---- ${name} ----\n${readFileSync(new URL(`../novel-workbench/src/client/${name}`, import.meta.url), 'utf8').trimEnd()}\n`).join('\n')
check('client.js is in sync with src/client fragments', built === client, { built: built.length, shipped: client.length })

// Skill catalog counts and every registered skill file must exist.
const catalog = JSON.parse(await readFile(new URL('../novel-workbench/skills/catalog.json', import.meta.url), 'utf8'))
const badCounts = []
for (const skill of catalog.skills) {
  const dir = new URL(`../novel-workbench/skills/${skill.name}/`, import.meta.url)
  let count = 0
  const walk = (url) => {
    for (const entry of readdirSync(url, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue
      if (entry.isDirectory()) walk(new URL(`${entry.name}/`, url))
      else count += 1
    }
  }
  try { walk(dir) } catch { count = 0 }
  if (count !== skill.files) badCounts.push({ skill: skill.name, catalog: skill.files, actual: count })
}
check('skill catalog file counts match disk', badCounts.length === 0, badCounts)
for (const name of ['index.js', 'agent.js', 'client.js', 'docs', 'icon.svg', 'locale', 'skills', 'agents', 'templates']) {
  const listed = pkg.files?.some((entry) => entry === name || entry.startsWith(`${name}/`))
  check(`package files include ${name}`, listed, pkg.files)
}

// Distribution resources: every declared detail document exists, is exactly one
// image line, and points at the packaged preview.
for (const locale of ['en', 'zh']) {
  const meta = JSON.parse(await readFile(new URL(`../novel-workbench/locale/${locale}.json`, import.meta.url), 'utf8'))
  const detailUrl = new URL(`../novel-workbench/${meta.meta.detail}`, import.meta.url)
  const detail = await readFile(detailUrl, 'utf8')
  check(`${locale} detail is one image line`, detail.trim().split(/\r?\n/).length === 1 && /^!\[[^\]]+\]\(preview\.svg\)$/.test(detail.trim()), detail.trim())
  check(`${locale} detail image is packaged`, existsSync(new URL('../novel-workbench/docs/preview.svg', import.meta.url)))
}
const icon = statSync(new URL('../novel-workbench/icon.svg', import.meta.url))
check('icon is a small valid resource', icon.size > 0 && icon.size < 256 * 1024, icon.size)
check('license, notice and changelog are packaged', ['LICENSE', 'NOTICE', 'CHANGELOG.md'].every((name) => existsSync(new URL(`../novel-workbench/${name}`, import.meta.url))))
check('client module id matches the package name', client.includes(`id: '${pkg.name}'`), { name: pkg.name })
check('client injects remote session services', /inject:\s*\[[^\]]*'remote\.session'[^\]]*\]/.test(client) && /inject:\s*\[[^\]]*'sessions'[^\]]*\]/.test(client), null)
check('bundle loads remote client packages', (pkg.dsh?.client?.inject ?? []).includes('@deepseek-ai/dsh-api-remotes') && (pkg.dsh?.client?.inject ?? []).includes('@deepseek-ai/dsh-api-session-controller'), pkg.dsh?.client?.inject)

console.log(failures === 0 ? '\nBUNDLE CHECKS PASSED' : `\n${failures} BUNDLE CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
