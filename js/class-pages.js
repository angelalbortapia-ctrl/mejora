/** Harf — Class pages (Silicon Valley Linear shell v8.0) */

import { esc } from '/js/core.js'

export const CLASS_MODULES = [
  {
    id: 'recon',
    tag: 'Módulo 01',
    title: 'Reconocimiento pasivo',
    desc: 'OSINT, fingerprinting y mapeo de superficie sin tocar el objetivo.',
    duration: '45 min',
    level: 'Fundamentos',
    lessons: ['DNS & subdominios', 'Tech stack fingerprint', 'Exposición de metadatos'],
    status: 'done',
  },
  {
    id: 'enum',
    tag: 'Módulo 02',
    title: 'Enumeración activa',
    desc: 'Puertos, servicios y vectores iniciales con disciplina operativa.',
    duration: '60 min',
    level: 'Intermedio',
    lessons: ['Scanning seguro', 'Service enumeration', 'Credenciales por defecto'],
    status: 'current',
  },
  {
    id: 'exploit',
    tag: 'Módulo 03',
    title: 'Explotación controlada',
    desc: 'Payloads, shells y post-explotación en entorno aislado.',
    duration: '90 min',
    level: 'Avanzado',
    lessons: ['Buffer basics', 'Web RCE patterns', 'Stabilizar shell'],
    status: 'locked',
  },
  {
    id: 'privesc',
    tag: 'Módulo 04',
    title: 'Escalada de privilegios',
    desc: 'Linux privesc, tokens y persistencia con trazabilidad.',
    duration: '75 min',
    level: 'Avanzado',
    lessons: ['SUID / capabilities', 'Kernel vectors', 'Limpiar rastro'],
    status: 'locked',
  },
]

function moduleById(id) {
  return CLASS_MODULES.find(m => m.id === id) || null
}

function statusLabel(status) {
  if (status === 'done') return { text: 'Completado', className: 'htb-meta-tag--terminal' }
  if (status === 'current') return { text: 'En curso', className: '' }
  return { text: 'Bloqueado', className: '' }
}

function lessonState(module, index) {
  if (module.status === 'done') return 'is-done'
  if (module.status === 'current' && index === 0) return 'is-current'
  if (module.status === 'current' && index > 0) return ''
  if (module.status === 'locked') return ''
  return index === 0 ? 'is-current' : ''
}

function renderModuleCard(m) {
  const st = statusLabel(m.status)
  const active = m.status === 'current' ? ' is-active' : ''
  const href = m.status === 'locked' ? '#' : `#/clase/${m.id}`
  const locked = m.status === 'locked'

  return `<a href="${href}" class="htb-card htb-card--link${active}" ${locked ? 'aria-disabled="true" onclick="return false"' : ''}>
    <p class="htb-meta-tag ${st.className}">${esc(m.tag)} · ${esc(st.text)}</p>
    <h2 class="htb-title">${esc(m.title)}</h2>
    <p class="htb-body">${esc(m.desc)}</p>
    <ul class="htb-stat-row htb-card__footer">
      <li><span>${esc(m.duration)}</span>duración</li>
      <li><span>${esc(m.level)}</span>nivel</li>
    </ul>
  </a>`
}

export function renderClassHub() {
  const done = CLASS_MODULES.filter(m => m.status === 'done').length
  const total = CLASS_MODULES.length

  return `<div class="harf-linear-page animate-fade-in">
    <header class="harf-linear-hero">
      <p class="htb-meta-tag">Harf · Silicon Valley track</p>
      <h1 class="harf-linear-hero__display">Academia táctica</h1>
      <p class="harf-linear-hero__lead">Ruta guiada con glass UI, métricas claras y botones de consola. ${done}/${total} módulos completados.</p>
      <div class="harf-linear-actions">
        <button type="button" class="htb-tactical-btn htb-tactical-btn--primary" onclick="startNextClassModule()">▶ Continuar ruta</button>
        <a href="#/" class="htb-tactical-btn htb-tactical-btn--ghost no-underline">← Volver</a>
      </div>
    </header>

    <section aria-labelledby="harf-class-grid-title">
      <p id="harf-class-grid-title" class="htb-meta-tag">Catálogo de módulos</p>
      <div class="harf-linear-grid" style="margin-top:16px">
        ${CLASS_MODULES.map(renderModuleCard).join('')}
      </div>
    </section>
  </div>`
}

