/** Escuela — programa neuronal, nutrición cerebral y ayuno intermitente */

import { esc } from './core.js'
import { getProgramStats, getDomainProgress, getTodaysSession } from './brain-program.js'
import {
  getBrainRegionProgress, getSchoolStats, getCurrentSchoolWeek, CURRICULUM, FACULTIES,
} from './school.js?v=141'
import { renderNeuralHero } from './brain-neural-theme.js?v=141'

const NUTRITION_PROTOCOLS = [
  {
    icon: '🐟',
    title: 'Omega-3 y DHA',
    lead: 'Grasas esenciales para membranas neuronales y plasticidad.',
    bullets: ['2–3 raciones/semana de pescado azul o alga DHA', 'Nueces, chía y linaza como respaldo vegetal', 'Evita freír: el calor oxida los ácidos grasos'],
    lesson: 'bdnf-exercise',
    tag: 'Membranas · sinapsis',
  },
  {
    icon: '🫐',
    title: 'Polifenoles y color',
    lead: 'Antioxidantes que apoyan flujo sanguíneo cerebral.',
    bullets: ['Arándanos, cacao ≥70%, té verde, aceite de oliva', 'Meta: mitad del plato con vegetales de colores distintos', 'Ultraprocesados = inflamación silenciosa'],
    lesson: 'glymphatic-sleep',
    tag: 'Flujo · protección',
  },
  {
    icon: '🥚',
    title: 'Proteína y neurotransmisores',
    lead: 'Triptófano, tirosina y colina son materia prima cerebral.',
    bullets: ['Desayuno con proteína estable (huevos, yogur griego, legumbres)', 'No elimines carbohidratos — el cerebro los necesita', 'Colina: huevo, brócoli, soja'],
    lesson: 'neurotransmitters',
    tag: 'Dopamina · acetilcolina',
  },
  {
    icon: '💧',
    title: 'Hidratación',
    lead: 'Deshidratación leve ya afecta atención y memoria de trabajo.',
    bullets: ['Vaso de agua al despertar, antes de café', 'Orina pálida = buen indicador simple', 'Electrolitos si entrenas o ayunas'],
    lesson: 'caffeine-adenosine',
    tag: 'Atención · energía',
  },
]

const FASTING_PROTOCOLS = [
  {
    id: '14-10',
    label: '14:10 suave',
    hours: '14 h ayuno · 10 h ventana',
    best: 'Empezar aquí si es tu primera vez',
    benefits: ['Mejor sensibilidad a la insulina', 'Menos picoteo mental por la mañana', 'Más fácil de sostener con vida social'],
    tips: ['Última comida ~20:00, primera ~10:00', 'Agua, té y café sin azúcar permitidos', 'Rompe el ayuno con proteína + fibra, no solo azúcar'],
    caution: false,
  },
  {
    id: '16-8',
    label: '16:8 clásico',
    hours: '16 h ayuno · 8 h ventana',
    best: 'Cuando 14:10 ya es cómodo',
    benefits: ['Ventana de enfoque matutinal sin digestión activa', 'Asociado a BDNF y autofagia en estudios', 'Puede mejorar claridad antes del mediodía'],
    tips: ['Ejemplo: comer 12:00–20:00', 'Entrena cerca de tu primera comida si haces fuerza', 'Prioriza sueño — el ayuno no compensa dormir mal'],
    caution: false,
  },
  {
    id: 'caution',
    label: 'Cuándo NO ayunar',
    hours: 'Seguridad primero',
    best: 'Escucha a tu cuerpo y a tu médico',
    benefits: [],
    tips: ['Embarazo, lactancia, TCA o diabetes insulinodependiente', 'Menores de 18 años', 'Si te mareas, irritas o pierdes ciclo — reduce ventana o pausa'],
    caution: true,
  },
]

function wellnessCard(item) {
  return `<article class="brain-wellness-card brain-neural-card">
    <div class="brain-wellness-card-head">
      <span class="brain-wellness-icon">${item.icon}</span>
      <div>
        <h3 class="brain-wellness-title">${esc(item.title)}</h3>
        <p class="brain-wellness-tag">${esc(item.tag)}</p>
      </div>
    </div>
    <p class="brain-wellness-lead">${esc(item.lead)}</p>
    <ul class="brain-wellness-list">${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    ${item.lesson ? `<button type="button" class="brain-wellness-link" onclick="openLesson('${item.lesson}')">Lección relacionada →</button>` : ''}
  </article>`
}

