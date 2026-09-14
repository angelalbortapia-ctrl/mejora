/** Escala de brutalidad por dificultad global */
const INTENSITY = {
  facil: { trialMult: 1.1, pace: 1.2, nBump: 0, incongruent: 0.58, nogoRate: 0.34, timeLimit: 0, corsiRounds: 8 },
  medio: { trialMult: 1.35, pace: 1, nBump: 0, incongruent: 0.74, nogoRate: 0.4, timeLimit: 3200, corsiRounds: 9 },
  dificil: { trialMult: 1.65, pace: 0.78, nBump: 1, incongruent: 0.86, nogoRate: 0.46, timeLimit: 2600, corsiRounds: 10 },
  experto: { trialMult: 2.1, pace: 0.58, nBump: 2, incongruent: 0.92, nogoRate: 0.52, timeLimit: 2000, corsiRounds: 12 },
}

export function getIntensity(difficulty = 'medio') {
  return INTENSITY[difficulty] || INTENSITY.medio
}

export function brainTrialCount(base, difficulty = 'medio') {
  const mult = getIntensity(difficulty).trialMult
  return Math.max(base, Math.round(base * mult))
}

const STROOP_COLORS = [
  { name: 'ROSA', hex: '#fb7185' },
  { name: 'TURQUESA', hex: '#00f5d4' },
  { name: 'MENTA', hex: '#2dd4bf' },
  { name: 'AMARILLO', hex: '#eab308' },
]

const NBACK_LETTERS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T']

const SYMBOL_MAP = [
  { sym: '△', digit: 1 }, { sym: '□', digit: 2 }, { sym: '○', digit: 3 },
  { sym: '◇', digit: 4 }, { sym: '☆', digit: 5 }, { sym: '▽', digit: 6 },
]

export function initNBack(level = 1, total = 20, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const n = Math.min(4, level + inten.nBump)
  const matchRate = difficulty === 'experto' ? 0.42 : difficulty === 'dificil' ? 0.38 : 0.32
  const stream = Array.from({ length: total + n }, () =>
    NBACK_LETTERS[Math.floor(Math.random() * NBACK_LETTERS.length)]
  )
  for (let i = n; i < stream.length; i++) {
    if (Math.random() < matchRate) stream[i] = stream[i - n]
  }
  const paceMs = Math.round(2400 * inten.pace)
  return {
    n, stream, index: 0, total, score: 0, trials: 0, paceMs,
    phase: 'ready', feedback: null, responded: false, finished: false,
  }
}

export function initStroop(total = 16, difficulty = 'medio') {
  const inc = getIntensity(difficulty).incongruent
  const trials = []
  for (let i = 0; i < total; i++) {
    const word = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    let ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    while (ink.name === word.name && Math.random() < inc) {
      ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    }
    trials.push({ word: word.name, ink: ink.hex, correct: ink.name, congruent: word.name === ink.name })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, difficulty }
}

export function initFlanker(total = 20, difficulty = 'medio') {
  const inc = getIntensity(difficulty).incongruent
  const trials = []
  for (let i = 0; i < total; i++) {
    const dir = Math.random() < 0.5 ? 'left' : 'right'
    const congruent = Math.random() > inc
    trials.push({ dir, congruent })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, difficulty }
}

export function initSwitching(total = 24, difficulty = 'medio') {
  const trials = []
  let rule = 'parity'
  const chaotic = difficulty === 'experto' || difficulty === 'dificil'
  for (let i = 0; i < total; i++) {
    if (chaotic) {
      if (i > 0 && Math.random() < (difficulty === 'experto' ? 0.45 : 0.32)) {
        rule = rule === 'parity' ? 'magnitude' : 'parity'
      }
    } else {
      rule = i % 2 === 0 ? 'parity' : 'magnitude'
    }
    const num = Math.floor(Math.random() * 9) + 1
    trials.push({ rule, num })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, ruleLabel: 'parity', difficulty }
}

