/** Sesiones Calma — protocolos con guion hablado */

import { PROGRAM_DEFINITIONS } from '/js/meditation-programs-data.js'
import { MEDITATION_STEPS } from '/js/meditation-steps-content.js'

export { MEDITATION_STEPS }

export const MED_CATEGORIES = {
  breath: { label: 'Respiración', icon: '◎', color: '#6ee7b7' },
  body: { label: 'Cuerpo', icon: '⬡', color: '#93c5fd' },
  focus: { label: 'Enfoque', icon: '◆', color: '#d4a012' },
  stress: { label: 'Regulación', icon: '⚡', color: '#f9a8d4' },
  sleep: { label: 'Sueño', icon: '☾', color: '#a78bfa' },
  restore: { label: 'Recuperación', icon: '⛊', color: '#34d399' },
}

export const MEDITATIONS = [
  { id: 'breathing', name: 'Ancla respiratoria', icon: '◎', category: 'breath', desc: 'Tres minutos para bajar el pulso.', hook: 'El exhalar largo le habla al nervio vago: el cuerpo entiende que puede soltar.', type: 'breathing', neuro: 'Exhalación prolongada → parasimpático.' },
  { id: 'box-breath', name: 'Ritmo cuadrado', icon: '▣', category: 'breath', desc: 'Cuatro tiempos iguales. Estabilidad bajo presión.', hook: 'Cuando todo acelera, la simetría del ritmo devuelve coherencia al sistema.', type: 'breathing', neuro: 'HRV y ritmo cardíaco más estables.' },
  { id: 'body-scan', name: 'Mapa corporal', icon: '⬡', category: 'body', desc: 'Recorrer el cuerpo sin corregir nada.', hook: 'La tensión suele vivir donde no miramos. Hoy solo observas.', type: 'steps', stepsKey: 'bodyScan', neuro: 'Ínsula e interocepción.' },
  { id: 'release', name: 'Soltar carga', icon: '▽', category: 'body', desc: 'Mandíbula, hombros, manos.', hook: 'No es relajarte a la fuerza. Es dejar de sostener lo que ya no necesitas.', type: 'steps', stepsKey: 'release', neuro: 'Señal de seguridad al tronco encefálico.' },
  { id: 'prefocus', name: 'Antes de ejecutar', icon: '◆', category: 'focus', desc: 'Una tarea. Un bloque. Sin ruido.', hook: 'La claridad no viene de hacer más. Viene de elegir una sola cosa.', type: 'steps', stepsKey: 'prefocus', neuro: 'Red atencional dorsal activa.' },
  { id: 'presleep', name: 'Bajar revoluciones', icon: '☾', category: 'sleep', desc: 'Transición hacia el descanso.', hook: 'El día ya terminó. El cuerpo puede aprender a creerlo.', type: 'steps', stepsKey: 'presleep', neuro: 'Ondas lentas y sueño profundo.' },
  { id: 'gratitude', name: 'Tres hechos reales', icon: '◇', category: 'restore', desc: 'Lo concreto que sí pasó hoy.', hook: 'La mente amplifica lo que falta. Esto entrena lo que funcionó.', type: 'steps', stepsKey: 'gratitude', neuro: 'PFC medial y regulación emocional.' },
  { id: 'walk', name: 'Paso consciente', icon: '➤', category: 'body', desc: 'Mente en los pies, no en el feed.', hook: 'Cada paso es un ancla. No tienes que llegar a ningún lado.', type: 'steps', stepsKey: 'walk', neuro: 'Regulación autonómica bilateral.' },
  { id: 'reset', name: 'Puente de dos minutos', icon: '⟲', category: 'focus', desc: 'Entre una tarea y la siguiente.', hook: 'Cierra el capítulo anterior antes de abrir el siguiente.', type: 'steps', stepsKey: 'reset', neuro: 'Menor costo de cambio de tarea.' },
  { id: 'stress', name: 'Cuando sube la presión', icon: '⚡', category: 'stress', desc: 'Urgencia sin pánico.', hook: 'La urgencia es una sensación, no una orden. Puedes sentirla sin obedecerla.', type: 'steps', stepsKey: 'stress', neuro: 'Amígdala down-regulada.' },
  { id: 'recovery', name: 'Modo restaurar', icon: '⛊', category: 'restore', desc: 'Después del esfuerzo.', hook: 'Recuperar no es flojera. Es parte del rendimiento.', type: 'steps', stepsKey: 'recovery', neuro: 'Parasimpático dominante.' },
  { id: 'focus-deep', name: 'Bloque profundo', icon: '◎', category: 'focus', desc: 'Entrar sin distracción.', hook: 'Diez respiraciones sin moverte. Eso es el umbral del flow.', type: 'steps', stepsKey: 'focusDeep', neuro: 'Dopamina estable, atención sostenida.' },
  { id: 'morning', name: 'Primeros minutos', icon: '↑', category: 'focus', desc: 'Antes del teléfono.', hook: 'El día se inclina hacia lo primero que alimentas. Elige con calma.', type: 'steps', stepsKey: 'morning', neuro: 'Ritmo circadiano y cortisol.' },
  { id: 'loving', name: 'Tono amable', icon: '◈', category: 'restore', desc: 'Hablar contigo sin dureza.', hook: 'La voz con la que te hablas se convierte en tu clima interno.', type: 'steps', stepsKey: 'loving', neuro: 'Ínsula y cíngulo anterior.' },
  { id: 'grounding-54321', name: 'Anclaje sensorial', icon: '⬢', category: 'stress', desc: '5-4-3-2-1. Volver al presente.', hook: 'Cuando la mente corre, los sentidos te devuelven al aquí.', type: 'steps', stepsKey: 'grounding54321', neuro: 'PFC y tálamo — presente.' },
  { id: 'anxiety-wave', name: 'Surfear la ola', icon: '〜', category: 'stress', desc: 'Dejar que pase sin pelear.', hook: 'Lo que resistes persiste. Lo que permites... se mueve.', type: 'steps', stepsKey: 'anxietyWave', neuro: 'Aceptación y respiración larga.' },
  { id: 'self-compassion', name: 'Menos autocrítica', icon: '♡', category: 'restore', desc: 'El trato que mereces.', hook: 'Si un amigo fallara igual, ¿qué le dirías? Eso también es para ti.', type: 'steps', stepsKey: 'selfCompassion', neuro: 'Reduce rigidez autocrítica.' },
  { id: 'meeting-prep', name: 'Antes de entrar', icon: '◉', category: 'focus', desc: 'Presencia sin defensa.', hook: 'No necesitas impresionar. Necesitas estar ahí.', type: 'steps', stepsKey: 'meetingPrep', neuro: 'Atención ejecutiva sin amenaza.' },
  { id: 'after-work', name: 'Soltar el día', icon: '▾', category: 'sleep', desc: 'Cierre antes de casa.', hook: 'Lo que no cierras, lo cargas en la cena. Suelta el trabajo aquí.', type: 'steps', stepsKey: 'afterWork', neuro: 'Transición ejecutiva → recuperación.' },
  { id: 'power-nap', name: 'Descanso breve', icon: '◌', category: 'sleep', desc: 'Diez minutos sin perderte.', hook: 'No tienes que dormir. Solo dejar que el sistema baje un poco.', type: 'steps', stepsKey: 'powerNap', neuro: 'Micro-sueño N1/N2.' },
  { id: 'transition-breath', name: 'Entre bloques', icon: '⇄', category: 'focus', desc: 'Puente de dos minutos.', hook: 'Una respiración entre tareas vale más que abrir otra pestaña.', type: 'steps', stepsKey: 'transitionBreath', neuro: 'Reduce switching cost.' },
  { id: 'social-reset', name: 'Después de hablar', icon: '◫', category: 'stress', desc: 'Volver a tu centro.', hook: 'No reescenas la conversación. Solo vuelves a ti.', type: 'steps', stepsKey: 'socialReset', neuro: 'Regula rumiación social.' },
  { id: 'digital-detox', name: 'Post-pantalla', icon: '⊘', category: 'restore', desc: 'Bajar estimulación.', hook: 'Tus ojos y tu sistema nervioso necesitan un margen antes del siguiente scroll.', type: 'steps', stepsKey: 'digitalDetox', neuro: 'Transición dopaminérgica.' },
  { id: 'panic-anchor', name: 'Ancla de emergencia', icon: '⚓', category: 'stress', desc: 'Cuando el cuerpo dispara.', hook: 'Esto es intenso, pero estás a salvo en este momento. Vamos paso a paso.', type: 'steps', stepsKey: 'panicAnchor', neuro: 'Vago + grounding físico.' },
  { id: 'anger-cool', name: 'Enfriar la ira', icon: '❄', category: 'stress', desc: 'Antes de responder.', hook: 'La rabia es información, no una orden. Respira antes del mensaje.', type: 'steps', stepsKey: 'angerCool', neuro: 'Amígdala → PFC vía pausa.' },
  { id: 'exam-prep', name: 'Antes del examen', icon: '◈', category: 'focus', desc: 'Nervios útiles, no parálisis.', hook: 'Un poco de adrenalina ayuda. Demasiada nubla. Equilibra aquí.', type: 'steps', stepsKey: 'examPrep', neuro: 'Cortisol modulado por respiración.' },
  { id: 'commute-calm', name: 'En el camino', icon: '⇢', category: 'body', desc: 'Tráfico, metro, espera.', hook: 'No puedes controlar el retraso. Sí cómo llegas por dentro.', type: 'steps', stepsKey: 'commuteCalm', neuro: 'Regulación autonómica en movimiento.' },
  { id: 'creativity-open', name: 'Abrir creatividad', icon: '✦', category: 'focus', desc: 'Espacio para ideas nuevas.', hook: 'No fuerces la chispa. Crea el clima donde puede aparecer.', type: 'steps', stepsKey: 'creativityOpen', neuro: 'Red default mode + PFC relajada.' },
  { id: 'grief-space', name: 'Espacio para el duelo', icon: '◌', category: 'restore', desc: 'Sin apurar el proceso.', hook: 'El dolor no es un bug. Es amor con lugar incierto.', type: 'steps', stepsKey: 'griefSpace', neuro: 'Validación emocional + vagal.' },
  { id: 'breath-478', name: 'Respiración 4-7-8', icon: '◎', category: 'breath', desc: 'Sueño y ansiedad leve.', hook: 'Inhala 4, sostén 7, exhala 8. El cuerpo entiende la señal.', type: 'breathing', neuro: 'Activación parasimpática rápida.' },
  { id: 'midday-reset', name: 'Reset de mediodía', icon: '☀', category: 'focus', desc: 'Evita el bajón de las 3 pm.', hook: 'La tarde no tiene que ser un desastre. Tres minutos cambian el tono.', type: 'steps', stepsKey: 'middayReset', neuro: 'Reactivación atencional.' },
]

