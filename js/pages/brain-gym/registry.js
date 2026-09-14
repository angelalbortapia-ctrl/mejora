/** Registro central de protocolos — Strategy + carga dinámica */

import { BaseProtocol, createProtocol } from '/js/pages/brain-gym/base-protocol.js'

const registry = new Map()
let bootstrapped = false

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
export function renderExercise(id, legacyFallback) {
  const p = registry.get(id)
  if (p?.render) {
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
  registry.forEach(p => { try { p.destroy?.() } catch {} })
  registry.clear()
  bootstrapped = false
}
