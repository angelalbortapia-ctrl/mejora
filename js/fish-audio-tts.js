/** Voz Calma — Fish Audio TTS (clonación / voces naturales) */

import { getSettings, saveSettings } from '/js/core.js'
import { ensureFishConfig, FISH_API_KEY, FISH_VOICE_ID } from '/js/fish-config.js'
import { getCalmaAudioContext, getVoiceOutputNode, getPrimedVoiceAudio, unlockCalmaAudioOnGesture } from '/js/calma-audio-bus.js'

/** Voces de la biblioteca pública — no necesitas grabarte ni clonar. */
export const FISH_LIBRARY_VOICES = [
  { id: 'c87656721dda48a7906f990f036ce76f', label: 'Voz Narrador Documental ★' },
  { id: '3f45a7fd7a614655a61eb7027b955783', label: 'Voz de locutor K' },
  { id: '5bec805f042d447cb4c542f49f225178', label: 'Farid dick 2' },
  { id: 'bfed5c0810a347dbb62e8ccce7f59c48', label: 'Voz Femenina Español' },
  { id: '9335bd0f15a7415a84407bd905ecd6b3', label: 'Voz Calma y Reflexiva — meditación' },
  { id: '7acd3e9011e94fd1bc58d4495dcf9f4b', label: 'Voz Calma Paz' },
  { id: '5e8b78a4ceae4e5193bed9bc3e7eab84', label: 'Voz Dulce ASMR' },
  { id: '4d730563a302401b87ea97e220ee5631', label: 'Voz Masculina Relax' },
  { id: '35199d5438854f5d9157c500479ab684', label: 'Narrador v2 — documental' },
  { id: '692eb1e1023242219dc8caae8c56fb12', label: 'Verity — neutra' },
]

export const FISH_TTS_MODELS = [
  { id: 's2.1-pro-free', label: 'S2.1 Pro Free — gratis (recomendado)' },
  { id: 's2.1-pro', label: 'S2.1 Pro — mejor calidad' },
  { id: 's2-pro', label: 'S2 Pro — generación anterior' },
]

const TTS_URL = 'https://api.fish.audio/v1/tts'
const MODELS_URL = 'https://api.fish.audio/model'
const TTS_PROXY = '/api/fish/tts'
const MODELS_PROXY = '/api/fish/model'

function getCloudFishProxyBase() {
  return (getSettings().fishProxyUrl || '').trim().replace(/\/$/, '')
}

function useFishProxy() {
  const h = window.location?.hostname || ''
  if (h === 'localhost' || h === '127.0.0.1') return true
  return Boolean(getCloudFishProxyBase())
}

function fishTtsUrl() {
  const cloud = getCloudFishProxyBase()
  if (cloud) return `${cloud}/tts`
  return useFishProxy() ? TTS_PROXY : TTS_URL
}

function fishModelsUrl(query = '') {
  const cloud = getCloudFishProxyBase()
  const base = cloud ? `${cloud}/model` : (useFishProxy() ? MODELS_PROXY : MODELS_URL)
  return query ? `${base}?${query}` : base
}

let audioCtx = null
let currentSource = null
let currentElement = null
let phraseTimer = null
let speaking = false
let speechQueue = []
let audioCache = new Map()
let speechGeneration = 0
let lastFishError = ''
let cachedVoiceList = null
let voiceListPromise = null
let fishProxyUnavailable = false

function getApiKey() {
  const fromSettings = (getSettings().fishApiKey || '').trim()
  return fromSettings || FISH_API_KEY || ''
}

export function hasFishTts() {
  const voice = getFishVoiceId()
  if (!voice) return false
  if (getCloudFishProxyBase() || useFishProxy()) return !fishProxyUnavailable
  return Boolean(getApiKey())
}

export function hasFishApiKey() {
  return Boolean(getCloudFishProxyBase()) || useFishProxy() || Boolean(getApiKey())
}

export function setFishProxyUrl(url) {
  const s = getSettings()
  s.fishProxyUrl = (url || '').trim().replace(/\/$/, '')
  saveSettings(s)
  fishProxyUnavailable = false
  audioCache.clear()
}

export function getFishProxyUrl() {
  return getCloudFishProxyBase()
}

export function getFishVoiceId() {
  return (getSettings().fishVoiceId || FISH_VOICE_ID || '').trim()
}

export function getFishVoiceTitle(id) {
  const vid = id || getFishVoiceId()
  const lib = FISH_LIBRARY_VOICES.find(v => v.id === vid)
  if (lib) return lib.label.replace(' ★', '')
  const mine = getCachedFishVoices().find(v => v.id === vid)
  return mine?.title || ''
}

export function getFishModel() {
  const m = getSettings().fishModel
  if (m && FISH_TTS_MODELS.some(x => x.id === m)) return m
  return 's2.1-pro-free'
}