export const MEDITATION_INTROS = {
  breathing: 'No tienes que hacerlo perfecto. Solo quédate donde estás y deja que el círculo marque el ritmo. Tres minutos bastan.',
  'box-breath': 'Cuatro tiempos iguales: inhala, sostén, exhala, pausa. Cuando todo acelera, la simetría devuelve orden al cuerpo.',
  'body-scan': 'No hay nada que arreglar en estos minutos. Solo recorrer el cuerpo con curiosidad, de pies a cabeza.',
  release: 'La tensión suele vivir donde no miramos. Hoy sueltas mandíbula, hombros y manos, sin tener que entender por qué.',
  prefocus: 'Antes de abrir otra pestaña: una sola tarea. Visualiza los primeros dos minutos. Eso es todo por ahora.',
  presleep: 'El día ya terminó. Lo pendiente tendrá su turno mañana. Ahora el cuerpo puede empezar a creerlo.',
  gratitude: 'La mente amplifica lo que falta. Hoy entrenas lo contrario: tres cosas reales de hoy, sin inflarlas.',
  walk: 'No tienes que llegar a ningún lado. Camina lento y deja la mente en los pies.',
  reset: 'Cierra el capítulo anterior. Nombra el siguiente. Dos minutos que valen más que abrir otra app.',
  stress: 'La presión es real. Y también lo es que puedes respirar dentro de ella, sin apagar el motor.',
  recovery: 'Estos minutos no son para rendir. Son para que el cuerpo recupere lo que gastó.',
  'focus-deep': 'Quita una distracción física. Diez respiraciones quietas. Eso es el umbral del enfoque.',
  morning: 'Antes del teléfono: tres respiraciones y una misión para el día. Una sola.',
  loving: 'La voz con la que te hablas se vuelve tu clima interno. Hoy, un tono más amable.',
  'grounding-54321': 'Cuando la mente corre al futuro, los sentidos te devuelven al cuerpo. Cinco, cuatro, tres, dos, uno.',
  'anxiety-wave': 'Lo que resistes persiste. Hoy practicas dejar que la ola suba y baje sin ahogarte.',
  'self-compassion': 'Si un amigo estuviera en lo mismo, ¿qué le dirías? Ese mismo trato es para ti.',
  'meeting-prep': 'No necesitas impresionar. Necesitas estar presente, escuchar y responder con calma.',
  'after-work': 'Lo que no cierras aquí, lo cargas en la cena. Deja el trabajo en este momento.',
  'power-nap': 'No tienes que dormir. Solo dejar que el sistema baje un poco. Diez minutos cuentan.',
  'transition-breath': 'Entre una tarea y otra: cierra la anterior, respira, abre la siguiente sin el teléfono.',
  'social-reset': 'La conversación ya pasó. No la reescribes. Vuelves a ti con tres respiraciones.',
  'digital-detox': 'Tus ojos y tu sistema nervioso necesitan un margen antes del siguiente scroll.',
  'panic-anchor': 'Esto se siente muy fuerte. Estás a salvo en este momento. Vamos paso a paso, juntos.',
  'anger-cool': 'No tienes que responder ahora. Primero baja el volumen interno. Luego decides.',
  'exam-prep': 'Has preparado lo que pudiste. Ahora el cuerpo necesita creer que puede rendir sin pánico.',
  'commute-calm': 'El trayecto también es tuyo. Suelta mandíbula y hombros aunque el mundo apure.',
  'creativity-open': 'Las ideas llegan cuando dejas de perseguirlas. Observa sin juzgar.',
  'grief-space': 'No tienes que estar bien. Solo quédate un momento con lo que sientes.',
  'breath-478': 'Cuatro entradas, siete de pausa, ocho de salida. Deja que el ritmo te guíe.',
  'midday-reset': 'La mañana ya pasó. Respira y elige una sola prioridad para lo que queda del día.',
}

