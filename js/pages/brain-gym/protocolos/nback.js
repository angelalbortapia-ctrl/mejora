/** Protocolo N-back — BaseProtocol completo */

import { createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, beginScoredBlock, PRACTICE_TRIALS, isPractice,
  renderPracticeBanner, renderTrialFlash, renderPaceRing,
} from '/js/brain-metrics.js'
import { initNBack } from '/js/brain-exercises.js'
import { getExerciseLevel } from '/js/brain-program.js'

function clearNbackPaceTick(s) {
  const { brainTimers } = getProtocolContext()
  if (s._paceTick == null) return
  clearInterval(s._paceTick)
  const i = brainTimers.indexOf(s._paceTick)
  if (i >= 0) brainTimers.splice(i, 1)
  s._paceTick = null
}

function nbackScheduleTick() {
  const { brainState, brainTimers, render } = getProtocolContext()
  const s = brainState.nback
  if (s.phase !== 'play' || s.finished) return
  clearNbackPaceTick(s)
  const start = Date.now()
  const tick = setInterval(() => {
    const elapsed = Date.now() - start
    s.pacePct = Math.max(0, 100 - (elapsed / s.paceMs) * 100)
    if (brainState.exercise === 'nback') render()
    if (elapsed >= s.paceMs) {
      clearNbackPaceTick(s)
      if (s.phase === 'play' && !s.responded && brainState.exercise === 'nback') nbackRespond(false)
    }
  }, 40)
  s._paceTick = tick
  brainTimers.push(tick)
}

function nbackRespond(saidMatch) {
  const {
    brainState, brainTimers, render, markTrial, playTone, ensureClinicalLab,
  } = getProtocolContext()
  const s = brainState.nback
  if (s.phase !== 'play' || s.responded) return
  clearNbackPaceTick(s)
  const idx = isPractice(s) ? (s.practiceIdx || 0) : s.index
  const isMatch = idx >= s.n && s.stream[idx] === s.stream[idx - s.n]
  const correct = saidMatch === isMatch
  let type = 'cr'
  if (isMatch && saidMatch) type = 'hit'
  else if (isMatch && !saidMatch) type = 'miss'
  else if (!isMatch && saidMatch) type = 'fa'
  logTrial(s.trialLog, { correct, type }, isPractice(s))
  if (correct) s.score++
  markTrial(correct)
  s.flash = correct ? 'ok' : 'bad'
  if (correct) { s.feedback = 'ok'; playTone(523) } else { s.feedback = 'bad'; playTone(200) }
  s.trials++
  s.responded = true
  render()
  brainTimers.push(setTimeout(() => {
    s.feedback = null
    s.flash = null
    s.responded = false
    if (isPractice(s)) {
      s.practiceIdx = (s.practiceIdx || 0) + 1
      if (s.practiceIdx >= PRACTICE_TRIALS) {
        const fresh = initNBack(getExerciseLevel('nback'), s.total, brainState.difficulty)
        beginScoredBlock(s)
        s.stream = fresh.stream
        s.n = fresh.n
        s.index = 0
        s.practiceIdx = 0
      }
      render()
      nbackScheduleTick()
      return
    }
    s.index++
    if (s.index >= s.total + s.n) {
      ensureClinicalLab().completeClinicalReport('nback', s)
      return
    }
    render()
    nbackScheduleTick()
  }, correct ? 280 : 420))
}

function nbackStart() {
  const { brainState, render, ensureClinicalLab } = getProtocolContext()
  const s = brainState.nback
  ensureClinicalLab().prepareClinicalState(s)
  s.phase = 'play'
  s.index = 0
  s.practiceIdx = 0
  render()
  nbackScheduleTick()
}

function mountNBackGlobals() {
  if (!window.nbackStart) window.nbackStart = nbackStart
  if (!window.nbackRespond) window.nbackRespond = nbackRespond
}

export function createNBackProtocol() {
  mountNBackGlobals()
  return createProtocol({
    id: 'nback',
    clinical: true,
    domain: 'working_memory',
    render() {
      const {
        brainState, brainWrapper, brainHud, ensureClinicalLab, renderProtocolIntro,
      } = getProtocolContext()
      const s = brainState.nback
      const lab = ensureClinicalLab()
      if (s.finished) {
        return brainWrapper(`<div class="text-center">
          <p class="text-2xl mb-2">🔁</p><p class="font-semibold mb-2">${s.n}-Back completado</p>
          ${lab.finishBlock('nback', s, s.score, s.trials || 1, 'nback')}</div>`)
      }
      if (s.phase === 'ready') {
        return renderProtocolIntro('nback', 'nbackStart()',
          `<p class="brain-protocol-brief__note">Nivel ${s.n} · ~${Math.round(s.paceMs / 100) / 10}s por letra · ${PRACTICE_TRIALS} trials de práctica</p>`)
      }
      const nIdx = isPractice(s) ? (s.practiceIdx || 0) : s.index
      const letter = s.stream[nIdx]
      const hudCur = nIdx + 1
      const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total + s.n
      return brainWrapper(`<div class="text-center brain-arena">
        ${renderPracticeBanner(s)}
        ${brainHud(hudCur, hudTot, `${s.n}-Back`)}
        <div class="brain-nback-ring-wrap">
          ${renderPaceRing(s.pacePct ?? 100)}
          <p class="brain-stimulus brain-stimulus--letter">${letter}</p>
        </div>
        <div class="brain-action-row">
          <button onclick="nbackRespond(false)" class="btn-secondary flex-1">Pasar</button>
          <button onclick="nbackRespond(true)" class="btn-primary flex-1 brain-btn-pulse">¡Coincide!</button>
        </div>
        ${renderTrialFlash(s)}
        ${s.feedback ? `<p class="brain-feedback brain-feedback--${s.feedback === 'ok' ? 'ok' : 'bad'}">${s.feedback === 'ok' ? '✓ Precisión' : '✗ Error'}</p>` : ''}
      </div>`, { arena: true })
    },
    cleanup() {
      try {
        const { brainState } = getProtocolContext()
        if (brainState.nback) clearNbackPaceTick(brainState.nback)
      } catch { /* contexto ya liberado */ }
      delete window.nbackStart
      delete window.nbackRespond
    },
  })
}
