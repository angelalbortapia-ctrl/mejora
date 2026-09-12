/** Sonido ambiente — Web Audio gapless loops (CC0), ver public/audio/CREDITS.md */

const TRACKS = {
  rain: 'public/audio/rain.mp3',
  ocean: 'public/audio/ocean.mp3',
  forest: 'public/audio/forest.mp3',
  wind: 'public/audio/wind.mp3',
  stream: 'public/audio/stream.mp3',
  fire: 'public/audio/fire.mp3',
  night: 'public/audio/night.mp3',
  cascada: 'public/audio/cascada.mp3',
  amanecer: 'public/audio/amanecer.mp3',
  cafe: 'public/audio/cafe.mp3',
  lago: 'public/audio/lago.mp3',
  tormenta: 'public/audio/tormenta.mp3',
  jardin: 'public/audio/jardin.mp3',
  chimes: 'public/audio/chimes.mp3',
  bamboo: 'public/audio/bamboo.mp3',
  zen: 'public/audio/zen.mp3',
  om: 'public/audio/om.mp3',
  shrine: 'public/audio/shrine.mp3',
}

const bufferCache = new Map()
const loadPromises = new Map()
let ambientCtx = null
let bowlCtx = null
let current = null
let fadeTimer = null
let ducking = false

const FADE_MS = 1400
const DUCK_FADE_MS = 520
const UNDUCK_FADE_MS = 780
const DEFAULT_VOL = 0.28
const VOICE_DUCK_RATIO = 0.14

function trackUrl(type) {
  const path = TRACKS[type]
  if (!path) return null
  return new URL(path, window.location.href).href
}

async function getAmbientContext() {
  const { getCalmaAudioContext } = await import('./calma-audio-bus.js')
  ambientCtx = await getCalmaAudioContext()
  return ambientCtx
}

function clearFade() {
  if (fadeTimer) clearInterval(fadeTimer)
  fadeTimer = null
}

function rampGain(gainNode, from, to, ms, onDone) {
  clearFade()
  const ctx = ambientCtx
  if (!ctx || !gainNode) {
    onDone?.()
    return
  }
  const now = ctx.currentTime
  const target = Math.max(0, to)
  try {
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(Math.max(0, from), now)
    gainNode.gain.linearRampToValueAtTime(target, now + ms / 1000)
  } catch (_) {
    gainNode.gain.value = target
  }
  fadeTimer = setTimeout(() => {
    fadeTimer = null
    gainNode.gain.value = target
    onDone?.()
  }, ms + 30)
}

async function loadBuffer(type) {
  if (bufferCache.has(type)) return bufferCache.get(type)
  if (loadPromises.has(type)) return loadPromises.get(type)

  const url = trackUrl(type)
  if (!url) return null

  const task = (async () => {
    const ctx = await getAmbientContext()
    const res = await fetch(url)
    if (!res.ok) throw new Error(`No se pudo cargar ${type}`)
    const data = await res.arrayBuffer()
    const buffer = await ctx.decodeAudioData(data.slice(0))
    bufferCache.set(type, buffer)
    loadPromises.delete(type)
    return buffer
  })()

  loadPromises.set(type, task)
  try {
    return await task
  } catch (e) {
    loadPromises.delete(type)
    bufferCache.delete(type)
    console.warn('[Calma] buffer:', type, e)
    return null
  }
}

function stopSourceNodes(nodes, fadeOut = true) {
  if (!nodes?.source || !nodes?.gain) return Promise.resolve()
  const { source, gain } = nodes
  return new Promise(resolve => {
    const done = () => {
      try { source.stop() } catch (_) {}
      try { source.disconnect() } catch (_) {}
      try { gain.disconnect() } catch (_) {}
      resolve()
    }
    if (!fadeOut || !ambientCtx) {
      done()
      return
    }
    const vol = gain.gain.value
    rampGain(gain, vol, 0, FADE_MS * 0.75, done)
  })
}

async function detachCurrent(fadeOut = true) {
  clearFade()
  if (!current) return
  const nodes = current
  current = null
  ducking = false
  await stopSourceNodes(nodes, fadeOut)
}

export function stopAmbientSound() {
  return detachCurrent(true)
}

export function pauseAmbientSound() {
  clearFade()
  if (ambientCtx?.state === 'running') ambientCtx.suspend().catch(() => {})
}

export async function resumeAmbientSound() {
  if (!current?.gain) return false
  try {
    await getAmbientContext()
    return true
  } catch (_) {
    return false
  }
}

export function isAmbientPlaying() {
  return !!current?.gain && !!current?.source
}

export function getAmbientType() {
  return current?.type || null
}