export function initGoNoGo(total = 30, difficulty = 'medio') {
  const nogoRate = getIntensity(difficulty).nogoRate
  const trials = []
  for (let i = 0; i < total; i++) {
    trials.push({ type: Math.random() < (1 - nogoRate) ? 'go' : 'nogo' })
  }
  const waitMs = difficulty === 'experto' ? 350 : difficulty === 'dificil' ? 450 : 600
  const nogoMs = difficulty === 'experto' ? 900 : difficulty === 'dificil' ? 1050 : 1200
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, waiting: false, started: false, bootScheduled: false, waitMs, nogoMs, difficulty }
}

export function initCorsi(level = 2, difficulty = 'medio') {
  return {
    level, sequence: [], userInput: [], phase: 'ready',
    score: 0, rounds: 0, maxRounds: getIntensity(difficulty).corsiRounds,
    finished: false, highlight: -1, difficulty,
  }
}

export function corsiGenerateSequence(level) {
  const seq = []
  const used = new Set()
  while (seq.length < level) {
    const pos = Math.floor(Math.random() * 9)
    if (!used.has(pos)) { used.add(pos); seq.push(pos) }
  }
  return seq
}

export function initSymbols(total = 20, timeLeft = 45) {
  const trials = []
  const map = [...SYMBOL_MAP].sort(() => Math.random() - 0.5).slice(0, 4)
  for (let i = 0; i < total; i++) {
    const item = map[Math.floor(Math.random() * map.length)]
    trials.push({ sym: item.sym, correct: item.digit, map })
  }
  return { trials, index: 0, score: 0, total, map, timeLeft, active: false, finished: false }
}

export function flankerArrows(trial) {
  const c = trial.dir === 'left' ? '←' : '→'
  const f = trial.congruent ? c : (c === '←' ? '→' : '←')
  return f + f + c + f + f
}

export function getSwitchAnswer(trial, answer) {
  if (trial.rule === 'parity') {
    const isEven = trial.num % 2 === 0
    if (answer === 'even') return isEven
    if (answer === 'odd') return !isEven
    return false
  }
  if (answer === 'high') return trial.num > 5
  if (answer === 'low') return trial.num <= 5
  return false
}

export function initReaction(total = 8) {
  return {
    total, index: 0, score: 0, phase: 'intro',
    trialStart: 0, rts: [], falseStarts: 0, delayMs: 0, finished: false,
    feedback: null,
  }
}

export function reactionDelayMs(difficulty = 'medio') {
  const base = { facil: 1400, medio: 2000, dificil: 2600, experto: 3200 }[difficulty] || 2000
  const span = { facil: 1800, medio: 2800, dificil: 3400, experto: 4000 }[difficulty] || 2800
  return base + Math.floor(Math.random() * span)
}

export function reactionGoWindowMs(difficulty = 'medio') {
  return { facil: 900, medio: 720, dificil: 580, experto: 480 }[difficulty] || 720
}

export function scoreReactionRt(ms, difficulty = 'medio') {
  if (ms < 200) return 0
  if (difficulty === 'experto') {
    if (ms < 300) return 3
    if (ms < 380) return 2
    if (ms < 460) return 1
    return 0
  }
  if (ms < 320) return 3
  if (ms < 420) return 2
  if (ms < 550) return 1
  return 0
}

export function initOddOut(groups, total = 8) {
  const trials = []
  const pool = [...groups].sort(() => Math.random() - 0.5)
  for (let i = 0; i < total; i++) trials.push(pool[i % pool.length])
  return { trials, index: 0, score: 0, total, feedback: null, finished: false }
}