export function getMeditationIntro(id) {
  const meta = getMeditationById(id)
  return MEDITATION_INTROS[id] || (meta ? `Comenzamos ${meta.name.toLowerCase()}.` : '')
}

export const SESSION_AMBIENT = {
  breathing: 'zen',
  'box-breath': 'zen',
  'body-scan': 'om',
  release: 'forest',
  prefocus: 'cafe',
  presleep: 'om',
  gratitude: 'shrine',
  walk: 'bamboo',
  reset: 'stream',
  stress: 'tormenta',
  recovery: 'lago',
  'focus-deep': 'cafe',
  morning: 'amanecer',
  loving: 'shrine',
  'grounding-54321': 'chimes',
  'anxiety-wave': 'ocean',
  'self-compassion': 'zen',
  'meeting-prep': 'cafe',
  'after-work': 'night',
  'power-nap': 'rain',
  'transition-breath': 'chimes',
  'social-reset': 'lago',
  'digital-detox': 'wind',
  'panic-anchor': 'om',
  'anger-cool': 'tormenta',
  'exam-prep': 'cafe',
  'commute-calm': 'wind',
  'creativity-open': 'jardin',
  'grief-space': 'lago',
  'breath-478': 'night',
  'midday-reset': 'amanecer',
}

export const MEDITATION_PROGRAMS = PROGRAM_DEFINITIONS.map(p => ({
  id: p.id,
  name: p.name,
  days: p.days.length,
  desc: p.purpose,
  purpose: p.purpose,
  promise: p.promise,
  audience: p.audience,
  schedule: p.days.map(d => d.sessionId),
  dayPlan: p.days,
}))

