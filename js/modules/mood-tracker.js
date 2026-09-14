/** Micro-registro emocional post Calma / rutina matutina */

import { getItem, setItem, getToday, MOODS, esc } from '/js/core.js'

const LOG_KEY = 'microJournalLog'

export function getMicroJournalLog() {
  return getItem(LOG_KEY, [])
}

export function getMicroJournalToday(source = null) {
  const today = getToday()
  const entries = getMicroJournalLog().filter(e => e.date === today)
  if (!source) return entries[entries.length - 1] || null
  return entries.find(e => e.source === source) || null
}

export function hasMicroJournalToday(source = null) {
  return Boolean(getMicroJournalToday(source))
}

/** Muestra el micro-diario si no hay registro hoy para esa fuente. */
export function shouldShowMicroJournal(source) {
  if (!source) return false
  return !hasMicroJournalToday(source)
}

export function saveMicroJournal({ source, moodId, clarity, note = '' }) {
  const mood = MOODS.find(m => m.id === Number(moodId))
  if (!mood) return null
  const entry = {
    date: getToday(),
    source,
    moodId: mood.id,
    moodLabel: mood.label,
    clarity: clamp15(clarity),
    note: String(note || '').trim().slice(0, 280),
    ts: Date.now(),
  }
  const log = getMicroJournalLog().filter(e => !(e.date === entry.date && e.source === source))
  log.push(entry)
  setItem(LOG_KEY, log.slice(-120))
  return entry
}

function clamp15(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 3
  return Math.max(1, Math.min(5, Math.round(n)))
}

const SOURCE_LABELS = {
  calma: 'Calma',
  routine: 'Rutina matutina',
}

export function renderMicroJournalHTML(source, { compact = false } = {}) {
  if (!shouldShowMicroJournal(source)) return ''
  const label = SOURCE_LABELS[source] || source
  const existing = getMicroJournalToday(source)

  const moodBtns = MOODS.map(m => `
    <button type="button" class="micro-mood-btn ${existing?.moodId === m.id ? 'is-active' : ''}"
      data-mood="${m.id}" onclick="pickMicroMood('${source}', ${m.id})" title="${esc(m.label)}">
      <span class="mood-emoji">${m.emoji}</span>
    </button>`).join('')

  return `<div class="micro-journal card card-static ${compact ? 'micro-journal--compact' : ''}" data-micro-source="${esc(source)}">
    <h3 class="section-title text-base">¿Cómo te sientes?</h3>
    <p class="text-xs text-muted mb-3">Micro-registro tras ${esc(label)} — ánimo y claridad mental.</p>
    <div class="micro-mood-row" role="group" aria-label="Estado de ánimo">${moodBtns}</div>
    <label class="micro-clarity-field block mt-3">
      <span class="text-xs text-muted">Claridad mental</span>
      <input type="range" id="micro-clarity-${esc(source)}" min="1" max="5" step="1" value="${existing?.clarity ?? 3}" class="w-full"
        oninput="document.getElementById('micro-clarity-val-${esc(source)}').textContent=this.value+'/5'">
      <span id="micro-clarity-val-${esc(source)}" class="text-sm tabular-nums">${existing?.clarity ?? 3}/5</span>
    </label>
    <textarea id="micro-note-${esc(source)}" class="input-field min-h-16 resize-none mt-2" maxlength="280"
      placeholder="Nota breve (opcional)…">${esc(existing?.note || '')}</textarea>
    <button type="button" class="btn-secondary w-full mt-2" onclick="submitMicroJournal('${source}')">Guardar y continuar</button>
  </div>`
}

let pickedMood = {}

export function bindMoodTrackerGlobals() {
  window.pickMicroMood = (source, moodId) => {
    pickedMood[source] = moodId
    document.querySelectorAll(`[data-micro-source="${source}"] .micro-mood-btn`).forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.mood) === moodId)
    })
  }

  window.submitMicroJournal = (source) => {
    const moodId = pickedMood[source]
      ?? document.querySelector(`[data-micro-source="${source}"] .micro-mood-btn.is-active`)?.dataset?.mood
    if (!moodId) {
      alert('Elige un estado de ánimo.')
      return
    }
    const clarity = document.getElementById(`micro-clarity-${source}`)?.value ?? 3
    const note = document.getElementById(`micro-note-${source}`)?.value ?? ''
    saveMicroJournal({ source, moodId, clarity, note })
    delete pickedMood[source]
    window.render?.()
  }

  window.skipMicroJournal = (source) => {
    saveMicroJournal({ source, moodId: 2, clarity: 3, note: '' })
    delete pickedMood[source]
    window.render?.()
  }
}
