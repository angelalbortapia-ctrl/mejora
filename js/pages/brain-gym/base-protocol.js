/** Contrato Strategy para protocolos del laboratorio cerebral */

import { computeMetrics } from '/js/brain-metrics.js'

/**
 * @typedef {object} ProtocolContext
 * @property {object} brainState
 * @property {Function} render
 * @property {Function} brainWrapper
 * @property {Function} brainHud
 * @property {Function} brainDelay
 * @property {Function} playTone
 * @property {Function} markTrial
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
  }

  /** @param {ProtocolContext} ctx @param {HTMLElement|null} container */
  init(ctx, container = null) {
    this._ctx = ctx
    this._container = container
    return this
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
    this._ctx = null
    this._container = null
  }

  /** @deprecated Usar cleanup() */
  destroy() {
    this.cleanup()
  }

  get ctx() {
    return this._ctx
  }
}

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
