/** Catálogo — búsqueda y filtros de lecciones */

import { esc } from './core.js'
import { LESSONS, LESSON_CATEGORIES, isLessonUnlocked, renderLessonCard, getCompletedLessons } from './brain-academy.js?v=143'
import { FACULTIES } from './school-curriculum.js?v=143'

function getFacultyForLesson(lessonId) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) return null
  return Object.entries(FACULTIES).find(([, f]) => f.categories.includes(lesson.category))?.[0] || 'cerebro'
}

export const DURATION_BUCKETS = {
  all: { label: 'Cualquier duración', min: 0, max: 99 },
  short: { label: 'Corta (≤5 min)', min: 0, max: 5 },
  medium: { label: 'Media (6–7 min)', min: 6, max: 7 },
  long: { label: 'Larga (8+ min)', min: 8, max: 99 },
}

export const REGION_FILTERS = [
  { id: 'all', label: 'Todas las regiones' },
  { id: 'pfc', label: 'Prefrontal', keywords: ['prefrontal', 'PFC', 'CPFDL', 'ejecutiv', 'Broca'] },
  { id: 'hippocampus', label: 'Hipocampo', keywords: ['hipocampo', 'hippocamp', 'consolid'] },
  { id: 'amygdala', label: 'Amígdala', keywords: ['amígdala', 'amigdala', 'miedo', 'amenaza'] },
  { id: 'parietal', label: 'Parietal', keywords: ['parietal', 'espacial'] },
  { id: 'insula', label: 'Ínsula', keywords: ['ínsula', 'insula', 'interocep'] },
  { id: 'basal', label: 'Ganglios basales', keywords: ['basal', 'dopamina', 'striatum', 'hábito'] },
  { id: 'cerebellum', label: 'Cerebelo', keywords: ['cerebelo', 'cerebell'] },
  { id: 'brainstem', label: 'Tronco / vago', keywords: ['vago', 'tronco', 'respir', 'raphe'] },
]

const DEFAULT_FILTER = { q: '', category: 'all', faculty: 'all', region: 'all', duration: 'all', status: 'all' }

export function normalizeCatalogFilter(f = {}) {
  return { ...DEFAULT_FILTER, ...f }
}

function lessonMatchesRegion(lesson, regionId) {
  if (regionId === 'all') return true
  const region = REGION_FILTERS.find(r => r.id === regionId)
  if (!region?.keywords) return true
  const text = `${lesson.region || ''} ${lesson.title} ${lesson.hook}`.toLowerCase()
  return region.keywords.some(kw => text.includes(kw.toLowerCase()))
}

function lessonMatchesDuration(lesson, durationId) {
  const bucket = DURATION_BUCKETS[durationId] || DURATION_BUCKETS.all
  const min = lesson.readMin || 5
  return min >= bucket.min && min <= bucket.max
}

export function filterLessons(lessons, filter = {}) {
  const f = normalizeCatalogFilter(filter)
  const q = f.q.trim().toLowerCase()
  const done = getCompletedLessons()

  return lessons.filter(lesson => {
    if (f.category !== 'all' && lesson.category !== f.category) return false
    if (f.faculty !== 'all' && getFacultyForLesson(lesson.id) !== f.faculty) return false
    if (!lessonMatchesRegion(lesson, f.region)) return false
    if (!lessonMatchesDuration(lesson, f.duration)) return false
    if (f.status === 'done' && !done.includes(lesson.id)) return false
    if (f.status === 'pending' && done.includes(lesson.id)) return false
    if (f.status === 'unlocked' && !isLessonUnlocked(lesson.id)) return false
    if (!q) return true
    const hay = `${lesson.title} ${lesson.hook} ${lesson.region || ''} ${LESSON_CATEGORIES[lesson.category]?.label || ''}`.toLowerCase()
    return hay.includes(q)
  })
}