function fastingCard(p) {
  const cls = p.caution ? 'brain-fasting-card brain-fasting-card--caution brain-neural-card' : 'brain-fasting-card brain-neural-card'
  return `<article class="${cls}">
    <div class="brain-fasting-head">
      <h3 class="brain-fasting-title">${esc(p.label)}</h3>
      <span class="brain-fasting-hours">${esc(p.hours)}</span>
    </div>
    <p class="brain-fasting-best">${esc(p.best)}</p>
    ${p.benefits.length ? `<ul class="brain-wellness-list">${p.benefits.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    <ul class="brain-wellness-list brain-wellness-list--tips">${p.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  </article>`
}

function regionNodeCard(r) {
  const active = r.count > 0
  const pct = Math.min(100, r.count * 25)
  return `<button type="button" class="brain-region-node ${active ? 'is-lit' : ''}" title="${r.count} lecciones vinculadas" data-region="${r.id}">
    <span class="brain-region-node__ring" style="--node-fill:${pct}%"></span>
    <span class="brain-region-node__icon">${r.icon}</span>
    <span class="brain-region-node__label">${esc(r.label)}</span>
    ${active ? `<span class="brain-region-node__count">${r.count}</span>` : '<span class="brain-region-node__dim">dormida</span>'}
  </button>`
}

export function renderNeuronsHub() {
  const stats = getSchoolStats()
  const prog = getProgramStats()
  const domains = getDomainProgress()
  const regions = getBrainRegionProgress()
  const activeRegions = regions.filter(r => r.count > 0).length
  const synapseScore = Math.round((activeRegions / regions.length) * 100)
  const week = getCurrentSchoolWeek()
  const block = CURRICULUM.find(c => c.week === week) || CURRICULUM[0]
  const today = getTodaysSession()

  return `<div class="brain-neural-hero span-full">
      <div class="brain-neural-hero__glow" aria-hidden="true"></div>
      <div class="brain-neural-hero__head">
        <div>
          <p class="brain-neural-hero__kicker">Mapa sináptico · plasticidad</p>
          <h1 class="brain-neural-hero__title font-display">Red neuronal</h1>
          <p class="brain-neural-hero__sub">Cada lección enciende vías. El laboratorio las refuerza con práctica.</p>
        </div>
        <div class="brain-neural-hero__stats">
          <div class="brain-neural-stat">
            <span class="brain-neural-stat__val">${synapseScore}%</span>
            <span class="brain-neural-stat__lbl">conexión</span>
          </div>
          <div class="brain-neural-stat">
            <span class="brain-neural-stat__val">${activeRegions}/${regions.length}</span>
            <span class="brain-neural-stat__lbl">regiones</span>
          </div>
          <div class="brain-neural-stat">
            <span class="brain-neural-stat__val">${stats.percent}%</span>
            <span class="brain-neural-stat__lbl">currículo</span>
          </div>
        </div>
      </div>

      <div class="brain-synapse-theater" aria-label="Visualización de red neuronal">
        <div class="brain-synapse-theater__scan" aria-hidden="true"></div>
        <div class="brain-synapse-theater__vignette" aria-hidden="true"></div>
        <canvas id="brain-synapse-canvas" class="brain-synapse-canvas" aria-hidden="true"></canvas>
        <div class="brain-synapse-hud">
          <div class="brain-synapse-hud__pill brain-synapse-hud__pill--live">
            <span class="brain-synapse-live-dot"></span> Impulsos en vivo
          </div>
          <p class="brain-synapse-hud__hint">Mueve el cursor sobre la red</p>
        </div>
        <div class="brain-region-orbit">
          ${regions.map(regionNodeCard).join('')}
        </div>
      </div>
    </div>

    <div class="brain-neurons-dash span-full">
      <section class="brain-dash-card brain-neural-card brain-dash-card--primary">
        <div class="brain-dash-card__icon">📋</div>
        <div class="brain-dash-card__body">
          <h3 class="brain-dash-card__title">Sesión de hoy</h3>
          <p class="brain-dash-card__meta">${today.length} ejercicios · ~20 min</p>
          <div class="brain-session-chips">
            ${today.map(ex => `<span class="brain-session-chip">${ex.icon} ${esc(ex.name)}</span>`).join('')}
          </div>
        </div>
        <div class="brain-dash-card__action">
          <span class="brain-dash-status ${prog.doneToday ? 'is-done' : ''}">${prog.doneToday ? '✓ Completada' : 'Pendiente'}</span>
          <button type="button" class="btn-primary" onclick="brainState.brainView='program';render()">Programa →</button>
        </div>
      </section>

      <section class="brain-dash-card brain-neural-card">
        <div class="brain-dash-card__icon">${FACULTIES[block?.faculty]?.icon || '🧠'}</div>
        <div class="brain-dash-card__body">
          <h3 class="brain-dash-card__title">Semana ${week}</h3>
          <p class="brain-dash-card__meta">${esc(block?.title || '')}</p>
          <p class="brain-dash-card__sub">${stats.weekDone}/${stats.weekTotal} lecciones</p>
        </div>
        <button type="button" class="btn-secondary" onclick="brainState.brainView='school';render()">Currículo →</button>
      </section>
    </div>

    <section class="brain-domains-orbit span-full">
      <h2 class="brain-section-title">Dominios cognitivos</h2>
      <div class="brain-domains-orbit__grid">
        ${domains.map(d => `<article class="brain-domain-orbit brain-neural-card" style="--orbit-color:${d.color}">
          <div class="brain-domain-orbit__ring">
            <svg viewBox="0 0 80 80" class="brain-domain-orbit__svg" aria-hidden="true">
              <circle cx="40" cy="40" r="34" class="brain-domain-orbit__track"/>
              <circle cx="40" cy="40" r="34" class="brain-domain-orbit__fill" style="stroke-dashoffset:${213 - (213 * (d.xp % 100)) / 100}"/>
            </svg>
            <span class="brain-domain-orbit__icon">${d.icon}</span>
          </div>
          <h3 class="brain-domain-orbit__name">${esc(d.name)}</h3>
          <p class="brain-domain-orbit__lvl">Nv. ${d.level} · ${d.xp} XP</p>
        </article>`).join('')}
      </div>
    </section>`
}

export function renderNutritionHub() {
  return `${renderNeuralHero({
    kicker: 'Combustible sináptico',
    title: 'Nutrición cerebral',
    sub: 'Comida como herramienta — no dieta milagro. Evidencia para memoria, enfoque y ánimo.',
    stats: [{ val: '4', lbl: 'protocolos' }],
  })}
    <div class="brain-wellness-grid">
      ${NUTRITION_PROTOCOLS.map(wellnessCard).join('')}
    </div>
    <p class="brain-wellness-disclaimer span-full">No es consejo médico. Si tienes condición metabólica, consulta a un profesional.</p>`
}

export function renderFastingHub() {
  return `${renderNeuralHero({
    kicker: 'Ritmo metabólico',
    title: 'Ayuno intermitente',
    sub: 'Ventanas de comida con criterio — no sufrimiento. Solo si encaja con tu vida y tu salud.',
    stats: [{ val: '14:10', lbl: 'inicio' }, { val: '16:8', lbl: 'clásico' }],
  })}
    <div class="brain-fasting-grid">
      ${FASTING_PROTOCOLS.map(fastingCard).join('')}
    </div>
    <section class="brain-fasting-cta brain-neural-card brain-neural-card--primary span-full">
      <h3 class="brain-panel-title">Integra con Mejora</h3>
      <p class="brain-panel-lead">Crea un hábito "Ventana de ayuno" en Hábitos, medita al romper el ayuno, y revisa la lección de cafeína y adenosina.</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <a href="#/mejora" class="btn-secondary no-underline">Ir a Hábitos</a>
        <button type="button" class="btn-secondary" onclick="openLesson('caffeine-adenosine')">Lección cafeína →</button>
        <button type="button" class="btn-secondary" onclick="openLesson('bdnf-exercise')">Lección BDNF →</button>
      </div>
    </section>`
}
