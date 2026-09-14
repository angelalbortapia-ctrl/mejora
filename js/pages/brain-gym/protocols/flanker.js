/** Protocolo Flanker — herencia ES6 de BaseProtocol */

import { BaseProtocol } from '/js/pages/brain-gym/base-protocol.js'
import {
  getProtocolContext, advanceTimedTrial, queueArmTrial, registerTimedHandler, unregisterTimedHandler,
} from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, isPractice, PRACTICE_TRIALS, renderPracticeBanner, renderTrialFlash,
} from '/js/brain-metrics.js'
import { flankerArrows } from '/js/brain-exercises.js'

export class FlankerProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'flanker', clinical: true, domain: 'attention' })
  }

  onInit() {
    this.bindGlobal('flankerAnswer', dir => this.answer(dir))
    registerTimedHandler('flanker', () => this.answer('__timeout__'))
  }

  onCleanup() {
    try { getProtocolContext().clearTrialDeadline() } catch { /* contexto liberado */ }
    unregisterTimedHandler('flanker')
  }

  currentTrial(s) {
    return isPractice(s) ? s.practiceTrials?.[s.practiceIdx || 0] : s.trials[s.index]
  }

  patchUI() {
    const { brainState, syncBrainLabChrome } = getProtocolContext()
    const s = brainState.flanker
    if (!s || s.finished || brainState.protocolBrief === 'flanker') return false
    const row = document.querySelector('.brain-flanker-row')
    if (!row) return false
    const t = this.currentTrial(s)
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

  answer(dir) {
    const {
      brainState, clearTrialDeadline, markTrial, playTone, ensureClinicalLab,
    } = getProtocolContext()
    if (brainState._trialBusy) return
    clearTrialDeadline()
    const s = brainState.flanker
    if (s.finished) return
    const t = this.currentTrial(s)
    if (!t) return
    const rt = brainState.trialStart ? Date.now() - brainState.trialStart : null
    const ok = dir !== '__timeout__' && dir === t.dir
    logTrial(s.trialLog, { correct: ok, congruent: t.congruent, rt }, isPractice(s))
    s.flash = ok ? 'ok' : 'bad'
    if (ok) { s.score++; playTone(523) } else playTone(200)
    markTrial(ok, rt)
    brainState.trialStart = null
    advanceTimedTrial(() => this.patchUI(), () => {
      if (this.advancePractice(s, () => queueArmTrial('flanker'), () => queueArmTrial('flanker'))) return
      s.index++
      if (s.index >= s.total) {
        ensureClinicalLab().completeClinicalReport('flanker', s)
        return
      }
      queueArmTrial('flanker')
    })
  }

  render() {
    const { brainState, brainWrapper, brainHud, ensureClinicalLab } = getProtocolContext()
    const s = brainState.flanker
    const lab = ensureClinicalLab()
    if (s.finished) {
      return brainWrapper(`<div class="text-center">
        <p class="font-semibold mb-2">Flanker completado</p>
        ${lab.finishBlock('flanker', s, s.score, s.total, 'flanker')}</div>`)
    }
    const t = this.currentTrial(s)
    if (!t) return brainWrapper('<p class="text-muted">Cargando…</p>')
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
  }
}

export function createFlankerProtocol() {
  return new FlankerProtocol()
}

export function patchFlankerUI() {
  return new FlankerProtocol().patchUI()
}
