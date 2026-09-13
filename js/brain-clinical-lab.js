/** Protocolos clínicos nuevos + helpers de sesión evaluada */

import { esc } from '/js/core.js'
import {
  attachClinical, logTrial, computeMetrics, saveProtocolResult, getProtocolHistory,
  renderClinicalReport, renderPracticeBanner, renderTrialFlash, renderPaceRing,
  isPractice, beginScoredBlock, PRACTICE_TRIALS,
} from '/js/brain-metrics.js'
import { flankerArrows, VIS_SHAPES, WC_COLORS, WC_SHAPES, initVisNBack } from '/js/brain-exercises.js'
import { getExerciseGuide, updateExerciseLevel, getExerciseLevel, EXERCISES } from '/js/brain-program.js'
import { showToast } from '/js/awards.js'

export const CLINICAL_PROTOCOLS = new Set([
  'stroop', 'flanker', 'nback', 'dualnback', 'cpt', 'gonogo', 'ant', 'trail', 'wisconsin', 'visnback',
])

export function prepareClinicalState(state) {
  attachClinical(state)
  if (!state.clinicalBlock || state.clinicalBlock === 'idle') {
    state.clinicalBlock = 'practice'
    state.practiceIdx = 0
    state.practiceLeft = PRACTICE_TRIALS
  }
  return state
}

export function completeClinicalReport(exerciseId, state, render) {
  const metrics = computeMetrics(exerciseId, state.trialLog, state)
  saveProtocolResult(exerciseId, metrics)
  state.metrics = metrics
  state.reportPhase = true
  state.finished = true
  const prev = getExerciseLevel(exerciseId)
  updateExerciseLevel(exerciseId, metrics.accuracy / 100)
  const next = getExerciseLevel(exerciseId)
  if (next > prev && EXERCISES[exerciseId]?.adaptive) {
    showToast(`Nivel adaptativo: ${next}`, 0, 'mental')
  }
  render(true)
}

export function renderClinicalFinish(exerciseId, state, score, total, id, brainFinishBtn, renderProtocolDebrief) {
  if (state.reportPhase && state.metrics) {
    const hist = getProtocolHistory(exerciseId)
    const guide = getExerciseGuide(exerciseId)
    const tip = typeof guide?.debrief === 'function' ? guide.debrief(state.metrics.accuracy) : ''
    return `${renderClinicalReport(exerciseId, state.metrics, brainFinishBtn(score, total, id), hist)}
      ${tip ? `<p class="brain-protocol-debrief__tip mt-3">${esc(tip)}</p>` : ''}`
  }
  return renderProtocolDebrief(exerciseId, score, total, brainFinishBtn(score, total, id))
}

export function stroopTrialMeta(s) {
  if (isPractice(s)) return s.practiceTrials?.[s.practiceIdx]
  return s.trials?.[s.index]
}

export function stroopHudIndex(s) {
  if (isPractice(s)) return (s.practiceIdx ?? 0) + 1
  return s.index + 1
}

export function stroopHudTotal(s) {
  if (isPractice(s)) return PRACTICE_TRIALS
  return s.total
}

export function renderStroopSwatches(onAnswer) {
  return `<div class="brain-color-grid brain-color-grid--swatch">
    ${[
      { name: 'ROSA', hex: '#fb7185' },
      { name: 'TURQUESA', hex: '#00f5d4' },
      { name: 'MENTA', hex: '#2dd4bf' },
      { name: 'AMARILLO', hex: '#eab308' },
    ].map(c => `<button type="button" onclick="${onAnswer}('${c.name}')"
      class="brain-swatch-btn" style="--swatch:${c.hex}" aria-label="${c.name}" title="${c.name}"></button>`).join('')}
  </div>`
}

