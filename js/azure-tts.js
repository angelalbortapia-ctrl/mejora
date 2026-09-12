/** Voz Calma — Microsoft Azure Neural TTS (capa gratuita F0) */

import { getSettings, saveSettings } from './core.js'
import { ensureAzureConfig, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } from './azure-config.js'
import {
  trackAzureChars, formatAzureUsageHint, assertAzureQuota, isAzureQuotaExhausted,
} from './azure-usage.js'

/** Voces neurales en español — tier gratuito F0 */
export const AZURE_MEDITATION_VOICES = [
  { id: 'es-MX-DaliaNeural', label: 'Dalia (México) — cálida', lang: 'es-MX' },
  { id: 'es-MX-JorgeNeural', label: 'Jorge (México) — sereno', lang: 'es-MX' },
  { id: 'es-MX-BeatrizNeural', label: 'Beatriz (México) — suave', lang: 'es-MX' },
  { id: 'es-MX-CandelaNeural', label: 'Candela (México) — joven', lang: 'es-MX' },
  { id: 'es-ES-ElviraNeural', label: 'Elvira (España) — clara', lang: 'es-ES' },
  { id: 'es-ES-AlvaroNeural', label: 'Álvaro (España) — grave', lang: 'es-ES' },
]

const OUTPUT_FORMAT = 'audio-48khz-192kbitrate-mono-mp3'

let audioCtx = null
let currentSource = null
let phraseTimer = null
let speaking = false
let speechQueue = []
let audioCache = new Map()
let speechGeneration = 0
let lastAzureError = ''

function getCredentials() {
  const s = getSettings()
  const key = (s.azureSpeechKey || '').trim() || AZURE_SPEECH_KEY || ''
  const region = (s.azureSpeechRegion || '').trim() || AZURE_SPEECH_REGION || 'eastus'
  return { key, region }
}

export function hasAzureTts() {
  const { key, region } = getCredentials()
  return Boolean(key && region)
}

export function hasAzureTtsQuota() {
  return hasAzureTts() && !isAzureQuotaExhausted()
}

export function isAzureQuotaBlocked() {
  return hasAzureTts() && isAzureQuotaExhausted()
}

export function getAzureVoiceId() {
  const v = getSettings().azureVoice
  if (v && AZURE_MEDITATION_VOICES.some(x => x.id === v)) return v
  return 'es-MX-DaliaNeural'
}

export function setAzureVoiceId(id) {
  const s = getSettings()
  s.azureVoice = id
  saveSettings(s)
}

export function setAzureSpeechKey(key) {
  const s = getSettings()
  s.azureSpeechKey = (key || '').trim()
  saveSettings(s)
}

export function setAzureSpeechRegion(region) {
  const s = getSettings()
  s.azureSpeechRegion = (region || 'eastus').trim()
  saveSettings(s)
}

