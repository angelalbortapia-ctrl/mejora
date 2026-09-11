/** Audio UI — tonos contextuales */

import { getSettings } from './core.js'

let audioCtx = null

function ensureCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function playTone(freq = 440, duration = 0.15) {
  if (!getSettings().sound) return
  try {
    const ctx = ensureCtx()
    const osc = ctx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

export function playClick() {
  playTone(520, 0.06)
}

export function playSuccess() {
  playTone(660, 0.12)
  setTimeout(() => playTone(880, 0.14), 80)
}

export function playHabitDone() {
  playTone(587, 0.1)
  setTimeout(() => playTone(784, 0.12), 70)
}