export function getFishSpeed() {
  const s = Number(getSettings().fishSpeed)
  if (!Number.isFinite(s)) return 0.96
  return Math.max(0.85, Math.min(1.15, s))
}

export function setFishApiKey(key) {
  const s = getSettings()
  s.fishApiKey = (key || '').trim()
  saveSettings(s)
  cachedVoiceList = null
}

export function setFishVoiceId(id) {
  const s = getSettings()
  s.fishVoiceId = (id || '').trim()
  saveSettings(s)
  audioCache.clear()
}

export function setFishModel(id) {
  const s = getSettings()
  s.fishModel = FISH_TTS_MODELS.some(x => x.id === id) ? id : 's2.1-pro'
  saveSettings(s)
  audioCache.clear()
}

export function setFishSpeed(speed) {
  const s = getSettings()
  s.fishSpeed = Math.max(0.85, Math.min(1.15, Number(speed) || 0.96))
  saveSettings(s)
  audioCache.clear()
}

function cacheKey(text) {
  return `${getFishModel()}::${getFishVoiceId()}::${getFishSpeed()}::${text}`
}

function humanizeForSpeech(text) {
  return String(text)
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*…\s*/g, '... ')
    .replace(/\s+/g, ' ')
    .trim()
}

function setFishError(msg) {
  lastFishError = msg
  console.warn('[Calma] Fish Audio:', msg)
}

export function getLastFishError() {
  return lastFishError
}

/** Comprueba si el proxy local de Fish está activo (start-server.command). */
export async function probeFishProxy() {
  if (!useFishProxy()) return Boolean(getApiKey())
  try {
    const res = await fetch(fishTtsUrl(), { method: 'OPTIONS' })
    const ok = res.status === 204 || res.status === 200
    fishProxyUnavailable = !ok
    return ok
  } catch {
    fishProxyUnavailable = true
    return false
  }
}

async function ensureAudioContext() {
  audioCtx = await getCalmaAudioContext()
  return audioCtx
}

async function requestFishAudio(text) {
  const apiKey = getApiKey()
  const voiceId = getFishVoiceId()
  const proxied = useFishProxy()
  if (!proxied && !apiKey) throw new Error('Sin API key de Fish Audio')
  if (!voiceId) throw new Error('Falta el ID de voz — elige una en Ajustes → Calma')

  const headers = {
    'Content-Type': 'application/json',
    model: getFishModel(),
  }
  if (!proxied) headers.Authorization = `Bearer ${apiKey}`

  const res = await fetch(fishTtsUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: humanizeForSpeech(text),
      reference_id: voiceId,
      temperature: 0.72,
      top_p: 0.78,
      prosody: {
        speed: getFishSpeed(),
        volume: 0,
        normalize_loudness: true,
      },
      format: 'mp3',
      sample_rate: 44100,
      mp3_bitrate: 192,
      latency: 'normal',
      normalize: true,
      chunk_length: 300,
      min_chunk_length: 50,
      condition_on_previous_chunks: true,
      repetition_penalty: 1.1,
    }),
  })

  if (!res.ok) {
    if (proxied && (res.status === 404 || res.status === 501)) {
      fishProxyUnavailable = true
      throw new Error('Proxy Fish no disponible — abre con start-server.command (no python -m http.server)')
    }
    const err = await res.json().catch(() => ({}))
    const msg = err.message || err.reason || `Fish ${res.status}`
    if (res.status === 401) throw new Error('API key de Fish inválida')
    if (res.status === 402) throw new Error('Sin créditos en Fish Audio — recarga en fish.audio')
    if (res.status === 500 && proxied) {
      fishProxyUnavailable = true
      throw new Error('Proxy Fish sin API key — revisa js/fish-config.local.js')
    }
    throw new Error(msg)
  }

  const bytes = await res.arrayBuffer()
  const raw = bytes.slice(0)
  let buffer = null
  try {
    const ctx = await ensureAudioContext()
    buffer = await ctx.decodeAudioData(raw.slice(0))
  } catch (_) {}
  if (!raw.byteLength) throw new Error('Fish: respuesta de audio vacía')
  return { buffer, bytes: raw }
}

const inFlight = new Map()

async function fetchFishAudio(text) {
  await ensureFishConfig()
  const ck = cacheKey(text)
  if (audioCache.has(ck)) return audioCache.get(ck)
  if (inFlight.has(ck)) return inFlight.get(ck)

  const task = (async () => {
    const clip = await requestFishAudio(text)
    audioCache.set(ck, clip)
    if (audioCache.size > 40) audioCache.delete(audioCache.keys().next().value)
    lastFishError = ''
    return clip
  })()

  inFlight.set(ck, task)
  try {
    return await task
  } finally {
    inFlight.delete(ck)
  }
}

