/** Contenido Calma mejorado con Gemini — guiones por día de programa */

import { getItem, setItem, getSettings } from './core.js'
import { ensureGeminiConfig, GEMINI_API_KEY } from './gemini-config.js'
import { getMeditationById, getProgramDayPlan, MEDITATION_PROGRAMS } from './meditations.js?v=141'

const TEXT_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite']
const CACHE_VERSION = 2
const CACHE_KEY = 'geminiMeditationContent'

const SYSTEM = `Eres guionista experto en meditaciones guiadas en español (México, tú informal pero cálido).
Escribes para VOZ HABLADA: frases cortas, concretas, sin misticismo barato, sin "visualiza tu luz interior", sin clichés de app genérica.
Cada paso debe sentirse útil HOY, conectado al día del programa.
Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra.`

function getApiKey() {
  const fromSettings = (getSettings().geminiApiKey || '').trim()
  return fromSettings || GEMINI_API_KEY || ''
}

export function hasGeminiContent() {
  return Boolean(getApiKey())
}

export function isGeminiProgramsEnabled() {
  const s = getSettings()
  return s.medGeminiPrograms !== false && hasGeminiContent()
}

function cacheId(programId, dayNumber, sessionId) {
  return `v${CACHE_VERSION}:${programId}:${dayNumber}:${sessionId}`
}

function readCache() {
  return getItem(CACHE_KEY, {})
}

function writeCacheEntry(id, data) {
  const all = readCache()
  all[id] = { ...data, savedAt: Date.now() }
  const keys = Object.keys(all)
  if (keys.length > 80) {
    keys.sort((a, b) => (all[a].savedAt || 0) - (all[b].savedAt || 0))
    keys.slice(0, keys.length - 80).forEach(k => delete all[k])
  }
  setItem(CACHE_KEY, all)
}

function parseJsonResponse(raw) {
  const text = String(raw || '').trim()
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1].trim() : text
  return JSON.parse(body)
}

async function requestGeminiJson(prompt) {
  await ensureGeminiConfig()
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Sin API key de Gemini')

  let lastErr = null
  for (const model of TEXT_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        },
      )
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`${model} ${res.status}: ${errText.slice(0, 200)}`)
      }
      const json = await res.json()
      const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!raw) throw new Error(`${model}: sin texto`)
      return parseJsonResponse(raw)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('Gemini contenido falló')
}

function normalizeSteps(baseSteps, enhancedSteps) {
  if (!Array.isArray(enhancedSteps) || !enhancedSteps.length) return null
  return baseSteps.map((base, i) => {
    const e = enhancedSteps[i] || enhancedSteps[Math.min(i, enhancedSteps.length - 1)]
    if (!e?.text && !e?.voice) return base
    return {
      ...base,
      text: String(e.text || base.text).trim(),
      voice: String(e.voice || e.text || base.voice).trim(),
      duration: base.duration,
    }
  })
}

function buildPrompt(programId, dayNumber, sessionId, dayPlan, baseSteps, baseIntro) {
  const program = MEDITATION_PROGRAMS.find(p => p.id === programId)
  const meta = getMeditationById(sessionId)
  const stepsJson = baseSteps.map(s => ({ text: s.text, voice: s.voice }))
  return `Programa: ${program?.name || programId}
Propósito del programa: ${program?.purpose || ''}
Día ${dayNumber} de ${program?.days || '?'}
Título del día: ${dayPlan?.title || ''}
Intención: ${dayPlan?.intention || ''}
Habilidad que entrena: ${dayPlan?.skill || ''}
Fase: ${dayPlan?.phase || ''}
Sesión: ${meta?.name || sessionId} — ${meta?.hook || meta?.desc || ''}

Intro actual (mejórala para este día, 2-4 frases habladas):
${baseIntro}

Pasos actuales (${baseSteps.length} pasos — mantén exactamente ${baseSteps.length}):
${JSON.stringify(stepsJson, null, 2)}

Reescribe intro y pasos para que suenen humanos, específicos a ESTE día del programa, y útiles en la vida real.
"voice" = guion hablado (más largo y cálido que "text"). "text" = lo que se lee en pantalla (más breve).

JSON:
{"intro":"...","steps":[{"text":"...","voice":"..."}]}`
}

export async function getOrCreateGeminiDayContent(programId, dayNumber, sessionId, baseSteps, baseIntro) {
  if (!isGeminiProgramsEnabled() || !baseSteps?.length) {
    return { intro: baseIntro, steps: baseSteps, source: 'static' }
  }

  const dayPlan = getProgramDayPlan(programId, dayNumber)
  const id = cacheId(programId, dayNumber, sessionId)
  const cached = readCache()[id]
  if (cached?.intro && cached?.steps?.length === baseSteps.length) {
    return { intro: cached.intro, steps: cached.steps, source: 'cache' }
  }

  const prompt = buildPrompt(programId, dayNumber, sessionId, dayPlan, baseSteps, baseIntro)
  const json = await requestGeminiJson(prompt)
  const steps = normalizeSteps(baseSteps, json.steps)
  if (!steps || !json.intro) throw new Error('Respuesta Gemini inválida')

  writeCacheEntry(id, { intro: json.intro, steps })
  return { intro: json.intro, steps, source: 'gemini' }
}

export async function prefetchGeminiDayContent(programId, dayNumber, sessionId, baseSteps, baseIntro) {
  try {
    return await getOrCreateGeminiDayContent(programId, dayNumber, sessionId, baseSteps, baseIntro)
  } catch (e) {
    console.warn('[Calma] Gemini contenido:', e)
    return { intro: baseIntro, steps: baseSteps, source: 'static', error: e.message }
  }
}

export function clearGeminiContentCache(programId) {
  const all = readCache()
  Object.keys(all).forEach(k => {
    if (!programId || k.includes(`:${programId}:`)) delete all[k]
  })
  setItem(CACHE_KEY, all)
}
