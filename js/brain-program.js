import { getItem, setItem, getToday, toDateStr, esc } from '/js/core.js'

/** Basado en: Miyake et al. (2000), Klingberg (2010), meta-análisis CCT 2024 */
export const COGNITIVE_DOMAINS = {
  working_memory: {
    id: 'working_memory',
    name: 'Memoria de trabajo',
    short: 'WM',
    icon: '🧠',
    color: '#00d4ff',
    region: 'Corteza prefrontal dorsolateral · red frontoparietal',
    theory: 'Sistema de mantenimiento y actualización de información (Baddeley). Base del razonamiento en tiempo real.',
    evidence: 'Entrenamiento adaptativo multimodal mejora WM y función ejecutiva (meta-análisis 2024, g≈0.16–0.48).',
  },
  inhibition: {
    id: 'inhibition',
    name: 'Control inhibitorio',
    short: 'Inhibición',
    icon: '🛑',
    color: '#ef4444',
    region: 'Cingulado anterior · PFC ventrolateral',
    theory: 'Suprimir respuestas prepotentes e interferencia (paradigma Stroop, Go/No-Go).',
    evidence: 'Core-EF training muestra efectos inmediatos y a largo plazo en inhibición (Bul 2025).',
  },
  flexibility: {
    id: 'flexibility',
    name: 'Flexibilidad cognitiva',
    short: 'Switching',
    icon: '🔄',
    color: '#8b5cf6',
    region: 'PFC rostrolateral · tálamo',
    theory: 'Alternar entre reglas o conjuntos de tareas (task switching).',
    evidence: 'Programas con switching + WM mejoran conectividad y cognición fluida (Transl. Psychiatry 2024).',
  },
  processing_speed: {
    id: 'processing_speed',
    name: 'Velocidad de procesamiento',
    short: 'Velocidad',
    icon: '⚡',
    color: '#f59e0b',
    region: 'Sustancia blanca · redes parietales',
    theory: 'Rapidez con precisión en decisiones automatizables.',
    evidence: 'Speed-of-processing training con feedback inmediato mejora atención y memoria verbal.',
  },
  attention: {
    id: 'attention',
    name: 'Atención selectiva',
    short: 'Atención',
    icon: '🎯',
    color: '#06b6d4',
    region: 'Red atencional dorsal y ventral',
    theory: 'Filtrar estímulos relevantes frente a distractores (paradigma Flanker).',
    evidence: 'Flanker y tareas de conflicto activan precuneus y LIFG tras entrenamiento (npj Aging 2025).',
  },
  reasoning: {
    id: 'reasoning',
    name: 'Razonamiento fluido',
    short: 'Lógica',
    icon: '🧩',
    color: '#00f5d4',
    region: 'PFC rostrolateral · parietal posterior',
    theory: 'Resolver problemas nuevos sin aprendizaje previo específico.',
    evidence: 'Mejor transferencia cuando el entrenamiento es variado y adaptativo (no repetitivo).',
  },
}

/** Minijuegos sin métricas clínicas formales */
export const CASUAL_EXERCISE_IDS = new Set(['math', 'anagram', 'oddout'])

