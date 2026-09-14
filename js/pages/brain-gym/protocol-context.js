/** Contexto inyectado para protocolos BaseProtocol (evita acoplar al monolito) */

let ctx = null
const timedHandlers = new Map()

export function initProtocolContext(c) {
  ctx = c
  return ctx
}

export function getProtocolContext() {
  if (!ctx) throw new Error('Protocol context no inicializado')
  return ctx
}

export function registerTimedHandler(id, fn) {
  timedHandlers.set(id, fn)
}

export function unregisterTimedHandler(id) {
  timedHandlers.delete(id)
}

export function queueArmTrial(id) {
  const { brainState, brainTimers, getIntensity, startTrialDeadline } = getProtocolContext()
  const handler = timedHandlers.get(id)
  if (!handler) return
  brainTimers.push(setTimeout(() => {
    if (brainState.exercise !== id) return
    const ms = getIntensity(brainState.difficulty).timeLimit
    if (!ms) return
    brainState.trialStart = Date.now()
    startTrialDeadline(ms, handler)
  }, 80))
}

export function advanceTimedTrial(patchFn, onDone) {
  const { brainState, render, syncBrainLabChrome } = getProtocolContext()
  if (brainState._trialBusy) return
  brainState._trialBusy = true
  onDone()
  brainState._trialBusy = false
  if (!brainState.exercise) return
  const s = brainState[brainState.exercise]
  if (s?.finished) { render(true); return }
  if (patchFn && patchFn()) syncBrainLabChrome()
  else render(true)
}