export const PROGRAM_CATALOG = Object.fromEntries(PROGRAM_DEFINITIONS.map(p => [
  p.id,
  {
    icon: p.icon,
    tagline: p.tagline,
    focus: p.focus,
    level: p.level,
    levelColor: p.levelColor,
    ambient: p.ambient,
    minutesPerDay: p.minutesPerDay,
    outcome: p.promise,
    purpose: p.purpose,
    audience: p.audience,
    phases: p.phases,
  },
]))

export function getProgramCatalog(programId) {
  return PROGRAM_CATALOG[programId] || null
}

export function getProgramDayPlan(programId, dayNumber) {
  const prog = MEDITATION_PROGRAMS.find(p => p.id === programId)
  if (!prog?.dayPlan?.length) return null
  const idx = Math.max(0, Math.min(prog.dayPlan.length - 1, (dayNumber || 1) - 1))
  return { ...prog.dayPlan[idx], day: idx + 1 }
}

export function getProgramDayIntro(programId, dayNumber) {
  const plan = getProgramDayPlan(programId, dayNumber)
  if (plan?.intro) return plan.intro
  const sid = plan?.sessionId
  return sid ? getMeditationIntro(sid) : ''
}

export function getSessionAmbient(sessionId) {
  return SESSION_AMBIENT[sessionId] || 'forest'
}

export function getAmbientLabel(ambientId) {
  const labels = {
    rain: 'Lluvia', ocean: 'Olas', forest: 'Bosque', wind: 'Viento', stream: 'Arroyo',
    fire: 'Fogata', night: 'Noche', cascada: 'Cascada', amanecer: 'Amanecer', cafe: 'Café',
    lago: 'Lago', tormenta: 'Tormenta', jardin: 'Jardín',
    zen: 'Jardín zen', om: 'Om profundo', chimes: 'Cuencos', bamboo: 'Agua zen', shrine: 'Santuario',
  }
  return labels[ambientId] || ambientId
}

export function getMeditationById(id) {
  return MEDITATIONS.find(m => m.id === id) || null
}
