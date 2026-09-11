/** Copy humano — claro, cercano, sin postureo */

const MISSION_COPY = {
  routine: {
    label: 'Rutina de la mañana',
    brief: 'Respiración, un poco de movimiento mental y una reflexión breve (~8 min).',
    why: 'Empezar con intención cambia el tono de todo lo que sigue.',
  },
  habits2: {
    label: 'Dos hábitos',
    brief: 'Marca al menos dos de tu lista. No tiene que ser perfecto.',
    why: 'La repetición tranquila construye más que un día heroico.',
  },
  habits3: {
    label: 'Tres hábitos',
    brief: 'Tres victorias pequeñas hoy. Si uno cuesta, bájale la meta.',
    why: 'Tres pasos constantes valen más que una semana de intención.',
  },
  mental: {
    label: 'Neurociencia',
    brief: 'Una lección de Academia o sesión de laboratorio (~15–20 min).',
    why: 'Cada lección cubre regiones cerebrales, circuitos y evidencia — no productividad genérica.',
  },
  reflect: {
    label: 'Escribir en el diario',
    brief: 'Unas líneas honestas. Con 15 caracteres ya cuenta.',
    why: 'Poner en palabras lo que pasó ayuda a soltarlo y dormir mejor.',
  },
  meditate: {
    label: 'Un momento de calma',
    brief: 'Meditación guiada o respiración. 5 minutos bastan si el día está pesado.',
    why: 'Tu cuerpo necesita señales repetidas para bajar el ritmo.',
  },
  focus: {
    label: 'Bloque de enfoque',
    brief: '25 minutos en una sola cosa. Teléfono lejos.',
    why: 'Cada interrupción te cuesta mucho más de lo que parece recuperar.',
  },
  express: {
    label: 'Rutina corta',
    brief: 'Versión de 5 min si no tienes tiempo para la completa.',
    why: 'Volver aunque sea poquito protege tu racha mejor que desaparecer.',
  },
  plan_review: {
    label: 'Revisar el día',
    brief: 'Mira tu lista y elige qué harás primero.',
    why: 'Decidir antes ahorra energía para cuando toque actuar.',
  },
  morning: {
    label: 'Definir la intención',
    brief: 'Antes del correo: ¿qué haría que hoy valga la pena?',
    why: 'Sin intención, el día lo llena quien más te interrumpa.',
  },
  evening: {
    label: 'Cerrar el día',
    brief: 'Anota ánimo y una reflexión. Sin juzgarte.',
    why: 'Lo que nombras lo procesas; lo que ignoras se queda dando vueltas.',
  },
}

export function enrichMission(task) {
  const copy = MISSION_COPY[task.id] || MISSION_COPY[task.type]
  if (!copy) return task
  return { ...task, label: copy.label || task.label, brief: copy.brief, why: copy.why }
}

export const GOAL_COACH = {
  streak: {
    desc: 'Se trata de volver, no de ser perfecto.',
    weekly: 'Tu racha mide constancia, no perfección. ¿Volviste ayer?',
    tip: 'Si fallas un día, el siguiente cuenta doble si regresas sin culpa.',
  },
  routines: {
    desc: 'Treinta rutinas son treinta veces que elegiste cuidarte.',
    weekly: '¿Cuántas rutinas llevas esta semana? La versión corta también cuenta.',
    tip: 'Ancla la rutina después de algo fijo: café, ducha, despertador.',
  },
  brain: {
    desc: 'La neuroplasticidad responde a repetición: cada sesión fortalece sinapsis.',
    weekly: '¿Qué región cerebral entrenaste esta semana — WM, inhibición, atención?',
    tip: 'Lee la lección de la semana antes del laboratorio — conecta teoría y práctica.',
  },
  meditation: {
    desc: 'Calma acumulada en minutos pequeños.',
    weekly: '¿Notas que reaccionas un poco más lento antes de responder? Eso es progreso.',
    tip: 'Si no puedes 10 min, tres respiraciones profundas también cuentan.',
  },
  reflections: {
    desc: 'Tu diario es el registro de cómo fuiste cambiando.',
    weekly: '¿Hay un tema que repites al escribir? Ahí hay algo para mirar.',
    tip: 'Escribe sin editar. No es un ensayo, es un espejo.',
  },
  habits: {
    desc: 'Cien hábitos hechos hablan de sistema, no de motivación pasajera.',
    weekly: '¿Cuál hábito te está costando menos? Refuerza ese antes de añadir otro.',
    tip: 'Si fallas tres días, baja la meta a la mitad pero no lo borres.',
  },
}

