/** Protocolo CPT-X — BaseProtocol completo */

import { createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, beginScoredBlock, PRACTICE_TRIALS, isPractice,
  renderPracticeBanner, renderTrialFlash,
} from '/js/brain-metrics.js'
import { initCPT } from '/js/brain-exercises.js'

function cptScheduleTick() {
  const { brainState, brainTimers, render, ensureClinicalLab } = getProtocolContext()
  const s = brainState.cpt
  if (s.phase !== 'play' || s.finished) return
  brainTimers.push(setTimeout(() => {
    if (brainState.exercise !== 'cpt' || s.phase !== 'play') return
    const t = isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
    if (!s.responded && t?.isTarget) {
      s.misses++
      logTrial(s.trialLog, { correct: false, type: 'miss', isTarget: true }, isPractice(s))
      s.flash = 'bad'
    }
    s.responded = false
    if (isPractice(s)) {
      s.practiceIdx = (s.practiceIdx || 0) + 1
      if (s.practiceIdx >= PRACTICE_TRIALS) {
        beginScoredBlock(s)
        s.practiceIdx = 0
        s.index = 0
        s.hits = 0
        s.misses = 0
        s.falseAlarms = 0
        render()
        cptScheduleTick()
        return
      }
      render()
      cptScheduleTick()
      return
    }
    s.index++
    if (s.index >= s.total) {
      ensureClinicalLab().completeClinicalReport('cpt', s)
      return
    }
    render()
    cptScheduleTick()
  }, s.isi))
}

function cptStart() {
  const { brainState, render, ensureClinicalLab } = getProtocolContext()
  const s = brainState.cpt
  ensureClinicalLab().prepareClinicalState(s)
  s.practiceTrials = initCPT(PRACTICE_TRIALS, s.difficulty || brainState.difficulty).trials
  s.phase = 'play'
  s.index = 0
  s.practiceIdx = 0
  render()
  cptScheduleTick()
}

function cptRespond() {
  const { brainState, render, playTone } = getProtocolContext()
  const s = brainState.cpt
  if (s.phase !== 'play' || s.responded) return
  const t = isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
  s.responded = true
  const ok = t.isTarget
  logTrial(s.trialLog, { correct: ok, type: ok ? 'hit' : 'fa', isTarget: t.isTarget }, isPractice(s))
  s.flash = ok ? 'ok' : 'bad'
  if (t.isTarget) { s.hits++; playTone(523) }
  else { s.falseAlarms++; playTone(200) }
  render()
}

function mountCPTGlobals() {
  if (!window.cptStart) window.cptStart = cptStart
  if (!window.cptRespond) window.cptRespond = cptRespond
}

export function createCPTProtocol() {
  mountCPTGlobals()
  return createProtocol({
    id: 'cpt',
    clinical: true,
    domain: 'attention',
    render() {
      const {
        brainState, brainWrapper, brainHud, ensureClinicalLab, renderProtocolIntro,
      } = getProtocolContext()
      const s = brainState.cpt
      const lab = ensureClinicalLab()
      if (s.finished) {
        const totalTargets = s.trials.filter(t => t.isTarget).length
        return brainWrapper(`<div class="text-center">
          <p class="font-display text-xl font-semibold mb-2">CPT-X completado</p>
          <p class="text-sm text-muted mb-2">Aciertos ${s.hits}/${totalTargets} · Omisiones ${s.misses} · Falsas alarmas ${s.falseAlarms}</p>
          ${lab.finishBlock('cpt', s, s.hits, totalTargets || 1, 'cpt')}</div>`)
      }
      if (s.phase === 'ready') {
        return renderProtocolIntro('cpt', 'cptStart()',
          `<p class="brain-protocol-brief__note">${s.total} estímulos · ~${Math.round(s.isi / 100) / 10}s cada uno · objetivo: <span class="brain-cpt-target">X</span></p>`)
      }
      const t = s.trials[s.index]
      const hudCur = isPractice(s) ? (s.practiceIdx || 0) + 1 : s.index + 1
      const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total
      return brainWrapper(`<div class="text-center brain-arena">
        ${renderPracticeBanner(s)}
        ${brainHud(hudCur, hudTot, 'CPT-X')}
        <p class="brain-cpt-letter is-enter ${t.isTarget ? 'is-target' : ''}" key="cpt-${s.index}">${t.letter}</p>
        <button type="button" onclick="cptRespond()" class="btn-primary w-full py-4">Responder (solo X)</button>
        ${renderTrialFlash(s)}
      </div>`, { arena: true })
    },
    destroy() {
      delete window.cptStart
      delete window.cptRespond
    },
  })
}