export const EXERCISES = {
  nback: {
    id: 'nback',
    name: 'N-Back simple',
    icon: '◉',
    domain: 'working_memory',
    paradigm: 'N-back letra (WM updating)',
    duration: '4 min',
    desc: 'Paradigma clásico: ¿esta letra es igual a la de hace N pasos? Carga en CPFDL.',
    brainScan: 'CPFDL + cíngulo anterior + parietal posterior — estándar en neuroimagen.',
    adaptive: true,
  },
  dualnback: {
    id: 'dualnback',
    name: 'Dual N-Back',
    icon: '◎',
    domain: 'working_memory',
    paradigm: 'Jaeggi dual n-back',
    duration: '8 min',
    desc: 'Dos canales: posición en cuadrícula Y letra. Marca cada coincidencia N-back por separado.',
    brainScan: 'Protocolo Jaeggi — mejora WM fluida en estudios controlados (g≈0.3–0.5).',
    adaptive: true,
  },
  revspan: {
    id: 'revspan',
    name: 'Span inverso',
    icon: '↺',
    domain: 'working_memory',
    paradigm: 'Digit span backwards (WAIS)',
    duration: '5 min',
    desc: 'Escucha la secuencia y repítela al revés. Escala adaptativa 3–9 dígitos.',
    brainScan: 'Bucle fronto-parietal + manipulación WM — usado en evaluación neuropsicológica.',
    adaptive: true,
  },
  cpt: {
    id: 'cpt',
    name: 'CPT-X',
    icon: '◈',
    domain: 'attention',
    paradigm: 'Continuous Performance Test',
    duration: '6 min',
    desc: 'Flujo continuo de letras. Responde solo a X. Mide omisiones y falsas alarmas.',
    brainScan: 'Red de alerta + cíngulo — déficit típico en TDAH y fatiga cognitiva.',
    adaptive: false,
  },
  pasat: {
    id: 'pasat',
    name: 'PASAT',
    icon: '∑',
    domain: 'processing_speed',
    paradigm: 'Paced Auditory Serial Addition',
    duration: '5 min',
    desc: 'Cada dígito nuevo: suma mental con el anterior. Ritmo fijo, sin pausa.',
    brainScan: 'Usado en esclerosis múltiple y fatiga — carga en velocidad + WM.',
    adaptive: false,
  },
  corsi: {
    id: 'corsi',
    name: 'Bloques Corsi',
    icon: '📦',
    domain: 'working_memory',
    paradigm: 'Span espacial (Corsi blocks)',
    duration: '3 min',
    desc: 'Reproduce secuencias de posiciones en una cuadrícula.',
    brainScan: 'Hipocampo y corteza parietal derecha — mapas espaciales en WM.',
    adaptive: true,
  },
  stroop: {
    id: 'stroop',
    name: 'Stroop',
    icon: '🎨',
    domain: 'inhibition',
    paradigm: 'Stroop de colores',
    duration: '2 min',
    desc: 'Nombra el color de la tinta, no la palabra escrita.',
    brainScan: 'Cíngulo anterior detecta conflicto; PFC ventrolateral inhibe respuesta prepotente.',
    adaptive: false,
  },
  gonogo: {
    id: 'gonogo',
    name: 'Go / No-Go',
    icon: '🚦',
    domain: 'inhibition',
    paradigm: 'Go/No-Go',
    duration: '2 min',
    desc: 'Responde solo a estímulos Go; inhibe la respuesta en No-Go.',
    brainScan: 'Corteza motora suplementaria + PFC ventrolateral frenan respuesta en No-Go.',
    adaptive: true,
  },
  flanker: {
    id: 'flanker',
    name: 'Flanker',
    icon: '↔️',
    domain: 'attention',
    paradigm: 'Eriksen Flanker',
    duration: '2 min',
    desc: 'Indica la dirección de la flecha central ignorando distractores.',
    brainScan: 'Precuneus y LIFG filtran distractores laterales — red dorsal en acción.',
    adaptive: false,
  },
  switching: {
    id: 'switching',
    name: 'Cambio de regla',
    icon: '🔀',
    domain: 'flexibility',
    paradigm: 'Task switching',
    duration: '3 min',
    desc: 'Alterna entre reglas (par/impar vs mayor/menor que 5).',
    brainScan: 'PFC rostrolateral reconfigura task-set — switching cost medible en fMRI.',
    adaptive: true,
  },
  symbols: {
    id: 'symbols',
    name: 'Símbolos-Dígitos',
    icon: '🔣',
    domain: 'processing_speed',
    paradigm: 'Symbol-Digit Modalities',
    duration: '2 min',
    desc: 'Asocia símbolos con dígitos lo más rápido posible.',
    brainScan: 'Corteza parietal y motor premotor — automatización de asociaciones.',
    adaptive: false,
  },
  math: {
    id: 'math',
    name: 'Cálculo rápido',
    icon: '➗',
    domain: 'processing_speed',
    paradigm: 'Arithmetic speed',
    duration: '2 min',
    desc: 'Operaciones mentales contra el tiempo.',
    adaptive: false,
  },
  memory: {
    id: 'memory',
    name: 'Secuencia visual',
    icon: '🎨',
    domain: 'working_memory',
    paradigm: 'Visual sequence recall',
    duration: '3 min',
    desc: 'Memoriza y repite secuencias de colores.',
    adaptive: true,
  },
  simon: {
    id: 'simon',
    name: 'Span numérico',
    icon: '🔢',
    domain: 'working_memory',
    paradigm: 'Digit span',
    duration: '3 min',
    desc: 'Recuerda secuencias de números en orden.',
    adaptive: true,
  },
  logic: {
    id: 'logic',
    name: 'Acertijos',
    icon: '🧩',
    domain: 'reasoning',
    paradigm: 'Deductive reasoning',
    duration: '3 min',
    desc: 'Razonamiento lógico y verbal.',
    brainScan: 'PFC rostrolateral + parietal posterior — razonamiento bajo incertidumbre.',
    adaptive: false,
  },
  sequence: {
    id: 'sequence',
    name: 'Patrones',
    icon: '📐',
    domain: 'reasoning',
    paradigm: 'Pattern induction',
    duration: '3 min',
    desc: 'Detecta reglas en series numéricas.',
    adaptive: false,
  },
  reaction: {
    id: 'reaction',
    name: 'Reflejos',
    icon: '⚡',
    domain: 'processing_speed',
    paradigm: 'Simple RT / choice RT',
    duration: '2 min',
    desc: 'Espera el verde y reacciona — mide latencia real en milisegundos.',
    brainScan: 'Corteza motora + tálamo — velocidad de transducción sensoriomotora.',
    adaptive: false,
  },
  anagram: {
    id: 'anagram',
    name: 'Anagramas',
    icon: '🔤',
    domain: 'reasoning',
    paradigm: 'Lexical retrieval',
    duration: '3 min',
    desc: 'Reordena letras bajo presión — acceso léxico y flexibilidad.',
    brainScan: 'Área de Broca + temporal inferior — desempaquetar fonología almacenada.',
    adaptive: false,
  },
  oddout: {
    id: 'oddout',
    name: 'Intruso semántico',
    icon: '🕵️',
    domain: 'reasoning',
    paradigm: 'Semantic categorization',
    duration: '2 min',
    desc: 'Encuentra la palabra que no pertenece al grupo.',
    brainScan: 'Temporal anterior + PFC — categorías y excepciones.',
    adaptive: false,
  },
  visnback: {
    id: 'visnback',
    name: '2-Back visual',
    icon: '◇',
    domain: 'working_memory',
    paradigm: 'Visual n-back',
    duration: '4 min',
    desc: 'Formas y colores en secuencia — marca coincidencias N-back sin letras.',
    brainScan: 'Parietal posterior + CPFDL — WM visoespacial.',
    adaptive: true,
  },
  trail: {
    id: 'trail',
    name: 'Trail Making',
    icon: '🔗',
    domain: 'flexibility',
    paradigm: 'TMT-A / TMT-B',
    duration: '3 min',
    desc: 'Une números (A) o alterna número-letra (B) lo más rápido posible.',
    brainScan: 'PFC + cíngulo — velocidad y flexibilidad ejecutiva.',
    adaptive: false,
  },
  wisconsin: {
    id: 'wisconsin',
    name: 'Wisconsin',
    icon: '🃏',
    domain: 'flexibility',
    paradigm: 'WCST simplificado',
    duration: '5 min',
    desc: 'Descubre la regla de clasificación (color, forma, número) y adáptate al cambio.',
    brainScan: 'PFC dorsolateral — flexibilidad y perseveración.',
    adaptive: false,
  },
  ant: {
    id: 'ant',
    name: 'ANT',
    icon: '◎',
    domain: 'attention',
    paradigm: 'Attention Network Test',
    duration: '4 min',
    desc: 'Cue atencional + flanker: mide alerta, orientación y control ejecutivo.',
    brainScan: 'Red atencional: alerta, orientación y control.',
    adaptive: false,
  },
}

