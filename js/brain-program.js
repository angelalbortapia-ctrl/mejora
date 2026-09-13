import { getItem, setItem, getToday, toDateStr } from '/js/core.js'

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

export const EXERCISES = {
  nback: {
    id: 'nback',
    name: 'N-Back',
    icon: '🔁',
    domain: 'working_memory',
    paradigm: 'N-back auditivo-visual',
    duration: '3 min',
    desc: 'Identifica cuando el estímulo coincide con el de hace N posiciones.',
    brainScan: 'CPFDL + cíngulo anterior + parietal posterior se activan con carga N.',
    adaptive: true,
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
}

const WEEKLY_CURRICULUM = [
  ['nback', 'stroop', 'corsi', 'switching', 'flanker', 'symbols'],
  ['corsi', 'gonogo', 'nback', 'flanker', 'stroop', 'switching'],
  ['nback', 'flanker', 'corsi', 'switching', 'gonogo', 'symbols'],
  ['symbols', 'nback', 'corsi', 'stroop', 'flanker', 'switching'],
  ['switching', 'gonogo', 'nback', 'corsi', 'stroop', 'flanker'],
  ['flanker', 'gonogo', 'switching', 'nback', 'symbols', 'stroop'],
  ['nback', 'corsi', 'stroop', 'flanker', 'switching', 'gonogo'],
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
  if (accuracy >= 0.85 && cur < 5) p.exerciseLevels[exerciseId] = cur + 1
  else if (accuracy < 0.5 && cur > 1) p.exerciseLevels[exerciseId] = cur - 1
  const domain = EXERCISES[exerciseId]?.domain
  if (domain) {
    p.domainXp[domain] = (p.domainXp[domain] || 0) + Math.round(accuracy * 20)
  }
  saveBrainProgram(p)
  return p.exerciseLevels[exerciseId] || 1
}

export function getTodaysSession() {
  const day = new Date().getDay()
  const ids = WEEKLY_CURRICULUM[day] || WEEKLY_CURRICULUM[0]
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

export const PROGRAM_DISCLAIMER =
  'Programa basado en paradigmas de entrenamiento cognitivo (N-back, Stroop, Flanker, Corsi). La evidencia muestra mejoras en tareas entrenadas y función ejecutiva; el transferencia lejana a IQ es limitada (Sala & Gobet, 2017). Consistencia 3×/semana · 20 min recomendada.'
