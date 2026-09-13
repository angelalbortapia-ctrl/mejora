import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MEDITATIONS } from '../js/meditations.js'
import { HABIT_TEMPLATES } from '../js/content.js'
import { EXERCISES } from '../js/brain-program.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('smoke — rutas y contenido', () => {
  it('app define rutas principales', () => {
    const app = readFileSync(join(root, 'js/app.js'), 'utf8')
    for (const p of ['/', '/mejora', '/gimnasia', '/meditacion', '/settings']) {
      assert.match(app, new RegExp(`['"]${p.replace('/', '\\/')}['"]:`))
    }
  })

  it('meditaciones tienen id y título', () => {
    assert.ok(MEDITATIONS.length >= 20)
    MEDITATIONS.forEach(m => {
      assert.ok(m.id, `meditation missing id: ${m.title}`)
      assert.ok(m.title?.length > 2, `meditation missing title: ${m.id}`)
    })
  })

  it('plantillas de hábitos no vacías', () => {
    assert.ok(HABIT_TEMPLATES.length >= 10)
    HABIT_TEMPLATES.forEach(t => {
      assert.ok(t.id && t.name)
    })
  })

  it('ejercicios cerebrales definidos', () => {
    assert.ok(Object.keys(EXERCISES).length >= 8)
  })
})

describe('smoke — archivos de producción', () => {
  it('privacy.html existe', () => {
    const html = readFileSync(join(root, 'privacy.html'), 'utf8')
    assert.match(html, /Privacidad/)
    assert.match(html, /borrar/i)
  })

  it('service worker precachea shell', () => {
    const sw = readFileSync(join(root, 'service-worker.js'), 'utf8')
    assert.match(sw, /precacheShell/)
    assert.match(sw, /import-map/)
    assert.match(sw, /privacy\.html/)
  })

  it('manifest tiene shortcuts PWA', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
    assert.ok(manifest.id)
    assert.ok(manifest.shortcuts?.length >= 3)
  })

  it('i18n locales existen', () => {
    assert.match(readFileSync(join(root, 'js/locales/es.js'), 'utf8'), /nav/)
    assert.match(readFileSync(join(root, 'js/locales/en.js'), 'utf8'), /nav/)
  })

  it('pages workflow exige tests antes de deploy', () => {
    const wf = readFileSync(join(root, '.github/workflows/pages.yml'), 'utf8')
    assert.match(wf, /needs:\s*test/)
    assert.match(wf, /npm test/)
  })
})
