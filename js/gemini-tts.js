/** Voz Calma con Gemini TTS (API gratuita de AI Studio) */

import { getSettings, saveSettings } from '/js/core.js'
import { ensureGeminiConfig, GEMINI_API_KEY } from '/js/gemini-config.js'

const TTS_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview']
const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'

export const GEMINI_MEDITATION_VOICES = [
  { id: 'Despina', label: 'Despina — serena', desc: 'Recomendada · cálida y natural' },
  { id: 'Vindemiatrix', label: 'Vindemiatrix — gentil', desc: 'Suave y cercana' },
  { id: 'Enceladus', label: 'Enceladus — respirada', desc: 'Íntima, pausada' },
  { id: 'Algieba', label: 'Algieba — fluida', desc: 'Calma y estable' },
  { id: 'Achernar', label: 'Achernar — neutra', desc: 'Más robótica' },
  { id: 'Kore', label: 'Kore — firme', desc: 'Clara y directa' },
]

let audioCtx = null
let currentSource = null
let phraseTimer = null
let speaking = false
let speechQueue = []
let audioCache = new Map()
let speechGeneration = 0
let lastGeminiError = ''

function getApiKey() {
  const fromSettings = (getSettings().geminiApiKey || '').trim()
  return fromSettings || GEMINI_API_KEY || ''
}

export function hasGeminiTts() {
  return Boolean(getApiKey())
}

export function getGeminiVoiceId() {
  const v = getSettings().geminiVoice
  if (v && GEMINI_MEDITATION_VOICES.some(x => x.id === v)) return v
  return 'Despina'
}

export function setGeminiVoiceId(id) {
  const s = getSettings()
  s.geminiVoice = id
  saveSettings(s)
}

export function setGeminiApiKey(key) {
  const s = getSettings()
  s.geminiApiKey = (key || '').trim()
  saveSettings(s)
}

function cacheKey(text, voice) {
  return `${voice}::${text}`
}

/** Texto plano — tags tipo [slowly] suenan artificiales en Gemini. */
function buildMeditationPrompt(text) {
  return String(text).replace(/\s+/g, ' ').trim()
}

function extractAudioBlock(json) {
  const steps = json?.steps || json?.interaction?.steps || []
  for (const step of steps) {
    for (const block of step?.content || []) {
      if (block?.type === 'audio' && block?.data) {
        return { data: block.data, mimeType: block.mime_type || 'audio/wav' }
      }
    }
  }
  const legacy = json?.output_audio || json?.interaction?.output_audio
  if (legacy?.data) return { data: legacy.data, mimeType: legacy.mime_type || 'audio/wav' }
  const inline = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData
  if (inline?.data) return { data: inline.data, mimeType: inline.mimeType || 'audio/wav' }
  return null
}

function setGeminiError(msg) {
  lastGeminiError = msg
  console.warn('[Calma] Gemini TTS:', msg)
}

export function getLastGeminiError() {
  return lastGeminiError
}

async function ensureAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  return audioCtx
}

function pcm16ToAudioBuffer(pcmBytes, ctx, sampleRate = 24000) {
  const samples = pcmBytes.byteLength / 2
  const buffer = ctx.createBuffer(1, samples, sampleRate)
  const channel = buffer.getChannelData(0)
  const view = new DataView(pcmBytes)
  for (let i = 0; i < samples; i++) {
    channel[i] = view.getInt16(i * 2, true) / 32768
  }
  return buffer
}

async function decodeAudioBytes(bytes, mimeType) {
  const ctx = await ensureAudioContext()
  if (mimeType.includes('l16') || mimeType.includes('pcm')) {
    return pcm16ToAudioBuffer(bytes, ctx, 24000)
  }
  try {
    return await ctx.decodeAudioData(bytes.slice(0))
  } catch {
    return pcm16ToAudioBuffer(bytes, ctx, 24000)
  }
}

function decodeAudioBlock(block) {
  const raw = Uint8Array.from(atob(block.data), c => c.charCodeAt(0))
  return decodeAudioBytes(raw.buffer, block.mimeType)
}

async function requestGeminiInteractions(text, model, apiKey, voice, useLegacyModalities = false) {
  const body = {
    model,
    input: buildMeditationPrompt(text),
    generation_config: {
      speech_config: [{ voice, language: 'es-MX' }],
    },
  }
  if (useLegacyModalities) {
    body.response_modalities = ['audio']
  } else {
    body.response_format = { type: 'audio' }
  }

  const res = await fetch(INTERACTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`${model} ${res.status}: ${errText.slice(0, 160)}`)
  }
  const json = await res.json()
  const block = extractAudioBlock(json)
  if (!block?.data) throw new Error(`${model}: sin audio en respuesta`)
  return decodeAudioBlock(block)
}

async function requestGeminiGenerateContent(text, model, apiKey, voice) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildMeditationPrompt(text) }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`${model} gen ${res.status}: ${errText.slice(0, 160)}`)
  }
  const json = await res.json()
  const block = extractAudioBlock(json)
  if (!block?.data) throw new Error(`${model} gen: sin audio en respuesta`)
  return decodeAudioBlock(block)
}