const WEEKLY_CURRICULUM = [
  ['dualnback', 'stroop', 'corsi', 'cpt', 'flanker', 'pasat'],
  ['corsi', 'gonogo', 'dualnback', 'revspan', 'flanker', 'switching'],
  ['dualnback', 'flanker', 'corsi', 'cpt', 'gonogo', 'pasat'],
  ['revspan', 'dualnback', 'corsi', 'stroop', 'flanker', 'switching'],
  ['switching', 'gonogo', 'dualnback', 'corsi', 'cpt', 'flanker'],
  ['flanker', 'gonogo', 'switching', 'dualnback', 'revspan', 'stroop'],
  ['dualnback', 'corsi', 'stroop', 'cpt', 'flanker', 'pasat'],
]

export function getBrainProgram() {
  return getItem('brainProgram', {
    domainXp: {},
    exerciseLevels: {},
    sessionsCompleted: 0,
    lastSessionDate: null,
    weekSessions: 0,
    weekStart: null,
  })
}

export function saveBrainProgram(p) {
  setItem('brainProgram', p)
}

export function getExerciseLevel(exerciseId) {
  const p = getBrainProgram()
  return p.exerciseLevels[exerciseId] || 1
}

export function updateExerciseLevel(exerciseId, accuracy) {
  const p = getBrainProgram()
  const cur = p.exerciseLevels[exerciseId] || 1
  if (accuracy >= 0.88 && cur < 7) p.exerciseLevels[exerciseId] = cur + 1
  else if (accuracy < 0.55 && cur > 1) p.exerciseLevels[exerciseId] = cur - 1
  const domain = EXERCISES[exerciseId]?.domain
  if (domain) {
    p.domainXp[domain] = (p.domainXp[domain] || 0) + Math.round(accuracy * 20)
  }
  saveBrainProgram(p)
  return p.exerciseLevels[exerciseId] || 1
}

