/** Voz guiada Calma — Fish / Azure / Gemini (API) o navegador */

import { getSettings, saveSettings } from './core.js'
import {
  hasGeminiTts, speakGeminiMeditation, stopGeminiSpeech, previewGeminiVoice,
  getGeminiVoiceHint, getGeminiVoiceId, GEMINI_MEDITATION_VOICES, isGeminiSpeaking,
  prefetchGeminiTexts, speakGeminiSequence,
} from './gemini-tts.js?v=124'
import {
  hasAzureTts, hasAzureTtsQuota, isAzureQuotaBlocked, isAzureSpeaking,
  speakAzureMeditation, stopAzureSpeech, previewAzureVoice,
  getAzureVoiceHint, getAzureVoiceId, AZURE_MEDITATION_VOICES,
  prefetchAzureTexts, speakAzureSequence,
} from './azure-tts.js?v=124'
import {
  hasFishTts, hasFishApiKey, speakFishMeditation, stopFishSpeech, previewFishVoice,
  getFishVoiceHint, getFishVoiceLabel, isFishSpeaking,
  prefetchFishTexts, speakFishSequence,
} from './fish-audio-tts.js?v=124'
import { isAzureConfigFilePresent } from './azure-config.js'
import { isFishConfigFilePresent } from './fish-config.js'
import { duckAmbientForVoice, restoreAmbientAfterVoice, resumeAudioContext } from './ambient-audio.js?v=124'

let programVoiceOverride = null

export function setProgramVoiceOverride(engine) {
  programVoiceOverride = engine === 'gemini' || engine === 'azure' || engine === 'fish' ? engine : null
}

export function getActiveMedVoiceEngine() {
  const engine = getSettings().medVoiceEngine || 'browser'
  if (programVoiceOverride === 'fish' && hasFishTts()) return 'fish'
  if (programVoiceOverride === 'azure' && hasAzureTtsQuota()) return 'azure'
  if (engine === 'fish' && hasFishTts()) return 'fish'
  if (engine === 'azure' && hasAzureTtsQuota()) return 'azure'
  if (engine === 'gemini' && hasGeminiTts()) return 'gemini'
  if (engine === 'browser') return 'browser'
  if (hasFishTts()) return 'fish'
  if (hasAzureTtsQuota()) return 'azure'
  if (hasGeminiTts()) return 'gemini'
  return 'browser'
}

export function usesAzureMedVoice() {
  return getActiveMedVoiceEngine() === 'azure'
}

export function isAzureVoiceCapped() {
  return isAzureQuotaBlocked()
}

export function usesGeminiMedVoice() {
  return getActiveMedVoiceEngine() === 'gemini'
}

export function usesFishMedVoice() {
  return getActiveMedVoiceEngine() === 'fish'
}

export function usesApiMedVoice() {
  return getActiveMedVoiceEngine() !== 'browser'
}

function useGeminiTts() {
  return usesGeminiMedVoice()
}

function useAzureTts() {
  return usesAzureMedVoice()
}

function useFishTts() {
  return usesFishMedVoice()
}

let cachedVoice = null
let breathCueIndex = 0
let speaking = false
let speechQueue = []
let phraseTimer = null
let voiceDepth = 0

function beginVoicePlayback() {
  voiceDepth++
  if (voiceDepth === 1) duckAmbientForVoice()
}

function endVoicePlayback() {
  voiceDepth = Math.max(0, voiceDepth - 1)
  if (voiceDepth === 0) restoreAmbientAfterVoice()
}

export function isMeditationVoiceSpeaking() {
  if (useFishTts()) return isFishSpeaking()
  if (useAzureTts()) return isAzureSpeaking()
  if (useGeminiTts()) return isGeminiSpeaking()
  return speaking || voiceDepth > 0
}

const DEFAULT_VOICE_RATE = 0.48

const VOICE_BLOCKLIST = [
  'grandma', 'grandpa', 'grandmother', 'grandfather', 'eddy', 'flo', 'reed', 'rocko',
  'shelley', 'cellos', 'bad news', 'good news', 'whisper', 'bahh', 'bells', 'boing',
  'bubbles', 'junior', 'kathy', 'organ', 'superstar', 'trinoids', 'zarvox', 'albert',
  'fred', 'wobble', 'jester', 'ralph', 'hysterical', 'pipe organ', 'deranged',
  'evil', 'princess', 'pirate', 'robot', 'novelty', 'funny', 'wry',
]

function getVoices() {
  return window.speechSynthesis?.getVoices() || []
}

