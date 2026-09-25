/** Escuela Mejora — currículo, facultades, mapa cerebral, repaso espaciado */

import { getItem, setItem, getToday, esc } from '/js/core.js'
import {
  LESSONS, LEGENDARY_HALL, getCompletedLessons, getAcademyWeekIndex,
  isLessonUnlocked, getLesson, renderLessonCard, getLessonQuiz,
  getDailyNeuroPunch, getWeeklyLessonMeta,
} from '/js/brain-academy.js'
import { APPLY_LESSONS } from '/js/school-apply-lessons.js'
import { FACULTIES, CURRICULUM } from '/js/school-curriculum.js'
import { renderFacultyCertificateBanner, renderCertificatesGrid, isFacultyComplete } from '/js/school-certificates.js'
import { wrapSchoolPage, renderZoneHead, normalizeSchoolSection } from '/js/school-shell.js'
import { renderLibraryList } from '/js/school-library.js'
import { renderExploreContent } from '/js/school-catalog.js'

export { FACULTIES, CURRICULUM }

export const BRAIN_REGIONS = [
  { id: 'pfc', label: 'Corteza prefrontal', icon: '🎯', keywords: ['prefrontal', 'PFC', 'CPFDL', 'Broca', 'ejecutiv'] },
  { id: 'hippocampus', label: 'Hipocampo', icon: '🧩', keywords: ['hipocampo', 'hippocamp', 'place cell', 'consolid'] },
  { id: 'amygdala', label: 'Amígdala', icon: '⚡', keywords: ['amígdala', 'amigdala', 'miedo', 'amenaza'] },
  { id: 'parietal', label: 'Parietal', icon: '🗺️', keywords: ['parietal', 'espacial', 'neglect'] },
  { id: 'insula', label: 'Ínsula', icon: '🫀', keywords: ['ínsula', 'insula', 'interocep'] },
  { id: 'basal', label: 'Ganglios basales', icon: '⚙️', keywords: ['basal', 'dopamina', 'hábito', 'striatum'] },
  { id: 'cerebellum', label: 'Cerebelo', icon: '🎾', keywords: ['cerebelo', 'cerebell', 'timing'] },
  { id: 'brainstem', label: 'Tronco / vago', icon: '🌊', keywords: ['vago', 'tronco', 'respir', 'raphe'] },
]

const REVIEW_INTERVALS = [3, 7, 30, 90]

export function getCurrentSchoolWeek() {
  return Math.min(12, getAcademyWeekIndex() + 1)
}

export function isCurriculumWeekUnlocked(week) {
  return week <= getCurrentSchoolWeek()
}

export function getFacultyForLesson(lessonId) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) return null
  return Object.entries(FACULTIES).find(([, f]) => f.categories.includes(lesson.category))?.[0] || 'cerebro'
}

export function getFacultyProgress(facultyId) {
  const faculty = FACULTIES[facultyId]
  if (!faculty) return { done: 0, total: 0, percent: 0 }
  const pool = LESSONS.filter(l => faculty.categories.includes(l.category))
  const done = getCompletedLessons()
  const completed = pool.filter(l => done.includes(l.id)).length
  return { done: completed, total: pool.length, percent: pool.length ? Math.round((completed / pool.length) * 100) : 0 }
}

export function getBrainRegionProgress() {
  const done = getCompletedLessons()
  return BRAIN_REGIONS.map(region => {
    const linked = LESSONS.filter(l => {
      if (!done.includes(l.id)) return false
      const text = `${l.region || ''} ${l.title} ${l.hook}`.toLowerCase()
      return region.keywords.some(kw => text.includes(kw.toLowerCase()))
    })
    return { ...region, count: linked.length, lessons: linked.map(l => l.id) }
  })
}

export function scheduleLessonReview(lessonId) {
  const reviews = getItem('lessonReviews', {})
  reviews[lessonId] = {
    level: 0,
    nextReview: addDaysToDate(getToday(), REVIEW_INTERVALS[0]),
    lastReview: getToday(),
    completedAt: getToday(),
  }
  setItem('lessonReviews', reviews)
}

export function completeLessonReview(lessonId) {
  const reviews = getItem('lessonReviews', {})
  const r = reviews[lessonId]
  if (!r) return
  const nextLevel = Math.min(r.level + 1, REVIEW_INTERVALS.length - 1)
  const interval = REVIEW_INTERVALS[nextLevel]
  reviews[lessonId] = {
    ...r,
    level: nextLevel,
    lastReview: getToday(),
    nextReview: addDaysToDate(getToday(), interval),
  }
  setItem('lessonReviews', reviews)
}