export function getTodaysSession() {
  const day = new Date().getDay()
  const idx = day === 0 ? 6 : day - 1
  const ids = WEEKLY_CURRICULUM[idx] || WEEKLY_CURRICULUM[0]
  return ids.map(id => ({
    ...EXERCISES[id],
    domainInfo: COGNITIVE_DOMAINS[EXERCISES[id].domain],
    level: getExerciseLevel(id),
  }))
}

export function isSessionDoneToday() {
  return getBrainProgram().lastSessionDate === getToday()
}

export function completeSession(results) {
  const p = getBrainProgram()
  const today = getToday()
  p.lastSessionDate = today
  p.sessionsCompleted = (p.sessionsCompleted || 0) + 1
  const weekStart = getWeekStart()
  if (p.weekStart !== weekStart) {
    p.weekStart = weekStart
    p.weekSessions = 1
  } else {
    p.weekSessions = (p.weekSessions || 0) + 1
  }
  saveBrainProgram(p)
  import('/js/product-analytics.js').then(m => {
    m.trackProductEvent(m.EVENTS.BRAIN_SESSION, { exercises: results?.length || 0 })
  }).catch(() => {})
  return p
}

function getWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return toDateStr(d)
}

export function getDomainProgress() {
  const p = getBrainProgram()
  return Object.entries(COGNITIVE_DOMAINS).map(([id, domain]) => ({
    ...domain,
    xp: p.domainXp[id] || 0,
    level: Math.min(10, Math.floor((p.domainXp[id] || 0) / 100) + 1),
  }))
}

export function getProgramStats() {
  const p = getBrainProgram()
  return {
    sessionsCompleted: p.sessionsCompleted || 0,
    weekSessions: p.weekSessions || 0,
    weekTarget: 3,
    doneToday: isSessionDoneToday(),
  }
}

/** Analiza historial clínico (últimas 7 sesiones por dominio) y sugiere misión adaptativa */
export async function getAdaptiveDailyMission() {
  const { getProtocolHistory } = await import('/js/brain-metrics.js')
  const domainScores = {}

  Object.entries(EXERCISES).forEach(([exId, ex]) => {
    const domain = ex.domain
    if (!domain) return
    const hist = getProtocolHistory(exId).slice(0, 7)
    if (!hist.length) return
    const accs = hist.map(h => h.metrics?.accuracy).filter(v => typeof v === 'number')
    if (!accs.length) return
    const avg = accs.reduce((a, b) => a + b, 0) / accs.length
    const variance = accs.length > 1
      ? Math.sqrt(accs.reduce((s, v) => s + (v - avg) ** 2, 0) / accs.length)
      : 0
    if (!domainScores[domain]) domainScores[domain] = { scores: [], exercises: [] }
    domainScores[domain].scores.push(avg)
    domainScores[domain].exercises.push({ id: exId, avg, variance, name: ex.name, icon: ex.icon })
  })

  let weakest = null
  let weakestScore = Infinity
  Object.entries(domainScores).forEach(([domainId, data]) => {
    const mean = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    const penalty = data.exercises.reduce((s, e) => s + e.variance, 0) / Math.max(1, data.exercises.length)
    const composite = mean - penalty * 0.15
    if (composite < weakestScore) {
      weakestScore = composite
      const ex = data.exercises.sort((a, b) => a.avg - b.avg)[0]
      weakest = {
        domainId,
        domain: COGNITIVE_DOMAINS[domainId],
        exerciseId: ex.id,
        exerciseName: ex.name,
        icon: ex.icon,
        avgAccuracy: Math.round(ex.avg),
        reason: ex.variance > 12
          ? 'Alta variabilidad — consolidar con práctica repetida'
          : 'Puntuación más baja de tu perfil reciente',
      }
    }
  })

  if (!weakest) {
    const fallback = getTodaysSession()[0]
    return fallback ? {
      exerciseId: fallback.id,
      exerciseName: fallback.name,
      icon: fallback.icon,
      domain: fallback.domainInfo,
      reason: 'Sesión guiada del día',
      avgAccuracy: null,
    } : null
  }
  return weakest
}

