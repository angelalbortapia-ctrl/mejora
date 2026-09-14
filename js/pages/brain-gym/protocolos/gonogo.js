/** Protocolo Go/No-Go — BaseProtocol completo */

import { createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, beginScoredBlock, PRACTICE_TRIALS, isPractice,
  renderPracticeBanner, renderTrialFlash,
} from '/js/brain-metrics.js'

function gonogoNext() {
  const { brainState, brainTimers, render, ensureClinicalLab } = getProtocolContext()
  const s = brainState.gonogo
  s.index++
  if (s.index >= s.total) {
    if (isPractice(s)) {
      beginScoredBlock(s)
      s.trials = s.fullTrials
      s.total = s.fullTrials.length
      s.index = -1
      s.score = 0
      s.flash = null
      gonogoNext()
      return
    }
    ensureClinicalLab().completeClinicalReport('gonogo', s)
    return
  }
  s.waiting = true
  render(true)
  const waitMs = s.waitMs || 600
  const nogoMs = s.nogoMs || 1200
  brainTimers.push(setTimeout(() => {
    s.waiting = false
    render(true)
    const t = s.trials[s.index]
    if (t.type === 'nogo') {
      brainTimers.push(setTimeout(() => {
        if (s.index < s.total && !s.finished && brainState.exercise === 'gonogo') {
          logTrial(s.trialLog, { correct: true, type: 'nogo_ok' }, isPractice(s))
          s.score++
          getProtocolContext().markTrial(true)
          getProtocolContext().playTone(523)
          gonogoNext()
        }
      }, nogoMs))
    }
  }, waitMs))
}

function gonogoTap() {
  const { brainState, markTrial, playTone } = getProtocolContext()
  const s = brainState.gonogo
  const t = s.trials[s.index]
  const ok = t.type === 'go'
  logTrial(s.trialLog, { correct: ok, type: ok ? 'go_hit' : 'commission' }, isPractice(s))
  s.flash = ok ? 'ok' : 'bad'
  if (ok) { s.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  gonogoNext()
}

function gonogoManualStart() {
  const { brainState, ensureClinicalLab } = getProtocolContext()
  const s = brainState.gonogo
  if (s.started) return
  ensureClinicalLab().prepareClinicalState(s)
  if (isPractice(s)) {
    s.trials = s.practiceTrials
    s.total = PRACTICE_TRIALS
  }
  s.started = true
  s.index = -1
  gonogoNext()
}

function mountGoNoGoGlobals() {
  if (!window.gonogoTap) window.gonogoTap = gonogoTap
  if (!window.gonogoManualStart) window.gonogoManualStart = gonogoManualStart
  if (!window.gonogoStart) window.gonogoStart = gonogoManualStart
}

export function createGoNoGoProtocol() {
  mountGoNoGoGlobals()
  return createProtocol({
    id: 'gonogo',
    clinical: true,
    domain: 'inhibition',
    render() {
      const {
        brainState, brainWrapper, brainHud, ensureClinicalLab, renderProtocolIntro,
      } = getProtocolContext()
      const s = brainState.gonogo
      const lab = ensureClinicalLab()
      if (s.finished) {
        return brainWrapper(`<div class="text-center">
          <p class="font-semibold mb-2">Go/No-Go completado</p>
          ${lab.finishBlock('gonogo', s, s.score, s.total, 'gonogo')}</div>`)
      }
      if (!s.started) return renderProtocolIntro('gonogo', 'gonogoManualStart()')
      if (s.waiting) return brainWrapper('<div class="text-center py-12"><p class="text-muted">Prepárate...</p></div>')
      const t = s.trials[s.index]
      const isGo = t.type === 'go'
      return brainWrapper(`<div class="text-center brain-arena">
        ${renderPracticeBanner(s)}
        ${brainHud(s.index + 1, s.total, 'Go / No-Go')}
        <div class="brain-gonogo-signal ${isGo ? 'is-go' : 'is-nogo'}">
          <span class="brain-gonogo-ring"></span>
          <span class="brain-gonogo-label">${isGo ? 'GO' : 'NO-GO'}</span>
        </div>
        ${isGo
          ? '<button type="button" onclick="gonogoTap()" class="btn-primary w-full py-4 brain-btn-pulse">¡Tocar!</button>'
          : '<p class="brain-hint">Aguanta — no toques</p>'}
        ${renderTrialFlash(s)}
      </div>`, { arena: true })
    },
    destroy() {
      delete window.gonogoTap
      delete window.gonogoManualStart
      delete window.gonogoStart
    },
  })
}
