/** Certificados por facultad — diploma descargable al completar módulo */

import { getItem, setItem, getSettings, esc } from './core.js'
import { FACULTIES } from './school-curriculum.js?v=145'
import { LESSONS, getCompletedLessons } from './brain-academy.js?v=145'

function getFacultyProgress(facultyId) {
  const faculty = FACULTIES[facultyId]
  if (!faculty) return { done: 0, total: 0, percent: 0 }
  const pool = LESSONS.filter(l => faculty.categories.includes(l.category))
  const done = getCompletedLessons()
  const completed = pool.filter(l => done.includes(l.id)).length
  return { done: completed, total: pool.length, percent: pool.length ? Math.round((completed / pool.length) * 100) : 0 }
}

const CERT_KEY = 'facultyCertificates'

export function isFacultyComplete(facultyId) {
  const p = getFacultyProgress(facultyId)
  return p.total > 0 && p.done >= p.total
}

export function getIssuedCertificates() {
  return getItem(CERT_KEY, [])
}

export function issueFacultyCertificate(facultyId) {
  if (!isFacultyComplete(facultyId)) return false
  const issued = getIssuedCertificates()
  if (!issued.includes(facultyId)) {
    issued.push(facultyId)
    setItem(CERT_KEY, issued)
  }
  return true
}

export function checkAndIssueCertificates() {
  const newly = []
  for (const id of Object.keys(FACULTIES)) {
    if (isFacultyComplete(id) && !getIssuedCertificates().includes(id)) {
      issueFacultyCertificate(id)
      newly.push(id)
    }
  }
  return newly
}

function certificateHTML(facultyId) {
  const faculty = FACULTIES[facultyId]
  const progress = getFacultyProgress(facultyId)
  const name = esc(getSettings().userName || 'Estudiante Mejora')
  const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Certificado — ${esc(faculty.label)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #faf8f5; color: #1c1917; }
  .cert {
    width: 297mm; height: 210mm; margin: 0 auto; padding: 18mm 22mm;
    background: linear-gradient(135deg, #fff 0%, #f3f0eb 55%, #fff 100%);
    border: 3px double #2d6a4f; position: relative;
  }
  .cert::before {
    content: ''; position: absolute; inset: 8mm; border: 1px solid #b7e4c7; pointer-events: none;
  }
  .cert-kicker { text-align: center; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #2d6a4f; margin: 0 0 8mm; }
  .cert-title { text-align: center; font-size: 34px; margin: 0 0 4mm; font-weight: 600; }
  .cert-sub { text-align: center; font-size: 14px; color: #78716c; margin: 0 0 12mm; }
  .cert-name { text-align: center; font-size: 28px; margin: 0 0 6mm; border-bottom: 1px solid #e7e2db; padding-bottom: 4mm; display: inline-block; width: 100%; }
  .cert-body { text-align: center; font-size: 15px; line-height: 1.7; max-width: 220mm; margin: 0 auto 10mm; }
  .cert-module { font-size: 22px; font-weight: 600; color: ${faculty.color}; margin: 4mm 0; }
  .cert-meta { display: flex; justify-content: space-between; font-size: 12px; color: #78716c; margin-top: 14mm; }
  .cert-seal { text-align: center; font-size: 42px; margin: 6mm 0; }
  @media print { body { background: #fff; } .cert { border-width: 2px; } }
</style></head><body>
<div class="cert">
  <p class="cert-kicker">Escuela Mejora · Neurociencia aplicada</p>
  <h1 class="cert-title">Certificado de módulo</h1>
  <p class="cert-sub">Se otorga el presente reconocimiento a</p>
  <p class="cert-name">${name}</p>
  <div class="cert-body">
    por haber completado el módulo académico
    <p class="cert-module">${faculty.icon} ${esc(faculty.label)}</p>
    con ${progress.total} lecciones estudiadas, demostrando dominio de los fundamentos
    neurocientíficos del área según el currículo de Escuela Mejora.
  </div>
  <p class="cert-seal">🏛️</p>
  <div class="cert-meta">
    <span>Fecha: ${date}</span>
    <span>${progress.total}/${progress.total} lecciones · 100%</span>
    <span>mejora.app</span>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`
}

export function downloadFacultyCertificate(facultyId) {
  if (!isFacultyComplete(facultyId)) return false
  issueFacultyCertificate(facultyId)
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return false
  w.document.write(certificateHTML(facultyId))
  w.document.close()
  return true
}

export function renderFacultyCertificateBanner(facultyId) {
  if (!isFacultyComplete(facultyId)) return ''
  const faculty = FACULTIES[facultyId]
  const issued = getIssuedCertificates().includes(facultyId)
  return `<div class="school-cert-banner">
    <div>
      <p class="school-cert-kicker">${issued ? 'Módulo completado' : '¡Módulo completado!'}</p>
      <p class="school-cert-title">${faculty.icon} ${faculty.label}</p>
      <p class="school-cert-desc">Descarga tu diploma en PDF (imprimir → guardar como PDF).</p>
    </div>
    <button type="button" onclick="downloadFacultyCert('${facultyId}')" class="school-cert-btn">📜 Descargar certificado</button>
  </div>`
}

export function renderCertificatesGrid() {
  const complete = Object.keys(FACULTIES).filter(isFacultyComplete)
  return `<div class="school-certs-grid">
    ${complete.map(id => {
      const f = FACULTIES[id]
      return `<button type="button" onclick="downloadFacultyCert('${id}')" class="school-cert-card" style="--faculty-color:${f.color}">
        <span class="school-cert-card-icon">${f.icon}</span>
        <span class="school-cert-card-title">${f.label}</span>
        <span class="school-cert-card-cta">Descargar PDF →</span>
      </button>`
    }).join('')}
  </div>`
}

export function renderCompletedCertificatesRow() {
  const complete = Object.keys(FACULTIES).filter(isFacultyComplete)
  if (!complete.length) return ''
  return `<section class="school-panel school-certs-row span-full">
    <div class="school-panel-head">
      <h2 class="school-panel-title">Tus certificados</h2>
      <span class="school-panel-meta">${complete.length} módulo${complete.length > 1 ? 's' : ''}</span>
    </div>
    ${renderCertificatesGrid()}
  </section>`
}