let adaptiveMissionCache = null

export async function refreshAdaptiveMission() {
  adaptiveMissionCache = await getAdaptiveDailyMission()
  return adaptiveMissionCache
}

export function getCachedAdaptiveMission() {
  return adaptiveMissionCache
}

export function renderAdaptiveMissionCard() {
  const m = adaptiveMissionCache
  if (!m) {
    return `<section id="adaptive-mission-card" class="m-adaptive-mission m-adaptive-mission--loading span-full" aria-busy="true">
      <p class="m-adaptive-mission__label">Misión prioritaria</p>
      <p class="text-sm text-muted">Analizando tu perfil cognitivo…</p>
    </section>`
  }
  const domainLabel = m.domain?.name || m.domain?.short || ''
  return `<section id="adaptive-mission-card" class="m-adaptive-mission span-full">
    <div class="m-adaptive-mission__head">
      <p class="m-adaptive-mission__label">Misión prioritaria del día</p>
      ${domainLabel ? `<span class="brain-protocol-tag brain-protocol-tag--clinical">${esc(domainLabel)}</span>` : ''}
    </div>
    <button type="button" class="m-adaptive-mission__cta" onclick="startBrain('${m.exerciseId}')">
      <span class="m-adaptive-mission__icon" aria-hidden="true">${m.icon || '🔬'}</span>
      <span class="m-adaptive-mission__body">
        <strong class="m-adaptive-mission__title">${esc(m.exerciseName)}</strong>
        <span class="m-adaptive-mission__reason">${esc(m.reason)}</span>
        ${m.avgAccuracy != null ? `<span class="m-adaptive-mission__stat">Media reciente: ${m.avgAccuracy}%</span>` : ''}
      </span>
      <span class="m-adaptive-mission__arrow" aria-hidden="true">→</span>
    </button>
  </section>`
}

export const PROGRAM_DISCLAIMER =
  'Programa basado en paradigmas de entrenamiento cognitivo (N-back, Stroop, Flanker, Corsi). La evidencia muestra mejoras en tareas entrenadas y función ejecutiva; la transferencia lejana a IQ es limitada (Sala & Gobet, 2017). Consistencia 3×/semana · 20 min recomendada.'