function isBlockedVoice(voice) {
  const name = (voice?.name || '').toLowerCase()
  return VOICE_BLOCKLIST.some(token => name.includes(token))
}

export function isGoogleSpanishVoice(voice) {
  if (!voice || isBlockedVoice(voice)) return false
  const name = (voice.name || '').toLowerCase()
  const lang = (voice.lang || '').toLowerCase()
  return name.includes('google') && lang.startsWith('es')
}

function scoreVoice(voice) {
  if (!voice || isBlockedVoice(voice)) return -999

  const name = (voice.name || '').toLowerCase()
  const lang = (voice.lang || '').toLowerCase()
  let score = 0

  if (isGoogleSpanishVoice(voice)) {
    score += 200
    if (lang.includes('mx') || lang.includes('419') || name.includes('latino')) score += 25
    if (lang.includes('us') || name.includes('estados unidos')) score += 15
    return score
  }

  if (lang.startsWith('es')) score += 50
  if (lang.includes('mx') || lang.includes('419')) score += 22
  if (lang.includes('es-es') || lang.includes('es_us')) score += 14
  if (name.includes('google')) score += 40
  if (name.includes('paulina')) score += 80
  if (/m[oó]nica/.test(name)) score += 75
  if (name.includes('helena') || name.includes('jorge') || name.includes('lucia') || name.includes('lucía')) score += 60
  if (name.includes('enhanced') || name.includes('premium') || name.includes('neural') || name.includes('natural')) score += 45
  if (voice.localService) score += 8
  if (name.includes('compact') || name.includes('espeak') || name.includes('synthetic')) score -= 80

  return score
}

function isUsableVoice(voice) {
  if (!voice || isBlockedVoice(voice)) return false
  if (isGoogleSpanishVoice(voice)) return true
  const lang = (voice.lang || '').toLowerCase()
  if (lang.startsWith('es')) return scoreVoice(voice) >= 30
  return scoreVoice(voice) >= 45
}

function isPremiumVoice(voice) {
  return isGoogleSpanishVoice(voice) || scoreVoice(voice) >= 70
}

export function hasGoogleSpanishVoice() {
  return getVoices().some(isGoogleSpanishVoice)
}

export function hasQualityMeditationVoice() {
  return getVoices().some(isUsableVoice)
}

export function getMedVoiceRate() {
  const r = Number(getSettings().medVoiceRate)
  if (!Number.isFinite(r)) return DEFAULT_VOICE_RATE
  return Math.max(0.42, Math.min(0.72, r))
}

export function setMedVoiceRate(rate) {
  const s = getSettings()
  s.medVoiceRate = Math.max(0.42, Math.min(0.72, Number(rate) || DEFAULT_VOICE_RATE))
  saveSettings(s)
}

function voiceListItem(v) {
  const google = isGoogleSpanishVoice(v)
  return {
    uri: v.voiceURI,
    label: google ? `${v.name} · Google` : v.name,
    premium: isPremiumVoice(v),
    recommended: google || /paulina|m[oó]nica/i.test(v.name || ''),
    google,
  }
}

export function renderMeditationVoiceOptions(selectedUri = '') {
  const voices = listMeditationVoices()
  const selected = selectedUri || getSelectedVoiceURI()
  const auto = voices[0]
  const rest = voices.slice(1)
  const google = rest.filter(v => v.google)
  const system = rest.filter(v => !v.google)

  const opt = (v) => {
    const star = v.recommended || v.premium ? ' ★' : ''
    const sel = v.uri === selected ? ' selected' : ''
    return `<option value="${v.uri}"${sel}>${v.label}${star}</option>`
  }

  let html = opt(auto)
  if (google.length) {
    html += `<optgroup label="Google — mejor calidad (Chrome + internet)">${google.map(opt).join('')}</optgroup>`
  }
  if (system.length) {
    html += `<optgroup label="Sistema (Mac / Safari)">${system.map(opt).join('')}</optgroup>`
  }
  return html
}

export function listMeditationVoices() {
  const pool = getVoices().filter(v => !isBlockedVoice(v))
  const spanish = pool.filter(v => (v.lang || '').toLowerCase().startsWith('es'))
  let candidates = (spanish.length ? spanish : pool).filter(isUsableVoice)
  if (!candidates.length && spanish.length) candidates = spanish

  const google = candidates.filter(isGoogleSpanishVoice).sort((a, b) => scoreVoice(b) - scoreVoice(a))
  const system = candidates.filter(v => !isGoogleSpanishVoice(v)).sort((a, b) => scoreVoice(b) - scoreVoice(a))
  const sorted = [...google, ...system]

  const autoLabel = hasGoogleSpanishVoice()
    ? 'Automática (Google español)'
    : 'Automática (mejor disponible)'

  const auto = [{ uri: '', label: autoLabel, premium: true, recommended: true, google: hasGoogleSpanishVoice() }]
  return auto.concat(sorted.map(voiceListItem))
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

function pickBestGoogleSpanish() {
  const google = getVoices().filter(isGoogleSpanishVoice)
  if (!google.length) return null
  return [...google].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0]
}

