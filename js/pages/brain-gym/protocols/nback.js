/** Protocolo N-back — herencia ES6 de BaseProtocol */

import { BaseProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'
import {
  logTrial, isPractice, PRACTICE_TRIALS, renderPracticeBanner, renderTrialFlash, renderPaceRing,
} from '/js/brain-metrics.js'
import { initNBack } from '/js/brain-exercises.js'
import { getExerciseLevel } from '/js/brain-program.js'

export class NBackProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'nback', clinical: true, domain: 'working_memory' })
    this._paceTick = null
  }

  onInit() {
    this.bindGlobal('nbackStart', () => this.start())
    this.bindGlobal('nbackRespond', saidMatch => this.respond(saidMatch))
  }

  onCleanup() {
    this.clearPaceTick()
  }

  clearPaceTick() {
    if (this._paceTick == null) return
    clearInterval(this._paceTick)
    const { brainTimers } = getProtocolContext()
    const i = brainTimers.indexOf(this._paceTick)
    if (i >= 0) brainTimers.splice(i, 1)
    this._paceTick = null
  }

  schedulePaceTick() {
    const { brainState, render } = getProtocolContext()
    const s = brainState.nback
    if (s.phase !== 'play' || s.finished) return
    this.clearPaceTick()
    const start = Date.now()
    this._paceTick = this.scheduleInterval(() => {
      const elapsed = Date.now() - start
      s.pacePct = Math.max(0, 100 - (elapsed / s.paceMs) * 100)
      if (brainState.exercise === 'nback') render()
      if (elapsed >= s.paceMs) {
        this.clearPaceTick()
        if (s.phase === 'play' && !s.responded && brainState.exercise === 'nback') this.respond(false)
      }
    }, 40)
  }

  respond(saidMatch) {
    const {
      brainState, render, markTrial, playTone, ensureClinicalLab,
    } = getProtocolContext()
    const s = brainState.nback
    if (s.phase !== 'play' || s.responded) return
    this.clearPaceTick()
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
    this.scheduleTimeout(() => {
      s.feedback = null
      s.flash = null
      s.responded = false
      if (isPractice(s)) {
        s.practiceIdx = (s.practiceIdx || 0) + 1
        if (s.practiceIdx >= PRACTICE_TRIALS) {
          const fresh = initNBack(getExerciseLevel('nback'), s.total, brainState.difficulty)
          this.finishPracticeBlock(s, () => {
            s.stream = fresh.stream
            s.n = fresh.n
          })
        }
        render()
        this.schedulePaceTick()
        return
      }
      s.index++
      if (s.index >= s.total + s.n) {
        ensureClinicalLab().completeClinicalReport('nback', s)
        return
      }
      render()
      this.schedulePaceTick()
    }, correct ? 280 : 420)
  }

  start() {
    const { brainState, render, ensureClinicalLab } = getProtocolContext()
    const s = brainState.nback
    ensureClinicalLab().prepareClinicalState(s)
    s.phase = 'play'
    s.index = 0
    s.practiceIdx = 0
    render()
    this.schedulePaceTick()
  }

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
  }
}

export function createNBackProtocol() {
  return new NBackProtocol()
}