export function getDueReviews() {
  const today = getToday()
  const reviews = getItem('lessonReviews', {})
  const done = getCompletedLessons()
  return Object.entries(reviews)
    .filter(([id, r]) => done.includes(id) && r.nextReview && r.nextReview <= today)
    .map(([id, r]) => ({ lesson: getLesson(id), ...r }))
    .filter(x => x.lesson)
}

export function getSchoolStats() {
  const done = getCompletedLessons().length
  const week = getCurrentSchoolWeek()
  const block = CURRICULUM.find(c => c.week === week)
  const weekDone = block ? block.lessons.filter(id => getCompletedLessons().includes(id)).length : 0
  const due = getDueReviews().length
  const percent = LESSONS.length ? Math.round((done / LESSONS.length) * 100) : 0
  return { done, total: LESSONS.length, week, weekDone, weekTotal: block?.lessons.length || 0, due, percent }
}

function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function progressRing(percent, size = 88) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return `<div class="school-ring" style="--ring-size:${size}px">
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="school-ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" />
      <circle class="school-ring-fill" cx="${size/2}" cy="${size/2}" r="${r}"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
    </svg>
    <span class="school-ring-label">${percent}%</span>
  </div>`
}

function weekLessonRow(id, weekUnlocked) {
  const L = getLesson(id)
  if (!L) return ''
  const done = getCompletedLessons().includes(id)
  const canOpen = weekUnlocked || isLessonUnlocked(id)
  return `<li class="school-lesson-row ${done ? 'is-done' : ''}">
    <button type="button" onclick="openLesson('${id}')" class="school-lesson-row-btn" ${canOpen ? '' : 'disabled'}>
      <span class="school-lesson-check">${done ? '✓' : ''}</span>
      <span class="school-lesson-row-body">
        <span class="school-lesson-row-title">${esc(L.title)}</span>
        <span class="school-lesson-row-meta">${L.readMin} min${L.region ? ` · ${esc(L.region.split('·')[0].trim())}` : ''}</span>
      </span>
      <span class="school-lesson-row-go">${canOpen ? '→' : '🔒'}</span>
    </button>
  </li>`
}

function renderWeekExtras(block) {
  const caseEntry = LEGENDARY_HALL.find(c => c.lessonId === block.caseId)
  if (!caseEntry && !block.lab) return ''
  return `<div class="school-week-extra">
    ${caseEntry ? `<button type="button" onclick="openLesson('${block.caseId}')" class="school-chip school-chip--case">🏛️ ${caseEntry.name}</button>` : ''}
    ${block.lab ? `<button type="button" onclick="goToLab('${block.lab}')" class="school-chip school-chip--lab">🔬 Laboratorio · ${block.lab}</button>` : ''}
  </div>`
}

function getCurrentWeekFeaturedLesson(block) {
  const done = getCompletedLessons()
  const nextId = block.lessons.find(id => !done.includes(id)) || block.lessons[0]
  return getLesson(nextId)
}

function renderCurrentWeekFocus(block, stats) {
  const featured = getCurrentWeekFeaturedLesson(block)
  const featuredIsNew = featured && !getCompletedLessons().includes(featured.id)
  const faculty = FACULTIES[block.faculty]
  const weekDone = stats.weekDone
  const weekTotal = stats.weekTotal
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0
  return `<section class="school-focus">
    <div class="school-focus-head">
      <div>
        <p class="school-focus-kicker">Semana ${block.week} de 12</p>
        <h2 class="school-focus-title">${block.title}</h2>
        <p class="school-focus-faculty" style="--faculty-color:${faculty?.color}">${faculty?.icon} ${faculty?.label}</p>
      </div>
      <div class="school-focus-progress">
        <span class="school-focus-progress-val">${weekDone}/${weekTotal}</span>
        <span class="school-focus-progress-label">esta semana</span>
        <div class="progress-track school-focus-track"><div class="progress-fill h-full" style="width:${weekPct}%"></div></div>
      </div>
    </div>
    <ul class="school-lesson-list">
      ${block.lessons.map(id => weekLessonRow(id, true)).join('')}
    </ul>
    ${renderWeekExtras(block)}
    ${featured ? `<button type="button" onclick="openLesson('${featured.id}')" class="school-focus-cta">
      <span class="school-focus-cta-label">${featuredIsNew ? 'Siguiente en tu semana' : 'Repasar semana'}</span>
      <span class="school-focus-cta-title">${esc(featured.title)} →</span>
    </button>` : ''}
  </section>`
}

