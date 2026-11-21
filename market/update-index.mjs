// Generate market/index.json from the template after an npm publish.
// Usage: node market/update-index.mjs
// Requires index.template.json; writes index.json (which is the file to host).
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(join(here, '..', 'novel-workbench', 'package.json'), 'utf8'))
const registry = (process.env.NPM_REGISTRY ?? 'https://registry.npmjs.org').replace(/\/$/, '')
const url = `${registry}/${pkg.name}`
const templatePath = join(here, 'index.template.json')
const outputPath = join(here, 'index.json')
const sourcePath = existsSync(outputPath) ? outputPath : templatePath

const response = await fetch(url, {
  headers: { accept: 'application/json' },
  signal: AbortSignal.timeout(10_000),
}).catch((error) => {
  console.error(`cannot reach ${url}: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
if (!response.ok) {
  console.error(`cannot read ${url}: HTTP ${response.status}`)
  process.exit(1)
}
const meta = await response.json()
const iso = meta?.time?.[pkg.version]
const published = typeof iso === 'string' ? Date.parse(iso) : Number.NaN
if (!Number.isFinite(published)) {
  console.error(`npm has no valid publish time for ${pkg.name}@${pkg.version}; publish first`)
  process.exit(1)
}

const index = JSON.parse(await readFile(sourcePath, 'utf8'))
if (index?.format !== 1) {
  console.error(`${sourcePath} does not declare format 1`)
  process.exit(1)
}
const plugin = index.plugins?.find((row) => row.name === pkg.name)
if (!plugin) {
  console.error(`${sourcePath} has no entry for ${pkg.name}`)
  process.exit(1)
}

// Build the version list from what the registry actually has. Keeping the
// template's seed versions would list versions that were never published
// (and would make installs fail). Only bundle versions with a valid
// engines.dsh are valid market entries.
const versions = Object.keys(meta.versions ?? {})
  .map((version) => {
    const manifest = meta.versions[version]
    if (!manifest?.dsh?.bundle) return null
    const iso = meta.time?.[version]
    const at = Date.parse(iso)
    const range = manifest?.engines?.dsh
    if (!Number.isFinite(at) || typeof range !== 'string' || range.trim().length === 0) return null
    return {
      version,
      publishTimestamp: Math.floor(at / 1000),
      source: { type: 'npm' },
      engines: { dsh: range },
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.publishTimestamp - a.publishTimestamp)
if (versions.length === 0) {
  console.error(`npm has no bundle versions with a valid engines.dsh for ${pkg.name}`)
  process.exit(1)
}
plugin.versions = versions
// Only keep tags whose target is in the published list, as the market format
// requires. `latest` then points at 1.0.9 without the 0.0.0-stage placeholder.
const tags = {}
for (const [tag, version] of Object.entries(meta['dist-tags'] ?? {})) {
  if (versions.some((row) => row.version === version)) tags[tag] = version
}
plugin['dist-tags'] = tags

await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`)
console.log(`wrote ${outputPath}: ${pkg.name}@${versions[0].version}, ${versions.length} published bundle version(s)`)
