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

export function initNBack(level = 1, total = 20) {
  const n = Math.min(3, level)
  const stream = Array.from({ length: total + n }, () =>
    NBACK_LETTERS[Math.floor(Math.random() * NBACK_LETTERS.length)]
  )
  for (let i = n; i < stream.length; i++) {
    if (Math.random() < 0.3) stream[i] = stream[i - n]
  }
  return {
    n, stream, index: 0, total, score: 0, trials: 0,
    phase: 'ready', feedback: null, responded: false, finished: false,
  }
}

export function initStroop(total = 16) {
  const trials = []
  for (let i = 0; i < total; i++) {
    const word = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    let ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    while (ink.name === word.name && Math.random() < 0.7) {
      ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    }
    trials.push({ word: word.name, ink: ink.hex, correct: ink.name, congruent: word.name === ink.name })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false }
}

export function initFlanker(total = 20) {
  const trials = []
  for (let i = 0; i < total; i++) {
    const dir = Math.random() < 0.5 ? 'left' : 'right'
    const congruent = Math.random() < 0.5
    trials.push({ dir, congruent })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false }
}

export function initSwitching(total = 24) {
  const trials = []
  for (let i = 0; i < total; i++) {
    const rule = i % 2 === 0 ? 'parity' : 'magnitude'
    const num = Math.floor(Math.random() * 9) + 1
    trials.push({ rule, num })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, ruleLabel: 'parity' }
}

export function initGoNoGo(total = 30) {
  const trials = []
  for (let i = 0; i < total; i++) {
    trials.push({ type: Math.random() < 0.7 ? 'go' : 'nogo' })
  }
  return { trials, index: 0, score: 0, total, feedback: null, finished: false, waiting: false }
}

export function initCorsi(level = 2) {
  return {
    level, sequence: [], userInput: [], phase: 'ready',
    score: 0, rounds: 0, maxRounds: 8, finished: false, highlight: -1,
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

export { STROOP_COLORS, SYMBOL_MAP, NBACK_LETTERS }
