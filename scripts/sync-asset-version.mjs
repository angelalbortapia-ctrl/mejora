#!/usr/bin/env node
/** Propaga ASSET_VERSION: import map, quita ?v= de imports JS, actualiza CSS/SW/HTML */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname, dirname, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION_FILE = join(ROOT, 'js/version.js')
const IMPORT_MAP = join(ROOT, 'js/import-map.json')

const src = readFileSync(VERSION_FILE, 'utf8')
const match = src.match(/export const ASSET_VERSION = (\d+)/)
if (!match) {
  console.error('No ASSET_VERSION in js/version.js')
  process.exit(1)
}
const V = match[1]

const IMPORT_RE = /(?<prefix>from\s+|import\s*\(\s*)['"](?<spec>\.?\.?\/[^'"]+?)['"]/g
const SKIP_IMPORT_MAP = /\.(example|local)\.js$/

function walk(dir, exts, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, exts, files)
    else if (exts.has(extname(name))) files.push(p)
  }
  return files
}

function jsFiles() {
  return walk(join(ROOT, 'js'), new Set(['.js']))
}

function toUrl(filePath) {
  const rel = relative(join(ROOT, 'js'), filePath).replace(/\\/g, '/')
  return `/js/${rel}`
}

function resolveSpec(importer, spec) {
  spec = spec.replace(/\?v=\d+/, '')
  if (spec.startsWith('/js/')) return spec
  const base = dirname(importer)
  let target
  if (spec.startsWith('./') || spec.startsWith('../')) {
    target = resolve(base, spec)
  } else {
    target = resolve(join(ROOT, 'js'), spec)
  }
  const jsRoot = join(ROOT, 'js')
  if (!target.startsWith(jsRoot)) return spec
  const rel = relative(jsRoot, target).replace(/\\/g, '/')
  return `/js/${rel}`
}

function buildImportMap() {
  const mapping = {}
  for (const file of jsFiles()) {
    const url = toUrl(file)
    if (SKIP_IMPORT_MAP.test(url)) continue
    mapping[url] = `${url}?v=${V}`
  }
  return mapping
}

function normalizeJsImports() {
  let touched = 0
  for (const file of jsFiles()) {
    let text = readFileSync(file, 'utf8')
    let changed = false
    const next = text.replace(IMPORT_RE, (m, prefix, spec) => {
      const url = resolveSpec(file, spec)
      if (url !== spec) changed = true
      return `${prefix}'${url}'`
    }).replace(/\?v=\d+/g, '')
    if (changed || next !== text) {
      writeFileSync(file, next)
      touched++
    }
  }
  return touched
}

function patchOtherFiles() {
  const exts = new Set(['.html', '.css', '.py'])
  const files = walk(ROOT, exts).filter(p =>
    !p.includes('sync-asset-version') && !p.endsWith('import-map.json')
  )
  let touched = 0
  for (const file of files) {
    let text = readFileSync(file, 'utf8')
    let next = text
      .replace(/\?v=\d+/g, `?v=${V}`)
      .replace(/const CACHE = 'mejora-v\d+'/g, `const CACHE = 'mejora-v${V}'`)
    if (file.endsWith('index.html')) {
      next = next.replace(
        /<script type="module" src="js\/app\.js\?v=\d+"><\/script>/,
        '<script type="module" src="/js/app.js"></script>'
      )
      if (!next.includes('import-map.json')) {
        next = next.replace(
          '<script type="module" src="/js/app.js"></script>',
          `  <script type="importmap" src="/js/import-map.json?v=${V}"></script>\n  <script type="module" src="/js/app.js"></script>`
        )
      }
    }
    if (next !== text) {
      writeFileSync(file, next)
      touched++
    }
  }
  return touched
}

const mapping = buildImportMap()
writeFileSync(IMPORT_MAP, JSON.stringify({ imports: mapping }, null, 2) + '\n')
const jsN = normalizeJsImports()
const otherN = patchOtherFiles()

console.log(`ASSET_VERSION=${V}`)
console.log(`  import-map.json → ${Object.keys(mapping).length} módulos`)
console.log(`  JS normalizados → ${jsN} archivos`)
console.log(`  otros archivos → ${otherN}`)
