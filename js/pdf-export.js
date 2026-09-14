/** Exportación de informes clínicos a PDF vía impresión del navegador (sin backend). */

import { esc } from '/js/core.js'

function buildReportHtml({ title, date, metrics, interpretation, history = [] }) {
  const rows = (metrics?.rows || []).map(r =>
    `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}${r.hint ? `<br><small>${esc(r.hint)}</small>` : ''}</td></tr>`
  ).join('')
  const trend = history.slice(0, 8).map(h =>
    `<li>${esc(h.date)} — ${h.metrics?.accuracy ?? '—'}%</li>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)} — Mejora</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #1c2230; margin: 2rem; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
    .meta { color: #5a6272; font-size: 0.9rem; margin-bottom: 1.25rem; }
    .score { font-size: 2.5rem; font-weight: 800; color: #0d9488; margin: 0.5rem 0; }
    .interp { background: #f0f4f8; padding: 0.75rem 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.92rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.65rem; text-align: left; vertical-align: top; }
    th { background: #f8fafc; width: 42%; font-weight: 600; }
    ul { margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.88rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #94a3b8; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="meta">Informe de protocolo · ${esc(date)} · Mejora.app</p>
  <p class="score">${metrics?.accuracy ?? 0}%</p>
  ${interpretation ? `<div class="interp">${esc(interpretation)}</div>` : ''}
  <table><tbody>${rows}</tbody></table>
  ${trend ? `<h2 style="font-size:1rem;margin-top:1.5rem">Historial reciente</h2><ul>${trend}</ul>` : ''}
  <footer>Generado localmente en tu dispositivo. No se envían datos a servidores.</footer>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
}

/**
 * Abre diálogo de impresión / guardar como PDF con el informe de sesión.
 */
export function exportClinicalReportPdf({ exerciseName, date, metrics, interpretation, history }) {
  const html = buildReportHtml({
    title: exerciseName || 'Protocolo clínico',
    date: date || new Date().toLocaleDateString('es'),
    metrics,
    interpretation,
    history,
  })
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    URL.revokeObjectURL(url)
    return false
  }
  win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  return true
}