export function getGoalCoach(metric) {
  return GOAL_COACH[metric] || {
    desc: 'Un objetivo claro convierte días sueltos en dirección.',
    weekly: 'Revisa cada domingo — ajusta, no abandones.',
    tip: 'Una meta activa es mejor que tres a medias.',
  }
}

export const MOOD_COACH = {
  1: {
    insight: 'Los días difíciles no borran tu progreso.',
    action: 'Prueba una meditación corta o la rutina express.',
    link: '#/meditacion',
    cta: 'Ir a calma',
  },
  2: {
    insight: 'Neutral también es válido — es espacio para elegir.',
    action: 'Dos líneas en el diario pueden aclarar qué necesitas.',
    link: '#/mejora/diario',
    cta: 'Escribir un poco',
  },
  3: {
    insight: 'Buen ánimo + un paso pequeño = combinación potente.',
    action: 'Aprovecha para la sesión mental o un hábito pendiente.',
    link: '#/gimnasia',
    cta: 'Entrenar mente',
  },
  4: {
    insight: 'Con energía alta, elige una sola cosa importante.',
    action: 'Avanza en una meta concreta, aunque sea poco.',
    link: '#/metas',
    cta: 'Ver metas',
  },
}

export const HOME_SHORTCUTS = [
  {
    href: '#/mejora',
    icon: '✓',
    title: 'Hábitos',
    desc: 'Tu lista y el diario',
  },
  {
    href: '#/gimnasia',
    icon: '🧠',
    title: 'Neurociencia',
    desc: '32 lecciones · casos legendarios',
  },
  {
    href: '#/meditacion',
    icon: '🌿',
    title: 'Calma',
    desc: 'Respirar y soltar',
  },
]

/** @deprecated usar HOME_SHORTCUTS */
export const QUICK_ACCESS = HOME_SHORTCUTS

const MISSION_TONE = {
  routine: 'calm', habits: 'habit', habits2: 'habit', habits3: 'habit',
  mental: 'brain', brain: 'brain', reflect: 'calm', reflection: 'calm',
  meditate: 'calm', meditation: 'calm', focus: 'focus',
  express: 'calm', morning: 'meta', evening: 'calm', plan_review: 'meta',
}

const MISSION_CHIP = {
  calm: 'Calma', habit: 'Hábitos', brain: 'Neuro', focus: 'Enfoque', meta: 'Plan',
}

export function getMissionTone(task) {
  return MISSION_TONE[task.type] || MISSION_TONE[task.id] || 'meta'
}

export function getMissionChip(tone) {
  return MISSION_CHIP[tone] || 'Hoy'
}

export function getDailyIntention() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const intentions = [
    'No necesitas hacerlo todo hoy. Solo lo que de verdad importa.',
    'Un paso claro vale más que diez intenciones vagas.',
    'Si solo haces una cosa bien, que sea la que más te importe.',
    'Volver cuenta más que hacerlo perfecto.',
    'Menos ruido, más presencia.',
    'Tu energía es limitada — úsala donde sume.',
    'Escribir dos líneas honestas puede cambiar el tono del día.',
    'Cinco minutos de calma no son tiempo perdido.',
  ]
  return intentions[day % intentions.length]
}