function pickBestVoice() {
  if (!window.speechSynthesis) return null
  const voices = getVoices()
  if (!voices.length) return null

  const saved = getSettings().medVoiceURI
  if (saved) {
    const picked = voices.find(v => v.voiceURI === saved)
    if (picked && isUsableVoice(picked)) return picked
    const s = getSettings()
    s.medVoiceURI = ''
    saveSettings(s)
  }

  const googleBest = pickBestGoogleSpanish()
  if (googleBest) return googleBest

  const spanish = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es') && !isBlockedVoice(v))
  const pool = spanish.length ? spanish : voices.filter(v => !isBlockedVoice(v))
  let best = null
  let bestScore = -Infinity

  for (const voice of pool) {
    const s = scoreVoice(voice)
    if (s > bestScore) {
      best = voice
      bestScore = s
    }
  }
  if (bestScore >= 30) return best
  const fallback = spanish[0] || pool[0]
  return fallback && !isBlockedVoice(fallback) ? fallback : null
}

function warmUpVoice() {
  if (!window.speechSynthesis || !cachedVoice) return
  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0.01
  u.rate = 1
  u.voice = cachedVoice
  window.speechSynthesis.speak(u)
  window.speechSynthesis.cancel()
}

export function initMeditationVoice() {
  if (!window.speechSynthesis) return
  const refresh = () => {
    cachedVoice = pickBestVoice()
    if (cachedVoice) warmUpVoice()
  }
  refresh()
  window.speechSynthesis.onvoiceschanged = refresh
  window.speechSynthesis.getVoices()
  ;[250, 600, 1200, 2000, 4000, 7000].forEach(ms => setTimeout(refresh, ms))
}

