/** Bloques dinámicos para lecciones — checkpoints, flips, escenarios, gamificación */

import { forgeSparkAt, haptic, celebrate, pulseElement } from './fx.js?v=143'
import { playSuccess, playLevelUp, playStreak } from './sounds.js?v=143'

const MASTERY_RANKS = [
  { min: 0, label: 'Explorador', icon: '◎' },
  { min: 25, label: 'Aprendiz', icon: '◈' },
  { min: 50, label: 'Experto', icon: '◆' },
  { min: 75, label: 'Maestro', icon: '✦' },
  { min: 95, label: 'Élite', icon: '⚡' },
]

export const LESSON_BLOCK_PRE = new Set([
  'punch', 'stat', 'compare', 'scenario', 'flip', 'analogy', 'timeline', 'quote', 'insight', 'steps', 'stack',
])
export const LESSON_BLOCK_POST = new Set(['checkpoint', 'action', 'debate', 'lab'])

export let lessonEngagement = {
  id: '', total: 0, done: 0, xp: 0, wins: [],
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

export function renderLessonBlocks(blocks, uid = '') {
  if (!blocks?.length) return ''
  return blocks.map((b, i) => renderLessonBlock(b, `${uid}-${i}`)).join('')
}

function renderLessonBlock(b, id) {
  switch (b.type) {
    case 'punch':
      return `<div class="lesson-block lesson-punch lesson-punch--glow">
        <span class="lesson-punch-value">${esc(b.value || b.text)}</span>
        ${b.sub ? `<span class="lesson-punch-sub">${esc(b.sub)}</span>` : ''}
      </div>`
    case 'stat': {
      const raw = String(b.value || '')
      const num = raw.match(/[\d.]+/)
      const suffix = num ? raw.slice(num.index + num[0].length) : ''
      const countAttr = num ? ` data-count="${num[0]}" data-suffix="${esc(suffix)}"` : ''
      return `<div class="lesson-block lesson-stat-block lesson-stat--animated">
        <span class="lesson-stat-big"${countAttr}>${num ? '0' + esc(suffix) : esc(raw)}</span>
        <span class="lesson-stat-label">${esc(b.label)}</span>
        ${b.context ? `<p class="lesson-stat-ctx">${esc(b.context)}</p>` : ''}
      </div>`
    }
    case 'compare':
      return `<div class="lesson-block lesson-compare">
        <div class="lesson-compare-col lesson-compare-col--myth">
          <span class="lesson-block-label">${esc(b.a?.label || 'Mito')}</span>
          <p>${esc(b.a?.text)}</p>
        </div>
        <div class="lesson-compare-col lesson-compare-col--real">
          <span class="lesson-block-label">${esc(b.b?.label || 'Ciencia')}</span>
          <p>${esc(b.b?.text)}</p>
        </div>
      </div>`
    case 'flip':
      return `<button type="button" class="lesson-block lesson-flip" data-flip="${id}" aria-pressed="false">
        <div class="lesson-flip-inner">
          <div class="lesson-flip-face lesson-flip-front">
            <span class="lesson-block-label">Toca para voltear</span>
            <p>${esc(b.front)}</p>
          </div>
          <div class="lesson-flip-face lesson-flip-back">
            <span class="lesson-block-label">La verdad</span>
            <p>${esc(b.back)}</p>
          </div>
        </div>
      </button>`
    case 'scenario':
      return `<div class="lesson-block lesson-scenario">
        <span class="lesson-block-label">🎬 Escenario</span>
        <p class="lesson-scenario-title">${esc(b.title)}</p>
        <p class="lesson-scenario-text">${esc(b.text)}</p>
        <button type="button" class="lesson-scenario-reveal btn-ghost text-sm" data-scenario="${id}">¿Qué pasa en el cerebro? →</button>
        <p class="lesson-scenario-answer" hidden>${esc(b.reveal)}</p>
      </div>`
    case 'checkpoint':
      const opts = (b.options || []).map((o, i) =>
        `<button type="button" class="lesson-check-opt" data-idx="${i}">${esc(o)}</button>`
      ).join('')
      return `<div class="lesson-block lesson-checkpoint lesson-checkpoint--arena" data-answer="${b.answer ?? 0}" id="${id}">
        <span class="lesson-checkpoint-scan" aria-hidden="true"></span>
        <span class="lesson-block-label">⚡ Checkpoint</span>
        <p class="lesson-checkpoint-q">${esc(b.q)}</p>
        <div class="lesson-checkpoint-options">${opts}</div>
        <p class="lesson-checkpoint-explain" hidden>${esc(b.explain)}</p>
      </div>`
    case 'analogy':
      return `<div class="lesson-block lesson-analogy">
        <span class="lesson-block-label">💡 Analogía</span>
        <div class="lesson-analogy-row">
          <span class="lesson-analogy-from">${esc(b.from)}</span>
          <span class="lesson-analogy-arrow">→</span>
          <span class="lesson-analogy-to">${esc(b.to)}</span>
        </div>
        <p>${esc(b.text)}</p>
      </div>`
    case 'timeline':
      const items = (b.items || []).map(it =>
        `<li><span class="lesson-tl-when">${esc(it.when)}</span><span class="lesson-tl-what">${esc(it.what)}</span></li>`
      ).join('')
      return `<div class="lesson-block lesson-timeline"><span class="lesson-block-label">📅 Línea temporal</span><ol>${items}</ol></div>`
    case 'action':
      return `<div class="lesson-block lesson-action">
        <span class="lesson-block-label">🏃 Hazlo ahora</span>
        <p>${esc(b.text)}</p>
        ${b.duration ? `<span class="lesson-action-time">${esc(b.duration)}</span>` : ''}
        <button type="button" class="lesson-action-done btn-secondary text-sm" data-action="${id}">Listo ✓</button>
      </div>`
    case 'quote':
      return `<blockquote class="lesson-block lesson-pullquote">${esc(b.text)}${b.author ? `<cite>— ${esc(b.author)}</cite>` : ''}</blockquote>`
    case 'insight':
      return `<div class="lesson-block lesson-insight">
        <span class="lesson-block-label">💎 Insight</span>
        <p>${esc(b.text)}</p>
      </div>`
    case 'debate': {
      const opts = [b.a, b.b].map((t, i) =>
        `<button type="button" class="lesson-debate-opt" data-idx="${i}">${esc(t)}</button>`
      ).join('')
      return `<div class="lesson-block lesson-debate" data-correct="${b.answer ?? 1}" data-win="${esc(b.win || '')}">
        <span class="lesson-block-label">⚔️ Mito vs ciencia</span>
        <p class="lesson-debate-q">${esc(b.q)}</p>
        <div class="lesson-debate-options">${opts}</div>
        <p class="lesson-debate-result" hidden></p>
      </div>`
    }
    case 'lab':
      return `<div class="lesson-block lesson-lab">
        <span class="lesson-block-label">🔬 Laboratorio</span>
        <p>${esc(b.text)}</p>
        <button type="button" class="btn-secondary text-sm lesson-lab-btn" data-exercise="${esc(b.exercise)}">${esc(b.cta || 'Entrenar ahora →')}</button>
      </div>`
    case 'steps': {
      const steps = (b.items || []).map((st, i) => `
        <button type="button" class="lesson-step-head" data-step="${i}" aria-expanded="false">
          <span class="lesson-step-num">${i + 1}</span>
          <span class="lesson-step-title">${esc(st.title)}</span>
          <span class="lesson-step-chevron">›</span>
        </button>
        <div class="lesson-step-body" hidden><p>${esc(st.text)}</p></div>
      `).join('')
      return `<div class="lesson-block lesson-steps">${steps}</div>`
    }
    case 'stack': {
      const cards = (b.cards || []).map((c, i) => `
        <button type="button" class="lesson-stack-card" data-stack="${id}-${i}" aria-pressed="false">
          <span class="lesson-stack-front">${esc(c.front)}</span>
          <span class="lesson-stack-back">${esc(c.back)}</span>
        </button>
      `).join('')
      return `<div class="lesson-block lesson-stack"><span class="lesson-block-label">🃏 Tarjetas</span><div class="lesson-stack-grid">${cards}</div></div>`
    }
    default:
      return ''
  }
}

function lessonReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
}