export function renderCatalogToolbar(filter = {}, resultCount = 0) {
  const f = normalizeCatalogFilter(filter)
  return `<section class="catalog-toolbar span-full">
    <div class="catalog-search-wrap">
      <input type="search" id="catalog-search" class="catalog-search input-field"
        placeholder="Buscar lección, región o tema…"
        value="${esc(f.q)}"
        oninput="setCatalogFilter('q', this.value)" />
    </div>
    <div class="catalog-filters">
      <select class="catalog-select input-field" onchange="setCatalogFilter('category', this.value)">
        <option value="all" ${f.category === 'all' ? 'selected' : ''}>Todos los temas</option>
        ${Object.entries(LESSON_CATEGORIES).map(([id, c]) =>
          `<option value="${id}" ${f.category === id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
      </select>
      <select class="catalog-select input-field" onchange="setCatalogFilter('faculty', this.value)">
        <option value="all" ${f.faculty === 'all' ? 'selected' : ''}>Todas las facultades</option>
        ${Object.entries(FACULTIES).map(([id, fac]) =>
          `<option value="${id}" ${f.faculty === id ? 'selected' : ''}>${fac.icon} ${fac.label}</option>`).join('')}
      </select>
      <select class="catalog-select input-field" onchange="setCatalogFilter('region', this.value)">
        ${REGION_FILTERS.map(r =>
          `<option value="${r.id}" ${f.region === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
      </select>
      <select class="catalog-select input-field" onchange="setCatalogFilter('duration', this.value)">
        ${Object.entries(DURATION_BUCKETS).map(([id, b]) =>
          `<option value="${id}" ${f.duration === id ? 'selected' : ''}>${b.label}</option>`).join('')}
      </select>
      <select class="catalog-select input-field" onchange="setCatalogFilter('status', this.value)">
        <option value="all" ${f.status === 'all' ? 'selected' : ''}>Todas</option>
        <option value="pending" ${f.status === 'pending' ? 'selected' : ''}>Pendientes</option>
        <option value="done" ${f.status === 'done' ? 'selected' : ''}>Completadas</option>
        <option value="unlocked" ${f.status === 'unlocked' ? 'selected' : ''}>Desbloqueadas</option>
      </select>
    </div>
    <p class="catalog-result-meta">${resultCount} lección${resultCount === 1 ? '' : 'es'}${f.q ? ` para “${esc(f.q)}”` : ''}</p>
    <button type="button" class="btn-ghost catalog-reset-btn" onclick="resetCatalogFilter()">Limpiar filtros</button>
  </section>`
}

export function renderCatalogGrid(lessons) {
  if (!lessons.length) {
    return `<p class="catalog-empty">Ninguna lección coincide con los filtros.</p>`
  }
  return `<div class="academy-lesson-grid catalog-grid" id="catalog-lesson-grid">
    ${lessons.map(l => renderLessonCard(l)).join('')}
  </div>`
}

export function renderExploreContent(filter, weekly) {
  const filtered = filterLessons(LESSONS, filter)
  const featured = weekly?.lesson
    ? `<button type="button" onclick="openLesson('${weekly.lesson.id}')" class="catalog-featured-btn catalog-featured-btn--neural span-full">
        <span class="catalog-featured-label">Destacada semana ${weekly.week}</span>
        <span class="catalog-featured-title">${esc(weekly.lesson.title)} →</span>
      </button>`
    : ''
  return `${featured}
    ${renderCatalogToolbar(filter, filtered.length)}
    ${renderCatalogGrid(filtered)}`
}

function syncCatalogToolbar(f) {
  const search = document.getElementById('catalog-search')
  if (search && search.value !== f.q) search.value = f.q
  const keys = ['category', 'faculty', 'region', 'duration', 'status']
  const toolbar = document.querySelector('.catalog-toolbar')
  toolbar?.querySelectorAll('.catalog-select').forEach((sel, i) => {
    const key = keys[i]
    if (key && sel.value !== f[key]) sel.value = f[key]
  })
}

export function patchCatalogUI(filter) {
  const meta = document.querySelector('.catalog-result-meta')
  const toolbar = document.getElementById('catalog-search')?.closest('.catalog-toolbar')
  if (!toolbar) return false
  const filtered = filterLessons(LESSONS, filter)
  const f = normalizeCatalogFilter(filter)
  syncCatalogToolbar(f)
  const existing = document.getElementById('catalog-lesson-grid')
    || document.querySelector('.catalog-empty--live')
  const next = filtered.length
    ? renderCatalogGrid(filtered)
    : '<p class="catalog-empty catalog-empty--live">Ninguna lección coincide con los filtros.</p>'
  if (existing) {
    const wrap = document.createElement('div')
    wrap.innerHTML = next
    existing.replaceWith(wrap.firstElementChild)
  } else {
    toolbar.insertAdjacentHTML('afterend', next)
  }
  if (meta) {
    meta.textContent = `${filtered.length} lección${filtered.length === 1 ? '' : 'es'}${f.q ? ` para “${f.q}”` : ''}`
  }
  return true
}