export function isMeditationVoiceSupported() {
  if (usesApiMedVoice()) return true
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isMeditationVoiceReady() {
  if (usesApiMedVoice()) return true
  return isMeditationVoiceSupported() && !!pickBestVoice()
}

export function getMeditationVoiceName() {
  if (useFishTts()) {
    return `Fish · ${getFishVoiceLabel()} ★`
  }
  if (useAzureTts()) {
    const v = AZURE_MEDITATION_VOICES.find(x => x.id === getAzureVoiceId())
    return `Microsoft · ${v?.label?.split(' —')[0] || 'Dalia'} ★`
  }
  if (useGeminiTts()) {
    const v = GEMINI_MEDITATION_VOICES.find(x => x.id === getGeminiVoiceId())
    return `Gemini · ${v?.id || 'Despina'} ★`
  }
  if (!cachedVoice) cachedVoice = pickBestVoice()
  if (!cachedVoice) return 'Sin voz de calidad'
  const name = cachedVoice.name || 'Voz del sistema'
  if (isGoogleSpanishVoice(cachedVoice)) return `${name} · Google ★`
  return isPremiumVoice(cachedVoice) ? `${name} ★` : name
}

export function getMeditationVoiceHint() {
  if (isAzureVoiceCapped()) {
    return 'Cuota Azure agotada este mes — voz del navegador activa. Se reinicia el día 1.'
  }
  if (useFishTts()) return getFishVoiceHint()
  if (useAzureTts()) return getAzureVoiceHint()
  if (useGeminiTts()) return getGeminiVoiceHint()
  if ((getSettings().medVoiceEngine === 'fish' || isFishConfigFilePresent()) && !hasFishTts()) {
    return hasFishApiKey()
      ? 'Pega el ID de tu voz clonada en Ajustes → Calma.'
      : 'Configura Fish Audio en Ajustes → Calma (fish.audio → API Keys).'
  }
  if ((getSettings().medVoiceEngine === 'azure' || isAzureConfigFilePresent()) && !hasAzureTts()) {
    return 'Pega tu key de Azure en Ajustes → Calma (o recarga con ?v=103).'
  }
  if (hasAzureTts() && getSettings().medVoiceEngine !== 'azure') {
    return 'Azure listo — en Ajustes elige motor Microsoft Azure Neural.'
  }
  if (hasGeminiTts() && getSettings().medVoiceEngine === 'gemini') {
    return 'API key Gemini detectada. Activa voz guía en Calma.'
  }
  if (!isMeditationVoiceSupported()) return 'Tu navegador no soporta voz guiada.'
  if (!isMeditationVoiceReady()) {
    return 'Cargando voces… En Chrome aparecen las de Google (mejor calidad, requieren internet).'
  }
  if (hasGoogleSpanishVoice()) {
    return 'Voces Google activas — las mejores en Chrome. Requieren conexión.'
  }
  const ua = navigator.userAgent || ''
  if (/chrome|chromium|edg/i.test(ua) && !/safari/i.test(ua.replace(/chrome\/?\d+/i, ''))) {
    return 'Abre Mejora en Chrome con internet para voces Google. En Safari solo hay voces del sistema.'
  }
  return 'En Mac: descarga Paulina o Mónica. En Chrome: usa voces Google del selector.'
}

export function stopMeditationVoice() {
  stopFishSpeech()
  stopAzureSpeech()
  stopGeminiSpeech()
  speechQueue = []
  speaking = false
  voiceDepth = 0
  if (phraseTimer) clearTimeout(phraseTimer)
  phraseTimer = null
  window.speechSynthesis?.cancel()
  restoreAmbientAfterVoice()
}

export function pauseMeditationVoice() {
  if (usesApiMedVoice()) {
    stopMeditationVoice()
    return
  }
  if (!window.speechSynthesis) return
  if (typeof window.speechSynthesis.pause === 'function' && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause()
  } else {
    stopMeditationVoice()
  }
}

export function resumeMeditationVoice() {
  if (!window.speechSynthesis) return
  if (typeof window.speechSynthesis.resume === 'function' && window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
}

function humanizeForSpeech(text) {
  return String(text)
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*…\s*/g, '... ')
    .replace(/\s+/g, ' ')
    .replace(/\.{3}/g, '...')
    .trim()
}

function splitPhrases(text) {
  const clean = humanizeForSpeech(text)
  if (!clean) return []

  const raw = clean
    .split(/(?<=[.!?…])\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 1)

  const merged = []
  for (const phrase of raw) {
    const wordCount = phrase.replace(/[.!?…]+$/, '').split(/\s+/).length
    if (wordCount <= 4 && merged.length) {
      merged[merged.length - 1] = `${merged[merged.length - 1].replace(/[.!?…]+$/, '')}, ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}`
    } else {
      merged.push(phrase)
    }
  }

  return merged.map(p => (/[.!?…]$/.test(p) ? p : `${p}.`))
}

function pauseAfterPhrase(phrase, index, total) {
  const len = phrase.length
  if (total <= 1) return 900
  if (index === 0) return 1400
  if (index === total - 1) return 1100
  if (len < 40) return 1500
  if (len < 80) return 1800
  return 2100
}

/** Segundos que necesita el guion hablado (voz + pausas naturales) */
export function estimateSpeechDurationSec(text) {
  if (!text) return 0
  const phrases = splitPhrases(text)
  if (!phrases.length) return 0
  const engine = getActiveMedVoiceEngine()
  const rate = getMedVoiceRate()
  let total = 0
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i]
    const words = phrase.replace(/[.!?…]+$/, '').split(/\s+/).filter(Boolean).length
    let wpm = 108
    if (engine === 'fish') wpm = 88
    else if (engine === 'azure') wpm = 94
    else if (engine === 'gemini') wpm = 98
    else wpm = Math.max(68, 82 * (rate / 0.52))
    total += (words / wpm) * 60
    total += pauseAfterPhrase(phrase, i, phrases.length) / 1000
  }
  return Math.ceil(total + 6)
}

function utterPhrase(phrase, onDone) {
  if (!phrase || !window.speechSynthesis) {
    onDone?.()
    return
  }
  if (!cachedVoice) cachedVoice = pickBestVoice()
  if (!cachedVoice) {
    onDone?.()
    return
  }

  const utterance = new SpeechSynthesisUtterance(phrase)
  utterance.lang = cachedVoice.lang || 'es-MX'
  utterance.voice = cachedVoice
  utterance.rate = getMedVoiceRate()
  utterance.pitch = isGoogleSpanishVoice(cachedVoice) ? 0.95 : 0.93
  utterance.volume = 0.94

  speaking = true
  utterance.onend = () => {
    speaking = false
    onDone?.()
  }
  utterance.onerror = () => {
    speaking = false
    onDone?.()
  }
  window.speechSynthesis.speak(utterance)
}

