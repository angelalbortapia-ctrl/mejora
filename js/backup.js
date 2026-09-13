import { PREFIX, getToday, getSettings, saveSettings } from '/js/core.js'
import { buildMonthlyReport } from '/js/analytics.js'

export function exportAllData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(PREFIX)) data[key.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(key))
  }
  return data
}

export function downloadJSON(data, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function maybeAutoBackup() {
  const s = getSettings()
  if (!s.autoBackupEnabled) return false
  const today = getToday()
  const last = s.lastAutoBackup
  if (last === today) return false

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (last && last >= toDateStrLocal(weekAgo)) return false

  const data = exportAllData()
  downloadJSON(data, `mejora-auto-${today}.json`)
  s.lastAutoBackup = today
  saveSettings(s)
  return true
}

function toDateStrLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function exportMonthlyReportText() {
  const r = buildMonthlyReport()
  const text = [
    'INFORME MEJORA',
    `Generado: ${new Date(r.generatedAt).toLocaleString('es')}`,
    `Período: ${r.period}`,
    '',
    '--- RESUMEN ---',
    `Días de viaje: ${r.summary.daysSinceStart}`,
    `Racha: ${r.summary.streak}`,
    `Consistencia 30d: ${r.summary.consistency30}%`,
    `Hábitos completados: ${r.summary.habitsCompleted}`,
    `Sesiones cerebrales: ${r.summary.brainSessions}`,
    `Reflexiones: ${r.summary.reflections}`,
    '',
    '--- ESTA SEMANA ---',
    r.weekly.narrative,
    '',
    '--- INSIGHT ---',
    r.insight,
    '',
    '--- METAS ---',
    ...r.goals.map(g => `${g.title}: ${g.progress}/${g.target} ${g.completed ? '✓' : g.active ? '(activa)' : ''}`),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  a.download = `mejora-informe-${getToday()}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
