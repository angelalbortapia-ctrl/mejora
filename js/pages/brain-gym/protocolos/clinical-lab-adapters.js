/** Adaptadores BaseProtocol para protocolos renderizados en brain-clinical-lab */

import { createProtocol } from '/js/pages/brain-gym/base-protocol.js'
import { getProtocolContext } from '/js/pages/brain-gym/protocol-context.js'

function clinicalRender(id, renderKey) {
  return createProtocol({
    id,
    clinical: true,
    render() {
      const { ensureClinicalLab } = getProtocolContext()
      const lab = ensureClinicalLab()
      const fn = lab[renderKey]
      if (!fn) return '<p class="text-muted">Protocolo no disponible</p>'
      return fn()
    },
  })
}

export function createTrailProtocol() {
  return clinicalRender('trail', 'renderTrailGame')
}

export function createANTProtocol() {
  return clinicalRender('ant', 'renderANTGame')
}

export function createWisconsinProtocol() {
  return clinicalRender('wisconsin', 'renderWisconsinGame')
}

export function createVisNBackProtocol() {
  return clinicalRender('visnback', 'renderVisNBackGame')
}
