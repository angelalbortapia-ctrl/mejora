/** Registro central de protocolos — Strategy + carga dinámica */

import { BaseProtocol, createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'

const registry = new Map()
let bootstrapped = false
let activeProtocolId = null

export function registerProtocol(specOrInstance) {
  const isPlainSpec = specOrInstance?.id
    && typeof specOrInstance.render === 'function'
    && !(specOrInstance instanceof BaseProtocol)
  const p = isPlainSpec ? createProtocol(specOrInstance) : specOrInstance
  registry.set(p.id, p)
  return p
}

export function registerProtocols(specs) {
  specs.forEach(registerProtocol)
}

export function getProtocol(id) {
  return registry.get(id) || null
}

export function hasProtocol(id) {
  return registry.has(id)
}

export function listProtocols({ clinicalOnly = false, freeOnly = false } = {}) {
  return [...registry.values()].filter(p => {
    if (clinicalOnly && !p.clinical) return false
    if (freeOnly && p.clinical) return false
    return true
  })
}

/**
 * Render vía registro; retorna null si no hay handler registrado.
 * @param {string} id
 * @param {object} legacyFallback — fn(id) => html si no está en registry
 */
export function setActiveProtocol(id) {
  if (activeProtocolId && activeProtocolId !== id) destroyActiveProtocol()
  activeProtocolId = id || null
  if (!id) return
  const p = registry.get(id)
  if (p?.init) {
    try { p.init(getProtocolContext()) } catch { /* contexto aún no listo */ }
  }
}

export function destroyActiveProtocol() {
  if (!activeProtocolId) return
  const p = registry.get(activeProtocolId)
  try { p?.cleanup?.() } catch (err) { console.error(`[registry] cleanup ${activeProtocolId}`, err) }
  activeProtocolId = null
}

export function renderExercise(id, legacyFallback) {
  const p = registry.get(id)
  if (p?.render) {
    setActiveProtocol(id)
    try {
      return p.render()
    } catch (err) {
      console.error(`[registry] render ${id}`, err)
      return legacyFallback?.(id) ?? ''
    }
  }
  return legacyFallback?.(id) ?? null
}

export function bootstrapRegistry(legacyHandlers = {}) {
  if (bootstrapped) return registry
  Object.entries(legacyHandlers).forEach(([id, renderFn]) => {
    if (!renderFn || registry.has(id)) return
    registerProtocol({
      id,
      clinical: legacyHandlers._clinical?.has(id) ?? false,
      render: () => renderFn(),
    })
  })
  bootstrapped = true
  return registry
}

export function resetRegistry() {
  destroyActiveProtocol()
  registry.forEach(p => { try { p.cleanup?.() } catch {} })
  registry.clear()
  bootstrapped = false
}
