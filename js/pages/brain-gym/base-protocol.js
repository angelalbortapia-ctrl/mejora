/** Clase base abstracta para protocolos clínicos del laboratorio cerebral */

import { computeMetrics } from '/js/brain-metrics.js'
import {
  beginScoredBlock, isPractice, PRACTICE_TRIALS,
} from '/js/brain-metrics.js'

/**
 * @typedef {object} ProtocolContext
 * @property {object} brainState
 * @property {Function} render
 * @property {Function} brainWrapper
 * @property {Function} brainHud
 * @property {Function} brainDelay
 * @property {Function} playTone
 * @property {Function} markTrial
 * @property {Array} brainTimers
 * @property {Function} clearTrialDeadline
 */

export class BaseProtocol {
  /**
   * @param {object} spec
   * @param {string} spec.id
   * @param {boolean} [spec.clinical]
   * @param {string} [spec.domain]
   */
  constructor(spec) {
    if (!spec?.id) throw new Error('BaseProtocol requiere id')
    this.id = spec.id
    this.clinical = spec.clinical ?? false
    this.domain = spec.domain ?? null
    this._ctx = null
    this._container = null
    this._mounted = false
    /** @type {Array<number>} */
    this._timers = []
    /** @type {Array<string>} */
    this._globals = []
  }

  /** @param {ProtocolContext} ctx @param {HTMLElement|null} container */
  init(ctx, container = null) {
    this._ctx = ctx
    this._container = container
    if (!this._mounted) {
      this._mounted = true
      this.onInit?.()
    }
    return this
  }

  /** Hook opcional tras init */
  onInit() {}

  requireCtx() {
    if (!this._ctx) throw new Error(`${this.id}: contexto no inicializado — llama init()`)
    return this._ctx
  }

  get ctx() {
    return this._ctx
  }

  get brainState() {
    return this.requireCtx().brainState
  }

  get state() {
    return this.brainState[this.id]
  }

  /** Registra timeout/interval y lo rastrea para cleanup */
  scheduleTimeout(fn, ms) {
    const id = setTimeout(fn, ms)
    this._trackTimer(id)
    return id
  }

  scheduleInterval(fn, ms) {
    const id = setInterval(fn, ms)
    this._trackTimer(id)
    return id
  }

  _trackTimer(id) {
    this._timers.push(id)
    if (this._ctx?.brainTimers) this._ctx.brainTimers.push(id)
  }

  clearTimers() {
    this._timers.forEach(t => {
      clearTimeout(t)
      clearInterval(t)
    })
    this._timers = []
  }

  /** Expone handler en window y lo rastrea para cleanup */
  bindGlobal(name, fn) {
    window[name] = fn
    this._globals.push(name)
  }

  unbindGlobals() {
    this._globals.forEach(name => { delete window[name] })
    this._globals = []
  }

  /** Avanza bloque de práctica → evaluado */
  finishPracticeBlock(s, onScoredStart) {
    beginScoredBlock(s)
    s.practiceIdx = 0
    s.index = 0
    onScoredStart?.()
  }

  /** Incrementa práctica; retorna true si terminó el bloque de práctica */
  advancePractice(s, onContinue, onScoredStart) {
    if (!isPractice(s)) return false
    s.practiceIdx = (s.practiceIdx || 0) + 1
    if (s.practiceIdx >= PRACTICE_TRIALS) {
      this.finishPracticeBlock(s, onScoredStart)
      return true
    }
    onContinue?.()
    return true
  }

  /** Renderiza HTML del protocolo (obligatorio en subclases) */
  render() {
    throw new Error(`${this.id}: render() no implementado`)
  }

  /** Maneja input del usuario (teclado/touch) — opcional */
  handleInput(_event) {}

  /** Métricas al terminar sesión */
  computeMetrics(state) {
    return computeMetrics(this.id, state?.trialLog, state)
  }

  /** Limpieza de timers/listeners — obligatorio al cambiar de ruta */
  cleanup() {
    this.clearTimers()
    this.unbindGlobals()
    this.onCleanup?.()
    this._ctx = null
    this._container = null
    this._mounted = false
  }

  /** Hook opcional antes de liberar contexto */
  onCleanup() {}

  /** @deprecated Usar cleanup() */
  destroy() {
    this.cleanup()
  }
}

/** Compatibilidad con specs planos legacy */
export function createProtocol(spec) {
  const base = new BaseProtocol(spec)
  if (spec.render) base.render = spec.render.bind(base)
  if (spec.handleInput) base.handleInput = spec.handleInput.bind(base)
  if (spec.computeMetrics) base.computeMetrics = spec.computeMetrics.bind(base)
  if (spec.onStart) base.onStart = spec.onStart.bind(base)
  if (spec.cleanup) base.cleanup = spec.cleanup.bind(base)
  else if (spec.destroy) base.cleanup = spec.destroy.bind(base)
  base.destroy = () => base.cleanup()
  return base
}
