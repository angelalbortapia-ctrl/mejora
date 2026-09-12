/** Voz natural para meditaciones guiadas — Web Speech API */

import { getSettings, saveSettings } from './core.js'

let cachedVoice = null
let breathCueIndex = 0

function getVoices() {
  return window.speechSynthesis?.getVoices() || []
}

function isPremiumVoice(voice) {
  const n = (voice.name || '').toLowerCase()
  return scoreVoice(voice) >= 55
}

export function listMeditationVoices() {
  const spanish = getVoices().filter(v => (v.lang || '').toLowerCase().startsWith('es'))
  const pool = spanish.length ? spanish : getVoices()
  const sorted = [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))
  const auto = [{ uri: '', label: 'Automática (mejor disponible)', premium: false }]
  return auto.concat(sorted.map(v => ({
    uri: v.voiceURI,
    label: v.name,
    premium: isPremiumVoice(v),
  })))
}

export function getSelectedVoiceURI() {
  return getSettings().medVoiceURI || ''
}

export function setMeditationVoiceURI(uri) {
  const s = getSettings()
  s.medVoiceURI = uri || ''
  saveSettings(s)
  cachedVoice = uri ? getVoices().find(v => v.voiceURI === uri) || pickBestVoice() : pickBestVoice()
}

const BREATH_CUES = {
  inhale: ['Inhala suavemente', 'Inhala por la nariz', 'Inhala... despacio'],
  hold: ['Mantén el aire', 'Sostén un momento', 'Mantén...'],
  exhale: ['Exhala lentamente', 'Suelta el aire con calma', 'Exhala... suave'],
}

const INTRO_CUES = {
  breathing: 'Respiración táctica. Sigue el ritmo del círculo, sin forzar.',
  'box-breath': 'Respiración cuadrada. Cuatro tiempos en cada fase. Fluye con el ritmo.',
}

function scoreVoice(voice) {
  const name = (voice.name || '').toLowerCase()
  const lang = (voice.lang || '').toLowerCase()
  let score = 0

  if (lang.startsWith('es')) score += 40
  if (lang.includes('mx') || lang.includes('419') || lang.includes('us')) score += 12
  if (name.includes('enhanced') || name.includes('premium') || name.includes('neural') || name.includes('natural')) score += 35
  if (name.includes('google')) score += 22
  if (name.includes('paulina') || name.includes('mónica') || name.includes('monica')) score += 28
  if (name.includes('helena') || name.includes('sabina') || name.includes('jorge') || name.includes('lucia') || name.includes('lucía')) score += 20
  if (name.includes('female') || name.includes('mujer')) score += 6
  if (voice.localService) score += 8
  if (name.includes('compact') || name.includes('espeak') || name.includes('synthetic')) score -= 25

  return score
}

function pickBestVoice() {
  if (!window.speechSynthesis) return null
  const voices = getVoices()
  if (!voices.length) return null

  const saved = getSettings().medVoiceURI
  if (saved) {
    const picked = voices.find(v => v.voiceURI === saved)
    if (picked) return picked
  }

  const spanish = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es'))
  const pool = spanish.length ? spanish : voices
  let best = null
  let bestScore = -Infinity

  for (const voice of pool) {
    const s = scoreVoice(voice)
    if (s > bestScore) {
      best = voice
      bestScore = s
    }
  }
  return best || pool[0] || null
}

export function initMeditationVoice() {
  if (!window.speechSynthesis) return
  const refresh = () => { cachedVoice = pickBestVoice() }
  refresh()
  window.speechSynthesis.onvoiceschanged = refresh
  if (!getVoices().length) window.speechSynthesis.getVoices()
}

export function isMeditationVoiceSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function getMeditationVoiceName() {
  if (!cachedVoice) cachedVoice = pickBestVoice()
  return cachedVoice?.name || 'Voz del sistema'
}

export function stopMeditationVoice() {
  window.speechSynthesis?.cancel()
}

function prepareText(text) {
  return String(text)
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speakMeditation(text) {
  if (!text || !window.speechSynthesis) return
  stopMeditationVoice()
  if (!cachedVoice) cachedVoice = pickBestVoice()

  const utterance = new SpeechSynthesisUtterance(prepareText(text))
  utterance.lang = cachedVoice?.lang || 'es-MX'
  if (cachedVoice) utterance.voice = cachedVoice
  utterance.rate = 0.84
  utterance.pitch = 0.96
  utterance.volume = 0.9

  window.speechSynthesis.speak(utterance)
}

export function speakMeditationIntro(sessionId) {
  const intro = INTRO_CUES[sessionId]
  if (intro) speakMeditation(intro)
}

export function speakBreathCue(phase) {
  const pool = BREATH_CUES[phase]
  if (!pool?.length) return
  const text = pool[breathCueIndex % pool.length]
  breathCueIndex++
  speakMeditation(text)
}

export function resetBreathCues() {
  breathCueIndex = 0
}