export function buildAnagramChoices(puzzle, pool) {
  const decoys = pool
    .filter(p => p.answer !== puzzle.answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(p => p.answer)
  const opts = [puzzle.answer, ...decoys].sort(() => Math.random() - 0.5)
  return opts
}

export function initAnagram(puzzles) {
  const first = puzzles[0]
  return {
    puzzles, index: 0, score: 0, total: puzzles.length,
    choices: buildAnagramChoices(first, puzzles),
    hintUsed: false, feedback: null, finished: false,
  }
}

/** Dual N-Back (Jaeggi) — letra + posición en cuadrícula 3×3 */
export function initDualNBack(level = 2, total = 28, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const n = Math.min(4, Math.max(2, level + inten.nBump))
  const len = total + n
  const stream = Array.from({ length: len }, () => ({
    pos: Math.floor(Math.random() * 9),
    letter: NBACK_LETTERS[Math.floor(Math.random() * NBACK_LETTERS.length)],
  }))
  const matchRate = difficulty === 'experto' ? 0.3 : difficulty === 'dificil' ? 0.26 : 0.22
  for (let i = n; i < len; i++) {
    const r = Math.random()
    if (r < matchRate * 0.35) {
      stream[i].letter = stream[i - n].letter
      stream[i].pos = stream[i - n].pos
    } else if (r < matchRate * 0.7) {
      stream[i].letter = stream[i - n].letter
    } else if (r < matchRate) {
      stream[i].pos = stream[i - n].pos
    }
  }
  const paceMs = Math.round(3000 * inten.pace)
  return {
    n, stream, index: 0, total, score: 0, letterScore: 0, posScore: 0, trials: 0, paceMs,
    phase: 'ready', feedback: null, pressedLetter: false, pressedPos: false,
    responded: false, finished: false,
  }
}

/** CPT — Continuous Performance Test (atención sostenida, objetivo X) */
export function initCPT(total = 80, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWYZ'.split('')
  const targetRate = difficulty === 'experto' ? 0.1 : difficulty === 'dificil' ? 0.12 : 0.14
  const trials = []
  for (let i = 0; i < total; i++) {
    const isTarget = Math.random() < targetRate
    trials.push({
      letter: isTarget ? 'X' : pool[Math.floor(Math.random() * pool.length)],
      isTarget,
    })
  }
  const isi = Math.round((difficulty === 'experto' ? 900 : difficulty === 'dificil' ? 1100 : 1300) * inten.pace)
  return {
    trials, index: 0, hits: 0, misses: 0, falseAlarms: 0, total,
    isi, phase: 'ready', responded: false, finished: false, difficulty,
  }
}

/** Span inverso — dígitos en orden inverso (neuropsicología clínica) */
export function initRevSpan(startLen = 3, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const maxLen = difficulty === 'experto' ? 9 : difficulty === 'dificil' ? 8 : 7
  return {
    length: startLen, maxLen, sequence: [], phase: 'ready', round: 0,
    maxRounds: Math.round(6 * inten.trialMult),
    score: 0, input: '', feedback: null, finished: false, difficulty,
  }
}

export function revSpanGenerate(len) {
  const seq = []
  for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * 9) + 1)
  return seq
}

/** PASAT simplificado — suma los dos últimos dígitos bajo ritmo fijo */
export function initPasat(total = 40, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const digits = []
  for (let i = 0; i < total + 1; i++) digits.push(Math.floor(Math.random() * 9) + 1)
  const paceMs = Math.round((difficulty === 'experto' ? 2200 : difficulty === 'dificil' ? 2600 : 3000) * inten.pace)
  return {
    digits, index: 1, total, score: 0, paceMs, phase: 'ready',
    answer: '', feedback: null, finished: false, difficulty,
  }
}

const VIS_SHAPES = [
  { id: 'circle', sym: '●', color: '#fb7185' },
  { id: 'square', sym: '■', color: '#00f5d4' },
  { id: 'diamond', sym: '◆', color: '#eab308' },
  { id: 'triangle', sym: '▲', color: '#a78bfa' },
]