async function requestGeminiAudio(text, model, apiKey, voice) {
  const attempts = [
    () => requestGeminiInteractions(text, model, apiKey, voice, false),
    () => requestGeminiInteractions(text, model, apiKey, voice, true),
    () => requestGeminiGenerateContent(text, model, apiKey, voice),
  ]
  let lastErr = null
  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error(`${model}: sin audio`)
}

const inFlight = new Map()

async function fetchGeminiAudio(text) {
  await ensureGeminiConfig()
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Sin API key de Gemini')

  const voice = getGeminiVoiceId()
  const key = cacheKey(text, voice)
  if (audioCache.has(key)) return audioCache.get(key)
  if (inFlight.has(key)) return inFlight.get(key)

  const task = (async () => {
    let lastErr = null
    for (const model of TTS_MODELS) {
      try {
        const buffer = await requestGeminiAudio(text, model, apiKey, voice)
        audioCache.set(key, buffer)
        if (audioCache.size > 40) audioCache.delete(audioCache.keys().next().value)
        lastGeminiError = ''
        return buffer
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('Gemini TTS falló')
  })()

  inFlight.set(key, task)
  try {
    return await task
  } finally {
    inFlight.delete(key)
  }
}

function stopCurrentSource() {
  if (currentSource) {
    try { currentSource.stop() } catch (_) {}
    currentSource = null
  }
}

export function stopGeminiSpeech() {
  speechGeneration++
  speechQueue = []
  speaking = false
  if (phraseTimer) clearTimeout(phraseTimer)
  phraseTimer = null
  stopCurrentSource()
}

export async function playGeminiBuffer(buffer) {
  const ctx = await ensureAudioContext()
  stopCurrentSource()
  return new Promise((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    currentSource = source
    source.onended = () => {
      if (currentSource === source) currentSource = null
      resolve()
    }
    source.start(0)
  })
}

function splitPhrases(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (!clean) return []
  return clean
    .split(/(?<=[.!?…])\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 1)
}

async function speakPhrasesGemini(phrases, { interrupt = true, pauseMs = 1400 } = {}) {
  if (!phrases.length) return
  if (interrupt) stopGeminiSpeech()

  const gen = speechGeneration
  let i = 0
  speaking = true

  while (i < phrases.length) {
    if (gen !== speechGeneration) return
    const phrase = phrases[i++]
    try {
      const buffer = await fetchGeminiAudio(phrase)
      if (gen !== speechGeneration) return
      await playGeminiBuffer(buffer)
    } catch (err) {
      setGeminiError(err.message || String(err))
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
    await speakGeminiMeditation(next, { interrupt: false })
  }
}

export function isGeminiSpeaking() {
  return speaking
}

export function waitForGeminiIdle() {
  if (!speaking) return Promise.resolve()
  return new Promise(resolve => {
    const tick = () => {
      if (!speaking) resolve()
      else setTimeout(tick, 120)
    }
    tick()
  })
}

export async function prefetchGeminiTexts(texts) {
  await ensureGeminiConfig()
  if (!hasGeminiTts() || !texts?.length) return
  for (const text of texts) {
    const phrases = splitPhrases(text)
    for (const phrase of phrases) {
      try { await fetchGeminiAudio(phrase) } catch (_) {}
    }
  }
}

export async function speakGeminiMeditation(text, { interrupt = true, pauseMs } = {}) {
  await ensureGeminiConfig()
  if (!text || !hasGeminiTts()) return
  const phrases = splitPhrases(text)
  if (!phrases.length) return

  if (speaking && !interrupt) {
    speechQueue.push(text)
    return waitForGeminiIdle()
  }
  if (speaking && interrupt) stopGeminiSpeech()

  const gap = pauseMs ?? (phrases.length > 2 ? 1800 : 1400)
  await speakPhrasesGemini(phrases, { interrupt, pauseMs: gap })
}

export async function speakGeminiSequence(texts) {
  for (const text of texts) {
    if (!text) continue
    await speakGeminiMeditation(text, { interrupt: false, pauseMs: 2000 })
  }
}

export async function previewGeminiVoice() {
  await ensureAudioContext()
  await speakGeminiMeditation(
    'Cierra los ojos un momento. No tienes que hacer nada perfecto. Solo quédate aquí, y respira.',
    { interrupt: true },
  )
}

export function listGeminiVoiceOptions(selected = '') {
  const id = selected || getGeminiVoiceId()
  return GEMINI_MEDITATION_VOICES.map(v =>
    `<option value="${v.id}" ${v.id === id ? 'selected' : ''}>${v.label} ★</option>`,
  ).join('')
}

export function getGeminiVoiceHint() {
  if (!hasGeminiTts()) {
    return 'Pega tu API key gratuita de Gemini en Ajustes → Calma (AI Studio).'
  }
  if (lastGeminiError) {
    const short = lastGeminiError.includes('401') || lastGeminiError.includes('403')
      ? 'API key inválida — revisa Ajustes → Calma.'
      : 'Error de voz Gemini — prueba de nuevo o revisa tu conexión.'
    return short
  }
  return 'Voz Gemini activa · requiere internet · capa gratuita de AI Studio.'
}
