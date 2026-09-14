/** Protocolo Stroop — herencia ES6 de BaseProtocol */

import { BaseProtocol } from '/js/pages/brain-gym/base-protocol.js'
import {
  getProtocolContext, advanceTimedTrial, queueArmTrial, registerTimedHandler, unregisterTimedHandler,
} from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, isPractice, renderPracticeBanner, renderTrialFlash,
} from '/js/brain-metrics.js'
import {
  renderStroopSwatches, stroopTrialMeta, stroopHudIndex, stroopHudTotal,
} from '/js/brain-clinical-lab.js'

export class StroopProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'stroop', clinical: true, domain: 'inhibition' })
  }

  onInit() {
    this.bindGlobal('stroopAnswer', name => this.answer(name))
    registerTimedHandler('stroop', () => this.answer('__timeout__'))
  }

  onCleanup() {
    try { getProtocolContext().clearTrialDeadline() } catch { /* contexto liberado */ }
    unregisterTimedHandler('stroop')
  }

  patchUI() {
    const { brainState, syncBrainLabChrome } = getProtocolContext()
    const s = brainState.stroop
    if (!s || s.finished || brainState.protocolBrief === 'stroop') return false
    const word = document.querySelector('.brain-stroop-word')
    if (!word) return false
    const t = stroopTrialMeta(s)
    if (!t) return false
    word.textContent = t.word
    word.style.setProperty('--stroop-ink', t.ink)
    const tag = document.querySelector('.brain-tag')
    if (tag) {
      tag.textContent = t.congruent ? 'Congruente' : 'Conflicto'
      tag.className = `brain-tag ${t.congruent ? 'brain-tag--ok' : 'brain-tag--warn'}`
    }
    const fill = document.querySelector('.brain-lab-metrics__fill')
    const val = document.querySelector('.brain-lab-metrics__value')
    const cur = stroopHudIndex(s)
    const tot = stroopHudTotal(s)
    if (fill) fill.style.width = `${Math.round((cur / tot) * 100)}%`
    if (val) val.textContent = `${cur}/${tot}`
    syncBrainLabChrome()
    return true
  }

  answer(name) {
    const {
      brainState, clearTrialDeadline, markTrial, playTone, ensureClinicalLab,
    } = getProtocolContext()
    if (brainState._trialBusy) return
    clearTrialDeadline()
    const s = brainState.stroop
    if (s.finished) return
    const t = stroopTrialMeta(s)
    if (!t) return
    const rt = brainState.trialStart ? Date.now() - brainState.trialStart : null
    const ok = name !== '__timeout__' && name === t.correct
    logTrial(s.trialLog, { correct: ok, congruent: t.congruent, rt }, isPractice(s))
    s.flash = ok ? 'ok' : 'bad'
    if (ok) { s.score++; playTone(523) } else playTone(200)
    markTrial(ok, rt)
    brainState.trialStart = null
    advanceTimedTrial(() => this.patchUI(), () => {
      if (this.advancePractice(s, () => queueArmTrial('stroop'), () => queueArmTrial('stroop'))) return
      s.index++
      if (s.index >= s.total) {
        ensureClinicalLab().completeClinicalReport('stroop', s)
        return
      }
      queueArmTrial('stroop')
    })
  }

  render() {
    const { brainState, brainWrapper, brainHud, ensureClinicalLab } = getProtocolContext()
    const s = brainState.stroop
    const lab = ensureClinicalLab()
    if (s.finished) {
      return brainWrapper(`<div class="text-center">
        <p class="font-semibold mb-2">Stroop completado</p>
        ${lab.finishBlock('stroop', s, s.score, s.total, 'stroop')}</div>`)
    }
    const t = stroopTrialMeta(s)
    if (!t) return brainWrapper('<p class="text-muted">Cargando…</p>')
    const conflict = t.congruent ? 'Congruente' : 'Conflicto'
    return brainWrapper(`<div class="text-center brain-arena" id="brain-stroop-root">
      ${renderPracticeBanner(s)}
      ${brainHud(stroopHudIndex(s), stroopHudTotal(s), 'Stroop')}
      <p class="brain-tag ${t.congruent ? 'brain-tag--ok' : 'brain-tag--warn'}">${conflict}</p>
      <p class="brain-stroop-word" style="--stroop-ink:${t.ink}">${t.word}</p>
      <p class="brain-hint">Tinta, no palabra</p>
      ${renderStroopSwatches('stroopAnswer')}
      ${renderTrialFlash(s)}
    </div>`, { arena: true })
  }
}

export function createStroopProtocol() {
  return new StroopProtocol()
}

export function patchStroopUI() {
  const p = new StroopProtocol()
  return p.patchUI()
}