function facultyCard(id, faculty) {
  const p = getFacultyProgress(id)
  return `<a href="#/gimnasia/aprender" onclick="event.preventDefault();goLearn('curriculum',{faculty:'${id}',skipRender:true});navigate('/gimnasia/aprender')" class="school-faculty-card no-underline" style="--faculty-color:${faculty.color}">
    <span class="school-faculty-icon">${faculty.icon}</span>
    <div class="school-faculty-body">
      <h3 class="school-faculty-title">${faculty.label}</h3>
      <p class="school-faculty-meta">${p.done}/${p.total} lecciones</p>
      <div class="progress-track school-faculty-track"><div class="progress-fill h-full" style="width:${p.percent}%;background:${faculty.color}"></div></div>
    </div>
    <span class="school-faculty-pct">${p.percent}%</span>
  </a>`
}

function renderCurriculumTimeline(currentWeek) {
  const done = getCompletedLessons()
  return CURRICULUM.map(block => {
    const unlocked = isCurriculumWeekUnlocked(block.week)
    const isCurrent = block.week === currentWeek
    const weekDone = block.lessons.filter(id => done.includes(id)).length
    const faculty = FACULTIES[block.faculty]
    const status = weekDone === block.lessons.length ? 'done' : unlocked ? 'open' : 'locked'
    return `<details class="school-timeline-week school-timeline-week--${status} ${isCurrent ? 'is-current' : ''}" ${isCurrent ? 'open' : ''}>
      <summary class="school-timeline-summary">
        <span class="school-timeline-dot" aria-hidden="true"></span>
        <span class="school-timeline-num">S${block.week}</span>
        <span class="school-timeline-title">${block.title}</span>
        <span class="school-timeline-faculty" style="color:${faculty?.color}">${faculty?.icon}</span>
        <span class="school-timeline-meta">${unlocked ? `${weekDone}/${block.lessons.length}` : '🔒'}</span>
      </summary>
      <div class="school-timeline-body">
        ${unlocked
          ? `<ul class="school-lesson-list school-lesson-list--compact">
              ${block.lessons.map(id => weekLessonRow(id, unlocked)).join('')}
            </ul>
            ${renderWeekExtras(block)}`
          : `<p class="school-timeline-locked">Disponible en la semana ${block.week} de tu currículo.</p>`}
      </div>
    </details>`
  }).join('')
}

function renderBrainMap(compact = false) {
  const regions = getBrainRegionProgress()
  const active = regions.filter(r => r.count > 0).length
  return `<section class="school-panel school-brain-map ${compact ? 'school-brain-map--compact' : ''}">
    <div class="school-panel-head">
      <h2 class="school-panel-title">Mapa cerebral</h2>
      <span class="school-panel-meta">${active}/${regions.length} regiones</span>
    </div>
    <div class="school-brain-grid">
      ${regions.map(r => {
        const lit = r.count > 0
        return `<div class="school-brain-region ${lit ? 'is-active' : ''}" title="${r.count} lecciones">
          <span class="school-brain-icon">${r.icon}</span>
          <span class="school-brain-label">${r.label}</span>
          ${lit ? `<span class="school-brain-count">${r.count}</span>` : ''}
        </div>`
      }).join('')}
    </div>
  </section>`
}

function renderReviewQueue() {
  const due = getDueReviews()
  if (!due.length) return ''
  return `<section class="school-panel school-review">
    <div class="school-panel-head">
      <h2 class="school-panel-title">Repaso espaciado</h2>
      <span class="school-panel-meta school-panel-meta--alert">${due.length} hoy</span>
    </div>
    <p class="school-panel-lead">Consolidación a 3, 7, 30 y 90 días.</p>
    <div class="school-review-list">
      ${due.slice(0, 4).map(r => `
        <button type="button" onclick="startReviewQuiz('${r.lesson.id}')" class="school-review-item">
          <span class="school-review-icon">↻</span>
          <span class="school-review-title">${esc(r.lesson.title)}</span>
        </button>`).join('')}
    </div>
  </section>`
}