export function renderVisNBackGame(brainState, brainWrapper, brainHud, renderPaceRingFn, renderIntro, finishBlock) {
  const s = brainState.visnback
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-semibold mb-2">2-Back visual completado</p>
      ${finishBlock('visnback', s, s.score, s.trials || 1, 'visnback')}</div>`)
  }
  if (s.phase === 'ready') return renderIntro('visnback', 'visNbackStart()')
  const visIdx = isPractice(s) ? (s.practiceIdx || 0) : s.index
  const shape = s.stream[visIdx]
  const hudCur = isPractice(s) ? (s.practiceIdx || 0) + 1 : s.index + 1
  const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total + s.n
  const ringPct = s.pacePct ?? 100
  return brainWrapper(`<div class="text-center brain-arena">
    ${renderPracticeBanner(s)}
    ${brainHud(hudCur, hudTot, `Visual ${s.n}-Back`)}
    <div class="brain-nback-ring-wrap">
      ${renderPaceRingFn(ringPct)}
      <p class="brain-stimulus brain-stimulus--shape" style="color:${shape.color}">${shape.sym}</p>
    </div>
    <div class="brain-action-row">
      <button type="button" onclick="visNbackRespond(false)" class="btn-secondary flex-1">Pasar</button>
      <button type="button" onclick="visNbackRespond(true)" class="btn-primary flex-1 brain-btn-pulse">Coincide</button>
    </div>
    ${renderTrialFlash(s)}
  </div>`, { arena: true })
}

export function renderTrailGame(brainState, brainWrapper, renderIntro, finishBlock) {
  const s = brainState.trail
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-semibold mb-2">Trail Making completado</p>
      ${finishBlock('trail', s, s.nodes.length - s.errors, s.nodes.length, 'trail')}</div>`)
  }
  if (s.phase === 'ready') return renderIntro('trail', 'trailStart()',
    `<p class="brain-protocol-brief__note">Variante TMT-${s.variant} · ${s.nodes.length} nodos</p>`)
  const target = s.nodes[s.current]?.label
  return brainWrapper(`<div class="brain-trail-board">
    ${renderPracticeBanner(s)}
    <p class="brain-trail-target">Siguiente: <strong>${esc(target || '')}</strong> · Errores ${s.errors}</p>
    <div class="brain-trail-canvas" role="group" aria-label="Trail Making">
      ${s.nodes.map((n, i) => `<button type="button"
        class="brain-trail-node ${i < s.current ? 'is-done' : ''} ${i === s.current ? 'is-next' : ''}"
        style="left:${n.x}%;top:${n.y}%"
        onclick="trailTap(${i})" ${i !== s.current ? 'disabled' : ''}
        aria-label="${esc(n.label)}">${esc(n.label)}</button>`).join('')}
    </div>
    ${renderTrialFlash(s)}
  </div>`)
}

function wisconsinCard(card, small = false) {
  const cls = small ? 'brain-wc-card brain-wc-card--sm' : 'brain-wc-card'
  return `<div class="${cls}" style="--wc-color:${card.color}">
    <span class="brain-wc-shape">${card.shape}</span>
    <span class="brain-wc-num">${card.number}</span>
  </div>`
}

export function renderWisconsinGame(brainState, brainWrapper, brainHud, renderIntro, finishBlock) {
  const s = brainState.wisconsin
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-semibold mb-2">Wisconsin completado</p>
      ${finishBlock('wisconsin', s, s.score, s.total, 'wisconsin')}</div>`)
  }
  if (s.phase === 'ready') return renderIntro('wisconsin', 'wisconsinStart()')
  const stim = s.deck[s.index]
  const rule = ['color', 'shape', 'number'][s.ruleIdx]
  const ruleLabel = { color: 'Color', shape: 'Forma', number: 'Número' }[rule]
  const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total
  return brainWrapper(`<div class="text-center brain-arena">
    ${renderPracticeBanner(s)}
    ${brainHud(s.index + 1, hudTot, 'WCST')}
    <p class="brain-tag">Regla activa: ${ruleLabel} · Categorías ${s.categories}/3</p>
    <div class="brain-wc-targets">${s.targets.map((t, i) =>
      `<button type="button" class="brain-wc-target" onclick="wisconsinPick(${i})">${wisconsinCard(t, true)}</button>`
    ).join('')}</div>
    <p class="brain-hint">¿A qué carta pertenece este estímulo?</p>
    ${wisconsinCard(stim)}
    ${s.feedback ? `<p class="brain-feedback brain-feedback--${s.feedback}">${s.feedback === 'ok' ? '✓ Categoría' : '✗ Perseveración'}</p>` : ''}
    ${renderTrialFlash(s)}
  </div>`, { arena: true })
}

export function renderANTGame(brainState, brainWrapper, brainHud, renderIntro, finishBlock) {
  const s = brainState.ant
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-semibold mb-2">ANT completado</p>
      ${finishBlock('ant', s, s.score, s.total, 'ant')}</div>`)
  }
  if (s.phase === 'ready') return renderIntro('ant', 'antStart()')
  const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total
  if (s.subphase === 'cue') {
    const cueLabel = { none: '·', center: '+', spatial: '◆' }[s.trials[s.index].cue]
    return brainWrapper(`<div class="text-center brain-arena">
      ${renderPracticeBanner(s)}
      ${brainHud(s.index + 1, hudTot, 'ANT')}
      <p class="brain-ant-cue">${cueLabel}</p>
      <p class="brain-hint">Prepara la respuesta…</p>
    </div>`, { arena: true })
  }
  const t = s.trials[s.index]
  const trial = { dir: t.dir, congruent: t.congruent }
  const arrows = flankerArrows(trial)
  return brainWrapper(`<div class="text-center brain-arena" id="brain-ant-root">
    ${renderPracticeBanner(s)}
    ${brainHud(s.index + 1, hudTot, 'ANT')}
    <p class="brain-flanker-row" aria-hidden="true">${arrows.split('').map((ch, i) =>
      `<span class="brain-flanker-char ${i === 2 ? 'is-center' : ''}">${ch}</span>`).join('')}</p>
    <div class="brain-action-row">
      <button type="button" onclick="antAnswer('left')" class="btn-secondary flex-1 brain-dir-btn">←</button>
      <button type="button" onclick="antAnswer('right')" class="btn-secondary flex-1 brain-dir-btn">→</button>
    </div>
    ${renderTrialFlash(s)}
  </div>`, { arena: true })
}