/** N-back visual — formas y colores en lugar de letras */
export function initVisNBack(level = 1, total = 20, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const n = Math.min(4, level + inten.nBump)
  const matchRate = difficulty === 'experto' ? 0.4 : difficulty === 'dificil' ? 0.36 : 0.3
  const stream = Array.from({ length: total + n }, () =>
    VIS_SHAPES[Math.floor(Math.random() * VIS_SHAPES.length)]
  )
  for (let i = n; i < stream.length; i++) {
    if (Math.random() < matchRate) stream[i] = stream[i - n]
  }
  const paceMs = Math.round(2600 * inten.pace)
  return {
    n, stream, index: 0, total, score: 0, trials: 0, paceMs,
    phase: 'ready', feedback: null, responded: false, finished: false,
  }
}

function trailLabels(variant) {
  if (variant === 'B') {
    const labels = []
    for (let i = 1; i <= 13; i++) {
      labels.push(String(i))
      labels.push(String.fromCharCode(64 + i))
    }
    return labels
  }
  return Array.from({ length: 25 }, (_, i) => String(i + 1))
}

/** Trail Making Test — A (números) o B (números + letras alternados) */
export function initTrailMaking(variant = 'A', difficulty = 'medio') {
  const labels = trailLabels(variant)
  const nodes = labels.map((label, i) => ({
    label,
    x: 8 + (i % 5) * 18 + (Math.random() * 6 - 3),
    y: 10 + Math.floor(i / 5) * 22 + (Math.random() * 6 - 3),
  }))
  for (let i = nodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nodes[i], nodes[j]] = [nodes[j], nodes[i]]
  }
  return {
    variant, nodes, current: 0, errors: 0, phase: 'ready',
    started: false, finished: false, startTime: null, elapsedMs: 0, difficulty,
  }
}

const WC_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']
const WC_SHAPES = ['●', '▲', '✚', '★']

/** Wisconsin Card Sort simplificado — 3 reglas, 4 cartas de respuesta */
export function initWisconsin(total = 24, difficulty = 'medio') {
  const rules = ['color', 'shape', 'number']
  const deck = []
  for (let i = 0; i < total + 8; i++) {
    deck.push({
      color: WC_COLORS[Math.floor(Math.random() * 4)],
      shape: WC_SHAPES[Math.floor(Math.random() * 4)],
      number: Math.floor(Math.random() * 4) + 1,
    })
  }
  const targets = [
    { color: WC_COLORS[0], shape: WC_SHAPES[0], number: 1 },
    { color: WC_COLORS[1], shape: WC_SHAPES[1], number: 2 },
    { color: WC_COLORS[2], shape: WC_SHAPES[2], number: 3 },
    { color: WC_COLORS[3], shape: WC_SHAPES[3], number: 4 },
  ]
  return {
    rules, ruleIdx: 0, categories: 0, perseverative: 0, consecutive: 0,
    deck, targets, index: 0, total, score: 0, phase: 'ready',
    feedback: null, finished: false, difficulty,
  }
}

/** Attention Network Test — cue + flanker */
export function initANT(total = 36, difficulty = 'medio') {
  const inten = getIntensity(difficulty)
  const trials = []
  for (let i = 0; i < total; i++) {
    const cue = ['none', 'center', 'spatial'][Math.floor(Math.random() * 3)]
    const dir = Math.random() < 0.5 ? 'left' : 'right'
    const congruent = Math.random() > inten.incongruent
    trials.push({ cue, dir, congruent })
  }
  const soa = Math.round((difficulty === 'experto' ? 400 : 500) * inten.pace)
  const isi = Math.round(1200 * inten.pace)
  return {
    trials, index: 0, score: 0, total, soa, isi,
    phase: 'ready', subphase: 'cue', finished: false, difficulty,
  }
}

export { STROOP_COLORS, SYMBOL_MAP, NBACK_LETTERS, VIS_SHAPES, WC_COLORS, WC_SHAPES }