function cacheKey(text, voice) {
  return `${voice}::${text}`
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function humanizeForSpeech(text) {
  return String(text)
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*…\s*/g, '... ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSsml(text, voice) {
  const voiceMeta = AZURE_MEDITATION_VOICES.find(v => v.id === voice)
  const lang = voiceMeta?.lang || 'es-MX'
  const clean = escapeXml(humanizeForSpeech(text))
    .replace(/,\s*/g, ',<break time="380ms"/> ')
    .replace(/;\s*/g, ';<break time="480ms"/> ')
  return `<speak version='1.0' xml:lang='${lang}' xmlns='http://www.w3.org/2001/10/synthesis'><voice name='${voice}'><prosody rate='-20%' pitch='-1st' volume='soft'>${clean}<break time='420ms'/></prosody></voice></speak>`
}

function setAzureError(msg) {
  lastAzureError = msg
  console.warn('[Calma] Azure TTS:', msg)
}

export function getLastAzureError() {
  return lastAzureError
}

async function ensureAudioContext() {
  const { getCalmaAudioContext } = await import('./calma-audio-bus.js')
  audioCtx = await getCalmaAudioContext()
  return audioCtx
}

async function requestAzureAudio(text, voice, key, region) {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
    },
    body: buildSsml(text, voice),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Azure ${res.status}: ${errText.slice(0, 120)}`)
  }
  const bytes = await res.arrayBuffer()
  const ctx = await ensureAudioContext()
  try {
    return await ctx.decodeAudioData(bytes.slice(0))
  } catch {
    throw new Error('Azure: no se pudo decodificar el audio')
  }
}

const inFlight = new Map()

async function fetchAzureAudio(text) {
  await ensureAzureConfig()
  const { key, region } = getCredentials()
  if (!key) throw new Error('Sin API key de Azure Speech')

  const voice = getAzureVoiceId()
  const ck = cacheKey(text, voice)
  if (audioCache.has(ck)) return audioCache.get(ck)
  if (inFlight.has(ck)) return inFlight.get(ck)

  const task = (async () => {
    assertAzureQuota(text.length)
    const buffer = await requestAzureAudio(text, voice, key, region)
    trackAzureChars(text.length)
    audioCache.set(ck, buffer)
    if (audioCache.size > 40) audioCache.delete(audioCache.keys().next().value)
    lastAzureError = ''
    return buffer
  })()

  inFlight.set(ck, task)
  try {
    return await task
  } finally {
    inFlight.delete(ck)
  }
}

export async function prefetchAzureTexts(texts) {
  await ensureAzureConfig()
  if (!hasAzureTts() || !texts?.length) return
  for (const text of texts) {
    for (const phrase of splitPhrases(text)) {
      try { await fetchAzureAudio(phrase) } catch (_) {}
    }
  }
}

function stopCurrentSource() {
  if (currentSource) {
    try { currentSource.stop() } catch (_) {}
    currentSource = null
  }
}

export function isAzureSpeaking() {
  return speaking
}

export function stopAzureSpeech() {
  speechGeneration++
  speechQueue = []
  speaking = false
  if (phraseTimer) clearTimeout(phraseTimer)
  phraseTimer = null
  stopCurrentSource()
}

export async function playAzureBuffer(buffer) {
  const ctx = await ensureAudioContext()
  const { getVoiceOutputNode } = await import('./calma-audio-bus.js')
  const out = getVoiceOutputNode()
  stopCurrentSource()
  return new Promise((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(out)
    currentSource = source
    source.onended = () => {
      if (currentSource === source) currentSource = null
      resolve()
    }
    source.start(0)
  })
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

async function speakPhrasesAzure(phrases, { interrupt = true, pauseMs = 2200 } = {}) {
  if (!phrases.length) return
  if (interrupt) stopAzureSpeech()

  const gen = speechGeneration
  let i = 0
  speaking = true

  while (i < phrases.length) {
    if (gen !== speechGeneration) return
    const phrase = phrases[i++]
    try {
      const buffer = await fetchAzureAudio(phrase)
      if (gen !== speechGeneration) return
      await playAzureBuffer(buffer)
    } catch (err) {
      const msg = err.message === 'AZURE_QUOTA_EXCEEDED'
        ? 'Cuota mensual Azure agotada — usando voz del navegador hasta el próximo mes.'
        : (err.message || String(err))
      setAzureError(msg)
      speaking = false
      return
    }
    if (i < phrases.length) {
      await new Promise(r => { phraseTimer = setTimeout(r, pauseMs) })
      if (gen !== speechGeneration) return
    }
  }

  speaking = false
  if (gen === speechGeneration && speechQueue.length) {
    const next = speechQueue.shift()
    await speakAzureMeditation(next, { interrupt: false })
  }
}

export async function speakAzureMeditation(text, { interrupt = true, pauseMs } = {}) {
  await ensureAzureConfig()
  if (!text || !hasAzureTts()) return
  const phrases = splitPhrases(text)
  if (!phrases.length) return

  if (speaking && !interrupt) {
    speechQueue.push(text)
    return
  }
  if (speaking && interrupt) stopAzureSpeech()

  const gap = pauseMs ?? (phrases.length > 2 ? 2400 : 2000)
  await speakPhrasesAzure(phrases, { interrupt, pauseMs: gap })
}

export async function speakAzureSequence(texts) {
  for (const text of texts) {
    if (!text) continue
    await speakAzureMeditation(text, { interrupt: false, pauseMs: 2400 })
  }
}

export async function previewAzureVoice() {
  await ensureAudioContext()
  await speakAzureMeditation(
    'Cierra los ojos un momento. No tienes que hacer nada perfecto. Solo quédate aquí, y respira.',
    { interrupt: true },
  )
}

export function listAzureVoiceOptions(selected = '') {
  const id = selected || getAzureVoiceId()
  return AZURE_MEDITATION_VOICES.map(v =>
    `<option value="${v.id}" ${v.id === id ? 'selected' : ''}>${v.label} ★</option>`,
  ).join('')
}

export function getAzureVoiceHint() {
  if (!hasAzureTts()) {
    return 'Microsoft Azure Speech: 500k caracteres/mes gratis. Configura en Ajustes → Calma.'
  }
  if (isAzureQuotaExhausted()) return formatAzureUsageHint()
  if (lastAzureError) {
    if (lastAzureError.includes('401') || lastAzureError.includes('403')) {
      return 'Key o región de Azure incorrecta — revisa Ajustes → Calma.'
    }
    if (lastAzureError.includes('Cuota mensual')) return lastAzureError
    return 'Error de voz Microsoft — revisa región (ej. eastus) y conexión.'
  }
  return `Voz Microsoft Neural · ${formatAzureUsageHint()}`
}

export {
  getAzureUsage, formatAzureUsageHint, formatAzureUsagePanel,
  isAzureQuotaExhausted, AZURE_USAGE_CAP,
} from './azure-usage.js'
