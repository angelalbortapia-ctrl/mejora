/** Bus de audio compartido — voz + ambiente en un solo contexto (mejor mezcla). */

let ctx = null
let voiceFilter = null
let voiceGain = null
let ambientGain = null

export async function getCalmaAudioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()

    ambientGain = ctx.createGain()
    ambientGain.gain.value = 1

    voiceFilter = ctx.createBiquadFilter()
    voiceFilter.type = 'lowpass'
    voiceFilter.frequency.value = 12800
    voiceFilter.Q.value = 0.65

    voiceGain = ctx.createGain()
    voiceGain.gain.value = 1.12

    ambientGain.connect(ctx.destination)
    voiceFilter.connect(voiceGain)
    voiceGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

export function getVoiceOutputNode() {
  return voiceFilter
}

export function getAmbientOutputNode() {
  return ambientGain
}