function clearPaceTick(s, brainTimers) {
  if (s._paceTick == null) return
  clearInterval(s._paceTick)
  const i = brainTimers.indexOf(s._paceTick)
  if (i >= 0) brainTimers.splice(i, 1)
  s._paceTick = null
}

export function mountClinicalHandlers(ctx) {
  const {
    brainState, render, brainDelay, playTone, markTrial,
    renderProtocolIntro, brainFinishBtn, renderProtocolDebrief,
  } = ctx
  const { brainTimers } = ctx

  window.visNbackStart = function() {
    const s = prepareClinicalState(brainState.visnback)
    s.phase = 'play'
    s.index = 0
    s.practiceIdx = 0
    s.pacePct = 100
    render()
    visNbackScheduleTick()
  }

  function visNbackScheduleTick() {
    const s = brainState.visnback
    if (s.phase !== 'play' || s.finished) return
    clearPaceTick(s, brainTimers)
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - start
      s.pacePct = Math.max(0, 100 - (elapsed / s.paceMs) * 100)
      if (brainState.exercise === 'visnback') render()
      if (elapsed >= s.paceMs) {
        clearPaceTick(s, brainTimers)
        if (s.phase === 'play' && !s.responded) window.visNbackRespond(false)
      }
    }, 40)
    s._paceTick = tick
    brainTimers.push(tick)
  }

  window.visNbackRespond = function(saidMatch) {
    const s = brainState.visnback
    if (s.phase !== 'play' || s.responded) return
    clearPaceTick(s, brainTimers)
    const idx = isPractice(s) ? (s.practiceIdx || 0) : s.index
    const isMatch = idx >= s.n && s.stream[idx].id === s.stream[idx - s.n].id
    const correct = saidMatch === isMatch
    let type = 'cr'
    if (isMatch && saidMatch) type = 'hit'
    else if (isMatch && !saidMatch) type = 'miss'
    else if (!isMatch && saidMatch) type = 'fa'
    logTrial(s.trialLog, { correct, type, rt: 0 }, isPractice(s))
    if (correct) s.score++
    markTrial(correct)
    s.flash = correct ? 'ok' : 'bad'
    s.trials++
    s.responded = true
    if (correct) playTone(523); else playTone(200)
    render()
    brainDelay(() => {
      s.flash = null
      s.responded = false
      if (isPractice(s)) {
        s.practiceIdx = (s.practiceIdx || 0) + 1
        if (s.practiceIdx >= PRACTICE_TRIALS) {
          const fresh = initVisNBack(getExerciseLevel('visnback'), s.total, brainState.difficulty)
          beginScoredBlock(s)
          s.stream = fresh.stream
          s.n = fresh.n
          s.index = 0
          s.practiceIdx = 0
        }
        render()
        visNbackScheduleTick()
        return
      }
      s.index++
      if (s.index >= s.total + s.n) {
        completeClinicalReport('visnback', s, render)
        return
      }
      render()
      visNbackScheduleTick()
    }, correct ? 280 : 420)
  }

  window.trailStart = function() {
    const s = prepareClinicalState(brainState.trail)
    s.phase = 'play'
    s.startTime = Date.now()
    s.started = true
    render()
  }

  window.trailTap = function(i) {
    const s = brainState.trail
    if (s.finished || i !== s.current) {
      s.errors++
      s.flash = 'bad'
      playTone(200)
      logTrial(s.trialLog, { correct: false, type: 'error' }, isPractice(s))
      render()
      brainDelay(() => { s.flash = null; render() }, 300)
      return
    }
    s.flash = 'ok'
    playTone(523)
    logTrial(s.trialLog, { correct: true, type: 'hit' }, isPractice(s))
    s.current++
    if (isPractice(s) && s.current >= Math.min(4, s.nodes.length)) {
      beginScoredBlock(s)
      s.current = 0
      s.errors = 0
      s.startTime = Date.now()
      s.flash = null
      render()
      return
    }
    if (s.current >= s.nodes.length) {
      s.elapsedMs = Date.now() - (s.startTime || Date.now())
      completeClinicalReport('trail', s, render)
      return
    }
    render()
    brainDelay(() => { s.flash = null; render() }, 200)
  }

  window.wisconsinStart = function() {
    const s = prepareClinicalState(brainState.wisconsin)
    s.phase = 'play'
    render()
  }

  window.wisconsinPick = function(cardIdx) {
    const s = brainState.wisconsin
    if (s.finished || s.phase !== 'play') return
    const stim = s.deck[s.index]
    const target = s.targets[cardIdx]
    const rule = s.rules[s.ruleIdx]
    const match = target[rule] === stim[rule]
    const ok = match
    if (ok) {
      s.score++
      s.consecutive++
      s.feedback = 'ok'
      playTone(523)
      if (s.consecutive >= 6) {
        s.categories++
        s.ruleIdx = (s.ruleIdx + 1) % 3
        s.consecutive = 0
      }
    } else {
      s.perseverative++
      s.consecutive = 0
      s.feedback = 'bad'
      playTone(200)
    }
    logTrial(s.trialLog, { correct: ok, rule, perseverative: !ok }, isPractice(s))
    s.flash = ok ? 'ok' : 'bad'
    s.index++
    if (isPractice(s)) s.practiceIdx = s.index
    render()
    brainDelay(() => {
      s.feedback = null
      s.flash = null
      if (isPractice(s) && s.index >= PRACTICE_TRIALS) {
        beginScoredBlock(s)
        s.index = 0
        s.practiceIdx = 0
        s.categories = 0
        s.perseverative = 0
        s.consecutive = 0
        render()
        return
      }
      if (s.index >= s.total || s.categories >= 3) {
        completeClinicalReport('wisconsin', s, render)
        return
      }
      render()
    }, ok ? 400 : 500)
  }

  window.antStart = function() {
    const s = prepareClinicalState(brainState.ant)
    s.phase = 'play'
    s.subphase = 'cue'
    s.index = 0
    render()
    antCueThenFlanker()
  }

  function antCueThenFlanker() {
    const s = brainState.ant
    if (s.finished || s.phase !== 'play') return
    s.subphase = 'cue'
    render()
    brainDelay(() => {
      s.subphase = 'flanker'
      s.trialStart = Date.now()
      render()
      brainDelay(() => {
        if (brainState.exercise === 'ant' && s.subphase === 'flanker') antAnswer('__timeout__')
      }, s.isi)
    }, s.soa)
  }

  window.antAnswer = function(dir) {
    const s = brainState.ant
    if (s.finished || s.subphase !== 'flanker') return
    const t = s.trials[s.index]
    const rt = s.trialStart ? Date.now() - s.trialStart : null
    const ok = dir !== '__timeout__' && dir === t.dir
    if (ok) s.score++
    logTrial(s.trialLog, { correct: ok, cue: t.cue, congruent: t.congruent, rt }, isPractice(s))
    markTrial(ok, rt)
    s.flash = ok ? 'ok' : 'bad'
    if (ok) playTone(523); else playTone(200)
    render()
    brainDelay(() => {
      s.flash = null
      s.index++
      if (isPractice(s)) s.practiceIdx = s.index
      if (isPractice(s) && s.index >= PRACTICE_TRIALS) {
        beginScoredBlock(s)
        s.index = 0
        s.practiceIdx = 0
        render()
        antCueThenFlanker()
        return
      }
      if (s.index >= s.total) {
        completeClinicalReport('ant', s, render)
        return
      }
      antCueThenFlanker()
    }, ok ? 250 : 400)
  }

  const finishBlock = (exId, state, score, total, id) =>
    renderClinicalFinish(exId, state, score, total, id, brainFinishBtn, renderProtocolDebrief)

  return {
    renderVisNBackGame: () => renderVisNBackGame(
      brainState, ctx.brainWrapper, ctx.brainHud, renderPaceRing, renderProtocolIntro, finishBlock,
    ),
    renderTrailGame: () => renderTrailGame(brainState, ctx.brainWrapper, renderProtocolIntro, finishBlock),
    renderWisconsinGame: () => renderWisconsinGame(
      brainState, ctx.brainWrapper, ctx.brainHud, renderProtocolIntro, finishBlock,
    ),
    renderANTGame: () => renderANTGame(
      brainState, ctx.brainWrapper, ctx.brainHud, renderProtocolIntro, finishBlock,
    ),
    finishBlock,
    prepareClinicalState,
    completeClinicalReport: (exId, state) => completeClinicalReport(exId, state, render),
  }
}
