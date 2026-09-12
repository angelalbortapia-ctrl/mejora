/** Búsqueda global — lecciones, meditaciones, rutas */

import { LESSONS } from './brain-academy.js?v=81'
import { MEDITATIONS } from './meditations.js?v=81'
import { NAV_SECTIONS } from './layout.js?v=81'

const EXTRA = [
  { label: 'Plan del día', href: '#/plan', type: 'Ruta' },
  { label: 'Rutina guiada', href: '#/rutina', type: 'Ruta' },
  { label: 'Modo enfoque', href: '#/enfoque', type: 'Ruta' },
  { label: 'Metas', href: '#/metas', type: 'Ruta' },
]

export function searchGlobal(query, limit = 12) {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return []
  const results = []

  for (const item of NAV_SECTIONS.flatMap(s => s.items)) {
    if (item.label.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q)) {
      results.push({ label: item.label, href: `#${item.path}`, type: 'Sección', meta: item.desc })
    }
  }
  for (const l of LESSONS) {
    if (l.title.toLowerCase().includes(q) || l.hook?.toLowerCase().includes(q)) {
      results.push({ label: l.title, href: `#/gimnasia/leccion/${l.id}`, type: 'Lección', meta: l.category })
    }
  }
  for (const m of MEDITATIONS) {
    if (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)) {
      results.push({ label: m.name, href: `#/meditacion/sesion/${m.id}`, type: 'Calma', meta: m.desc })
    }
  }
  for (const e of EXTRA) {
    if (e.label.toLowerCase().includes(q)) results.push({ ...e, meta: '' })
  }
  return results.slice(0, limit)
}

export function mountGlobalSearch() {
  if (document.getElementById('global-search-dialog')) return
  const dlg = document.createElement('dialog')
  dlg.id = 'global-search-dialog'
  dlg.className = 'global-search-dialog'
  dlg.innerHTML = `<form method="dialog" class="global-search-form">
    <label class="global-search-label" for="global-search-input">Buscar en Mejora</label>
    <input id="global-search-input" class="global-search-input" type="search" placeholder="Lección, meditación, sección…" autocomplete="off" />
    <ul id="global-search-results" class="global-search-results" role="listbox"></ul>
    <p class="global-search-hint">Atajo: <kbd>⌘</kbd><kbd>K</kbd></p>
  </form>`
  document.body.appendChild(dlg)

  const input = dlg.querySelector('#global-search-input')
  const list = dlg.querySelector('#global-search-results')

  input?.addEventListener('input', () => {
    const hits = searchGlobal(input.value)
    list.innerHTML = hits.length
      ? hits.map(h => `<li><button type="button" class="global-search-hit" data-href="${h.href}">
          <span class="global-search-type">${h.type}</span>
          <span class="global-search-title">${h.label}</span>
          ${h.meta ? `<span class="global-search-meta">${h.meta}</span>` : ''}
        </button></li>`).join('')
      : '<li class="global-search-empty">Sin resultados</li>'
  })

  list?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-href]')
    if (!btn) return
    location.hash = btn.dataset.href.replace('#', '#')
    dlg.close()
  })

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      dlg.showModal()
      input?.focus()
    }
  })
}