export function renderClassModule(moduleId) {
  const m = moduleById(moduleId)
  if (!m) {
    return `<div class="harf-linear-page">
      <div class="htb-card">
        <p class="htb-meta-tag">Error</p>
        <h1 class="htb-title">Módulo no encontrado</h1>
        <p class="htb-body">El identificador <code>${esc(moduleId)}</code> no existe en el catálogo.</p>
        <div class="harf-linear-actions" style="margin-top:20px">
          <a href="#/clase" class="htb-tactical-btn no-underline">← Academia</a>
        </div>
      </div>
    </div>`
  }

  const st = statusLabel(m.status)

  return `<div class="harf-linear-page animate-fade-in">
    <header class="harf-linear-hero">
      <p class="htb-meta-tag ${st.className}">${esc(m.tag)} · ${esc(st.text)}</p>
      <h1 class="htb-title htb-title--lg">${esc(m.title)}</h1>
      <p class="harf-linear-hero__lead">${esc(m.desc)}</p>
      <div class="harf-linear-actions">
        <button type="button" class="htb-tactical-btn htb-tactical-btn--primary" onclick="launchClassLab('${m.id}')">$ launch_lab.sh</button>
        <a href="#/clase" class="htb-tactical-btn htb-tactical-btn--ghost no-underline">← Catálogo</a>
      </div>
    </header>

    <div class="harf-linear-split">
      <article class="htb-card is-active">
        <p class="htb-meta-tag">Briefing</p>
        <h2 class="htb-title">Objetivos de sesión</h2>
        <p class="htb-body">Ejecuta cada lección en orden. Documenta hallazgos en tu journal antes de pasar al siguiente bloque.</p>
        <ul class="htb-module-list" style="margin-top:20px">
          ${m.lessons.map((lesson, i) => `
            <li class="htb-module-list__item ${lessonState(m, i)}">
              <span aria-hidden="true">${m.status === 'done' || (m.status === 'current' && i === 0) ? '✓' : '○'}</span>
              <span>${esc(lesson)}</span>
            </li>`).join('')}
        </ul>
      </article>

      <article class="htb-card">
        <p class="htb-meta-tag">Métricas</p>
        <h2 class="htb-title">Panel operativo</h2>
        <ul class="htb-stat-row" style="margin-top:16px">
          <li><span>${esc(m.duration)}</span>tiempo est.</li>
          <li><span>${esc(m.level)}</span>dificultad</li>
          <li><span>${m.lessons.length}</span>lecciones</li>
        </ul>
        <p class="htb-body" style="margin-top:20px">Entorno aislado · sin tráfico hacia producción · logs auditables.</p>
        <div class="harf-linear-actions" style="margin-top:24px">
          <button type="button" class="htb-tactical-btn" onclick="openClassNotes('${m.id}')">Ver notas</button>
          <button type="button" class="htb-tactical-btn" onclick="markClassComplete('${m.id}')">Marcar completo</button>
        </div>
      </article>
    </div>
  </div>`
}

export function getActiveClassModuleId(pathParts = []) {
  const idx = pathParts.indexOf('clase')
  if (idx === -1) return null
  return pathParts[idx + 1] || null
}

export function renderClassRoute(pathParts = []) {
  const moduleId = getActiveClassModuleId(pathParts)
  if (!moduleId) return renderClassHub()
  return renderClassModule(moduleId)
}

export function bindClassGlobals() {
  window.startNextClassModule = () => {
    const next = CLASS_MODULES.find(m => m.status === 'current') || CLASS_MODULES.find(m => m.status !== 'done' && m.status !== 'locked')
    if (next) location.hash = `#/clase/${next.id}`
    else location.hash = '#/clase'
  }

  window.launchClassLab = (id) => {
    const m = moduleById(id)
    if (!m || m.status === 'locked') return
    document.body.classList.add('harf-linear')
    alert(`Lab "${m.title}" — conecta tu entorno Harf para iniciar la VM.`)
  }

  window.openClassNotes = (id) => {
    const m = moduleById(id)
    if (!m) return
    const notes = m.lessons.map((l, i) => `${i + 1}. ${l}`).join('\n')
    alert(`Notas · ${m.title}\n\n${notes}`)
  }

  window.markClassComplete = (id) => {
    const m = moduleById(id)
    if (!m || m.status === 'locked') return
    m.status = 'done'
    const next = CLASS_MODULES.find(x => x.id !== id && x.status !== 'done')
    if (next) next.status = 'current'
    window.render?.(true)
  }
}