export function setAmbientVolume(vol) {
  const v = Math.max(0, Math.min(1, Number(vol) || 0))
  if (v <= 0) {
    stopAmbientSound()
    return true
  }
  if (!current?.gain) return false
  clearFade()
  current.baseVolume = v
  current.volume = v
  current.gain.gain.value = ducking ? v * VOICE_DUCK_RATIO : v
  return true
}

export function duckAmbientForVoice(ratio = VOICE_DUCK_RATIO) {
  if (!current?.gain) return
  if (!current.baseVolume) current.baseVolume = current.volume ?? current.gain.gain.value
  ducking = true
  clearFade()
  const target = Math.max(0.03, current.baseVolume * ratio)
  rampGain(current.gain, current.gain.gain.value, target, DUCK_FADE_MS)
}

export function restoreAmbientAfterVoice() {
  if (!current?.gain || !current.baseVolume) {
    ducking = false
    return
  }
  ducking = false
  clearFade()
  rampGain(current.gain, current.gain.gain.value, current.baseVolume, UNDUCK_FADE_MS)
}

export function isAmbientDucked() {
  return ducking
}

export async function resumeAudioContext() {
  await getAmbientContext()
  if (!bowlCtx) bowlCtx = ambientCtx
  if (bowlCtx?.state === 'suspended') await bowlCtx.resume()
  return bowlCtx || ambientCtx
}

export async function playSingingBowl(variant = 'start') {
  try {
    const c = await resumeAudioContext()
    const { getAmbientOutputNode } = await import('./calma-audio-bus.js')
    const out = getAmbientOutputNode()
    const t = c.currentTime
    const base = variant === 'end' ? 196 : 220
    const freqs = [base, base * 1.5, base * 2.01, base * 2.71]
    const peak = variant === 'end' ? 0.14 : 0.11
    const decay = variant === 'end' ? 3.2 : 2.4
    freqs.forEach((f, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)
      g.gain.setValueAtTime(peak / (i + 1), t)
      g.gain.linearRampToValueAtTime(0, t + decay + i * 0.1)
      osc.connect(g)
      g.connect(out)
      osc.start(t)
      osc.stop(t + decay + 0.6)
    })
  } catch (_) {}
}

export function preloadAmbientSounds() {
  Object.keys(TRACKS).forEach(type => {
    loadBuffer(type).catch(() => {})
  })
}

export async function startAmbientSound(type, volume = DEFAULT_VOL) {
  if (!type || type === 'off') {
    await stopAmbientSound()
    return false
  }

  const v = Math.max(0.08, Math.min(0.65, Number(volume) || DEFAULT_VOL))
  if (v <= 0) {
    await stopAmbientSound()
    return false
  }

  if (!TRACKS[type]) {
    await stopAmbientSound()
    return false
  }

  if (current?.type === type && current?.source) {
    setAmbientVolume(v)
    return true
  }

  const buffer = await loadBuffer(type)
  if (!buffer) return false

  await detachCurrent(true)

  try {
    const ctx = await getAmbientContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.loopStart = 0
    source.loopEnd = buffer.duration

    const { getAmbientOutputNode } = await import('./calma-audio-bus.js')
    const gain = ctx.createGain()
    gain.gain.value = 0
    source.connect(gain)
    gain.connect(getAmbientOutputNode())
    source.start(0)

    current = { type, source, gain, volume: v, baseVolume: v }
    rampGain(gain, 0, v, FADE_MS)
    return true
  } catch (e) {
    console.warn('[Calma] ambiente:', e)
    current = null
    return false
  }
}

export const AMBIENT_PRESETS = [
  { id: 'off', label: 'Silencio', icon: '🔇' },
  { id: 'zen', label: 'Jardín zen', icon: '🪷' },
  { id: 'om', label: 'Om profundo', icon: 'ॐ' },
  { id: 'chimes', label: 'Cuencos', icon: '🔔' },
  { id: 'bamboo', label: 'Agua zen', icon: '💧' },
  { id: 'shrine', label: 'Santuario', icon: '⛩️' },
  { id: 'rain', label: 'Lluvia', icon: '🌧️' },
  { id: 'ocean', label: 'Olas', icon: '🌊' },
  { id: 'forest', label: 'Bosque', icon: '🌲' },
  { id: 'cascada', label: 'Cascada', icon: '🏔️' },
  { id: 'stream', label: 'Arroyo', icon: '💧' },
  { id: 'lago', label: 'Lago', icon: '🏞️' },
  { id: 'fire', label: 'Fogata', icon: '🔥' },
  { id: 'wind', label: 'Viento', icon: '💨' },
  { id: 'tormenta', label: 'Tormenta', icon: '⛈️' },
  { id: 'amanecer', label: 'Amanecer', icon: '🌅' },
  { id: 'jardin', label: 'Jardín', icon: '🌸' },
  { id: 'night', label: 'Noche', icon: '🌙' },
  { id: 'cafe', label: 'Café', icon: '☕' },
]
