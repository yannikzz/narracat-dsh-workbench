// Build the single-file DSH client from src/client/*.js fragments.
// Run: node dev/build-client.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../novel-workbench/', import.meta.url)
const fragments = [
  '00-head.js',
  '10-copy.js',
  '12-logo.js',
  '13-contact.js',
  '15-copy-extra.js',
  '20-util.js',
  '30-css.js',
  '40-icons.js',
  '50-shelf.js',
  '60-workbench.js',
  '70-views.js',
  '80-panel.js',
  '90-register.js',
]
const parts = fragments.map((name) => {
  const path = new URL(`src/client/${name}`, root)
  return `// ---- ${name} ----\n${readFileSync(path, 'utf8').trimEnd()}\n`
})
writeFileSync(new URL('client.js', root), parts.join('\n'))
console.log(`built novel-workbench/client.js from ${fragments.length} fragments`)