function speakPhrases(phrases, { interrupt = true } = {}) {
  if (!phrases.length || !window.speechSynthesis) return
  if (!cachedVoice) cachedVoice = pickBestVoice()
  if (!cachedVoice) return
  if (interrupt) stopMeditationVoice()

  let i = 0
  if (voiceDepth === 0) beginVoicePlayback()
  const next = () => {
    if (i >= phrases.length) {
      speaking = false
      if (speechQueue.length) {
        const queued = speechQueue.shift()
        speakPhrases(splitPhrases(queued), { interrupt: false })
      } else {
        endVoicePlayback()
      }
      return
    }
    const phrase = phrases[i]
    const pauseMs = pauseAfterPhrase(phrase, i, phrases.length)
    i++
    utterPhrase(phrase, () => {
      phraseTimer = setTimeout(next, pauseMs)
    })
  }
  next()
}

export async function speakMeditation(text, { interrupt = true, pauseMs } = {}) {
  if (!text) return
  if (useFishTts() || useAzureTts() || useGeminiTts()) {
    await resumeAudioContext()
  }
  if (useFishTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakFishMeditation(text, { interrupt, pauseMs })
    } finally {
      if (!isFishSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  if (useAzureTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakAzureMeditation(text, { interrupt, pauseMs })
    } finally {
      if (!isAzureSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  if (useGeminiTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakGeminiMeditation(text, { interrupt, pauseMs })
    } finally {
      if (!isGeminiSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  if (!window.speechSynthesis) return
  if (!cachedVoice) cachedVoice = pickBestVoice()
  if (!cachedVoice) return

  const phrases = splitPhrases(text)
  if (!phrases.length) return

  if (speaking && !interrupt) {
    speechQueue.push(text)
    return
  }
  if (speaking && interrupt) stopMeditationVoice()

  speakPhrases(phrases, { interrupt })
}

export async function speakMeditationIntro(text) {
  if (text) await speakMeditation(text, { interrupt: true, pauseMs: 2000 })
}

export async function warmMeditationVoiceCache(texts) {
  if (!texts?.length) return
  if (useFishTts()) await prefetchFishTexts(texts)
  else if (useAzureTts()) await prefetchAzureTexts(texts)
  else if (useGeminiTts()) await prefetchGeminiTexts(texts)
}

export async function speakGuidedMeditationOpen(intro, firstStepText) {
  if (!intro && !firstStepText) return
  const parts = [intro, firstStepText].filter(Boolean)
  if (useFishTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakFishSequence(parts)
    } finally {
      if (!isFishSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  if (useAzureTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakAzureSequence(parts)
    } finally {
      if (!isAzureSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  if (useGeminiTts()) {
    if (voiceDepth === 0) beginVoicePlayback()
    try {
      await speakGeminiSequence(parts)
    } finally {
      if (!isGeminiSpeaking() && voiceDepth > 0) endVoicePlayback()
    }
    return
  }
  const introMs = intro ? estimateSpeechDurationSec(intro) * 1000 + 1200 : 0
  if (intro) setTimeout(() => speakMeditation(intro, { interrupt: true }), 800)
  if (firstStepText) setTimeout(() => speakMeditation(firstStepText, { interrupt: true }), Math.max(5500, introMs))
}

export function speakBreathCue(_phase) {
  breathCueIndex++
}

export async function previewMeditationVoice() {
  if (useFishTts()) {
    await previewFishVoice()
    return
  }
  if (useAzureTts()) {
    await previewAzureVoice()
    return
  }
  if (useGeminiTts()) {
    await previewGeminiVoice()
    return
  }
  speakMeditation(
    'Cierra los ojos un momento. No tienes que hacer nada perfecto. Solo quédate aquí, y respira.',
    { interrupt: true },
  )
}

export { hasGeminiTts, listGeminiVoiceOptions } from './gemini-tts.js?v=124'
export { hasAzureTts, listAzureVoiceOptions, setAzureVoiceId, setAzureSpeechKey, setAzureSpeechRegion } from './azure-tts.js?v=124'
export {
  hasFishTts, hasFishApiKey, listFishVoiceOptions, refreshFishVoiceList,
  setFishApiKey, setFishVoiceId, setFishModel, setFishSpeed, FISH_TTS_MODELS,
} from './fish-audio-tts.js?v=124'

export function resetBreathCues() {
  breathCueIndex = 0
}

export function getStepSpeechText(step) {
  if (!step) return ''
  return step.voice || step.text || ''
}