export async function fetchFishVoiceList() {
  await ensureFishConfig()
  const apiKey = getApiKey()
  if (!apiKey) return []

  const headers = useFishProxy() ? {} : { Authorization: `Bearer ${apiKey}` }
  const res = await fetch(fishModelsUrl('self=true&page_size=50&language=es'), { headers })
  if (!res.ok) return []

  const json = await res.json()
  return (json.items || [])
    .filter(m => m.type === 'tts' && m.state === 'trained')
    .map(m => ({ id: m._id, title: m.title || 'Sin nombre', state: m.state }))
}

export async function refreshFishVoiceList() {
  if (!hasFishApiKey()) {
    cachedVoiceList = []
    return cachedVoiceList
  }
  if (!voiceListPromise) {
    voiceListPromise = fetchFishVoiceList()
      .then(list => {
        cachedVoiceList = list
        return list
      })
      .finally(() => { voiceListPromise = null })
  }
  return voiceListPromise
}

export function getCachedFishVoices() {
  return cachedVoiceList || []
}

export function listFishVoiceOptions(selected = '') {
  const id = selected || getFishVoiceId()
  const opts = []
  if (!id) opts.push('<option value="">Elige una voz…</option>')
  for (const v of FISH_LIBRARY_VOICES) {
    opts.push(`<option value="${v.id}" ${v.id === id ? 'selected' : ''}>${v.label}</option>`)
  }
  for (const v of getCachedFishVoices()) {
    opts.push(`<option value="${v.id}" ${v.id === id ? 'selected' : ''}>${v.title} (clonada)</option>`)
  }
  const known = FISH_LIBRARY_VOICES.some(v => v.id === id) || getCachedFishVoices().some(v => v.id === id)
  if (id && !known) {
    const title = getFishVoiceTitle(id)
    opts.push(`<option value="${id}" selected>${title || `${id.slice(0, 14)}…`}</option>`)
  }
  return opts.join('')
}

function stopCurrentSource() {
  if (currentSource) {
    try { currentSource.stop() } catch (_) {}
    currentSource = null
  }
}

function stopCurrentElement() {
  if (!currentElement) return
  try {
    currentElement.pause()
    currentElement.removeAttribute('src')
    currentElement.load()
  } catch (_) {}
  currentElement = null
}

export function isFishSpeaking() {
  return speaking
}

export function stopFishSpeech() {
  speechGeneration++
  speechQueue = []
  speaking = false
  if (phraseTimer) clearTimeout(phraseTimer)
  phraseTimer = null
  stopCurrentSource()
  stopCurrentElement()
}

async function playFishMp3(bytes) {
  if (!bytes?.byteLength) throw new Error('Fish: sin datos de audio')
  stopCurrentElement()
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = getPrimedVoiceAudio()
  audio.volume = 0.96
  currentElement = audio
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(url)
      if (currentElement === audio) currentElement = null
    }
    const onDone = () => {
      audio.removeEventListener('ended', onDone)
      audio.removeEventListener('error', onErr)
      cleanup()
      resolve()
    }
    const onErr = () => {
      audio.removeEventListener('ended', onDone)
      audio.removeEventListener('error', onErr)
      cleanup()
      reject(new Error('No se pudo reproducir audio Fish'))
    }
    audio.addEventListener('ended', onDone)
    audio.addEventListener('error', onErr)
    audio.src = url
    audio.play().catch((err) => {
      onErr()
      reject(err)
    })
  })
}

export async function playFishBuffer(buffer) {
  const ctx = await ensureAudioContext()
  if (ctx.state === 'suspended') {
    try { await ctx.resume() } catch (_) {}
  }
  if (ctx.state !== 'running') unlockCalmaAudioOnGesture()
  const out = getVoiceOutputNode()
  if (!out) throw new Error('Bus de audio Calma no inicializado')
  stopCurrentSource()
  stopCurrentElement()
  return new Promise((resolve, reject) => {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(out)
    currentSource = source
    source.onended = () => {
      if (currentSource === source) currentSource = null
      resolve()
    }
    try {
      source.start(0)
    } catch (err) {
      currentSource = null
      reject(err)
    }
  })
}

async function playFishClip(clip) {
  await playFishMp3(clip?.bytes)
}

const PHRASE_MAX_CHARS = 280

function endPhrase(s) {
  const t = s.trim()
  return /[.!?…]$/.test(t) ? t : `${t}.`
}