function getMasteryRank(pct) {
  let rank = MASTERY_RANKS[0]
  for (const r of MASTERY_RANKS) if (pct >= r.min) rank = r
  return rank
}

function lessonFlash(vp, kind = 'win') {
  if (lessonReducedMotion()) return
  const flash = vp.querySelector('.lesson-flash-overlay')
  if (!flash) return
  flash.classList.remove('lesson-flash--win', 'lesson-flash--level')
  flash.classList.add(kind === 'level' ? 'lesson-flash--level' : 'lesson-flash--win')
  void flash.offsetWidth
  flash.classList.add('is-active')
  setTimeout(() => flash.classList.remove('is-active'), 520)
}

function showLessonXpFloat(vp, amount, extra = '') {
  if (lessonReducedMotion()) return
  const el = document.createElement('span')
  el.className = 'lesson-xp-float' + (extra ? ' lesson-xp-float--combo' : '')
  el.textContent = extra ? `${extra} +${amount} XP` : `+${amount} XP`
  const hud = vp.querySelector('.lesson-mastery-xp')
  const r = hud?.getBoundingClientRect()
  el.style.left = `${(r?.left ?? window.innerWidth / 2) - 20}px`
  el.style.top = `${(r?.top ?? 60) - 12}px`
  document.getElementById('fx-layer')?.appendChild(el)
  setTimeout(() => el.remove(), 1200)
}

function showComboToast(vp, streak, mult) {
  if (lessonReducedMotion() || streak < 2) return
  const layer = vp.querySelector('.lesson-combo-layer')
  if (!layer) return
  const el = document.createElement('div')
  el.className = 'lesson-combo-toast'
  el.textContent = streak >= 4 ? `🔥 RACHA x${mult}` : `⚡ x${mult} racha`
  layer.appendChild(el)
  setTimeout(() => el.remove(), 1400)
}

function showSectionToast(vp, title) {
  if (lessonReducedMotion()) return
  const toast = vp.querySelector('.lesson-section-toast')
  if (!toast) return
  toast.textContent = `✓ ${(title || 'Sección').slice(0, 42)}`
  toast.hidden = false
  toast.classList.add('is-show')
  setTimeout(() => {
    toast.classList.remove('is-show')
    toast.hidden = true
  }, 2200)
}

function markSectionProgress(vp, el) {
  const section = el.closest('.lesson-section-card')
  if (!section) return
  const idx = section.dataset.section
  const nav = vp.querySelector(`.lesson-sec-nav-item[data-sec="${idx}"]`)
  if (el.classList.contains('is-correct')) nav?.classList.add('is-done')
  const interactives = [...section.querySelectorAll('.lesson-checkpoint, .lesson-debate')]
  if (!interactives.length) return
  const allAnswered = interactives.every(x => x.classList.contains('is-answered'))
  const allCorrect = interactives.every(x => x.classList.contains('is-correct') || !x.classList.contains('is-answered'))
  if (allAnswered && !section.classList.contains('is-complete')) {
    section.classList.add('is-complete')
    if (interactives.some(x => x.classList.contains('is-correct'))) {
      showSectionToast(vp, section.querySelector('.academy-section-title')?.textContent)
      forgeSparkAt(section, 16)
      haptic([12, 24, 12])
    }
  }
}

export function animateLessonStats(vp) {
  if (lessonReducedMotion()) return
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.animated) return
      entry.target.dataset.animated = '1'
      const el = entry.target
      const end = parseFloat(el.dataset.count)
      const suffix = el.dataset.suffix || ''
      if (Number.isNaN(end)) return
      const dur = 900
      const start = performance.now()
      const tick = now => {
        const t = Math.min(1, (now - start) / dur)
        const ease = 1 - Math.pow(1 - t, 3)
        const val = end % 1 ? (ease * end).toFixed(1) : Math.round(ease * end)
        el.textContent = `${val}${suffix}`
        if (t < 1) requestAnimationFrame(tick)
        else pulseElement(el)
      }
      requestAnimationFrame(tick)
    })
  }, { root: vp, threshold: 0.5 })
  vp.querySelectorAll('.lesson-stat-big[data-count]').forEach(el => obs.observe(el))
  vp._lessonStatObs = obs
}

export function initLessonEngagement(vp, lessonId) {
  if (!vp) return
  const interactives = vp.querySelectorAll(
    '.lesson-checkpoint, .lesson-scenario:not(.is-done), .lesson-action, .lesson-flip, .lesson-debate, .lesson-steps, .lesson-stack-card'
  )
  const checkpoints = vp.querySelectorAll('.lesson-checkpoint').length
  lessonEngagement = {
    id: lessonId,
    total: Math.max(checkpoints, 1) + (interactives.length - checkpoints),
    done: 0,
    xp: 0,
    wins: [],
    checkpoints,
    passed: 0,
    streak: 0,
    bestStreak: 0,
    lastRank: 0,
  }
  vp.dataset.lessonId = lessonId
  delete vp.dataset.masteryCelebrated
  updateLessonHud(vp)
  renderMasteryRecap(vp)
  animateLessonStats(vp)
}

