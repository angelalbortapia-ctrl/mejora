/** Sonido ambiente — loops WAV con HTML5 Audio */

const TRACKS = {
  rain: 'public/audio/rain.wav',
  ocean: 'public/audio/ocean.wav',
  forest: 'public/audio/forest.wav',
  wind: 'public/audio/wind.wav',
  stream: 'public/audio/stream.wav',
  fire: 'public/audio/fire.wav',
  night: 'public/audio/night.wav',
  brown: 'public/audio/brown.wav',
  cafe: 'public/audio/cafe.wav',
  zen: 'public/audio/zen.wav',
}

const pool = new Map()
let current = null
let bowlCtx = null

function trackUrl(type) {
  const path = TRACKS[type]
  if (!path) return null
  return new URL(path, window.location.href).href
}

function getAudio(type) {
  let audio = pool.get(type)
  if (!audio) {
    const url = trackUrl(type)
    if (!url) return null
    audio = new Audio(url)
    audio.loop = true
    audio.preload = 'auto'
    pool.set(type, audio)
  }
  return audio
}

function detachCurrent() {
  if (!current?.audio) return
  try {
    current.audio.pause()
    current.audio.currentTime = 0
  } catch (_) {}
  current = null
}

export function stopAmbientSound() {
  detachCurrent()
}

export function isAmbientPlaying() {
  return !!current?.audio && !current.audio.paused && !current.audio.ended
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
  if (!current?.audio) return false
  current.audio.volume = v
  current.volume = v
  return true
}

export async function resumeAudioContext() {
  if (!bowlCtx) bowlCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (bowlCtx.state === 'suspended') await bowlCtx.resume()
  return bowlCtx
}

export async function playSingingBowl(variant = 'start') {
  try {
    const c = await resumeAudioContext()
    const t = c.currentTime
    const base = variant === 'end' ? 196 : 220
    const freqs = [base, base * 1.5, base * 2.01, base * 2.71]
    const peak = variant === 'end' ? 0.16 : 0.13
    const decay = variant === 'end' ? 3.2 : 2.4
    freqs.forEach((f, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)
      g.gain.setValueAtTime(peak / (i + 1), t)
      g.gain.linearRampToValueAtTime(0, t + decay + i * 0.1)
      osc.connect(g)
      g.connect(c.destination)
      osc.start(t)
      osc.stop(t + decay + 0.6)
    })
  } catch (_) {}
}

export async function startAmbientSound(type, volume = 0.45) {
  if (!type || type === 'off') {
    stopAmbientSound()
    return false
  }

  const v = Math.max(0, Math.min(1, Number(volume) || 0))
  if (v <= 0) {
    stopAmbientSound()
    return false
  }

  if (!TRACKS[type]) {
    stopAmbientSound()
    return false
  }

  if (current?.type === type && current?.audio && !current.audio.paused) {
    current.audio.volume = v
    current.volume = v
    return true
  }

  detachCurrent()

  let audio = getAudio(type)
  if (!audio) return false

  try {
    audio.volume = v
    await audio.play()
    current = { audio, type, volume: v }
    return true
  } catch (e) {
    console.warn('Ambient play failed, retrying:', e)
    try {
      pool.delete(type)
      audio = getAudio(type)
      if (!audio) return false
      audio.volume = v
      await audio.play()
      current = { audio, type, volume: v }
      return true
    } catch (e2) {
      console.warn('Ambient play failed:', e2)
      detachCurrent()
      return false
    }
  }
}

export const AMBIENT_PRESETS = [
  { id: 'off', label: 'Silencio', icon: '🔇' },
  { id: 'rain', label: 'Lluvia', icon: '🌧️' },
  { id: 'ocean', label: 'Olas', icon: '🌊' },
  { id: 'forest', label: 'Bosque', icon: '🌲' },
  { id: 'wind', label: 'Viento', icon: '💨' },
  { id: 'stream', label: 'Arroyo', icon: '💧' },
  { id: 'fire', label: 'Fogata', icon: '🔥' },
  { id: 'night', label: 'Noche', icon: '🌙' },
  { id: 'brown', label: 'Ruido suave', icon: '🫧' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'zen', label: 'Zen', icon: '🎐' },
]
