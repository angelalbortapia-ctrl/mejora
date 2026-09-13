/** Contexto de programa en sesiones guiadas — sin depender de Gemini */

import { getProgramDayPlan } from '/js/meditations.js'

const STEP_BRIDGES = [
  'Sigue conmigo.',
  'Quédate en esto un momento.',
  'Sin apuro.',
  'Nota qué cambia en el cuerpo.',
  'Vuelve si la mente se fue.',
]

function pickBridge(index) {
  return STEP_BRIDGES[index % STEP_BRIDGES.length]
}

/** Intro + pasos con intención del día, instrucciones habladas y texto útil en pantalla */
export function enrichProgramSession(programId, dayNumber, intro, steps) {
  const plan = getProgramDayPlan(programId, dayNumber)
  if (!plan || !steps?.length) return { intro, steps }

  const dayIntro = plan.intro || intro
  const total = steps.length

  const enriched = steps.map((step, index) => {
    const baseVoice = String(step.voice || step.text || '').trim()
    const baseText = String(step.text || '').trim()
    const isFirst = index === 0
    const isLast = index === total - 1

    let voice = baseVoice
    if (isFirst) {
      voice = `Día ${dayNumber}. Hoy entrenamos ${plan.skill}. ${baseVoice}`
    } else if (isLast) {
      voice = `${baseVoice} Antes de terminar: ${plan.intention}`
    } else if (index % 2 === 0) {
      voice = `${pickBridge(index)} ${baseVoice}`
    }

    let text = baseText
    if (isFirst && plan.intention) {
      text = plan.intention
    } else if (!text || text.length < 12) {
      text = baseVoice.length > 90 ? `${baseVoice.slice(0, 87)}…` : baseVoice
    }

    return { ...step, text, voice }
  })

  return { intro: dayIntro, steps: enriched }
}
