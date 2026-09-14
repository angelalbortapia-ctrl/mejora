/** Protocolo Flanker — BaseProtocol completo */

import { createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import {
  getProtocolContext, advanceTimedTrial, queueArmTrial, registerTimedHandler,
} from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, beginScoredBlock, PRACTICE_TRIALS, isPractice,
  renderPracticeBanner, renderTrialFlash,
} from '/js/brain-metrics.js'
import { flankerArrows } from '/js/brain-exercises.js'

function patchFlankerUI() {
  const { brainState, syncBrainLabChrome } = getProtocolContext()
  const s = brainState.flanker
  if (!s || s.finished || brainState.protocolBrief === 'flanker') return false
  const row = document.querySelector('.brain-flanker-row')
  if (!row) return false
  const t = isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
  if (!t) return false
  row.innerHTML = flankerArrows(t).split('').map((ch, i) =>
    `<span class="brain-flanker-char ${i === 2 ? 'is-center' : ''}">${ch}</span>`).join('')
  const tag = document.querySelector('.brain-tag')
  if (tag) {
    tag.textContent = t.congruent ? 'Alineadas' : 'Interferencia'
    tag.className = `brain-tag ${t.congruent ? 'brain-tag--ok' : 'brain-tag--warn'}`
  }
  const fill = document.querySelector('.brain-lab-metrics__fill')
  const val = document.querySelector('.brain-lab-metrics__value')
  const cur = isPractice(s) ? (s.practiceIdx || 0) + 1 : s.index + 1
  const tot = isPractice(s) ? PRACTICE_TRIALS : s.total
  if (fill) fill.style.width = `${Math.round((cur / tot) * 100)}%`
  if (val) val.textContent = `${cur}/${tot}`
  syncBrainLabChrome()
  return true
}

function flankerAnswer(dir) {
  const {
    brainState, clearTrialDeadline, markTrial, playTone, ensureClinicalLab,
  } = getProtocolContext()
  if (brainState._trialBusy) return
  clearTrialDeadline()
  const s = brainState.flanker
  if (s.finished) return
  const t = isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
  if (!t) return
  const rt = brainState.trialStart ? Date.now() - brainState.trialStart : null
  const ok = dir !== '__timeout__' && dir === t.dir
  logTrial(s.trialLog, { correct: ok, congruent: t.congruent, rt }, isPractice(s))
  s.flash = ok ? 'ok' : 'bad'
  if (ok) { s.score++; playTone(523) } else playTone(200)
  markTrial(ok, rt)
  brainState.trialStart = null
  advanceTimedTrial(patchFlankerUI, () => {
    if (isPractice(s)) {
      s.practiceIdx = (s.practiceIdx || 0) + 1
      if (s.practiceIdx >= PRACTICE_TRIALS) {
        beginScoredBlock(s)
        s.practiceIdx = 0
        s.index = 0
        queueArmTrial('flanker')
        return
      }
      queueArmTrial('flanker')
      return
    }
    s.index++
    if (s.index >= s.total) {
      ensureClinicalLab().completeClinicalReport('flanker', s)
      return
    }
    queueArmTrial('flanker')
  })
}

function mountFlankerGlobals() {
  if (!window.flankerAnswer) window.flankerAnswer = flankerAnswer
  registerTimedHandler('flanker', () => flankerAnswer('__timeout__'))
}

export function createFlankerProtocol() {
  mountFlankerGlobals()
  return createProtocol({
    id: 'flanker',
    clinical: true,
    domain: 'attention',
    render() {
      const { brainState, brainWrapper, brainHud, ensureClinicalLab } = getProtocolContext()
      const s = brainState.flanker
      const lab = ensureClinicalLab()
      if (s.finished) {
        return brainWrapper(`<div class="text-center">
          <p class="font-semibold mb-2">Flanker completado</p>
          ${lab.finishBlock('flanker', s, s.score, s.total, 'flanker')}</div>`)
      }
      const t = isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
      const arrows = flankerArrows(t)
      const hudCur = isPractice(s) ? (s.practiceIdx || 0) + 1 : s.index + 1
      const hudTot = isPractice(s) ? PRACTICE_TRIALS : s.total
      return brainWrapper(`<div class="text-center brain-arena" id="brain-flanker-root">
        ${renderPracticeBanner(s)}
        ${brainHud(hudCur, hudTot, 'Flanker')}
        <p class="brain-tag ${t.congruent ? 'brain-tag--ok' : 'brain-tag--warn'}">${t.congruent ? 'Alineadas' : 'Interferencia'}</p>
        <p class="brain-flanker-row" aria-hidden="true">${arrows.split('').map((ch, i) => `<span class="brain-flanker-char ${i === 2 ? 'is-center' : ''}">${ch}</span>`).join('')}</p>
        <div class="brain-action-row">
          <button type="button" onclick="flankerAnswer('left')" class="btn-secondary flex-1 brain-dir-btn">←</button>
          <button type="button" onclick="flankerAnswer('right')" class="btn-secondary flex-1 brain-dir-btn">→</button>
        </div>
        ${renderTrialFlash(s)}
      </div>`, { arena: true })
    },
    destroy() { delete window.flankerAnswer },
  })
}

export { patchFlankerUI }
