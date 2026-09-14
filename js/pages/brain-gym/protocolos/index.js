/** Registro central de protocolos — Strategy pattern completo */

import { hasProtocol, registerProtocols } from '/js/pages/brain-gym/registry.js'
import { createStroopProtocol } from '/js/pages/brain-gym/protocolos/stroop.js'
import { createFlankerProtocol } from '/js/pages/brain-gym/protocolos/flanker.js'
import { createNBackProtocol } from '/js/pages/brain-gym/protocolos/nback.js'
import { createCPTProtocol } from '/js/pages/brain-gym/protocolos/cpt.js'
import { createGoNoGoProtocol } from '/js/pages/brain-gym/protocolos/gonogo.js'
import {
  createTrailProtocol, createANTProtocol, createWisconsinProtocol, createVisNBackProtocol,
} from '/js/pages/brain-gym/protocolos/clinical-lab-adapters.js'

/** Registra protocolos clínicos como BaseProtocol completos */
export function buildClinicalProtocolRegistry(ctx = {}) {
  const specs = [
    createStroopProtocol(),
    createFlankerProtocol(),
    createNBackProtocol(),
    createCPTProtocol(),
    createGoNoGoProtocol(),
    createTrailProtocol(),
    createANTProtocol(),
    createWisconsinProtocol(),
    createVisNBackProtocol(),
  ]
  if (ctx.renderDualNBackGame) {
    specs.push({
      id: 'dualnback',
      clinical: true,
      domain: 'working_memory',
      render: ctx.renderDualNBackGame,
    })
  }
  registerProtocols(specs)
  return specs
}

/** Ejercicios de laboratorio no clínicos (runtime legacy) */
export function registerFreeLabProtocols(handlers) {
  const casual = [
    ['math', handlers.renderMathGame],
    ['anagram', handlers.renderAnagramGame],
    ['oddout', handlers.renderOddOutGame],
  ]
  const standard = [
    ['dualnback', handlers.renderDualNBackGame],
    ['revspan', handlers.renderRevSpanGame],
    ['pasat', handlers.renderPasatGame],
    ['switching', handlers.renderSwitchingGame],
    ['corsi', handlers.renderCorsiGame],
    ['symbols', handlers.renderSymbolsGame],
    ['logic', handlers.renderLogicGame],
    ['memory', handlers.renderMemoryGame],
    ['simon', handlers.renderSimonGame],
    ['sequence', handlers.renderSequenceGame],
    ['reaction', handlers.renderReactionGame],
  ]
  const specs = []
  const seen = new Set()
  for (const [id, render] of [...casual, ...standard]) {
    if (!render || seen.has(id) || hasProtocol(id)) continue
    seen.add(id)
    specs.push({ id, clinical: false, render })
  }
  registerProtocols(specs)
}