function renderCasesContent() {
  const done = getCompletedLessons()
  return `${renderZoneHead('Sala de casos', 'Pacientes y experimentos que reescribieron la neurociencia.', `${LEGENDARY_HALL.length} casos`)}
    <div class="school-cases-grid school-cases-grid--full">
      ${LEGENDARY_HALL.map(c => `
        <button type="button" onclick="openLesson('${c.lessonId}')" class="school-case-card ${done.includes(c.lessonId) ? 'is-done' : ''}">
          <span class="school-case-year">${c.year}</span>
          <strong class="school-case-name">${c.name}</strong>
          <span class="school-case-tag">${c.tagline}</span>
        </button>`).join('')}
    </div>`
}

function renderCertsContent() {
  const complete = Object.keys(FACULTIES).filter(isFacultyComplete)
  if (!complete.length) {
    return `${renderZoneHead('Certificados', 'Completa un módulo al 100% para obtener tu diploma.')}
      <div class="school-empty-state">
        <p class="school-empty-icon">📜</p>
        <p class="school-empty-title">Aún no tienes certificados</p>
        <p class="school-empty-desc">Termina todas las lecciones de una facultad para desbloquear tu diploma en PDF.</p>
        <div class="school-faculty-grid school-faculty-grid--compact">
          ${Object.entries(FACULTIES).map(([id, f]) => facultyCard(id, f)).join('')}
        </div>
      </div>`
  }
  return `${renderZoneHead('Tus certificados', 'Diplomas por módulo completado — imprime o guarda como PDF.', `${complete.length} módulo${complete.length > 1 ? 's' : ''}`)}
    ${renderCertificatesGrid()}`
}

export function renderHomeReviewBanner() {
  const due = getDueReviews()
  if (!due.length) return ''
  const n = due.length
  const first = due[0].lesson
  return `<a href="#/gimnasia" onclick="event.preventDefault();startReviewQuiz('${first.id}')" class="m-review-banner no-underline">
    <span class="m-review-banner-icon">📚</span>
    <span class="m-review-banner-body">
      <span class="m-review-banner-label">Repaso espaciado</span>
      <span class="m-review-banner-title">${n} lección${n > 1 ? 'es' : ''} para repasar hoy</span>
      <span class="m-review-banner-desc">Quiz rápido de 3 preguntas · consolidación 3/7/30/90 días</span>
    </span>
    <span class="m-review-banner-cta">Repasar →</span>
  </a>`
}

export function getReviewQuiz(lessonId) {
  const quiz = getLessonQuiz(lessonId)
  if (!quiz) return null
  return quiz.slice(0, 3)
}

export function renderReviewQuizFlow(flow) {
  const lesson = getLesson(flow.id)
  if (!lesson) return ''
  const quiz = getReviewQuiz(flow.id)
  if (!quiz?.length) {
    return `<div class="review-flow animate-fade-in">
      <p class="academy-post-label">Repaso espaciado</p>
      <h2 class="academy-post-title">${esc(lesson.title)}</h2>
      <p class="academy-post-hook">Sin quiz disponible — repasa la lección directamente.</p>
      <button type="button" onclick="openLesson('${flow.id}')" class="btn-primary w-full py-4">Releer lección →</button>
      <button type="button" onclick="finishReviewQuiz()" class="btn-ghost w-full mt-2">Volver</button>
    </div>`
  }
  if (flow.phase === 'done') {
    return `<div class="review-flow animate-fade-in review-flow--done">
      <p class="academy-post-label">Repaso completado</p>
      <h2 class="academy-post-title">✓ ${esc(lesson.title)}</h2>
      <p class="academy-post-score">${flow.quizScore}/${quiz.length} correctas</p>
      <p class="academy-post-hook">Próximo repaso programado según tu curva de consolidación.</p>
      <button type="button" onclick="finishReviewQuiz()" class="btn-primary w-full py-4">Listo</button>
    </div>`
  }
  const q = quiz[flow.quizIndex]
  const pct = Math.round((flow.quizIndex / quiz.length) * 100)
  return `<div class="review-flow animate-fade-in">
    <p class="academy-post-label">Repaso espaciado · ${esc(lesson.title)}</p>
    <div class="progress-track w-full mb-4" style="height:4px"><div class="progress-fill h-full" style="width:${pct}%"></div></div>
    <h2 class="academy-post-title">${q.q}</h2>
    <div class="academy-quiz-options">
      ${q.options.map((opt, i) => `
        <button type="button" onclick="answerReviewQuiz(${i})" class="academy-quiz-opt">${esc(opt)}</button>`).join('')}
    </div>
    <p class="text-xs text-muted mt-3 text-center">${flow.quizIndex + 1} / ${quiz.length}</p>
    <button type="button" onclick="finishReviewQuiz()" class="btn-ghost w-full mt-3">Cancelar</button>
  </div>`
}