/** Bloques largos = menos cortes = prosodia más natural (menos robótica) */
function splitPhrases(text) {
  const clean = humanizeForSpeech(text)
  if (!clean) return []
  if (clean.length <= PHRASE_MAX_CHARS) return [endPhrase(clean)]

  const sentences = clean.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(s => s.length > 1)
  const chunks = []
  let buf = ''

  for (const sentence of sentences) {
    const next = buf ? `${buf} ${sentence}` : sentence
    if (next.length <= PHRASE_MAX_CHARS) {
      buf = next
      continue
    }
    if (buf) chunks.push(endPhrase(buf))
    if (sentence.length <= PHRASE_MAX_CHARS) {
      buf = sentence
    } else {
      const parts = sentence.split(/,\s+/).filter(Boolean)
      let partBuf = ''
      for (const part of parts) {
        const candidate = partBuf ? `${partBuf}, ${part}` : part
        if (candidate.length <= PHRASE_MAX_CHARS) partBuf = candidate
        else {
          if (partBuf) chunks.push(endPhrase(partBuf))
          partBuf = part
        }
      }
      buf = partBuf
    }
  }
  if (buf) chunks.push(endPhrase(buf))
  return chunks.length ? chunks : [endPhrase(clean)]
}

function fishPauseMs(phrase, index, total, override) {
  if (override != null) return override
  if (total <= 1) return 350
  if (index === total - 1) return 500
  const words = phrase.replace(/[.!?…]+$/, '').split(/\s+/).length
  if (words < 12) return 750
  return 1050
}

function abortFishPhraseLoop(gen) {
  if (gen !== speechGeneration) {
    speaking = false
    return true
  }
  return false
}

async function speakPhrasesFish(phrases, { interrupt = true, pauseMs } = {}) {
  if (!phrases.length) return false
  if (interrupt) stopFishSpeech()

  const gen = speechGeneration
  let i = 0
  let played = false
  speaking = true

  try {
    while (i < phrases.length) {
      if (abortFishPhraseLoop(gen)) return played
      const phrase = phrases[i++]
      const clip = await fetchFishAudio(phrase)
      if (abortFishPhraseLoop(gen)) return played
      await playFishClip(clip)
      played = true
      if (i < phrases.length) {
        const gap = fishPauseMs(phrases[i - 1], i - 1, phrases.length, pauseMs)
        await new Promise(r => { phraseTimer = setTimeout(r, gap) })
        if (abortFishPhraseLoop(gen)) return played
      }
    }
  } catch (err) {
    setFishError(err.message || String(err))
    return played
  } finally {
    if (gen === speechGeneration) speaking = false
  }

  if (gen === speechGeneration && speechQueue.length) {
    const next = speechQueue.shift()
    const queued = await speakFishMeditation(next, { interrupt: false })
    return played || queued
  }
  return played
}

export async function prefetchFishTexts(texts) {
  await ensureFishConfig()
  if (!hasFishTts() || !texts?.length) return
  for (const text of texts) {
    for (const phrase of splitPhrases(text)) {
      try { await fetchFishAudio(phrase) } catch (_) {}
    }
  }
}

/** @returns {Promise<boolean>} true si se reprodujo al menos un fragmento */
export async function speakFishMeditation(text, { interrupt = true, pauseMs } = {}) {
  await ensureFishConfig()
  if (!text || !hasFishTts()) return false
  const phrases = splitPhrases(text)
  if (!phrases.length) return false

  if (speaking && !interrupt) {
    speechQueue.push(text)
    return true
  }
  if (speaking && interrupt) stopFishSpeech()

  return speakPhrasesFish(phrases, { interrupt, pauseMs })
}

export async function speakFishSequence(texts) {
  for (const text of texts) {
    if (!text) continue
    await speakFishMeditation(text, { interrupt: false, pauseMs: 900 })
  }
}

export async function previewFishVoice() {
  await ensureAudioContext()
  await speakFishMeditation(
    'Cierra los ojos un momento. No tienes que hacer nada perfecto. Solo quédate aquí, y respira.',
    { interrupt: true },
  )
}

export function getFishVoiceLabel() {
  const id = getFishVoiceId()
  if (!id) return 'Sin voz'
  const title = getFishVoiceTitle(id)
  return title || `${id.slice(0, 10)}…`
}

export function getFishVoiceHint() {
  if (!hasFishApiKey()) {
    return useFishProxy()
      ? 'Proxy Fish sin key — reinicia con start-server.command y revisa fish-config.local.js'
      : 'Pega tu API key de Fish Audio en Ajustes → Calma (fish.audio → API Keys).'
  }
  if (!getFishVoiceId()) {
    return 'Clona una voz en fish.audio y pega su ID en Ajustes → Calma.'
  }
  if (lastFishError) {
    if (lastFishError.includes('inválida')) return lastFishError
    if (lastFishError.includes('créditos')) return lastFishError
    return 'Error de Fish Audio — revisa key, ID de voz y conexión.'
  }
  return `Fish Audio · ${getFishVoiceLabel()} · modelo ${getFishModel()}`
}