function registerEngagement(vp, kind, label, xp, opts = {}) {
  const correct = opts.correct !== false
  let mult = 1
  if (correct && (kind === 'checkpoint' || kind === 'debate')) {
    lessonEngagement.streak++
    lessonEngagement.bestStreak = Math.max(lessonEngagement.bestStreak, lessonEngagement.streak)
    mult = Math.min(3, 1 + Math.floor((lessonEngagement.streak - 1) / 2))
    if (lessonEngagement.streak >= 2) {
      playStreak()
      showComboToast(vp, lessonEngagement.streak, mult)
    } else {
      playSuccess()
    }
    lessonFlash(vp, 'win')
  } else if (!correct && (kind === 'checkpoint' || kind === 'debate')) {
    lessonEngagement.streak = 0
  } else if (correct) {
    playSuccess()
  }

  const gained = Math.round(xp * mult)
  lessonEngagement.done++
  lessonEngagement.xp += gained
  if (label) lessonEngagement.wins.push(label)
  if (kind === 'checkpoint' && correct) lessonEngagement.passed++

  const pct = getLessonMasteryPct()
  const rank = getMasteryRank(pct)
  const rankIdx = MASTERY_RANKS.indexOf(rank)
  if (rankIdx > lessonEngagement.lastRank) {
    lessonEngagement.lastRank = rankIdx
    lessonFlash(vp, 'level')
    playLevelUp()
    const layer = vp.querySelector('.lesson-combo-layer')
    if (layer) {
      const el = document.createElement('div')
      el.className = 'lesson-combo-toast lesson-combo-toast--rank'
      el.textContent = `${rank.icon} ${rank.label}`
      layer.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  }

  updateLessonHud(vp)
  showLessonXpFloat(vp, gained, mult > 1 ? `x${mult}` : '')
  renderMasteryRecap(vp)
  if (opts.el) markSectionProgress(vp, opts.el)

  if (
    lessonEngagement.checkpoints > 0
    && lessonEngagement.passed >= lessonEngagement.checkpoints
    && !vp.dataset.masteryCelebrated
  ) {
    vp.dataset.masteryCelebrated = '1'
    celebrate('level')
    lessonFlash(vp, 'level')
    vp.querySelector('.lesson-mastery-recap')?.classList.add('is-complete')
  }
  updateCompleteButtons(vp, pct)
}

export function getLessonMasteryPct() {
  const { checkpoints, passed, done, total } = lessonEngagement
  if (checkpoints > 0) return Math.min(100, Math.round((passed / checkpoints) * 70 + (done / Math.max(total, 1)) * 30))
  if (total > 0) return Math.min(100, Math.round((done / total) * 100))
  return 0
}

export function getLessonBonusXp() {
  const pct = getLessonMasteryPct()
  if (pct >= 90) return 20
  if (pct >= 70) return 12
  if (pct >= 50) return 6
  return 0
}

function updateLessonHud(vp) {
  const pct = getLessonMasteryPct()
  const rank = getMasteryRank(pct)
  const ring = vp.querySelector('.lesson-mastery-ring')
  const pctEl = vp.querySelector('.lesson-mastery-pct')
  const xpEl = vp.querySelector('.lesson-mastery-xp')
  const rankEl = vp.querySelector('.lesson-mastery-rank')
  const streakEl = vp.querySelector('.lesson-streak-badge')
  if (ring) ring.style.setProperty('--mastery', pct)
  if (pctEl) pctEl.textContent = `${pct}%`
  if (xpEl) xpEl.textContent = `+${lessonEngagement.xp} XP`
  if (rankEl) rankEl.textContent = `${rank.icon} ${rank.label}`
  if (streakEl) {
    streakEl.textContent = lessonEngagement.streak >= 2 ? `🔥${lessonEngagement.streak}` : ''
    streakEl.hidden = lessonEngagement.streak < 2
  }
  updateCompleteButtons(vp, pct)
}

function updateCompleteButtons(vp, pct) {
  const bonus = getLessonBonusXp()
  const hint = pct < 50 && lessonEngagement.checkpoints > 0
    ? `Interactúa más · ${pct}% dominio`
    : bonus > 0 ? `+${bonus} XP bonus al completar` : `${pct}% dominio`
  vp.querySelectorAll('.lesson-complete-hint').forEach(el => { el.textContent = hint })
  vp.querySelectorAll('.lesson-complete-btn, .lesson-footer-cta').forEach(btn => {
    btn.classList.toggle('lesson-btn-ready', pct >= 50)
  })
}

function renderMasteryRecap(vp) {
  const list = vp.querySelector('#lesson-mastery-list')
  if (!list) return
  if (!lessonEngagement.wins.length) {
    list.innerHTML = '<li class="lesson-mastery-empty">Completa checkpoints y escenarios para llenar tu mapa</li>'
    return
  }
  list.innerHTML = lessonEngagement.wins.map(w => `<li class="lesson-mastery-win">${esc(w)}</li>`).join('')
}

export function renderLessonEngagementHud() {
  return `<div class="lesson-mastery-hud" aria-live="polite">
    <span class="lesson-streak-badge" hidden></span>
    <div class="lesson-mastery-ring" style="--mastery:0" title="Dominio de la lección">
      <svg viewBox="0 0 36 36" class="lesson-mastery-svg" aria-hidden="true">
        <circle class="lesson-mastery-bg" cx="18" cy="18" r="15.5"/>
        <circle class="lesson-mastery-fill" cx="18" cy="18" r="15.5"/>
      </svg>
      <span class="lesson-mastery-pct">0%</span>
    </div>
    <div class="lesson-mastery-meta">
      <span class="lesson-mastery-rank">◎ Explorador</span>
      <span class="lesson-mastery-xp">+0 XP</span>
    </div>
  </div>`
}

export function renderLessonFxLayers() {
  return `<div class="lesson-aurora" aria-hidden="true"></div>
    <div class="lesson-flash-overlay" aria-hidden="true"></div>
    <div class="lesson-combo-layer" aria-live="polite"></div>
    <div class="lesson-section-toast" hidden></div>`
}

export function renderLessonMasteryRecap() {
  return `<div class="lesson-mastery-recap lesson-reflect-panel" id="lesson-mastery-recap">
    <p class="academy-reflect-label">🧠 Tu dominio en vivo</p>
    <ul class="lesson-mastery-list" id="lesson-mastery-list">
      <li class="lesson-mastery-empty">Completa checkpoints y escenarios para llenar tu mapa</li>
    </ul>
  </div>`
}

/** Semana 1 + overrides premium */
const LESSON_DYNAMIC = {
  neurotransmitters: {
    sections: [
      {
        h: 'La sinapsis: de la señal eléctrica al mensaje químico',
        p: 'La neurona presináptica libera neurotransmisores en la hendidura. Se unen a receptores y cambian la probabilidad de que la siguiente neurona dispare — inmediato (ionotrópico) o lento y duradero (metabotrópico).',
        blocks: [
          { type: 'analogy', from: 'WhatsApp', to: 'Sinapsis', text: 'No es que las neuronas se “toquen”. Una manda un mensaje químico; la otra decide si contestar con fuego o ignorar.' },
          { type: 'stat', value: '0.5 ms', label: 'ventana sináptica', context: 'En ese flash se decide si una red se activa o se frena.' },
          { type: 'checkpoint', q: '¿Qué limita cuánto dura un mensaje sináptico?', options: ['Solo el axón', 'Reuptake y degradación', 'La mielina'], answer: 1, explain: 'La reuptake “recicla” el neurotransmisor; la degradación lo destruye. Ahí actúan Prozac, cafeína y más.' },
        ],
      },
      {
        h: 'Glutamato y GABA: el acelerador y el freno',
        p: 'Glutamato excita (aprendizaje, memoria). GABA inhibe (calma, sueño, control). El balance E/I es el termostato de casi todo circuito cognitivo.',
        blocks: [
          { type: 'compare', a: { label: 'Demasiado gas', text: 'Excitación sin freno → ansiedad, rumiación, epilepsia.' }, b: { label: 'Demasiado freno', text: 'Inhibición global → sedación, lentitud, “mente nublada”.' } },
          { type: 'flip', front: '“Meditar es solo relajarte”', back: 'Respiración lenta modula GABA y tono parasimpático de forma medible — no es placebo.' },
          { type: 'checkpoint', q: '¿Cuál es el principal inhibitorio del SNC?', options: ['Glutamato', 'GABA', 'Dopamina'], answer: 1, explain: 'GABA frena redes hiperactivas. Sin balance, no hay control fino.' },
        ],
      },
      {
        h: 'Moduladores: dopamina, serotonina, noradrenalina, ACh',
        p: 'No son emociones embotelladas. Ajustan ganancia, alerta y plasticidad en circuitos distribuidos según contexto.',
        blocks: [
          { type: 'punch', value: 'Dopamina ≠ placer', sub: 'Marca predicción de recompensa y error — por eso el scroll engancha antes del contenido.' },
          { type: 'scenario', title: 'Lunes 7am, suena la alarma', text: 'Ayer prometiste gym. Hoy tu cerebro ya calculó probabilidad de esfuerzo vs sofá.', reveal: 'Dopamina no te “premia” en el gym — te empujó ayer cuando planeaste. Hoy compite con adenosina (sueño) y costo metabólico. Por eso la decisión es química + contexto, no “fuerza de voluntad” abstracta.' },
          { type: 'checkpoint', q: '¿Por qué los ISRS tardan semanas?', options: ['Llenan serotonina al instante', 'Remodelan receptores con plasticidad', 'Solo funcionan de noche'], answer: 1, explain: 'Cambian la ganancia sináptica a lo largo del tiempo — no es un depósito de serotonina.' },
        ],
      },
      {
        h: 'Hebb, Kandel y el hábito como química repetida',
        p: '“Neurons that fire together, wire together.” Cada repetición de hábito es entrenamiento sináptico — refuerzo o podado.',
        blocks: [
          { type: 'timeline', items: [{ when: '1949', what: 'Hebb: co-activación → conexión' }, { when: '2000', what: 'Kandel: Nobel por LTP en Aplysia' }, { when: 'Hoy', what: 'Tu rutina en Mejora = mismo mecanismo' }] },
          { type: 'action', text: 'Elige UN gesto de 2 min (agua, estiramiento, 5 respiraciones). Misma hora mañana. Eso es LTP en acción.', duration: '2 min' },
          { type: 'checkpoint', q: '¿Qué hace LTD?', options: ['Fortalece sinapsis usadas', 'Debilita sinapsis ignoradas', 'Crea neuronas nuevas'], answer: 1, explain: 'Use it or lose it — el cerebro poda lo que no repites.' },
        ],
      },
    ],
  },
  'predictive-brain': {
    lead: 'Tu experiencia de “realidad” es un borrador interno que el cerebro corrige cuando algo no cuadra. No eres cámara — eres modelo generativo.',
    keyTerms: [
      { term: 'Prediction error', def: 'Diferencia entre lo que el cerebro esperaba y lo que llegó.' },
      { term: 'Prior', def: 'Expectativa previa que sesga la interpretación.' },
      { term: 'Interocepción', def: 'Predicción desde señales corporales internas.' },
    ],
    sections: [
      {
        h: 'Tu cerebro adivina antes de ver',
        p: 'Friston y Barrett: el SNC genera modelos internos y solo procesa la sorpresa. Lo predecible cuesta poca energía; lo inesperado dispara actualización.',
        blocks: [
          { type: 'scenario', title: 'Camillas por un pasillo oscuro', text: 'Ves una forma al fondo. Un segundo después “ves” que es una percha.', reveal: 'Tu corteza visual recibió datos ambiguos. El cerebro inyectó la predicción más probable (objeto familiar) hasta que nuevos datos corrigieron el modelo. No viste tarde — predijiste mal y corregiste.' },
          { type: 'flip', front: '“Veo el mundo tal cual es”', back: 'Ves tu mejor predicción corregida. La ilusión de continuidad visual es relleno predictivo.' },
          { type: 'checkpoint', q: '¿Qué procesa prioritariamente el cerebro?', options: ['Todo por igual', 'Solo prediction error', 'Solo emociones'], answer: 1, explain: 'Lo familiar se predice bien y casi no se “nota”. Lo nuevo exige energía.' },
        ],
      },
      {
        h: 'Por qué duele sin lesión y el miedo sin peligro',
        p: 'Dolor crónico, ansiedad y síntomas somáticos pueden ser prediction error sostenido: el modelo espera amenaza y el cuerpo obediente.',
        blocks: [
          { type: 'compare', a: { label: 'Libro de texto', text: 'Estímulo → respuesta. Lineal.' }, b: { label: 'Cerebro real', text: 'Predicción → acción corporal → sensación que confirma la predicción. Bucle.' } },
          { type: 'punch', value: 'Ansiedad = modelo mal calibrado', sub: 'No es “pensar de más” — es un prior de amenaza demasiado alto.' },
          { type: 'action', text: 'Piensa en algo que te estresa hoy. Escribe el peor escenario Y dos escenarios neutros igual de probables.', duration: '60 seg' },
        ],
      },
      {
        h: 'Reentrenar predicciones (sin autoayuda barata)',
        p: 'Exposición gradual, respiración y reappraisal no “piensan positivo” — bajan el prior de amenaza con evidencia nueva repetida.',
        blocks: [
          { type: 'analogy', from: 'GPS recalculando', to: 'Corteza', text: 'Cada vez que anticipas lo peor y NO pasa, es un dato que el modelo debería integrar — si prestas atención.' },
          { type: 'checkpoint', q: '¿Qué reduce prediction error a largo plazo?', options: ['Evitar el estímulo siempre', 'Exposición con seguridad', 'Ignorar emociones'], answer: 1, explain: 'El modelo aprende cuando predice mal en contexto seguro — no cuando huyes.' },
          { type: 'flip', front: '“Solo necesito pensar racional”', back: 'La amígdala actualiza con experiencia corporal repetida, no con un argumento lógico una vez.' },
        ],
      },
    ],
  },
  'cerebellum-mass': {
    lead: 'Un puño de tejido con más neuronas que todo el resto del cerebro junto. Durante décadas lo ignoraron como “solo movimiento”. Error carísimo.',
    sections: [
      {
        h: '69 mil millones en un puño',
        p: 'El cerebelo pesa ~10% del cerebro pero alberga ~80% de tus neuronas granulares. Densidad brutal, especialización extrema.',
        blocks: [
          { type: 'stat', value: '80%', label: 'de tus neuronas', context: 'viven en el cerebelo — no en la corteza.' },
          { type: 'punch', value: '10% peso · 80% neuronas', sub: 'Si el cerebro fuera empresa, el cerebelo es el área de operaciones.' },
          { type: 'checkpoint', q: '¿Qué hacen las neuronas granulares cerebelares?', options: ['Solo digestión', 'Timing y precisión temporal', 'Producen mielina'], answer: 1, explain: 'Disparan a frecuencias extremas — calibran cuándo, no solo qué.' },
        ],
      },
      {
        h: 'Más que coordinar dedos',
        p: 'Daño cerebelar = ataxia PERO también problemas de lenguaje, planificación y regulación emocional. fMRI lo enciende en WM y decisiones.',
        blocks: [
          { type: 'scenario', title: 'Primer día en guitarra', text: 'Tus dedos son torpes. Semana 8: el riff sale sin pensar.', reveal: 'El cerebelo absorbió el timing del patrón. La corteza pensó al inicio; el cerebelo automatizó la secuencia temporal.' },
          { type: 'compare', a: { label: 'Corteza', text: '“Qué hacer” — plan, reglas, lenguaje.' }, b: { label: 'Cerebelo', text: '“Cuándo y qué tan preciso” — ritmo, predicción sensorial.' } },
        ],
      },
      {
        h: 'Entrena tu coprocesador',
        p: 'Repetición con feedback afina el modelo predictivo del cerebelo. Por eso la práctica deliberada cambia habilidad sin esfuerzo consciente constante.',
        blocks: [
          { type: 'action', text: 'Toca un ritmo simple con la mano (ta-ta-ta-PAUSA) 20 veces. Siente cuando deja de requerir atención.', duration: '90 seg' },
          { type: 'flip', front: '“Ya sé la teoría”', back: 'El cerebelo no lee teoría — necesita repeticiones con timing. Saber ≠ automatizar.' },
          { type: 'checkpoint', q: '¿Qué mejora con práctica motora repetida?', options: ['Solo músculos', 'Modelo temporal cerebelar', 'Número de neuronas nuevas'], answer: 1, explain: 'Afina predicción de cuándo llega feedback — motor Y cognitivo.' },
        ],
      },
    ],
  },
  'glia-brain-glue': {
    lead: 'La mitad de las células de tu cerebro no disparan. Sin ellas, las neuronas mueren en horas. El libro de neuro intro que solo habla de neuronas te mintió por omisión.',
    sections: [
      {
        h: 'Astrocitos: el soporte que nadie ve',
        p: 'Regulan glutamato, nutren neuronas, forman la barrera glía limitante. Son el “microambiente” que decide si una sinapsis funciona bien o se intoxica.',
        blocks: [
          { type: 'analogy', from: 'Aire acondicionado', to: 'Astrocitos', text: 'No son la fiesta (neuronas) — pero si fallan, todos se sofocan con glutamato.' },
          { type: 'stat', value: '50%', label: 'células cerebrales', context: 'son glía — no “relleno”.' },
          { type: 'checkpoint', q: '¿Qué pasa sin astrocitos funcionales?', options: ['Nada visible', 'Neuronas mueren en horas', 'Solo pierdes memoria'], answer: 1, explain: 'Sin limpieza y soporte metabólico, el SNC colapsa rápido.' },
        ],
      },
      {
        h: 'Microglía: el equipo de limpieza que puede volverse tóxico',
        p: 'Patrullan sinapsis, eliminan conexiones débiles, responden a lesión. Crónicamente activada (estrés, mal sueño) → neuroinflamación.',
        blocks: [
          { type: 'scenario', title: 'Semana de 5h de sueño + jefe + notificaciones', text: 'No “estás de malas”. Tu microglía lleva días en modo combate.', reveal: 'Activación crónica puede dañar sinapsis que antes eran sanas. Dormir y bajar estrés no es lujo — es antiinflamatorio cerebral.' },
          { type: 'flip', front: '“La inflamación es solo del cuerpo”', back: 'Neuroinflamación afecta humor, foco y memoria — sin fiebre ni resfriado.' },
        ],
      },
      {
        h: 'Mielina: velocidad en el SNC',
        p: 'Oligodendrocitos producen mielina en cerebro/espinal. Más capas = más velocidad. Esclerosis múltiple = señal lenta, síntomas motores y cognitivos.',
        blocks: [
          { type: 'compare', a: { label: 'Sin mielina', text: '~1 m/s — señal lenta, imprecisa.' }, b: { label: 'Con mielina', text: 'Hasta ~100 m/s — salto nodal eficiente.' } },
          { type: 'action', text: 'Esta noche: una hora menos de pantalla antes de dormir. Tu microglía te lo va a agradecer.', duration: 'Hoy' },
          { type: 'checkpoint', q: '¿Qué células producen mielina en el SNC?', options: ['Astrocitos', 'Oligodendrocitos', 'Neuronas'], answer: 1, explain: 'En nervio periférico son células de Schwann — distinto equipo, mismo trabajo.' },
        ],
      },
    ],
  },
  'wm-ram': {
    lead: 'Tu cerebro no es un disco duro con 50 pestañas abiertas. Es RAM con 4 slots — y ya tienes 3 ocupados sin darte cuenta.',
    keyTerms: [
      { term: 'WM', def: 'Espacio de trabajo temporal — no almacén.' },
      { term: 'CPFDL', def: 'Corteza prefrontal dorsolateral — el buffer.' },
      { term: 'Residuo', def: 'Info que sigue ocupando slots tras cambiar de tarea.' },
    ],
    sections: [
      {
        h: 'Baddeley: tres componentes, un jefe',
        p: 'Bucle fonológico (verbal), sketchpad visoespacial y ejecutivo central. La CPFDL coordina mientras mantienes y manipulas información.',
        blocks: [
          { type: 'analogy', from: 'RAM de PC', to: 'Memoria de trabajo', text: '4 GB no significa 4 GB libres — el sistema operativo ya comió la mitad. Tu WM igual.' },
          { type: 'stat', value: '4±1', label: 'ítems en WM', context: 'Miller/Cowan — no 7 como te contaron.' },
          { type: 'checkpoint', q: '¿Qué libera WM de forma inmediata?', options: ['Releer en voz alta', 'Escribir en papel', 'Pensar más fuerte'], answer: 1, explain: 'Externalizar = sacar del buffer. Por eso las listas funcionan.' },
        ],
      },
      {
        h: 'Saturación invisible',
        p: 'Cada notificación abierta, conversación pendiente o decisión sin cerrar deja residuo. Cambiar de tarea no borra — compite.',
        blocks: [
          { type: 'scenario', title: 'Slack + email + reunión en 5 min', text: 'Crees que “solo revisas rápido”. Tu WM ya guarda 3 hilos abiertos.', reveal: 'El costo de reentrada no es el tiempo del Slack — son los slots que siguen ocupados cuando vuelves al foco profundo. 23 min para recuperar concentración (Mark et al.).' },
          { type: 'insight', text: 'Multitarea no existe. Existe alternar rápido con residuo acumulado.' },
          { type: 'action', text: 'Escribe en un papel los 3 datos que NO puedes olvidar hoy. Cierra el papel. Siente el alivio cognitivo.', duration: '30 seg' },
        ],
      },
      {
        h: 'N-back: entrenar el buffer',
        p: 'Meta-análisis 2024: efectos modestos pero reales en WM (g≈0.16–0.48). Transferencia cercana sí; IQ general, debatido.',
        blocks: [
          { type: 'compare', a: { label: 'Mito', text: 'N-back = inteligencia general' }, b: { label: 'Ciencia', text: 'Entrenas actualización en WM — reuniones, specs, contexto' } },
          { type: 'lab', text: 'El laboratorio N-back replica la demanda de mantener una ventana deslizante activa.', exercise: 'nback', cta: 'Entrenar N-back →' },
          { type: 'checkpoint', q: '¿Qué paradigma entrena WM en Mejora?', options: ['Stroop', 'N-back', 'Go/No-Go'], answer: 1, explain: 'Coincidir estímulo con N posiciones atrás = actualización constante.' },
        ],
      },
    ],
  },
  'hippocampus-consolidation': {
    lead: 'El hipocampo no es un USB. Es el índice que etiqueta episodios y los envía a la corteza mientras duermes.',
    sections: [
      {
        h: 'Place cells y time cells',
        p: 'Neuronas que disparan en lugares y momentos específicos. Integran contexto espacial, temporal y emocional.',
        blocks: [
          { type: 'scenario', title: 'O\'Keefe observa ratas en 1971', text: 'Misma neurona dispara siempre en la misma esquina del laberinto.', reveal: 'Neuronas de lugar — Nobel 2014. Tu hipocampo hace lo mismo con “dónde estabas” cuando aprendiste algo.' },
          { type: 'timeline', items: [{ when: 'Día', what: 'Codificación hipocampal' }, { when: 'N3', what: 'Replay durante sueño' }, { when: 'Semanas', what: 'Transferencia a corteza' }] },
          { type: 'checkpoint', q: '¿Qué hace el hipocampo en sueño profundo?', options: ['Borra recuerdos', 'Replay y transfiere a corteza', 'Produce melatonina'], answer: 1, explain: 'Hippocampal replay durante N3 — consolidación sistemática.' },
        ],
      },
      {
        h: 'Testing effect',
        p: 'Recordar sin mirar fortalece más que releer. Cada recuperación exitosa reconsolida la traza.',
        blocks: [
          { type: 'flip', front: '“Releer apuntes es estudiar”', back: 'Recuperación activa (testing effect) consolida más que pasiva relectura.' },
          { type: 'action', text: 'Cierra los ojos 30 seg. Reconstruye lo último que aprendiste hoy — sin notas.', duration: '30 seg' },
          { type: 'debate', q: '¿Qué fija mejor la memoria?', a: 'Releer 5 veces', b: 'Recordar 2 veces sin mirar', answer: 1, win: 'Testing effect — recuperación activa gana' },
        ],
      },
      {
        h: 'Mapas mentales y Corsi',
        p: 'Secuencias espaciales entrenan el mismo hardware que navegar y recordar rutas.',
        blocks: [
          { type: 'lab', text: 'Corsi entrena span visoespacial — el sketchpad del modelo de Baddeley.', exercise: 'corsi', cta: 'Practicar Corsi →' },
          { type: 'punch', value: 'Aprender ≠ leer', sub: 'Aprender = codificar + dormir + recuperar activamente.' },
          { type: 'checkpoint', q: '¿Sin hipocampo funcional qué falla?', options: ['Memoria procedimental', 'Memoria episódica nueva', 'Reflejos'], answer: 1, explain: 'H.M. podía aprender habilidades pero no episodios nuevos.' },
        ],
      },
    ],
  },
  'patient-hm': {
    intensity: 'brutal',
    lead: 'Un hombre que olvidaba cada día pero seguía aprendiendo sin saberlo. El caso que partió la memoria en dos.',
    sections: [
      {
        h: 'La cirugía que cambió la neurociencia',
        p: '1953: extirpan hipocampo bilateral de H.M. para controlar epilepsia. Memoria anterógrada destruida.',
        blocks: [
          { type: 'stat', value: '55 años', label: 'de estudio', context: '100+ papers con un solo paciente anónimo.' },
          { type: 'scenario', title: 'H.M. conoce al investigador', text: 'Cada visita es la primera vez. Estrecha la mano como si fuera nuevo.', reveal: 'Memoria episódica = cero. Pero puede aprender habilidades motoras (prisma) sin recordar que practicó — memoria implícita intacta.' },
          { type: 'checkpoint', q: '¿Qué conservó H.M.?', options: ['Episodios nuevos', 'Habilidades procedimentales', 'Recuerdos de infancia recientes'], answer: 1, explain: 'Separación dramática: hipocampo = índice episódico, no todo aprendizaje.' },
        ],
      },
      {
        h: 'Dos sistemas de memoria',
        p: 'Explícita (hipocampo) vs implícita (ganglios basales, cerebelo). No es un solo “archivo”.',
        blocks: [
          { type: 'compare', a: { label: 'Episódica', text: 'Qué, dónde, cuándo — hipocampo' }, b: { label: 'Procedimental', text: 'Cómo — sin “recuerdo” consciente' } },
          { type: 'insight', text: 'Puedes aprender sin saber que aprendiste. H.M. lo demostró cada día.' },
          { type: 'debate', q: '¿La memoria es un archivo?', a: 'Sí, grabamos eventos', b: 'No, hay sistemas distintos', answer: 1, win: 'Memoria = múltiples sistemas, no un disco' },
        ],
      },
      {
        h: 'Lección para tu vida',
        p: 'Sin consolidación hipocampal no hay narrativa personal continua. Dormir y recuperar activamente no es opcional.',
        blocks: [
          { type: 'action', text: 'Escribe en 3 líneas un episodio de hoy que quieras conservar. Eso es externalizar lo que H.M. no pudo retener.', duration: '2 min' },
          { type: 'flip', front: '“Olvido porque soy distraído”', back: 'Olvido episódico severo = fallo de codificación/consolidación, no flojera.' },
          { type: 'checkpoint', q: '¿Qué operación causó el déficit de H.M.?', options: ['Lesión de PFC', 'Extirpación hipocampal bilateral', 'Daño cerebelar'], answer: 1, explain: 'Scoville & Milner (1957) — fundacional.' },
        ],
      },
    ],
  },
  'nback-transfer': {
    sections: [
      {
        h: 'La ventana deslizante',
        p: '¿Coincide con N posiciones atrás? Mantienes, actualizas, descartas — demanda máxima de WM.',
        blocks: [
          { type: 'analogy', from: 'Chat con 5 hilos', to: 'N-back', text: 'Seguir quién dijo qué hace 3 mensajes = misma carga cognitiva.' },
          { type: 'checkpoint', q: '¿Qué entrena principalmente N-back?', options: ['Memoria largo plazo', 'Actualización en WM', 'Velocidad motora'], answer: 1, explain: 'Ventana deslizante en CPFDL + cíngulo.' },
        ],
      },
      {
        h: 'Transferencia: honestidad científica',
        p: 'Sala & Gobet (2017): efecto en IQ general pequeño y debatido. Cercano = robusto.',
        blocks: [
          { type: 'compare', a: { label: 'Transferencia cercana', text: 'Tareas similares de WM — sí' }, b: { label: 'Transferencia lejana', text: 'IQ general — efecto modesto' } },
          { type: 'debate', q: '¿N-back te hace genio?', a: 'Sí, sube IQ 15 puntos', b: 'Entrenas WM, no magia general', answer: 1, win: 'Honestidad: mejora específica, no superpoder' },
          { type: 'lab', text: '20 min, 3×/semana, 8 semanas — protocolo con evidencia.', exercise: 'nback', cta: 'Sesión N-back →' },
        ],
      },
      {
        h: 'Dosis efectiva',
        p: 'Consistencia + dificultad adaptativa. Más horas ≠ mejor si estás en zona de aburrimiento o frustración.',
        blocks: [
          { type: 'steps', items: [
            { title: 'Duración', text: '~20 min por sesión' },
            { title: 'Frecuencia', text: '3× por semana' },
            { title: 'Duración programa', text: '8 semanas mínimo' },
            { title: 'Clave', text: 'Dificultad que te reta sin frustrarte' },
          ] },
          { type: 'action', text: 'Programa 3 sesiones N-back esta semana en tu calendario — mismo horario.', duration: '1 min' },
        ],
      },
    ],
  },
  'reconsolidation': {
    sections: [
      {
        h: 'Recordar = editar',
        p: 'Al recuperar un recuerdo, la traza vuelve labile horas. Puedes modificarla.',
        blocks: [
          { type: 'flip', front: '“Los recuerdos son fijos”', back: 'Cada recuperación reconsolida — editas al guardar de nuevo.' },
          { type: 'scenario', title: 'Terapia de exposición', text: 'Activas miedo en contexto seguro.', reveal: 'Ventana de reconsolidación: nueva información emocional puede reescribir la asociación amigdalar — no solo “hablar de ello”.' },
          { type: 'checkpoint', q: '¿Cuándo es vulnerable un recuerdo?', options: ['Al codificar', 'Al recuperar', 'Nunca'], answer: 1, explain: 'Labile post-recuperación — ventana de horas.' },
        ],
      },
      {
        h: 'Memoria falsa',
        p: 'Loftus: sugerencias implantan recuerdos vívidos de eventos que no ocurrieron.',
        blocks: [
          { type: 'punch', value: '25%', sub: 'adultos “recuerdan” perderse en un mall que nunca visitaron (Loftus).' },
          { type: 'debate', q: '¿Vividez = verdad?', a: 'Si lo veo claro, pasó', b: 'Vividez ≠ precisión', answer: 1, win: 'Confianza no es garantía' },
          { type: 'action', text: 'Piensa en un recuerdo de infancia. ¿Alguien de tu familia lo cuenta distinto?', duration: '60 seg' },
        ],
      },
    ],
  },
  'false-memories': {
    intensity: 'intenso',
    sections: [
      {
        h: 'El experimento del shopping mall',
        p: 'Fotos falsas + sugerencia familiar = recuerdo emocional de perderse de niño.',
        blocks: [
          { type: 'scenario', title: 'Loftus y el mall', text: 'Participantes describen con detalle y emoción un evento fabricado.', reveal: 'El cerebro no etiqueta “real” vs “imaginado”. Simular y recordar comparten redes.' },
          { type: 'checkpoint', q: '¿Por qué funcionan las falsas memorias?', options: ['Mala fe', 'Simulación comparte redes con memoria', 'Hipnosis'], answer: 1, explain: 'Hipocampo + PFC no distinguen origen con certeza.' },
        ],
      },
      {
        h: 'Implicaciones reales',
        p: 'Testimonios, terapia de recuperación de memoria en los 90, juicios.',
        blocks: [
          { type: 'insight', text: 'Confianza en un recuerdo ≠ precisión. Pregunta siempre: ¿hay corroboración externa?' },
          { type: 'compare', a: { label: 'Sensación', text: '“Lo recuerdo perfecto”' }, b: { label: 'Evidencia', text: 'Fotos, testigos, registros' } },
          { type: 'action', text: 'Antes de jurar un recuerdo en una discusión: ¿qué evidencia externa lo respalda?', duration: 'Ahora' },
        ],
      },
    ],
  },
}

function buildAutoBlocks(section, lesson, index, total, meta) {
  const blocks = []
  if (index === 0 && lesson.hook) {
    blocks.push({ type: 'punch', value: lesson.hook.split('—')[0].trim().slice(0, 72), sub: 'Hook de la lección' })
    blocks.push({ type: 'insight', text: lesson.takeaway || 'Cada sección tiene un checkpoint — no solo leas, interactúa.' })
  }
  if (meta?.myth && index === 0) {
    const parts = meta.myth.replace(/^Mito:\s*/i, '').split(/\.?\s*Realidad:\s*/i)
    if (parts.length >= 2) {
      blocks.push({ type: 'compare', a: { label: 'Mito', text: parts[0].trim() }, b: { label: 'Ciencia', text: parts[1].trim() } })
    }
  }
  if (section.bullets?.length >= 2 && index % 2 === 1) {
    blocks.push({
      type: 'flip',
      front: section.bullets[0],
      back: section.bullets[1],
    })
  }
  if (index === total - 1 && lesson.apply) {
    blocks.push({ type: 'action', text: lesson.apply, duration: 'Ahora' })
  }
  if (lesson.relatedExercise && index === total - 1) {
    blocks.push({
      type: 'lab',
      text: 'Refuerza esta lección en el laboratorio con el ejercicio vinculado.',
      exercise: lesson.relatedExercise,
      cta: 'Ir al laboratorio →',
    })
  }
  if (meta?.deepCut && index === 1) {
    blocks.push({ type: 'insight', text: meta.deepCut })
  }
  if (meta?.caseStudy && index === Math.floor(total / 2)) {
    blocks.push({ type: 'scenario', title: 'Caso clínico', text: 'Un paciente real cambió lo que sabemos de esta región.', reveal: meta.caseStudy })
  }
  if (section.bullets?.length && index === total - 1) {
    const q = section.bullets[0].includes('?') ? section.bullets[0] : `¿Cuál idea clave resume esta sección?`
    blocks.push({
      type: 'checkpoint',
      q,
      options: [section.bullets[0].slice(0, 60), section.bullets[1]?.slice(0, 60) || 'Ninguna', 'Todas aplican'],
      answer: 0,
      explain: section.bullets[0],
    })
  }
  return blocks
}

export function applyDynamicLesson(lesson) {
  const custom = LESSON_DYNAMIC[lesson.id]
  if (custom) {
    const sections = (custom.sections || lesson.sections).map((s, i) => ({
      ...lesson.sections?.[i],
      ...s,
      blocks: s.blocks || [],
    }))
    return { ...lesson, ...custom, sections }
  }

  const meta = lesson.myth || lesson.caseStudy ? lesson : null
  const sections = (lesson.sections || []).map((s, i, arr) => ({
    ...s,
    blocks: [...(s.blocks || []), ...buildAutoBlocks(s, lesson, i, arr.length, meta || lesson)],
  }))
  return { ...lesson, sections }
}

export function bindLessonInteractions(vp) {
  if (!vp) return

  vp.querySelectorAll('.lesson-block').forEach((block, i) => {
    block.style.setProperty('--block-delay', `${i * 0.04}s`)
  })

  vp.querySelectorAll('.lesson-flip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-flipped')) return
      btn.classList.add('is-flipped')
      btn.setAttribute('aria-pressed', 'true')
      haptic(6)
      forgeSparkAt(btn, 5)
      registerEngagement(vp, 'flip', 'Concepto revelado', 3)
    })
  })

  vp.querySelectorAll('.lesson-stack-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('is-flipped')
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
      if (on) {
        haptic(6)
        forgeSparkAt(btn, 4)
        registerEngagement(vp, 'stack', 'Tarjeta dominada', 2)
      }
    })
  })

  vp.querySelectorAll('.lesson-scenario-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = btn.closest('.lesson-scenario')
      const ans = box?.querySelector('.lesson-scenario-answer')
      if (!ans || box?.classList.contains('is-done')) return
      box.classList.add('is-done')
      ans.hidden = false
      btn.hidden = true
      haptic(10)
      forgeSparkAt(btn, 6)
      registerEngagement(vp, 'scenario', 'Escenario resuelto', 4)
    })
  })

  vp.querySelectorAll('.lesson-checkpoint').forEach(cp => {
    const answer = parseInt(cp.dataset.answer, 10)
    const explain = cp.querySelector('.lesson-checkpoint-explain')
    const q = cp.querySelector('.lesson-checkpoint-q')?.textContent?.slice(0, 48) || 'Checkpoint'
    cp.querySelectorAll('.lesson-check-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (cp.classList.contains('is-answered')) return
        const idx = parseInt(btn.dataset.idx, 10)
        cp.classList.add('is-answered')
        cp.querySelectorAll('.lesson-check-opt').forEach(b => b.disabled = true)
        if (idx === answer) {
          btn.classList.add('is-correct')
          cp.classList.add('is-correct')
          haptic([10, 30, 10])
          forgeSparkAt(btn, 10)
          registerEngagement(vp, 'checkpoint', `✓ ${q}`, 8, { correct: true, el: cp })
        } else {
          btn.classList.add('is-wrong')
          cp.querySelector(`[data-idx="${answer}"]`)?.classList.add('is-correct')
          haptic([30, 20, 30])
          registerEngagement(vp, 'checkpoint', `Repasar: ${q}`, 2, { correct: false, el: cp })
        }
        if (explain) explain.hidden = false
      })
    })
  })

  vp.querySelectorAll('.lesson-debate').forEach(box => {
    const correct = parseInt(box.dataset.correct, 10)
    const win = box.dataset.win || 'Correcto'
    const result = box.querySelector('.lesson-debate-result')
    box.querySelectorAll('.lesson-debate-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (box.classList.contains('is-answered')) return
        box.classList.add('is-answered')
        const idx = parseInt(btn.dataset.idx, 10)
        box.querySelectorAll('.lesson-debate-opt').forEach(b => b.disabled = true)
        if (idx === correct) {
          btn.classList.add('is-correct')
          if (result) { result.textContent = win; result.hidden = false }
          forgeSparkAt(btn, 8)
          registerEngagement(vp, 'debate', win, 6, { correct: true, el: box })
        } else {
          btn.classList.add('is-wrong')
          box.querySelector(`[data-idx="${correct}"]`)?.classList.add('is-correct')
          if (result) { result.textContent = win; result.hidden = false }
          registerEngagement(vp, 'debate', win, 2, { correct: false, el: box })
        }
      })
    })
  })

  vp.querySelectorAll('.lesson-step-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling
      const open = btn.getAttribute('aria-expanded') === 'true'
      btn.setAttribute('aria-expanded', open ? 'false' : 'true')
      if (body) body.hidden = open
      if (!open) {
        haptic(5)
        btn.classList.add('is-open')
        const steps = btn.closest('.lesson-steps')
        if (steps && !steps.classList.contains('is-engaged')) {
          steps.classList.add('is-engaged')
          registerEngagement(vp, 'steps', 'Protocolo revisado', 4)
        }
      }
    })
  })

  vp.querySelectorAll('.lesson-action-done').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-done')) return
      btn.classList.add('is-done')
      btn.textContent = 'Hecho ✓'
      btn.disabled = true
      haptic([8, 20, 8])
      forgeSparkAt(btn, 10)
      registerEngagement(vp, 'action', 'Práctica completada', 5)
    })
  })

  vp.querySelectorAll('.lesson-lab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ex = btn.dataset.exercise
      if (!ex) return
      registerEngagement(vp, 'lab', 'Camino al laboratorio', 3)
      if (typeof window.closeLesson === 'function' && typeof window.startBrain === 'function') {
        window.closeLesson()
        window.goTrain?.('lab')
        window.startBrain(ex)
      }
    })
  })

  if (!lessonReducedMotion()) {
    const blockObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible') })
    }, { root: vp, threshold: 0.2 })
    vp.querySelectorAll('.lesson-block').forEach(b => blockObs.observe(b))
    vp._lessonBlockObs = blockObs
  }
}