function renderApplyContent(stats) {
  const done = APPLY_LESSONS.filter(l => getCompletedLessons().includes(l.id)).length
  return `<div class="school-layout">
    <section class="school-zone school-zone--panel span-full">
      ${renderZoneHead('Aplicación diaria', `${APPLY_LESSONS.length} micro-lecciones para llevar la neurociencia a tu rutina.`, `${done}/${APPLY_LESSONS.length}`)}
      <p class="ds-lead">Sin fecha de desbloqueo — disponibles desde el día 1. Ideal después del plan o antes de dormir.</p>
      <div class="academy-lesson-grid school-apply-grid">
        ${APPLY_LESSONS.map(l => renderLessonCard({ ...l, unlocked: true })).join('')}
      </div>
    </section>
  </div>`
}

function renderCurriculumContent(stats) {
  const currentWeek = stats.week
  const block = CURRICULUM.find(c => c.week === currentWeek) || CURRICULUM[0]
  return `<div class="school-layout">
    <div class="school-main">
      ${block ? renderCurrentWeekFocus(block, stats) : ''}
      <section class="school-zone school-zone--panel">
        ${renderZoneHead('Facultades', 'Cuatro módulos temáticos del currículo.', '4 módulos')}
        <div class="school-faculty-grid">
          ${Object.entries(FACULTIES).map(([id, f]) => facultyCard(id, f)).join('')}
        </div>
      </section>
      <section class="school-zone school-zone--panel">
        ${renderZoneHead('Currículo completo', '12 semanas · despliega cada bloque para ver lecciones.', 'S1–S12')}
        <div class="school-timeline-list">
          ${renderCurriculumTimeline(currentWeek)}
        </div>
      </section>
    </div>
    <aside class="school-aside">
      <div class="school-punch">
        <p class="school-punch-label">Clase express</p>
        <p class="school-punch-text">${getDailyNeuroPunch()}</p>
      </div>
      ${renderReviewQueue()}
      ${renderBrainMap(true)}
    </aside>
  </div>`
}

function renderFacultyContent(schoolFaculty) {
  const faculty = FACULTIES[schoolFaculty]
  const progress = getFacultyProgress(schoolFaculty)
  const lessons = LESSONS.filter(l => faculty.categories.includes(l.category))
  return `<button type="button" onclick="goLearn('curriculum')" class="school-back">← Facultades</button>
    <header class="school-hero school-hero--faculty" style="--faculty-color:${faculty.color}">
      <span class="school-hero-icon">${faculty.icon}</span>
      <div class="school-hero-copy">
        <h1 class="school-hero-title">${faculty.label}</h1>
        <p class="school-hero-lead">${progress.done} de ${progress.total} lecciones · ${progress.percent}% del módulo</p>
      </div>
      ${progressRing(progress.percent, 72)}
    </header>
    ${renderFacultyCertificateBanner(schoolFaculty)}
    <div class="academy-lesson-grid school-faculty-grid">
      ${lessons.map(l => renderLessonCard(l)).join('')}
    </div>`
}

export function renderSchoolHub(schoolFaculty = null, schoolSection = 'curriculum', options = {}) {
  const stats = getSchoolStats()
  const { pubmed = {}, libraryFilter = {}, showHeader = false, catalogFilter = {} } = options
  const shellOpts = { stats, showHeader }
  if (schoolFaculty && FACULTIES[schoolFaculty]) {
    return wrapSchoolPage(renderFacultyContent(schoolFaculty), 'curriculum', shellOpts)
  }
  const section = normalizeSchoolSection(schoolSection)
  switch (section) {
    case 'explore':
      return wrapSchoolPage(renderExploreContent(catalogFilter, getWeeklyLessonMeta()), 'explore', shellOpts)
    case 'apply':
      return wrapSchoolPage(renderApplyContent(stats), 'apply', shellOpts)
    case 'library':
      return wrapSchoolPage(renderLibraryList(libraryFilter, pubmed), 'library', shellOpts)
    case 'cases':
      return wrapSchoolPage(renderCasesContent(), 'cases', shellOpts)
    case 'certs':
      return wrapSchoolPage(renderCertsContent(), 'certs', shellOpts)
    default:
      return wrapSchoolPage(renderCurriculumContent(stats), 'curriculum', shellOpts)
  }
}