/** Guía clínica por protocolo: propósito, instrucciones, métricas y feedback */
export const EXERCISE_GUIDES = {
  dualnback: {
    purpose: 'Entrena memoria de trabajo en dos canales a la vez (posición + letra). Es el protocolo Jaeggi usado en estudios que mostraron mejoras en WM fluida.',
    howTo: [
      'Observa la letra y la posición del cuadrado en la cuadrícula 3×3.',
      'Marca «Letra» si coincide con la de hace N pasos.',
      'Marca «Posición» si el cuadrado está donde estaba hace N pasos.',
      'Puedes marcar ambas en el mismo estímulo. Si no hay coincidencia, no pulses nada.',
    ],
    measures: 'Precisión por canal, omisiones y falsas alarmas',
    brain: 'CPFDL + parietal posterior + cíngulo anterior',
    life: 'Mantener contexto mientras actualizas información: reuniones, código, instrucciones encadenadas.',
    debrief: (pct) => pct >= 75
      ? 'Buen control dual. Tu WM está sosteniendo dos flujos — sigue subiendo N cuando aciertes >85%.'
      : pct >= 50
        ? 'Normal al empezar. Concéntrate en un canal primero; luego integra el segundo.'
        : 'Demasiado rápido o demasiado N. Baja dificultad y prioriza no marcar cuando no hay match.',
  },
  nback: {
    purpose: 'Paradigma estándar en neurociencia para medir y entrenar actualización de memoria de trabajo (mantener una ventana deslizante mental).',
    howTo: [
      'Aparece una letra cada pocos segundos.',
      'Pulsa «Coincide» solo si es igual a la de hace N posiciones.',
      'Si no coincide, pulsa «Pasar» o deja que avance el tiempo.',
    ],
    measures: 'Aciertos, omisiones (no marcar match) y falsas alarmas',
    brain: 'CPFDL + cíngulo anterior',
    life: 'Seguir una conversación técnica mientras recuerdas datos de hace unos minutos.',
    debrief: (pct) => pct >= 80 ? 'WM actualizada con precisión. El estándar clínico es >80% en tu nivel N.' : 'Revisa si confundes N posiciones atrás. Externalizar 1 dato en papel libera carga.',
  },
  revspan: {
    purpose: 'Span inverso del WAIS: mide manipulación de WM (no solo repetir, sino invertir). Usado en evaluación neuropsicológica.',
    howTo: [
      'Verás dígitos uno a uno — memorízalos en silencio.',
      'Al terminar la secuencia, escríbelos al revés.',
      'Si aciertas, la longitud sube. Un error termina el bloque.',
    ],
    measures: 'Longitud máxima alcanzada y secuencias correctas',
    brain: 'Bucle fronto-parietal',
    life: 'Invertir instrucciones, números o pasos mentales sin escribir.',
    debrief: (pct) => 'Tu techo hoy indica capacidad de manipulación. Repite 3×/semana para subir 1 dígito en ~4 semanas.',
  },
  corsi: {
    purpose: 'Bloques Corsi: span espacial. Mide memoria visoespacial en cuadrícula — equivalente clínico al digit span pero en espacio.',
    howTo: [
      'Observa qué bloques se iluminan y en qué orden.',
      'Cuando termine la secuencia, repítela tocando los mismos bloques.',
      'Cada ronda correcta aumenta la longitud.',
    ],
    measures: 'Span espacial máximo (bloques en secuencia)',
    brain: 'Hipocampo + parietal derecha',
    life: 'Recordar rutas, dónde dejaste objetos, layouts de pantalla.',
    debrief: (pct) => pct >= 60 ? 'Mapa espacial sólido. Visualiza la secuencia como un camino.' : 'Repite en voz baja «arriba-izq, centro…» mientras observas.',
  },
  stroop: {
    purpose: 'Mide conflicto cognitivo: tu cerebro quiere leer la palabra, pero debes responder al color de la tinta. Entrena inhibición de respuesta prepotente.',
    howTo: [
      'Ignora el significado de la palabra.',
      'Pulsa el botón del COLOR de la tinta, no del texto.',
      'En «conflicto» la palabra y el color no coinciden — ahí entrena tu cíngulo anterior.',
    ],
    measures: 'Precisión y tiempo en ítems congruentes vs incongruentes',
    brain: 'Cíngulo anterior + PFC ventrolateral',
    life: 'Frenar impulsos automáticos: responder correos sin leer, compras por hábito, reaccionar en chat.',
    debrief: (pct) => pct >= 85 ? 'Buena inhibición. El coste Stroop baja con práctica consistente.' : 'Ve más lento en conflictos. Nombra el color en voz baja antes de pulsar.',
  },
  gonogo: {
    purpose: 'Entrena frenado motor: responder rápido a Go e inhibir completamente en No-Go. Déficit típico en impulsividad y TDAH.',
    howTo: [
      'En señal GO (verde): toca lo antes posible.',
      'En NO-GO (rojo): no toques nada. Aguanta.',
      'Los No-Go son menos frecuentes — ahí está el entrenamiento real.',
    ],
    measures: 'Aciertos Go, comisiones en No-Go (tocar cuando no debías)',
    brain: 'Ganglios basales + PFC ventrolateral + SMA',
    life: 'No abrir notificaciones, no responder de golpe, no picar por ansiedad.',
    debrief: (pct) => pct >= 80 ? 'Control motor bajo presión. Mantén ritmo sin anticiparte.' : 'Si fallas en No-Go, exhala antes de cada trial — la anticipación es el error.',
  },
  flanker: {
    purpose: 'Atención selectiva con distractores: la flecha central manda; las laterales interfieren si apuntan al lado opuesto.',
    howTo: [
      'Mira solo la flecha del centro.',
      'Indica si apunta izquierda o derecha.',
      'En trials de interferencia, ignora las flechas laterales.',
    ],
    measures: 'Precisión y efecto de interferencia (congruentes vs incongruentes)',
    brain: 'Precuneus + LIFG + red atencional dorsal',
    life: 'Filtrar ruido en oficina abierta, conversaciones paralelas, notificaciones.',
    debrief: (pct) => pct >= 80 ? 'Filtro atencional fuerte.' : 'Fija la mirada en el centro antes de decidir. No leas las flechas laterales.',
  },
  switching: {
    purpose: 'Task switching: alternar entre reglas activas. Mide coste de cambio (switch cost) — flexibilidad cognitiva ejecutiva.',
    howTo: [
      'Lee la regla de cada trial: par/impar O mayor/menor que 5.',
      'La regla puede cambiar sin aviso — relee antes de responder.',
      'En dificultad alta los cambios son más frecuentes.',
    ],
    measures: 'Precisión tras cambio de regla vs repetición',
    brain: 'PFC rostrolateral',
    life: 'Alternar modos: escuchar ↔ presentar, creativo ↔ analítico, multitarea real.',
    debrief: (pct) => pct >= 75 ? 'Reconfiguración rápida entre reglas.' : 'Tras cada cambio, di la regla en voz baja antes de responder.',
  },
  cpt: {
    purpose: 'CPT-X: vigilancia sostenida. Flujo continuo de estímulos; solo respondes al objetivo raro (X). Mide omisiones y falsas alarmas.',
    howTo: [
      'Las letras pasan en ritmo fijo — no te distraigas.',
      'Pulsa «Responder» solo cuando veas X.',
      'Ignora todas las demás letras. Responder a no-X es falsa alarma.',
    ],
    measures: 'Hits, omisiones (X sin responder), falsas alarmas',
    brain: 'Red de alerta + cíngulo anterior',
    life: 'Monitoreo, control de calidad, detectar el email importante entre cientos.',
    debrief: (pct) => pct >= 85 ? 'Vigilancia sostenida sólida.' : pct >= 60 ? 'Omisiones = distracción. Falsas alarmas = impulsividad. Ajusta según tu error.' : 'Baja a fácil y mantén ritmo respiratorio. La fatiga sube omisiones.',
  },
  pasat: {
    purpose: 'PASAT: suma serial bajo ritmo impuesto. Usado clínicamente en esclerosis múltiple y fatiga cognitiva. Carga WM + velocidad.',
    howTo: [
      'Cada pocos segundos aparece un dígito nuevo.',
      'Suma el dígito actual + el anterior y escribe el resultado.',
      'El ritmo no espera — si te atrasas, sigue con la siguiente suma.',
    ],
    measures: 'Sumas correctas bajo ritmo fijo',
    brain: 'Parietal + CPFDL + velocidad de procesamiento',
    life: 'Cálculos encadenados bajo presión: presupuestos, estimaciones rápidas.',
    debrief: (pct) => pct >= 70 ? 'Buen ritmo aritmético.' : 'Practica primero sin ritmo, luego sube velocidad. No intentes recuperar sumas pasadas.',
  },
  symbols: {
    purpose: 'Símbolos-Dígitos (WAIS-IV adaptado): velocidad de asociación símbolo-número. Mide procesamiento automatizado.',
    howTo: [
      'Memoriza la tabla símbolo→dígito arriba.',
      'Pulsa el dígito que corresponde al símbolo grande.',
      'Velocidad con precisión — tienes tiempo limitado.',
    ],
    measures: 'Aciertos por minuto (throughput)',
    brain: 'Parietal + premotor',
    life: 'Leer tablas, códigos de color, leyendas técnicas con fluidez.',
    debrief: (pct) => 'El throughput sube cuando la tabla queda memorizada — no mires cada símbolo como si fuera nuevo.',
  },
  reaction: {
    purpose: 'Tiempo de reacción simple: mide latencia sensoriomotora real en milisegundos. No es un juego — es psicofísica básica.',
    howTo: [
      'Pantalla roja = espera. No anticipes.',
      'Verde = toca inmediatamente.',
      'Tocar antes del verde cuenta como falsa salida.',
    ],
    measures: 'RT en ms, falsas salidas, variabilidad',
    brain: 'Tálamo + corteza motora + vía sensoriomotora',
    life: 'Deporte, conducción, decisiones bajo presión temporal.',
    debrief: (pct) => 'RT <350 ms es rápido; >500 ms puede indicar fatiga o anticipación. La variabilidad importa más que un solo trial.',
  },
  logic: {
    purpose: 'Razonamiento deductivo con feedback explicativo. Entrena inferencia lógica, no adivinanza.',
    howTo: [
      'Lee el enunciado completo antes de elegir.',
      'Tras responder verás la explicación — úsala para calibrar.',
      'No hay tiempo límite agresivo; la precisión importa.',
    ],
    measures: 'Aciertos en inferencia lógica/verbal',
    brain: 'PFC rostrolateral + parietal posterior',
    life: 'Debugging, decisiones con información incompleta, detectar falacias.',
    debrief: (pct) => pct >= 80 ? 'Razonamiento sólido.' : 'Relee la explicación de cada error — el patrón se repite.',
  },
  visnback: {
    purpose: 'N-back visual sin letras: entrena WM visoespacial con formas y colores — útil si el canal verbal está saturado.',
    howTo: [
      'Observa la forma y su color en cada estímulo.',
      'Marca «Coincide» si es igual a la de hace N pasos (forma y color).',
      'Si no coincide, pulsa «Pasar».',
    ],
    measures: 'Precisión, omisiones y falsas alarmas',
    brain: 'Parietal posterior + CPFDL',
    life: 'Recordar iconos, layouts, estados de UI que se repiten.',
    debrief: (pct) => pct >= 75 ? 'WM visual sólida.' : 'Visualiza la forma anterior antes de decidir.',
  },
  trail: {
    purpose: 'Trail Making Test: velocidad + flexibilidad. TMT-A mide atención; TMT-B añade cambio de set (número→letra).',
    howTo: [
      'Toca cada nodo en orden ascendente lo más rápido posible.',
      'En TMT-B alterna número y letra: 1-A-2-B…',
      'Cada error suma penalización de tiempo.',
    ],
    measures: 'Tiempo total y errores de secuencia',
    brain: 'PFC + cíngulo anterior',
    life: 'Alternar entre tareas numéricas y verbales bajo presión.',
    debrief: (pct) => pct >= 80 ? 'Secuenciación fluida.' : 'Ve más despacio al cambiar de número a letra.',
  },
  wisconsin: {
    purpose: 'WCST: descubrir reglas de clasificación y adaptarte cuando cambian — déficit clásico en lesión frontal.',
    howTo: [
      'Clasifica la carta inferior eligiendo una de las 4 de arriba.',
      'La regla (color, forma o número) cambia sin aviso tras varios aciertos.',
      'Si fallas, prueba otra dimensión — no repitas la misma regla obsoleta.',
    ],
    measures: 'Categorías completadas y errores de perseveración',
    brain: 'PFC dorsolateral',
    life: 'Cuando un método deja de funcionar, cambiar de estrategia sin insistir.',
    debrief: (pct) => pct >= 70 ? 'Flexibilidad cognitiva adecuada.' : 'Tras un error, cambia de dimensión activamente.',
  },
  ant: {
    purpose: 'Attention Network Test: cue (ninguna, centro, espacial) + flanker. Mide tres redes atencionales.',
    howTo: [
      'Tras el cue, indica la dirección de la flecha central.',
      'Ignora las flechas laterales en trials de conflicto.',
      'Responde lo antes posible tras aparecer el estímulo.',
    ],
    measures: 'Precisión y efectos de alerta/orientación/interferencia',
    brain: 'Red atencional (alerta, orientación, control)',
    life: 'Filtrar distracciones cuando ya sabes dónde mirar.',
    debrief: (pct) => pct >= 80 ? 'Redes atencionales coordinadas.' : 'Fija la mirada en el centro durante el cue.',
  },
}

export function getExerciseGuide(id) {
  return EXERCISE_GUIDES[id] || null
}
