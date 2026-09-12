/** Academia Mejora — neurociencia aplicada: lecciones, regiones cerebrales, laboratorio */

import { getItem, setItem, getWeekNumber } from './core.js'
import { SCHOOL_LESSONS, SCHOOL_LESSON_META, EXTRA_LEGENDARY_HALL } from './school-lessons.js?v=81'
import { APPLY_LESSONS } from './school-apply-lessons.js?v=81'
import { isCurriculumLessonUnlocked } from './school-curriculum.js?v=81'

const ACADEMY_START_KEY = 'academyStart'

export const LESSON_CATEGORIES = {
  systems: { label: 'Sistemas', icon: '🔬', color: '#06b6d4' },
  memory: { label: 'Memoria', icon: '🧩', color: '#00d4ff' },
  attention: { label: 'Atención', icon: '🎯', color: '#f59e0b' },
  emotion: { label: 'Emoción', icon: '🫧', color: '#a78bfa' },
  plasticity: { label: 'Plasticidad', icon: '⚡', color: '#2dd4bf' },
  sleep: { label: 'Sueño', icon: '💤', color: '#818cf8' },
  apply: { label: 'Aplicación', icon: '🌍', color: '#d4a012' },
}

const APPLY_LESSON_IDS = new Set(APPLY_LESSONS.map(l => l.id))

export const LESSONS = [
  {
    id: 'wm-ram',
    category: 'memory',
    title: 'Memoria de trabajo: el buffer del cerebro',
    readMin: 5,
    region: 'Corteza prefrontal dorsolateral · red frontoparietal',
    relatedExercise: 'nback',
    hook: 'Tu cerebro no multitarea — mantiene 4±1 ítems activos en un buffer limitado.',
    sections: [
      { h: 'Modelo de Baddeley', p: 'La memoria de trabajo (WM) no es un disco duro: es un espacio de trabajo temporal con componentes verbal (bucle fonológico), visoespacial (sketchpad) y un ejecutivo central que coordina. La corteza prefrontal dorsolateral (CPFDL) y la red frontoparietal sostienen la información mientras la manipulas.' },
      { h: 'Capacidad y saturación', p: 'Miller y Cowan estimaron ~4 ítems en adultos. Cada distracción, preocupación abierta o cambio de tarea deja “residuo” que ocupa slots. Por eso anotar en papel libera WM: externalizas la carga y la CPFDL puede volver a la tarea principal.' },
      { h: 'Evidencia de entrenamiento', p: 'Meta-análisis de entrenamiento cognitivo (2024) muestran efectos modestos pero reales en WM y función ejecutiva (g≈0.16–0.48). El paradigma N-back entrena actualización de información — la misma demanda que seguir una conversación compleja con specs en mente.' },
    ],
    takeaway: 'La WM es un recurso finito en CPFDL. Externaliza para liberar capacidad.',
    apply: 'Antes de una tarea difícil: escribe los 3 datos que no puedes olvidar. Libera el buffer.',
    reflect: '¿Qué información está ocupando tu WM ahora mismo sin que lo notes?',
  },
  {
    id: 'hippocampus-consolidation',
    category: 'memory',
    title: 'Hipocampo: de recuerdo reciente a memoria larga',
    readMin: 5,
    region: 'Hipocampo · corteza entorrinal',
    relatedExercise: 'corsi',
    hook: 'El hipocampo no almacena recuerdos — los indexa y los transfiere a la corteza.',
    sections: [
      { h: 'Codificación', p: 'El hipocampo integra contexto espacial, temporal y emocional de un evento. Las neuronas de lugar (place cells) se activan en ubicaciones específicas; las de tiempo (time cells) marcan secuencias. Sin hipocampo funcional, no hay memoria episódica nueva.' },
      { h: 'Replay y consolidación', p: 'Durante el sueño, el hipocampo “reproduce” patrones de actividad del día (hippocampal replay) y los transfiere gradualmente a corteza neocortical — especialmente durante ondas lentas (N3). Este proceso convierte memoria dependiente del hipocampo en memoria independiente.' },
      { h: 'Recuperación activa', p: 'Recordar sin mirar fortalece más que releer (efecto de testing). Cada recuperación exitosa reconsolida la traza sináptica. El escaneo corporal y secuencias espaciales (Corsi) entrenan mapas mentales que el hipocampo procesa activamente.' },
    ],
    takeaway: 'Aprender = codificar en hipocampo + consolidar en sueño + recuperar activamente.',
    apply: 'Cierra los ojos 30 s y reconstruye de memoria lo último que aprendiste hoy — sin mirar notas.',
    reflect: '¿Qué aprendiste recientemente que aún “depende” de repasar?',
  },
  {
    id: 'nback-transfer',
    category: 'memory',
    title: 'N-Back: qué entrena y qué no',
    readMin: 5,
    region: 'CPFDL · cíngulo anterior · parietal',
    relatedExercise: 'nback',
    hook: 'El N-Back entrena actualización en WM — no te convierte en genio general.',
    sections: [
      { h: 'Paradigma', p: 'Debes decidir si el estímulo actual coincide con el de N posiciones atrás. Esto exige mantener una ventana deslizante activa y actualizarla constantemente — demanda máxima de WM y control ejecutivo.' },
      { h: 'Transferencia cercana vs lejana', p: 'Sala & Gobet (2017): los efectos en IQ general son pequeños y debatidos. La transferencia cercana (tareas similares de WM) es robusta. En vida real: seguir instrucciones complejas, detectar patrones, mantener contexto en reuniones.' },
      { h: 'Dosis efectiva', p: 'Protocolos con efecto: ~20 min, 3×/semana, 8 semanas, dificultad adaptativa. Más volumen no siempre mejora resultados — la consistencia y el desafío óptimo (ni aburrido ni imposible) importan.' },
    ],
    takeaway: 'N-Back es gimnasio de WM, no píldora de inteligencia. Úsalo con honestidad científica.',
    apply: 'Después de N-Back: intenta una tarea real que requiera 2–3 datos en mente sin anotar.',
    reflect: '¿Qué situación de hoy requería actualizar información mental constantemente?',
  },
  {
    id: 'attention-networks',
    category: 'attention',
    title: 'Dos redes: alerta y orientación',
    readMin: 5,
    region: 'Red dorsal (top-down) · red ventral (bottom-up)',
    relatedExercise: 'flanker',
    hook: 'Atender no es uno — son dos redes cerebrales compitiendo por recursos.',
    sections: [
      { h: 'Red atencional dorsal', p: 'Top-down: voluntaria, orientada a metas. Conecta PFC, parietal posterior y tálamo. La usas cuando decides enfocarte en un documento ignorando el ruido. Se fatiga con uso prolongado (~25–45 min).' },
      { h: 'Red atencional ventral', p: 'Bottom-up: automática, responde a estímulos salientes. Una notificación, un movimiento lateral, un sonido fuerte — la ventral te “secuestra” aunque no quieras. Es evolutivamente más rápida que la dorsal.' },
      { h: 'Conflicto y entrenamiento', p: 'El paradigma Flanker (Eriksen) mide cuánto tarda tu red dorsal en imponerse sobre distractores laterales. Entrenar Flanker mejora conectividad precuneus-LIFG (npj Aging 2025). Diseñar entorno = reducir triggers ventrales.' },
    ],
    takeaway: 'Protege la red dorsal: menos estímulos salientes, bloques de foco definidos.',
    apply: 'Un bloque de 25 min: una tarea, notificaciones apagadas, nada que active la red ventral.',
    reflect: '¿Qué estímulo bottom-up te interrumpió más hoy?',
  },
  {
    id: 'attention-switch',
    category: 'attention',
    title: 'Costo de cambio de tarea en la PFC',
    readMin: 4,
    region: 'PFC rostrolateral · tálamo',
    relatedExercise: 'switching',
    hook: 'Cambiar de tarea no es gratis — la PFC paga un impuesto metabólico cada vez.',
    sections: [
      { h: 'Switching cost', p: 'Alternar entre reglas o tareas activa PFC rostrolateral y genera “residual switch cost”: tardas más en la primera respuesta tras cambiar. fMRI muestra que el cerebro necesita reconfigurar conjuntos de tareas activos.' },
      { h: 'Multitarea = alternancia rápida', p: 'No existe multitarea paralela para tareas cognitivas. Lo que haces es task-switching rápido, y cada switch deja residuo en WM y aumenta errores. Estudios de oficina: hasta 23 min para recuperar foco profundo tras interrupción.' },
      { h: 'Task-set reconfiguration', p: 'El paradigma de task switching entrena la velocidad de reconfiguración. En vida: pasar de escuchar a presentar, de creativo a analítico. Mejor estrategia: agrupar tareas similares y minimizar switches.' },
    ],
    takeaway: 'Agrupa tareas por “modo mental”. Cada cambio cuesta PFC.',
    apply: 'Agrupa hoy las tareas similares en bloques. No alternes email con trabajo profundo.',
    reflect: '¿Cuántos cambios de “modo mental” hiciste en la última hora?',
  },
  {
    id: 'stroop-life',
    category: 'attention',
    title: 'Stroop: conflicto en el cíngulo anterior',
    readMin: 4,
    region: 'Cíngulo anterior · PFC ventrolateral',
    relatedExercise: 'stroop',
    hook: 'Cuando la respuesta automática choca con la correcta, el cíngulo anterior enciende alarmas.',
    sections: [
      { h: 'Paradigma clásico', p: 'Nombrar el color de la tinta cuando la palabra dice otro color. La lectura es automática (más rápida); inhibir esa respuesta requiere control inhibitorio. El cíngulo anterior detecta conflicto; la PFC ventrolateral ejecuta la inhibición.' },
      { h: 'Efecto Stroop emocional', p: 'El mismo circuito opera con impulsos emocionales: abrir apps “sin querer”, comer por ansiedad, responder agresivo. Estímulo prepotente vs respuesta que elegirías con calma = Stroop de la vida real.' },
      { h: 'Entrenamiento', p: 'Practicar Stroop mejora control inhibitorio en laboratorio (Bul 2025, core-EF training). La pausa de 10 s entre estímulo y respuesta da tiempo al cíngulo-PFC para intervenir.' },
    ],
    takeaway: 'El conflicto cognitivo es neurológico. La pausa es tu ventana de control.',
    apply: 'Antes de enviar un mensaje emocional: 10 s de pausa. ¿Lo enviarías mañana?',
    reflect: '¿Cuál es tu Stroop personal — reacción automática que quieres inhibir?',
  },
  {
    id: 'gonogo-impulse',
    category: 'attention',
    title: 'Go/No-Go: frenar el impulso motor',
    readMin: 4,
    region: 'Corteza motora · ganglios basales · PFC',
    relatedExercise: 'gonogo',
    hook: 'Inhibir una respuesta ya iniciada es una de las funciones más costosas del cerebro.',
    sections: [
      { h: 'Paradigma', p: 'Responde rápido a estímulos Go; inhibe completamente en No-Go. Los errores de comisión (responder cuando debías inhibir) reflejan fallo en control motor inhibitorio — distinto del Stroop que es conflicto semántico.' },
      { h: 'Circuito inhibitorio', p: 'Los ganglios basales (núcleo accumbens, globo pálido) y la PFC ventrolateral modulan la salida motora. En No-Go exitoso, la corteza motora suplementaria “frena” la respuesta prepotente en ~200 ms.' },
      { h: 'Aplicación', p: 'Cada notificación que resistes abrir es un No-Go real. Entrenar el paradigma mejora inhibición de respuestas automáticas — útil para scroll, compras impulsivas, interrupciones.' },
    ],
    takeaway: 'La inhibición motora es entrenable. Cada No-Go exitoso fortalece el circuito.',
    apply: 'Cuando suene una notificación: No-Go consciente — no tocar por 10 s. Observa el impulso.',
    reflect: '¿Qué impulso motor (tocar, abrir, responder) te cuesta más inhibir?',
  },
  {
    id: 'dopamine-habits',
    category: 'plasticity',
    title: 'Dopamina: señal de predicción de error',
    readMin: 5,
    region: 'VTA · núcleo accumbens · corteza prefrontal',
    hook: 'La dopamina no es placer — es la señal de “esto es mejor de lo esperado”.',
    sections: [
      { h: 'Reward prediction error', p: 'Schultz (1997): las neuronas dopaminérgicas de la VTA disparan cuando la recompensa supera la predicción, no cuando llega la recompensa en sí. Es un sistema de aprendizaje: actualiza qué acciones vale la pena repetir.' },
      { h: 'Anticipación > consumo', p: 'La subida dopaminérgica ocurre en la anticipación (búsqueda), no en el consumo. Redes sociales, slots y notificaciones explotan recompensas variables — máxima anticipación, mínima satisfacción.' },
      { h: 'Hábitos y bucles', p: 'Los ganglios basales automatizan conductas repetidas (ver lección de hábitos). Puedes hackear el circuito: señal clara → rutina corta → recompensa inmediata y predecible. La dopamina refuerza el bucle que diseñes.' },
    ],
    takeaway: 'Dopamina aprende predicciones. Diseña recompensas predecibles para hábitos buenos.',
    apply: 'Después de un hábito completado: pausa 30 s y nota la sensación — separa logro de scroll.',
    reflect: '¿Qué conducta te da anticipación dopaminérgica sin satisfacción real?',
  },
  {
    id: 'basal-ganglia-habits',
    category: 'plasticity',
    title: 'Ganglios basales: del esfuerzo al automático',
    readMin: 5,
    region: 'Ganglios basales · corteza motora · PFC',
    hook: 'Los hábitos viven en los ganglios basales — no en la voluntad.',
    sections: [
      { h: 'Bucles hábito', p: 'Señal (contexto) → rutina (conducta) → recompensa (refuerzo). Graybiel mostró que con repetición, la actividad se desplaza de PFC (esfuerzo consciente) a ganglios basales (automático). Por eso los primeros días cuestan y luego “fluyen”.' },
      { h: 'Consolidación', p: 'Lally et al. (2010): automatización toma 18–254 días (media ~66). La varianza es enorme según complejidad del hábito. Lo constante: cada repetición fortalece la vía estriatal.' },
      { h: 'Neuroplasticidad del hábito', p: 'No puedes borrar un hábito — puedes sobreescribirlo con uno nuevo que compita por el mismo trigger. El viejo circuito permanece (extinción ≠ borrado), pero el nuevo puede dominar con repetición suficiente.' },
    ],
    takeaway: 'Los hábitos son circuitos basales. Repetición > motivación.',
    apply: 'Ancla un hábito nuevo a un trigger existente (después del café, antes de dormir).',
    reflect: '¿Qué conducta ya es automática en tus ganglios basales — buena o mala?',
  },
  {
    id: 'bdnf-exercise',
    category: 'plasticity',
    title: 'BDNF: el fertilizante de tus neuronas',
    readMin: 4,
    region: 'Hipocampo · corteza · sinapsis',
    hook: 'El ejercicio físico libera BDNF — y tu cerebro crece conexiones.',
    sections: [
      { h: 'Brain-Derived Neurotrophic Factor', p: 'BDNF es una proteína que promueve supervivencia neuronal, crecimiento de dendritas y plasticidad sináptica. Se expresa en hipocampo y corteza. Niveles bajos se asocian con depresión y deterioro cognitivo.' },
      { h: 'Ejercicio aeróbico', p: '30 min de ejercicio moderado elevan BDNF plasmático de forma aguda. Estudios en humanos muestran mejoras en memoria y atención tras programas de 3–6 meses. No hace falta gym: caminar rápido cuenta.' },
      { h: 'Sueño y BDNF', p: 'El sueño profundo también regula BDNF. Ejercicio + sueño = doble vía de neuroplasticidad. El movimiento matutino potencia consolidación nocturna.' },
    ],
    takeaway: 'Mover el cuerpo es mover el cerebro. BDNF conecta ambos.',
    apply: '10 min de movimiento antes del mediodía — caminar, escaleras, estiramientos.',
    reflect: '¿Cuándo fue la última vez que notaste claridad mental después de moverte?',
  },
  {
    id: 'amygdala-threat',
    category: 'emotion',
    title: 'Amígdala: detector de amenazas en 12 ms',
    readMin: 5,
    region: 'Amígdala · tálamo · corteza visual',
    relatedExercise: 'gonogo',
    hook: 'Tu amígdala reacciona antes de que tu conciencia procese el estímulo.',
    sections: [
      { h: 'Vía rápida', p: 'Estímulos amenazantes viajan tálamo → amígdala en ~12 ms, antes de llegar a la corteza visual (~30 ms). Por eso “saltas” ante un ruido antes de saber qué fue. Es supervivencia, no debilidad.' },
      { h: 'Amígdala hiperactiva', p: 'Estrés crónico, trauma o ansiedad mantienen la amígdala en alerta permanente. Esto sesga la percepción hacia amenazas (bias atencional negativo) y dificulta regulación emocional.' },
      { h: 'Reappraisal y PFC', p: 'La corteza prefrontal puede modular la respuesta amigdalina mediante reappraisal cognitivo (“no es peligro real”). Mindfulness y respiración lenta fortalecen PFC-amígdala — literalmente más conexión inhibidora.' },
    ],
    takeaway: 'La amígdala es rápida e imprecisa. La PFC puede calibrarla — con práctica.',
    apply: 'Cuando sientas alarma sin causa clara: nombra la emoción en voz alta. Activa PFC.',
    reflect: '¿Qué situación activó tu amígdala hoy sin amenaza real?',
  },
  {
    id: 'stress-pfc',
    category: 'emotion',
    title: 'Cortisol crónico y apagado de la PFC',
    readMin: 4,
    region: 'Eje HPA · amígdala · corteza prefrontal',
    hook: 'Estrés sostenido no te hace débil — desconecta tu centro de decisiones.',
    sections: [
      { h: 'Eje HPA', p: 'Estrés → hipotálamo libera CRH → hipófisis ACTH → glándulas adrenales cortisol. Agudo: útil (memoria emocional, energía). Crónico: neurotóxico para PFC y hipocampo.' },
      { h: 'PFC offline', p: 'Cortisol elevado reduce actividad en PFC dorsolateral: peor planificación, más impulsividad, WM reducida. La amígdala gana peso relativo — decisiones desde miedo, no desde análisis.' },
      { h: 'Regulación fisiológica', p: 'Exhalar largo (6–8 s) activa nervio vago y baja cortisol en minutos. No resuelve el problema — restaura PFC para que puedas resolverlo.' },
    ],
    takeaway: 'Regula cortisol primero (respiración, movimiento). La PFC vuelve después.',
    apply: 'Tres ciclos 4-7-8 ahora. Nota si cambia tu claridad para decidir.',
    reflect: '¿Dónde sientes el estrés en tu cuerpo cuando el cortisol sube?',
  },
  {
    id: 'breath-vagus',
    category: 'emotion',
    title: 'Nervio vago: el freno del sistema nervioso',
    readMin: 4,
    region: 'Tronco encefálico · núcleo del tracto solitario · HRV',
    hook: 'El nervio vago es el cable que conecta tu respiración con tu calma.',
    sections: [
      { h: 'Simpático vs parasimpático', p: 'Simpático acelera (lucha/huida): ↑FC, ↑cortisol, ↓digestión. Parasimpático frena (descanso/digestión): ↓FC, ↓cortisol. El nervio vago (X par craneal) es el principal efector parasimpático.' },
      { h: 'Exhalar activa el vago', p: 'Inhalar activa ligeramente simpático. Exhalar largo estimula barorreceptores y aumenta variabilidad de frecuencia cardíaca (HRV) — marcador de regulación autonómica. Ratio 4 inhala / 6–8 exhala es el más estudiado.' },
      { h: 'Evidencia', p: 'HRV biofeedback y respiración lenta reducen ansiedad en meta-análisis. Usado en atletas, militares y terapia cognitiva. No es mística — es fisiología medible.' },
    ],
    takeaway: 'La respiración es la única palanca voluntaria del sistema autónomo.',
    apply: '5 respiraciones con exhalar de 6 s antes de tu próxima reunión difícil.',
    reflect: '¿Cuándo fue la última vez que respiraste conscientemente sin que una app te lo pidiera?',
  },
  {
    id: 'default-mode',
    category: 'systems',
    title: 'Red por defecto: cuando el cerebro divaga',
    readMin: 5,
    region: 'Corteza prefrontal medial · precuneus · giro angular',
    hook: 'Cuando no haces nada, tu cerebro no está apagado — está en modo por defecto.',
    sections: [
      { h: 'Default Mode Network (DMN)', p: 'Raichle (2001): red activa en reposo que se desactiva durante tareas focalizadas. Incluye PFC medial, precuneus y giro angular. Procesa autobiografía, simulación futura y rumiación.' },
      { h: 'Rumiación', p: 'DMN hiperactiva se asocia con depresión y ansiedad: dar vueltas al pasado/futuro sin resolver nada. Mindfulness entrena desactivar DMN y activar redes de atención presente.' },
      { h: 'Creatividad y DMN', p: 'La creatividad requiere alternar DMN (generación de ideas) y red ejecutiva (evaluación). Bloques de foco + pausas sin estímulo permiten este ciclo.' },
    ],
    takeaway: 'La divagación mental es neurológica. Pausas intencionales sin pantalla la regulan.',
    apply: '5 min sin pantalla ni podcast. Solo caminar o mirar por la ventana. Observa la DMN.',
    reflect: '¿A dónde viaja tu mente cuando no estás haciendo nada?',
  },
  {
    id: 'sleep-consolidation',
    category: 'sleep',
    title: 'Sueño N3 y REM: consolidación sináptica',
    readMin: 5,
    region: 'Hipocampo · corteza · tálamo',
    hook: 'Aprender de día y dormir de noche — el cerebro necesita ambos para fijar.',
    sections: [
      { h: 'Sueño de ondas lentas (N3)', p: 'Durante N3, ondas delta sincronizan hipocampo y corteza. El hipocampo “replay” patrones del día; la corteza fortalece sinapsis relevantes. Sin N3, retención cae hasta 40% en 24 h.' },
      { h: 'Sueño REM', p: 'REM integra memoria emocional y procedimental. Sueños procesan experiencias con neurotransmisores distintos (↓ noradrenalina). Privación de REM afecta creatividad y regulación emocional.' },
      { h: 'Atención al día siguiente', p: 'Una noche de 5 h deteriora atención sostenida equivalente a intoxicación leve (Van Dongen 2003). No es flojera — es hipocampo y PFC sin consolidar.' },
    ],
    takeaway: 'Dormir es fase de escritura del aprendizaje diario.',
    apply: 'Esta noche: horario ±30 min, sin pantallas 30 min antes. Prioriza N3.',
    reflect: '¿Cuántas horas dormiste esta semana? ¿Notaste la diferencia en tu foco?',
  },
  {
    id: 'glymphatic-sleep',
    category: 'sleep',
    title: 'Sistema glinfático: limpieza nocturna',
    readMin: 4,
    region: 'Espacio perivascular · astrocitos · líquido cefalorraquídeo',
    hook: 'Tu cerebro tiene un sistema de drenaje que solo funciona cuando duermes.',
    sections: [
      { h: 'Descubrimiento', p: 'Iliff et al. (2012): el sistema glinfático elimina metabolitos tóxicos (incluida β-amiloide) del cerebro. Funciona principalmente durante sueño profundo, cuando el espacio intersticial se expande ~60%.' },
      { h: 'Posición y calidad', p: 'Dormir de lado puede optimizar el flujo glinfático vs boca arriba (estudios en roedores). La calidad del sueño importa más que solo horas — fragmentación interrumpe ciclos de limpieza.' },
      { h: 'Consecuencias de privación', p: 'Sueño crónico insuficiente acumula metabolitos. Se asocia con deterioro cognitivo a largo plazo. El descanso no es lujo — es mantenimiento neurobiológico.' },
    ],
    takeaway: 'Dormir limpia el cerebro literalmente. No negociable.',
    apply: 'Prioriza 7–8 h esta semana. Si no puedes, una siesta de 20 min ayuda parcialmente.',
    reflect: '¿Tu sueño es continuo o fragmentado? ¿Te despiertas descansado?',
  },
  {
    id: 'neurotransmitters',
    category: 'systems',
    title: 'Neurotransmisores: el lenguaje químico del cerebro',
    readMin: 5,
    region: 'Sinapsis · vesículas sinápticas · receptores',
    hook: 'Tus pensamientos son patrones de liberación química entre neuronas.',
    sections: [
      { h: 'Glutamato y GABA', p: 'Glutamato: principal excitatorio (aprendizaje, plasticidad). GABA: principal inhibitorio (calma, sueño). El balance excitación/inhibición define si una red está activa o suprimida.' },
      { h: 'Moduladores', p: 'Dopamina (motivación, aprendizaje), serotonina (ánimo, impulsividad), noradrenalina (alerta, estrés), acetilcolina (atención, memoria). No son “emociones en una molécula” — modulan circuitos completos.' },
      { h: 'Sinapsis y plasticidad', p: 'Hebb (1949): “neurons that fire together, wire together”. La repetición fortalece sinapsis (LTP). Cada hábito, lección y ejercicio es química sináptica repetida.' },
    ],
    takeaway: 'Conducta = patrones sinápticos. Repetición cambia química cerebral.',
    apply: 'Elige una conducta para repetir 7 días. Cada repetición es una sinapsis más fuerte.',
    reflect: '¿Qué circuito químico refuerzas más con tus acciones diarias?',
  },
  {
    id: 'prefrontal-decisions',
    category: 'attention',
    title: 'PFC y fatiga de decisiones',
    readMin: 4,
    region: 'Corteza prefrontal · cíngulo anterior',
    relatedExercise: 'symbols',
    hook: 'Cada decisión consume glucosa y atención en la PFC — hasta que no queda.',
    sections: [
      { h: 'Ego depletion (con matices)', p: 'Baumeister propuso que la fuerza de voluntad se agota como músculo. Replicaciones mixtas, pero la fatiga cognitiva real existe: más decisiones → peor calidad en las siguientes.' },
      { h: 'Decision fatigue', p: 'Jueces otorgan más libertad condicional al inicio del día que al final (Danziger 2011). Tu PFC tiene capacidad diaria limitada para evaluar opciones nuevas.' },
      { h: 'Automatizar lo trivial', p: 'Rutinas fijas, comidas repetidas en días de carga, “uniforme” personal. Cada decisión automatizada ahorra PFC para lo que importa. Los ganglios basales toman el relevo.' },
    ],
    takeaway: 'Menos decisiones micro = más PFC para decisiones macro.',
    apply: 'Automatiza una decisión diaria (desayuno, ropa, hora de ejercicio).',
    reflect: '¿A qué hora del día tomas tus peores decisiones?',
  },
  {
    id: 'hebb-plasticity',
    category: 'plasticity',
    title: 'Plasticidad Hebbiana: usar o perder',
    readMin: 4,
    region: 'Sinapsis · dendritas · hipocampo',
    hook: 'Las neuronas que se activan juntas, se conectan juntas — para bien o para mal.',
    sections: [
      { h: 'LTP y LTD', p: 'Potenciación a largo plazo (LTP): sinapsis que se fortalecen con uso repetido. Depresión a largo plazo (LTD): sinapsis que se debilitan sin uso. Tu cerebro poda conexiones inactivas constantemente.' },
      { h: 'Ventanas críticas', p: 'Mayor plasticidad en infancia, pero la neuroplasticidad adulta es real — limitada pero funcional. Aprender idiomas, instrumentos o habilidades cognitivas siempre modifica conectividad (estudios de imagen).' },
      { h: 'Uso o pérdida', p: 'Una semana sin practicar un hábito debilita la vía. Volver después de fallar requiere más repeticiones que mantener. Por eso la consistencia importa más que la intensidad.' },
    ],
    takeaway: 'Cada día sin práctica es poda sináptica. Cada repetición es LTP.',
    apply: 'Practica hoy algo que aprendiste esta semana — aunque sea 2 minutos.',
    reflect: '¿Qué habilidad estás dejando podar por falta de uso?',
  },
  {
    id: 'interoception',
    category: 'emotion',
    title: 'Interocepción: el cerebro lee tu cuerpo',
    readMin: 5,
    region: 'Ínsula · corteza somatosensorial · amígdala',
    hook: 'Las emociones empiezan como señales corporales que la ínsula interpreta.',
    sections: [
      { h: 'Teoría de construcción', p: 'Barrett: las emociones no son “hardwired” — el cerebro construye significado a partir de sensaciones corporales (corazón, respiración, tensión muscular) usando predicción y contexto. La ínsula es central en esta lectura.' },
      { h: 'Señales tempranas', p: 'Hombros tensos, mandíbula apretada, respiración alta — la ínsula las procesa antes de que la PFC nombre la emoción. El escaneo corporal entrena interocepción: detectar señales antes de que escalen.' },
      { h: 'Regulación bottom-up', p: 'Cambiar el cuerpo (respiración, postura, movimiento) cambia la entrada interoceptiva y por tanto la emoción construida. No es “pensar positivo” — es modificar datos sensoriales que la ínsula interpreta.' },
    ],
    takeaway: 'Tu cuerpo avisa antes que tu mente admita. Escuchar la ínsula es regulación.',
    apply: 'Ahora: escanea mandíbula, hombros, respiración. ¿Qué dice tu ínsula?',
    reflect: '¿Qué señal corporal ignoras habitualmente hasta que se vuelve crisis?',
  },
  {
    id: 'patient-hm',
    category: 'memory',
    title: 'Paciente H.M.: el hombre que olvidó y enseñó al mundo',
    readMin: 6,
    region: 'Hipocampo bilateral · lóbulo temporal medial',
    relatedExercise: 'corsi',
    hook: 'Le quitaron el hipocampo para curar epilepsia. Vivió 55 años sin formar un recuerdo nuevo.',
    sections: [
      { h: 'La operación', p: 'Henry Molaison (H.M.) tenía epilepsia severa. En 1953, Scoville extirpó gran parte de sus lóbulos temporales mediales bilaterales — incluido hipocampo. Las convulsiones mejoraron. La memoria episódica, desapareció.' },
      { h: 'Lo que perdió y lo que no', p: 'H.M. no recordaba nada nuevo después de 1953: ni rostros, ni eventos, ni dónde dejó las cosas. Pero conservó memoria procedimental (aprendió nuevas habilidades motoras sin saber que las aprendía) y memoria a corto plazo de segundos. Demostró que la memoria no es una sola cosa.' },
      { h: 'Legado', p: 'H.M. es el paciente más estudiado en historia de la neurociencia. Su caso separó memoria declarativa (hipocampo) de procedimental (ganglios basales/cerebelo). Murió en 2008; su cerebro fue escaneado en 3,500 cortes — un monumento a la ciencia.' },
    ],
    takeaway: 'Sin hipocampo no hay memoria episódica nueva. El resto del cerebro sigue aprendiendo en silencio.',
    apply: 'Aprende algo hoy y duerme bien — el hipocampo necesita N3 para fijarlo.',
    reflect: '¿Qué de esta semana olvidarías si tu hipocampo dejara de codificar mañana?',
  },
  {
    id: 'phineas-gage',
    category: 'systems',
    title: 'Phineas Gage: la barra que atravesó un lóbulo frontal',
    readMin: 5,
    region: 'Lóbulo frontal · corteza prefrontal',
    hook: 'Una barra de hierro de 1 metro le atravesó el cráneo. Sobrevivió. Su personalidad no.',
    sections: [
      { h: 'El accidente', p: '1848, Vermont. Gage, capataz de ferrocarril, tenía 25 años. Una explosión impulsó una barra de tamping de 3 cm de diámetro a través de su mejilla izquierda y salió por la parte superior del cráneo. Caminó, habló, y vivió 12 años más.' },
      { h: 'Antes y después', p: 'Antes: responsable, eficiente, respetado. Después: impulsivo, inconstante, incapaz de planificar. “Gage ya no era Gage”, dijo su médico. El daño frontal destruyó función ejecutiva — no inteligencia, sino carácter y control.' },
      { h: 'Lo que nos enseñó', p: 'Fue la primera evidencia fuerte de que la personalidad y el juicio viven en el lóbulo frontal. La PFC no es “extra” — es lo que te convierte en alguien confiable. Daño frontal = decisiones sin freno, sin empatía contextual, sin visión a largo plazo.' },
    ],
    takeaway: 'La PFC no es abstracta — es tu juicio, tu planificación, tu “tú”.',
    apply: 'Antes de una decisión impulsiva: pregúntate qué diría tu PFC si tuviera 10 s más.',
    reflect: '¿Cuándo actuaste sin tu PFC — solo con impulso?',
  },
  {
    id: 'predictive-brain',
    category: 'systems',
    title: 'Cerebro predictivo: no ves la realidad, la adivinas',
    readMin: 6,
    region: 'Corteza · tálamo · modelos generativos',
    hook: 'Tu cerebro no procesa el mundo — predice el mundo y corrige errores.',
    sections: [
      { h: 'Teoría predictiva', p: 'Friston y Barrett: el cerebro es una máquina de predicción. Genera modelos internos de lo que debería llegar por los sentidos. Solo procesa la “sorpresa” — la diferencia entre predicción y realidad (prediction error).' },
      { h: 'Por qué importa', p: 'Por eso el dolor puede existir sin daño, el miedo sin peligro, y la ansiedad sin causa. Tu cerebro predice amenaza y el cuerpo responde. También por eso la práctica reduce sorpresa: lo familiar se predice bien y requiere menos energía.' },
      { h: 'Aplicación cognitiva', p: 'La ansiedad anticipatoria es prediction error crónico: el cerebro espera lo peor y cada estímulo ambiguo confirma el modelo. Respiración, exposición gradual y reappraisal actualizan el modelo predictivo — no “piensan positivo”, cambian priors bayesianos.' },
    ],
    takeaway: 'Percibes predicciones corregidas, no realidad cruda. Puedes entrenar mejores predicciones.',
    apply: 'Cuando anticipes lo peor: nombra 3 escenarios neutros o positivos igual de probables.',
    reflect: '¿Qué predicción negativa de tu cerebro se cumplió solo porque actuaste como si fuera cierta?',
  },
  {
    id: 'pain-matrix',
    category: 'emotion',
    title: 'Dolor: construcción cerebral, no alarma del tejido',
    readMin: 5,
    region: 'Ínsula · cíngulo anterior · somatosensorial',
    hook: 'Puedes tener daño tisular sin dolor y dolor sin daño. El dolor vive en el cerebro.',
    sections: [
      { h: 'Teoría neuromatrix', p: 'Melzack (1999): el dolor no es señal directa del cuerpo — es output de un patrón cerebral (neuromatrix) que integra sensación, emoción, contexto y memoria. La “matriz del dolor” incluye ínsula, cíngulo y corteza somatosensorial.' },
      { h: 'Casos extremos', p: 'Soldados en combate con heridas graves a veces no sienten dolor hasta estar a salvo — el contexto modula la matriz. Fibromialgia: dolor crónico sin lesión visible. Dolor fantasma en miembros amputados: la matriz sigue activa sin input periférico.' },
      { h: 'Implicación', p: 'El dolor emocional usa circuitos superpuestos. Rechazo social activa ínsula y cíngulo como dolor físico (Eisenberger 2003). Por eso “duele” perder a alguien — literalmente, mismas regiones.' },
    ],
    takeaway: 'Dolor = cerebro interpretando señales en contexto. No siempre significa daño.',
    apply: 'Si algo “duele” emocionalmente: trátalo como señal interoceptiva, no como verdad absoluta.',
    reflect: '¿Alguna vez el dolor emocional se sintió físico en pecho o estómago?',
  },
  {
    id: 'cerebellum-mass',
    category: 'systems',
    title: 'Cerebelo: la mitad de tus neuronas en un puño',
    readMin: 5,
    region: 'Cerebelo · 69 mil millones de neuronas',
    relatedExercise: 'corsi',
    hook: 'El cerebelo pesa 10% del cerebro pero contiene ~80% de todas tus neuronas.',
    sections: [
      { h: 'Anatomía sorprendente', p: '69 mil millones de neuronas granulares en capas compactas. Durante décadas se pensó que solo coordinaba movimiento. Hoy sabemos que también modula cognición, lenguaje, timing y predicción sensorial.' },
      { h: 'Más que movimiento', p: 'Daño cerebelar causa ataxia pero también déficits en planificación, lenguaje y regulación emocional. fMRI muestra activación cerebelar en tareas de WM, lenguaje y toma de decisiones. Es un coprocesador de precisión temporal.' },
      { h: 'Timing y aprendizaje', p: 'El cerebelo calibra intervalos temporales — desde coordinar dedos hasta predecir cuándo llega una recompensa. Error de timing en aprendizaje motor se corrige aquí. Por eso la repetición con feedback mejora habilidades: el cerebelo afina el modelo.' },
    ],
    takeaway: 'No subestimes el cerebelo — es motor, cognitivo y predictivo.',
    apply: 'Aprende una secuencia motora pequeña (ritmo con dedos) — el cerebelo adora patrones temporales.',
    reflect: '¿Qué habilidad mejoró solo con repetición sin pensar?',
  },
  {
    id: 'blindsight',
    category: 'attention',
    title: 'Blindsight: ver sin saber que ves',
    readMin: 5,
    region: 'Corteza visual V1 · vías subcorticales',
    relatedExercise: 'flanker',
    hook: 'Daño en V1 = ceguera cortical. Pero algunos “ven” sin conciencia visual.',
    sections: [
      { h: 'Ceguera cortical', p: 'La corteza visual primaria (V1) procesa input retinal consciente. Daño bilateral en V1 produce ceguera — el paciente jura no ver nada. Pero en la mitad de los casos queda blindsight.' },
      { h: 'Respuesta sin conciencia', p: 'Pacientes con blindsight “adivinan” correctamente la ubicación o dirección de estímulos que juraron no ver. Vías subcorticales (colículo superior → tálamo → pulvinar) procesan información sin pasar por V1 consciente.' },
      { h: 'Lección profunda', p: 'La conciencia visual y el procesamiento visual son separables. Tu cerebro toma decisiones con datos que tu yo consciente no reporta. Mucho de lo que “sabes” llega por vías que no nombras.' },
    ],
    takeaway: 'Conciencia ≠ procesamiento. Tu cerebro sabe más de lo que admites.',
    apply: 'Confía en intuiciones entrenadas — a veces son blindsight de experiencia acumulada.',
    reflect: '¿Alguna vez “supiste” algo sin poder explicar cómo?',
    intensity: 'brutal',
  },
  {
    id: 'split-brain',
    category: 'systems',
    title: 'Cerebro dividido: dos mentes en un cuerpo',
    readMin: 6,
    region: 'Cuerpo calloso · hemisferios izquierdo/derecho',
    hook: 'Cortaron el cable entre tus hemisferios. De repente, tenías dos voluntades.',
    sections: [
      { h: 'La operación', p: 'Epilepsia intratable: la solución extrema fue seccionar el cuerpo calloso — el puente de 200 millones de axones que conecta hemisferios. Sperry ganó el Nobel (1981) estudiando a estos pacientes. Resultado: dos mitades que cooperan… hasta que no.' },
      { h: 'Experimento clásico', p: 'Estímulo visual solo al hemisferio izquierdo (controla lenguaje): el paciente no puede nombrarlo pero puede señalarlo con la mano izquierda (controlada por el derecho). Dos sistemas procesando en paralelo, una sola boca para hablar.' },
      { h: 'Conflicto interno', p: 'Pacientes reportan que la mano izquierda “hace cosas por su cuenta” — abrir puertas que la otra cerró, pelear por el control del volante. No es metáfora: sin cuerpo calloso, la integración de “yo” se fractura.' },
    ],
    takeaway: 'Tu “yo” unificado es obra del cuerpo calloso. Sin él, la mente se bifurca.',
    apply: 'Cuando sientas conflicto interno (“una parte quiere X, otra Y”): puede ser hemisferios compitiendo sin integrar.',
    reflect: '¿Alguna vez tu cuerpo hizo algo que tu mente no había “autorizado”?',
    intensity: 'brutal',
  },
  {
    id: 'patient-sm',
    category: 'emotion',
    title: 'Paciente S.M.: la mujer sin miedo',
    readMin: 5,
    region: 'Amígdala bilateral · enfermedad de Urbach-Wiethe',
    hook: 'Sin amígdalas, tocó serpientes venenosas con las manos. Sin pestañear.',
    sections: [
      { h: 'Urbach-Wiete', p: 'Calcificación bilateral de amígdalas desde la infancia. S.M. (y pacientes similares) no experimentan miedo a amenazas externas: serpientes, arañas, películas de terror, asaltos. La amígdala es el hardware del miedo — sin ella, no hay alarma.' },
      { h: 'Lo que sí siente', p: 'S.M. experimenta alegría, tristeza, ira y ansiedad social. El miedo no es “emoción única” — es circuito específico. Sin amígdala pierdes miedo a peligro físico, pero no toda emoción.' },
      { h: 'Costo de no tener miedo', p: 'S.M. ha sido asaltada múltiples veces en situaciones que cualquiera evitaría. Sin amígdala no hay “algo está mal” visceral. El miedo no es debilidad — es sistema de supervivencia calibrado por millones de años.' },
    ],
    takeaway: 'El miedo es amígdala, no cobardía. Sin ella, caminas hacia el peligro sin saberlo.',
    apply: 'La próxima vez que sientas miedo: agradécele a tu amígdala — está haciendo su trabajo.',
    reflect: '¿Qué amenaza ignoraste porque tu amígdala estaba “apagada” por confianza o prisa?',
    intensity: 'brutal',
  },
  {
    id: 'capgras',
    category: 'emotion',
    title: 'Capgras: tu madre es un impostor',
    readMin: 5,
    region: 'Desconexión fusiforme-amígdala · delirio',
    hook: 'Reconoces el rostro. Sabes quién es. Pero algo en tu pecho dice: no es ella.',
    sections: [
      { h: 'El delirio', p: 'Capgras (1923): el paciente cree que personas cercanas fueron reemplazadas por dobles idénticos. Reconocimiento visual intacto (área fusiforme) pero sin “señal emocional familiar” (amígdala desconectada). El cerebro resuelve la disonancia: debe ser un impostor.' },
      { h: 'Mecanismo', p: 'Ver a alguien que amas debería activar amígdala + ínsula (calidez, familiaridad). Si la vía visual-emocional se rompe, ves el rostro sin el “feeling”. La explicación narrativa que genera la PFC: suplantación.' },
      { h: 'Lección', p: '“Reconocer” y “sentir familiaridad” son procesos separables. Tu certeza de que alguien es quien dice ser combina visión + emoción — no solo lógica.' },
    ],
    takeaway: 'La familiaridad es emoción + visión. Rompe una vía y la realidad se fractura.',
    apply: 'Cuando alguien “se siente distinto” sin razón clara: puede ser tu ínsula, no ellos.',
    reflect: '¿Alguna vez un rostro conocido te generó extrañeza sin explicación?',
    intensity: 'brutal',
  },
  {
    id: 'phantom-limb',
    category: 'systems',
    title: 'Miembros fantasma: el mapa que no se borra',
    readMin: 5,
    region: 'Corteza somatosensorial · homúnculo de Penfield',
    hook: 'Te amputaron el brazo. Duele. El brazo que ya no existe.',
    sections: [
      { h: 'Paradoja', p: '70–80% de amputados sienten el miembro ausente: picazón, dolor, movimiento. La corteza somatosensorial conserva el mapa corporal (homúnculo) aunque el input periférico desapareció. El cerebro sigue generando sensación sin datos.' },
      { h: 'Caja de espejos', p: 'Ramachandran (1990s): espejo que “restaura” visualmente el miembro. El cerebro ve movimiento simétrico, reconcilia conflicto sensorial, y el dolor fantasma puede desaparecer en minutos. Prueba de que el dolor es construcción cortical.' },
      { h: 'Reorganización', p: 'La corteza del área amputada puede ser “reclamada” por zonas vecinas (rostro, hombro). Tocar la mejilla puede sentirse como tocar el dedo fantasma. El mapa se deforma pero no se vacía.' },
    ],
    takeaway: 'Tu mapa corporal en corteza es software persistente. El cuerpo cambia; el mapa tarda en actualizar.',
    apply: 'Si tienes dolor crónico “sin causa”: puede ser mapa cortical desincronizado, no solo tejido.',
    reflect: '¿Tu cerebro aún “siente” algo que ya no está ahí — hábito, relación, versión tuya?',
    intensity: 'brutal',
  },
  {
    id: 'london-taxi',
    category: 'plasticity',
    title: 'Taxistas de Londres: hipocampos que crecen',
    readMin: 5,
    region: 'Hipocampo posterior · navegación espacial',
    relatedExercise: 'corsi',
    hook: '4 años memorizando 25,000 calles. Su hipocampo creció mediblemente.',
    sections: [
      { h: 'The Knowledge', p: 'Para ser taxista en Londres debes pasar “The Knowledge”: examen brutal de calles, rutas y puntos de interés. Maguire et al. (2000) escaneó cerebros: taxistas tenían hipocampo posterior más grande que controles.' },
      { h: 'Uso o pérdida', p: 'No es genética — es entrenamiento. Conductores de autobús con rutas fijas no mostraron el mismo efecto. Navegación espacial activa y demandante remodela estructura cerebral en adultos.' },
      { h: 'GPS te está apagando', p: 'Delegar navegación al GPS reduce activación hipocampal. Maguire advirtió: si no usas tu mapa mental, la región se atrofia. Tu hipocampo necesita ejercicio espacial real.' },
    ],
    takeaway: 'El hipocampo crece con uso espacial. El GPS lo deja en reposo.',
    apply: 'Hoy: llega a un lugar sin GPS — aunque sea una cuadra. Fuerza tu place cells.',
    reflect: '¿Cuándo fue la última vez que navegaste un lugar nuevo sin pantalla?',
    intensity: 'intenso',
  },
  {
    id: 'synesthesia',
    category: 'systems',
    title: 'Sinestesia: cuando los sentidos se cruzan',
    readMin: 5,
    region: 'Corteza cruzada · números-colores · grapheme-color',
    hook: 'El 7 es púrpura. El martes sabe a pollo frito. Para ellos, siempre fue así.',
    sections: [
      { h: 'Qué es', p: 'Estimulación de un sentido activa otro involuntariamente: números con color, sonidos con formas, palabras con sabor. ~4% de la población. No es metáfora poética — es cableado neural literal.' },
      { h: 'Base neural', p: 'fMRI muestra activación cruzada: ver un número activa área visual del color asociado en sinestésicos grapheme-color. Ramachandran propuso “pruning” incompleto en desarrollo — conexiones que en otros se podan, aquí permanecen.' },
      { h: 'Ventaja cognitiva', p: 'Sinestésicos a menudo tienen mejor memoria para secuencias (los colores anclan dígitos). Algunos matemáticos y artistas reportan sinestesia. No es trastorno — es variación de conectividad.' },
    ],
    takeaway: 'Tus sentidos están más separados que los de un sinestésico — y eso es solo una configuración.',
    apply: 'Asocia un color a un concepto difícil — ancla sinestésico artificial para memoria.',
    reflect: '¿Qué número o letra tendría color si tu cerebro los cruzara?',
    intensity: 'intenso',
  },
  ...SCHOOL_LESSONS,
  ...APPLY_LESSONS,
]

/** Casos legendarios — acceso rápido en Academia */
export const LEGENDARY_HALL = [
  { lessonId: 'patient-hm', year: '1953', name: 'H.M.', tagline: '55 años sin un día nuevo en memoria' },
  { lessonId: 'phineas-gage', year: '1848', name: 'Phineas Gage', tagline: 'Barra de hierro · otra personalidad' },
  { lessonId: 'split-brain', year: '1981', name: 'Cerebro dividido', tagline: 'Nobel a Sperry · dos mentes' },
  { lessonId: 'patient-sm', year: '2010', name: 'Paciente S.M.', tagline: 'Sin miedo · serpientes con las manos' },
  { lessonId: 'capgras', year: '1923', name: 'Capgras', tagline: 'Tu madre es un impostor' },
  { lessonId: 'phantom-limb', year: '1990s', name: 'Miembro fantasma', tagline: 'Ramachandran · caja de espejos' },
  { lessonId: 'blindsight', year: '1974', name: 'Blindsight', tagline: 'Ver sin saber que ves' },
  { lessonId: 'london-taxi', year: '2000', name: 'Taxistas', tagline: 'Hipocampo que crece con calles' },
  ...EXTRA_LEGENDARY_HALL,
]

const NEURO_DEBATES = [
  { q: '¿El N-back sube tu IQ?', a: 'Transferencia lejana: efecto pequeño y debatido (Sala & Gobet). Cercana a memoria de trabajo: sí, con consistencia.' },
  { q: '¿Usamos solo el 10% del cerebro?', a: 'Mito total. fMRI muestra que usas prácticamente todo — solo no al mismo tiempo.' },
  { q: '¿La dopamina es placer?', a: 'No. Schultz: es señal de predicción de error — anticipación y aprendizaje, no consumo.' },
  { q: '¿El tamaño del cerebro = inteligencia?', a: 'Correlación débil. La conectividad y eficiencia importan más que volumen.' },
  { q: '¿Los recuerdos son grabaciones?', a: 'No. Cada recuerdo es reconstrucción que se altera al recordar — el hipocampo reescribe.' },
  { q: '¿Multitarea existe?', a: 'No en paralelo cognitivo. Task-switching con costo medible en PFC y errores.' },
  { q: '¿El cerebro deja de cambiar a los 25?', a: 'La plasticidad baja pero no muere. Taxistas, músicos y meditadores lo demuestran en adultos.' },
  { q: '¿Meditar “apaga” el cerebro?', a: 'Desactiva DMN (rumiación) y fortalece redes de atención — cambios estructurales en 8 semanas.' },
  { q: '¿El dolor siempre indica daño?', a: 'Melzack: dolor es output cerebral. Daño sin dolor y dolor sin daño existen.' },
  { q: '¿Izquierdo lógico, derecho creativo?', a: 'Oversimplificación. Ambos hemisferios participan en casi todo — especialización es relativa.' },
  { q: '¿El azúcar da hiperactividad?', a: 'En estudios controlados con niños: no hay efecto consistente. Expectativa del cuidador sí.' },
  { q: '¿Podemos confiar en recuerdos “vividos”?', a: 'Vividez ≠ precisión. Memoria emocional intensa puede ser igual de falsa.' },
]

/** Metadatos extra: casos clínicos, mitos, citas */
const LESSON_META = {
  'wm-ram': {
    caseStudy: 'Paciente con lesión en CPFDL: WM espacial intacta pero verbal destruida — Baddeley tenía razón sobre componentes separados.',
    myth: 'Mito: “puedo multitareaar si me organizo”. Realidad: alternas y cada switch deja residuo en WM.',
    cite: 'Baddeley (2000) · Cowan (2001)',
    deepCut: 'Repetir un número en voz alta mientras caminas puede hacerte tropezar — el bucle fonológico compite con equilibrio.',
  },
  'hippocampus-consolidation': {
    caseStudy: 'O’Keefe & Dostrovsky (1971): descubrieron neuronas de lugar en hipocampo de rata — Nobel 2014.',
    myth: 'Mito: “grabo recuerdos como video”. Realidad: cada recuerdo es reconstrucción parcial que cambia al recordar.',
    cite: 'O’Keefe (2014) · Wilson & McNaughton (1994) replay',
  },
  'nback-transfer': {
    caseStudy: 'Jaeggi et al. (2008) mostró transferencia a fluid intelligence — replicaciones posteriores matizaron el efecto.',
    myth: 'Mito: “N-back me hace más inteligente en todo”. Realidad: entrenas WM, no IQ general.',
    cite: 'Sala & Gobet (2017) · Jaeggi et al. (2008)',
  },
  'attention-networks': {
    caseStudy: 'Posner & Petersen (1990): formalizaron las redes dorsal y ventral — base de toda neurociencia de atención moderna.',
    myth: 'Mito: “me distraigo porque soy flojo”. Realidad: la red ventral es más rápida que tu voluntad.',
    cite: 'Corbetta & Shulman (2002)',
  },
  'attention-switch': {
    caseStudy: 'Rubinstein et al. (2001): task-switching deja “residual cost” medible en RT y errores durante minutos.',
    myth: 'Mito: “revisar el email toma 30 segundos”. Realidad: el costo de reentrada al foco profundo es enorme.',
    cite: 'Monsell (2003) · Mark et al. (2008)',
  },
  'stroop-life': {
    caseStudy: 'Stroop (1935): el efecto lleva su nombre desde un artículo de 70 años — sigue siendo gold standard.',
    myth: 'Mito: “tengo buen autocontrol”. Realidad: el control inhibitorio es finito y se entrena.',
    cite: 'Stroop (1935) · MacLeod (1991) review',
  },
  'gonogo-impulse': {
    caseStudy: 'Pacientes con lesión PFC ventrolateral: errores de comisión masivos en No-Go — no pueden frenar.',
    myth: 'Mito: “solo fue un impulso”. Realidad: fue fallo de inhibición en ganglios basales-PFC.',
    cite: 'Aron et al. (2004) · stop-signal paradigm',
  },
  'dopamine-habits': {
    caseStudy: 'Schultz midió dopamina en monos: los spikes ocurren en la señal predictiva, no en el jugo.',
    myth: 'Mito: “dopamina = placer”. Realidad: dopamina = aprendizaje de predicción.',
    cite: 'Schultz et al. (1997)',
  },
  'basal-ganglia-habits': {
    caseStudy: 'Pacientes de Parkinson (dopamina basal destruida): no pueden iniciar movimiento voluntario pero sí seguir rutinas cristalizadas.',
    myth: 'Mito: “romper un hábito es borrarlo”. Realidad: extinción ≠ borrado — el circuito viejo sigue ahí.',
    cite: 'Graybiel (2008) · Lally et al. (2010)',
  },
  'bdnf-exercise': {
    caseStudy: 'Erickson et al. (2011): 1 año de caminata aumentó volumen hipocampal en adultos mayores.',
    myth: 'Mito: “ejercicio es para el cuerpo”. Realidad: es neurotrofina directa para el cerebro.',
    cite: 'Erickson et al. (2011) · Voss et al. (2013)',
  },
  'amygdala-threat': {
    caseStudy: 'Paciente S.M.: amígdala bilateral destruida por enfermedad de Urbach-Wiethe — sin miedo a serpientes, arañas o amenazas sociales.',
    myth: 'Mito: “el miedo es racional”. Realidad: la amígdala dispara antes de que razones.',
    cite: 'LeDoux (1996) · Feinstein et al. (2011)',
  },
  'stress-pfc': {
    caseStudy: 'Sapolsky en babuinos: estrés crónico de bajo rango reduce volumen hipocampal y función PFC.',
    myth: 'Mito: “estrés me hace productivo”. Realidad: agudo sí; crónico destruye PFC.',
    cite: 'Arnsten (2009) · Lupien et al. (2009)',
  },
  'breath-vagus': {
    caseStudy: 'Navy SEALs entrenan respiración box (4-4-4-4) para HRV bajo fuego — fisiología, no mística.',
    myth: 'Mito: “respirar profundo calma todo”. Realidad: exhalar largo activa vago; inhalar solo no basta.',
    cite: 'Porges (2011) · polyvagal theory',
  },
  'default-mode': {
    caseStudy: 'Raichle vio actividad “de más” en PET de reposo — nació el concepto de DMN por accidente.',
    myth: 'Mito: “divagar es perder tiempo”. Realidad: DMN integra identidad y simula futuros — pero puede rumiar.',
    cite: 'Raichle et al. (2001) · Buckner et al. (2008)',
  },
  'sleep-consolidation': {
    caseStudy: 'Walker (2004): una noche de sueño duplica probabilidad de insight en problemas complejos.',
    myth: 'Mito: “puedo dormir el fin de semana”. Realidad: consolidación es nocturna — no se acumula.',
    cite: 'Walker (2017) · Van Dongen et al. (2003)',
  },
  'glymphatic-sleep': {
    caseStudy: 'Rats: β-amiloide se elimina 2× más rápido durante sueño — Iliff lo demostró en 2012.',
    myth: 'Mito: “5 h me alcanzan”. Realidad: sin N3 profundo, el lavado glinfático no completa ciclos.',
    cite: 'Iliff et al. (2012) · Xie et al. (2013)',
  },
  'neurotransmitters': {
    caseStudy: 'Prozac no “sube serotonina mágicamente” — modula receptores tras semanas de plasticidad sináptica.',
    myth: 'Mito: “un neurotransmisor = una emoción”. Realidad: modulan redes completas en contexto.',
    cite: 'Hebb (1949) · Kandel (2000)',
  },
  'prefrontal-decisions': {
    caseStudy: 'Danziger (2011): jueces israelíes otorgaban 65% más libertades al inicio del día que antes del almuerzo.',
    myth: 'Mito: “tengo energía infinita para decidir”. Realidad: PFC se degrada con cada opción nueva.',
    cite: 'Danziger et al. (2011) · Baumeister (1998)',
  },
  'hebb-plasticity': {
    caseStudy: 'Kandel ganó Nobel estudiando LTP en Aplysia — sinapsis que se fortalecen con uso.',
    myth: 'Mito: “ya no aprendo porque soy grande”. Realidad: plasticidad adulta es más lenta, no inexistente.',
    cite: 'Kandel (2000) · Hebb (1949)',
  },
  'interoception': {
    caseStudy: 'Barrett: pacientes con ínsula dañada confunden emociones — no pueden nombrar lo que sienten.',
    myth: 'Mito: “las emociones vienen de afuera”. Realidad: el cerebro las construye desde adentro.',
    cite: 'Barrett (2017) · Craig (2009)',
  },
  'patient-hm': {
    caseStudy: 'H.M. participó en 100+ estudios durante 55 años sin recordar haberlos hecho.',
    myth: 'Mito: “la memoria es un archivo”. Realidad: sin hipocampo no hay índice de episodios nuevos.',
    cite: 'Scoville & Milner (1957) · Corkin (2002)',
  },
  'phineas-gage': {
    caseStudy: 'Gage vivió 12 años más; su cráneo y la barra están en el Warren Museum de Harvard.',
    myth: 'Mito: “la inteligencia está en el IQ”. Realidad: PFC es juicio, planificación y carácter.',
    cite: 'Harlow (1848) · Damasio (1994)',
  },
  'predictive-brain': {
    caseStudy: 'La ilusión de adelantamiento visual: tu cerebro “rellena” frames que no llegaron a tiempo.',
    myth: 'Mito: “veo el mundo tal cual es”. Realidad: ves tu mejor predicción corregida.',
    cite: 'Friston (2010) · Barrett (2017)',
  },
  'pain-matrix': {
    caseStudy: 'Eisenberger: exclusion social activa ínsula y cíngulo igual que dolor físico en fMRI.',
    myth: 'Mito: “dolor = daño”. Realidad: dolor = output cerebral en contexto.',
    cite: 'Melzack (1999) · Eisenberger et al. (2003)',
  },
  'cerebellum-mass': {
    caseStudy: 'Hájós & Szabadics (2016): las neuronas granulares cerebelares disparan a frecuencias extremas — densidad única.',
    myth: 'Mito: “el cerebelo es solo coordinación motora”. Realidad: timing cognitivo y predicción.',
    cite: 'Buckner (2013) · Schmahmann (2019)',
  },
  'blindsight': {
    caseStudy: 'Paciente D.B. (Weiskrantz 1986): “ciego” pero acertaba ubicación de objetos al 100%.',
    myth: 'Mito: “si no lo veo, no lo proceso”. Realidad: vías subcorticales procesan sin conciencia.',
    cite: 'Weiskrantz et al. (1974) · de Gelder (2010)',
    intensity: 'brutal',
    quote: '“La conciencia es el último en enterarse.” — Weiskrantz',
  },
  'patient-hm': {
    intensity: 'brutal',
    quote: '“Cada día es solo para él el primero de su vida.” — Corkin sobre H.M.',
    deepCut: 'H.M. firmaba consentimientos sin recordar haberlos firmado minutos antes.',
  },
  'phineas-gage': {
    intensity: 'brutal',
    quote: '“Gage ya no era Gage.” — Dr. Harlow, 1868',
    deepCut: 'La barra pesaba 6 kg y salió por la parte superior del cráneo. Caminó solo.',
  },
  'split-brain': {
    caseStudy: 'Paciente W.J.: la mano izquierda peleaba por el control del volante mientras la derecha corregía.',
    myth: 'Mito: “un hemisferio es creativo, otro lógico”. Realidad: ambos hacen casi todo — la especialización es sutil.',
    cite: 'Sperry (1981 Nobel) · Gazzaniga',
    intensity: 'brutal',
    quote: '“Hay dos mentes conscientes en un solo cráneo.” — Gazzaniga',
    deepCut: 'Con ojos vendados, un paciente se sonreía con una mano y se hacía cosquillas con la otra — riéndose de sí mismo sin saber por qué.',
  },
  'patient-sm': {
    caseStudy: 'Feinstein et al. (2011): único estudio con CO₂ inhalado — S.M. no mostró miedo mientras otros entraban en pánico.',
    myth: 'Mito: “sin miedo serías libre”. Realidad: sin amígdala te metes en situaciones mortales sin alarma.',
    cite: 'Feinstein et al. (2011) · Adolphs (2013)',
    intensity: 'brutal',
    quote: '“El miedo no es opcional — es arquitectura.” — LeDoux',
    deepCut: 'Le ofrecieron tocar serpientes venenosas en laboratorio. Lo hizo. Con curiosidad.',
  },
  'capgras': {
    caseStudy: 'Un paciente intentó estrangular a su padre creyendo que era un doble — reconocimiento visual intacto, familiaridad muerta.',
    myth: 'Mito: “es locura sin lógica”. Realidad: la PFC construye narrativa coherente ante datos emocionales rotos.',
    cite: 'Capgras & Reboul-Lachaux (1923) · Ramachandran',
    intensity: 'brutal',
    deepCut: 'Algunos pacientes solo tienen Capgras con familiares en persona — en fotos los reconocen “como ellos”.',
  },
  'phantom-limb': {
    caseStudy: 'Ramachandran: un paciente sintió su mano fantasma en un espejo y lloró al “verla” de nuevo.',
    myth: 'Mito: “el dolor fantasma es psicológico”. Realidad: es mapa somatosensorial sin input — muy real en corteza.',
    cite: 'Ramachandran & Rogers-Ramachandran (1996)',
    intensity: 'brutal',
    quote: '“El cerebro no distingue entre lo que ve y lo que construye.” — Ramachandran',
  },
  'london-taxi': {
    caseStudy: 'Maguire: al jubilarse, el hipocampo de taxistas vuelve hacia el tamaño promedio — plasticidad reversible.',
    myth: 'Mito: “el cerebro adulto no cambia de tamaño”. Realidad: uso intenso remodela estructura en meses.',
    cite: 'Maguire et al. (2000) · Woollett & Maguire (2011)',
    intensity: 'intenso',
    deepCut: 'The Knowledge toma 3–4 años. 25,000 calles. Sin GPS. Sin mapa.',
  },
  'synesthesia': {
    caseStudy: 'Daniel Tammet: recitó π a 22,514 decimales — cada dígito con color y forma sinestésica como ancla.',
    myth: 'Mito: “es imaginación poética”. Realidad: activación cruzada medible en fMRI desde la infancia.',
    cite: 'Ramachandran & Hubbard (2001)',
    intensity: 'intenso',
    deepCut: 'Para algunos sinestésicos, el número 4 es “verde sucio” y el 7 es “azul celeste” — siempre, desde niños.',
  },
  ...SCHOOL_LESSON_META,
}

export const NEURO_PUNCH = [
  'Tu cerebro consume 20% de tu energía corporal con solo 2% de tu masa. Es el órgano más hambriento que tienes.',
  'Las neuronas disparan a ~100 m/s. Un pensamiento complejo recorre metros de cable en milisegundos.',
  'Perder 1 noche de sueño deteriora tu atención como si hubieras bebido. Van Dongen lo midió en 2003.',
  'El hipocampo de un taxista de Londres es más grande que el tuyo — si no manejas sin GPS cada día.',
  'La amígdala reacciona en 12 ms. Tu conciencia visual tarda 30. Saltas antes de saber por qué.',
  'H.M. vivió 55 años sin recordar un solo día nuevo. Su caso fundó la neurociencia de la memoria.',
  'Phineas Gage sobrevivió una barra de hierro en el cráneo. Su personalidad no sobrevivió intacta.',
  'El cerebelo tiene ~69 mil millones de neuronas. El resto del cerebro, ~16 mil millones.',
  'Schultz demostró: la dopamina sube en la anticipación, no en el placer. Por eso el scroll engancha.',
  'Durante el sueño profundo, tu cerebro se lava. El sistema glinfático elimina β-amiloide solo de noche.',
  '“Neurons that fire together, wire together” — Hebb, 1949. Sigue siendo ley de tu cerebro hoy.',
  'El dolor rechazo social activa las mismas regiones que un golpe físico. Eisenberger, 2003.',
  'Tu cerebro predice el mundo y solo procesa sorpresas. No ves realidad — ves predicciones corregidas.',
  'Blindsight: pacientes “ciegos” que aciertan dónde está un objeto sin saber que lo ven.',
  'BDNF sube con 30 min de caminar. Tu hipocampo literalmente crece con ejercicio aeróbico.',
  'Una decisión trivial consume la misma PFC que una importante. Por eso al final del día eliges mal.',
  'La ínsula lee tu corazón, respiración y tensión antes de que nombres la emoción.',
  'Sin GABA, tu cerebro sería convulsión permanente. El equilibrio excitación/inhibición es todo.',
  'El N-back no te hace genio. Te hace mejor en mantener una ventana mental deslizante — y eso sí importa.',
  'La red por defecto consume energía cuando “no haces nada”. Rumias, simulas, te autobiografías.',
  'Place cells: cada ubicación que visitas tiene neuronas dedicadas en tu hipocampo. Nobel 2014.',
  'El nervio vago es el freno biológico. Exhalar largo es la única palanca autónoma voluntaria.',
  'LTP fortalece sinapsis con uso. LTD las debilita sin uso. Tu cerebro poda cada semana.',
  'Paciente S.M. sin amígdala: tocó serpientes venenosas sin miedo. El miedo es circuito, no razón.',
  'Cerebro dividido: la mano izquierda puede pelear con la derecha por el volante. Dos mentes, un cuerpo.',
  'Capgras: reconoces el rostro de tu madre pero tu amígdala no siente familiaridad — conclusión: impostor.',
  'Taxistas de Londres: 4 años memorizando calles agrandan el hipocampo. El GPS lo encoge.',
  'Sinestesia: el 7 es púrpura. No es metáfora — es cruce neural medible en fMRI.',
  'Miembro fantasma: 80% de amputados sienten el brazo que ya no existe. El mapa cortical no se borra.',
  'Tu yo unificado es ilusión del cuerpo calloso. Sin él, Gazzaniga demostró dos consciencias.',
  'Recuerdos vívidos pueden ser falsos. El hipocampo reconstruye — no reproduce.',
]

function enrichLesson(lesson) {
  const meta = LESSON_META[lesson.id]
  return meta ? { ...lesson, ...meta } : lesson
}

export function getDailyNeuroPunch(date = new Date()) {
  const day = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  return NEURO_PUNCH[day % NEURO_PUNCH.length]
}

export function renderNeuroPunchBanner() {
  return `<aside class="academy-punch span-full">
    <p class="academy-punch-label">⚡ Dato brutal</p>
    <p class="academy-punch-text">${getDailyNeuroPunch()}</p>
  </aside>`
}

export function getDailyDebate(date = new Date()) {
  const day = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  return NEURO_DEBATES[day % NEURO_DEBATES.length]
}

export function renderDebateBanner() {
  const d = getDailyDebate()
  return `<aside class="academy-debate span-full">
    <p class="academy-debate-label">⚔️ Mito vs ciencia</p>
    <p class="academy-debate-q">${d.q}</p>
    <p class="academy-debate-a">${d.a}</p>
  </aside>`
}

export function renderLegendaryHall() {
  const cards = LEGENDARY_HALL.map(c => {
    const unlocked = isLessonUnlocked(c.lessonId)
    return `<button type="button" onclick="openLesson('${c.lessonId}')" class="academy-legend ${unlocked ? '' : 'academy-legend--locked'}">
      <span class="academy-legend-year">${c.year}</span>
      <span class="academy-legend-name">${c.name}</span>
      <span class="academy-legend-tag">${c.tagline}</span>
      ${unlocked ? '' : '<span class="academy-legend-lock">🔒</span>'}
    </button>`
  }).join('')
  return `<section class="academy-hall span-full">
    <div class="academy-hall-head">
      <h2 class="academy-hall-title">🏛️ Casos legendarios</h2>
      <p class="academy-hall-sub">Pacientes y experimentos que reescribieron la neurociencia</p>
    </div>
    <div class="academy-hall-scroll">${cards}</div>
  </section>`
}

function intensityBadge(intensity) {
  if (intensity === 'brutal') return '<span class="academy-intensity academy-intensity--brutal">🔥 Brutal</span>'
  if (intensity === 'intenso') return '<span class="academy-intensity academy-intensity--hot">⚡ Intenso</span>'
  return ''
}

export const EXERCISE_REAL_WORLD = {
  nback: 'CPFDL actualizando información: reuniones con specs, cocinar con receta, código con requisitos en mente.',
  corsi: 'Hipocampo espacial: recordar dónde dejaste cosas, rutas, layouts de interfaz, mapas mentales.',
  stroop: 'Cíngulo anterior en conflicto: inhibir respuesta automática en chats, emails, compras impulsivas.',
  gonogo: 'Ganglios basales + PFC: inhibir impulso de abrir notificación, responder de golpe, comer por ansiedad.',
  flanker: 'Red dorsal vs ventral: filtrar distractores laterales en oficina abierta, ruido, pensamientos intrusos.',
  switching: 'PFC rostrolateral: alternar modos mentales — creativo ↔ analítico, escuchar ↔ presentar.',
  symbols: 'Velocidad de procesamiento parietal: leer gráficos, tablas, códigos de color en trabajo técnico.',
  logic: 'PFC rostrolateral: razonamiento bajo incertidumbre, debugging, decisiones con información incompleta.',
  math: 'Giro angular y PFC: cálculo mental bajo presión — presupuestos, propinas, estimaciones rápidas.',
  memory: 'Hipocampo + PFC: retener secuencias visuales — listas, pasos, instrucciones en orden.',
  simon: 'Bucle fronto-parietal: span de dígitos — números de teléfono, códigos, datos en cadena.',
  sequence: 'Corteza prefrontal: detectar patrones — tendencias, errores recurrentes, reglas ocultas.',
}

export const LAB_EXERCISE_IDS = [
  'nback', 'corsi', 'stroop', 'gonogo', 'flanker', 'switching', 'symbols', 'logic',
  'math', 'memory', 'simon', 'sequence',
]

export const LAB_EXERCISE_GROUPS = [
  { id: 'protocols', label: 'Protocolos de laboratorio', ids: ['nback', 'corsi', 'stroop', 'gonogo', 'flanker', 'switching', 'symbols', 'logic'] },
  { id: 'training', label: 'Entrenamiento cognitivo', ids: ['math', 'memory', 'simon', 'sequence'] },
]

export function getLessonExercise(lessonId) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  return lesson?.relatedExercise || null
}

/** Quizzes manuales para casos clave; el resto se genera desde takeaway/mito */
export const LESSON_QUIZZES = {
  'patient-hm': [
    { q: '¿Qué perdió H.M. tras la operación?', options: ['Memoria procedimental', 'Memoria episódica nueva', 'Inteligencia general'], correct: 1 },
    { q: '¿Qué conservó H.M.?', options: ['Aprender habilidades motoras sin recordar aprender', 'Nada', 'Solo memoria visual'], correct: 0 },
    { q: '¿Qué estructura se extirpó?', options: ['Cerebelo', 'Hipocampo bilateral', 'Amígdala'], correct: 1 },
  ],
  'phineas-gage': [
    { q: '¿Qué cambió en Gage después del accidente?', options: ['Su IQ subió', 'Su personalidad y juicio', 'Su memoria'], correct: 1 },
    { q: '¿Qué región sufrió daño?', options: ['Lóbulo frontal / PFC', 'Hipocampo', 'Cerebelo'], correct: 0 },
    { q: '¿Sobrevivió al accidente?', options: ['No', 'Sí, 12 años más', 'Solo unas horas'], correct: 1 },
  ],
  'patient-sm': [
    { q: '¿Por qué S.M. no siente miedo?', options: ['Valentía extrema', 'Amígdala bilateral destruida', 'Falta de imaginación'], correct: 1 },
    { q: '¿Qué hizo con serpientes venenosas en el lab?', options: ['Las evitó', 'Las tocó con curiosidad', 'No participó'], correct: 1 },
    { q: '¿Qué emociones SÍ experimenta?', options: ['Ninguna', 'Alegría, tristeza, ira', 'Solo miedo'], correct: 1 },
  ],
  'split-brain': [
    { q: '¿Qué se cortó en pacientes split-brain?', options: ['Hipocampo', 'Cuerpo calloso', 'Nervio óptico'], correct: 1 },
    { q: '¿Quién ganó el Nobel por este trabajo?', options: ['Kandel', 'Sperry', 'O’Keefe'], correct: 1 },
    { q: '¿Qué puede pasar entre hemisferios separados?', options: ['Nada', 'Conflictos entre manos / voluntades', 'Pérdida de visión'], correct: 1 },
  ],
  'stroop-life': [
    { q: '¿Qué detecta el cíngulo anterior en Stroop?', options: ['Color', 'Conflicto cognitivo', 'Hambre'], correct: 1 },
    { q: 'En Stroop clásico, ¿qué debes nombrar?', options: ['La palabra escrita', 'El color de la tinta', 'La primera letra'], correct: 1 },
    { q: 'Un “Stroop emocional” en vida real es…', options: ['Responder de golpe en un chat', 'Dormir bien', 'Caminar'], correct: 0 },
  ],
  'nback-transfer': [
    { q: '¿Qué entrena principalmente el N-back?', options: ['Memoria de trabajo / actualización', 'IQ general garantizado', 'Creatividad artística'], correct: 0 },
    { q: 'Transferencia lejana a IQ (Sala & Gobet):', options: ['Enorme', 'Pequeña y debatida', 'Inexistente en todos los estudios'], correct: 1 },
    { q: 'Dosis típica con evidencia:', options: ['1 h una vez', '~20 min, 3×/sem, 8 sem', '10 h diarias'], correct: 1 },
  ],
}

export function getLessonQuiz(lessonId) {
  if (LESSON_QUIZZES[lessonId]) return LESSON_QUIZZES[lessonId]
  const L = getLesson(lessonId)
  if (!L?.takeaway) return null
  const mythWrong = L.myth?.includes('Mito:')
    ? L.myth.split('Realidad:')[0].replace('Mito:', '').trim().slice(0, 70)
    : 'El cerebro solo usa el 10%'
  const region = (L.region || 'Corteza cerebral').split('·')[0].trim()
  return [
    { q: `Idea central de “${L.title}”:`, options: [L.takeaway.slice(0, 90), mythWrong, 'No tiene base científica'], correct: 0 },
    { q: 'Región o sistema principal:', options: [region, 'Solo el tálamo', 'Ninguno en particular'], correct: 0 },
    { q: '¿Qué harías para aplicarlo hoy?', options: [L.apply.slice(0, 90), 'Ignorarlo', 'Esperar motivación'], correct: 0 },
  ]
}

export function renderHomeNeuroCard() {
  const lesson = getDailyLesson()
  const punch = getDailyNeuroPunch()
  const ex = getLessonExercise(lesson.id)
  const unlocked = isLessonUnlocked(lesson.id)
  return `<section class="m-neuro span-full">
    <div class="m-neuro-head">
      <p class="m-neuro-label">Neuro hoy</p>
      <a href="#/gimnasia" class="m-neuro-more no-underline" onclick="brainState.brainView='school';setTimeout(render,0)">Escuela →</a>
    </div>
    <p class="m-neuro-punch">${punch}</p>
    <div class="m-neuro-actions">
      ${unlocked
        ? `<button type="button" onclick="goToLesson('${lesson.id}')" class="m-neuro-btn m-neuro-btn--primary">📖 ${lesson.title}</button>`
        : `<a href="#/gimnasia" class="m-neuro-btn no-underline">📖 Ir a Academia</a>`}
      ${ex ? `<button type="button" onclick="goToLab('${ex}')" class="m-neuro-btn">🔬 ${ex}</button>` : ''}
    </div>
  </section>`
}

export function renderLessonPostFlow(flow) {
  const lesson = getLesson(flow.id)
  if (!lesson) return ''
  const quiz = getLessonQuiz(flow.id)
  const exId = lesson.relatedExercise

  if (flow.phase === 'quiz' && quiz) {
    const q = quiz[flow.quizIndex]
    if (!q) {
      flow.phase = 'bridge'
      return renderLessonPostFlow(flow)
    }
    const pct = Math.round((flow.quizIndex / quiz.length) * 100)
    return `<div class="academy-post-flow animate-fade-in">
      <p class="academy-post-label">Paso 1 · Comprueba lo aprendido</p>
      <div class="progress-track w-full mb-4" style="height:4px"><div class="progress-fill h-full" style="width:${pct}%"></div></div>
      <h2 class="academy-post-title">${q.q}</h2>
      <div class="academy-quiz-options">
        ${q.options.map((opt, i) => `
          <button type="button" onclick="answerLessonQuiz(${i})" class="academy-quiz-opt">${opt}</button>`).join('')}
      </div>
      <p class="text-xs text-muted mt-3 text-center">${flow.quizIndex + 1} / ${quiz.length}</p>
    </div>`
  }

  const quizLine = flow.quizScore != null && quiz
    ? `<p class="academy-post-score">Quiz: ${flow.quizScore}/${quiz.length} correctas</p>`
    : ''

  return `<div class="academy-post-flow animate-fade-in">
    <p class="academy-post-label">Paso 2 · Cierra el bucle</p>
    <h2 class="academy-post-title">✓ ${lesson.title}</h2>
    ${quizLine}
    <p class="academy-post-hook">${lesson.takeaway}</p>
    ${exId ? `<button type="button" onclick="startLessonPractice('${exId}')" class="btn-primary w-full py-4 mb-3">🔬 Practicar ${exId} en laboratorio</button>` : ''}
    <button type="button" onclick="finishLessonFlow(true)" class="btn-primary w-full py-4 mt-4">Terminar lección</button>
  </div>`
}

export function getDailyLesson(date = new Date()) {
  const day = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  return enrichLesson(LESSONS[day % LESSONS.length])
}

export function getAcademyWeekIndex() {
  let start = getItem(ACADEMY_START_KEY, null)
  if (!start) {
    start = { year: new Date().getFullYear(), week: getWeekNumber() }
    setItem(ACADEMY_START_KEY, start)
  }
  const nowY = new Date().getFullYear()
  const nowW = getWeekNumber()
  if (nowY === start.year) return Math.max(0, nowW - start.week)
  return Math.max(0, (nowY - start.year) * 52 + (nowW - start.week))
}

const LEGENDARY_LESSON_IDS = new Set(LEGENDARY_HALL.map(c => c.lessonId))

export function isLegendaryLesson(lessonId) {
  return LEGENDARY_LESSON_IDS.has(lessonId)
}

/** 4 lecciones al inicio + 4 nuevas por semana (~12 semanas para 52) */
export function getUnlockedLessonCount() {
  return Math.min(LESSONS.length, 4 + getAcademyWeekIndex() * 4)
}

export function isLessonUnlocked(lessonId) {
  if (APPLY_LESSON_IDS.has(lessonId)) return true
  if (isLegendaryLesson(lessonId)) return true
  const currentWeek = getAcademyWeekIndex() + 1
  if (isCurriculumLessonUnlocked(lessonId, currentWeek)) return true
  const idx = LESSONS.findIndex(l => l.id === lessonId)
  return idx >= 0 && idx < getUnlockedLessonCount()
}

export function getLessonUnlockWeek(lessonId) {
  if (APPLY_LESSON_IDS.has(lessonId)) return null
  if (isLegendaryLesson(lessonId)) return null
  const idx = LESSONS.findIndex(l => l.id === lessonId)
  if (idx < 0) return null
  if (idx < 4) return 1
  return Math.ceil((idx - 3) / 4) + 1
}

export function getWeeklyLesson() {
  const count = getUnlockedLessonCount()
  return enrichLesson(LESSONS[count - 1] || LESSONS[0])
}

export function getWeeklyLessonMeta() {
  const week = getAcademyWeekIndex() + 1
  const lesson = getWeeklyLesson()
  const done = getCompletedLessons().includes(lesson.id)
  return { week, lesson, isNew: !done, unlocked: getUnlockedLessonCount(), total: LESSONS.length }
}

const DEBRIEF_BY_DOMAIN = {
  working_memory: '¿Qué circuito de WM (CPFDL) activaste hoy fuera de la app?',
  inhibition: '¿Hubo un impulso que tu cíngulo-PFC inhibió (o no) antes de esta sesión?',
  flexibility: '¿Tuviste que reconfigurar task-set hoy (PFC rostrolateral)?',
  processing_speed: '¿En qué momento tu procesamiento parietal se sintió lento?',
  attention: '¿Qué estímulo bottom-up secuestró tu red ventral hoy?',
  reasoning: '¿Qué decisión requiere PFC rostrolateral en lugar de automático?',
}

const DEBRIEF_GENERIC = [
  '¿Qué región cerebral crees que más entrenaste hoy?',
  'Del 1 al 10, ¿cómo está tu claridad en PFC ahora vs. antes?',
  '¿Qué harás diferente en las próximas 2 h gracias a esta sesión?',
]

export function getSessionDebrief(results = []) {
  const domains = []
  const seen = new Set()
  let weakest = null
  results.forEach(r => {
    if (r.domain && !seen.has(r.domain)) {
      seen.add(r.domain)
      domains.push(r.domain)
    }
    if (!weakest || r.accuracy < weakest.accuracy) weakest = r
  })
  const prompts = []
  domains.forEach(d => {
    if (DEBRIEF_BY_DOMAIN[d]) prompts.push(DEBRIEF_BY_DOMAIN[d])
  })
  DEBRIEF_GENERIC.forEach(p => { if (prompts.length < 3) prompts.push(p) })
  const intro = weakest
    ? `Entrenaste ${results.length} protocolos. El más exigente: ${weakest.name || 'ejercicio'} (${Math.round((weakest.accuracy || 0) * 100)}%). Cierra el bucle neuronal con 30 s de reflexión.`
    : 'Sesión completada. La reflexión post-entrenamiento consolida aprendizaje motor y cognitivo.'
  return { intro, prompts: prompts.slice(0, 3), weakest }
}

export function getLesson(id) {
  const l = LESSONS.find(x => x.id === id)
  return l ? enrichLesson(l) : null
}

export function lessonProgressHTML(lessonId, completed = false) {
  const idx = LESSONS.findIndex(l => l.id === lessonId)
  return `${idx + 1}/${LESSONS.length}`
}

export function getCompletedLessons() {
  const done = getItem('lessons_done', [])
  if (done.length) return done
  try {
    const legacy = JSON.parse(localStorage.getItem('mejora_lessons_done') || '[]')
    if (legacy.length) {
      setItem('lessons_done', legacy)
      localStorage.removeItem('mejora_lessons_done')
      return legacy
    }
  } catch {}
  return []
}

export function markLessonComplete(id) {
  const done = getCompletedLessons()
  if (!done.includes(id)) {
    done.push(id)
    setItem('lessons_done', done)
    import('./school.js').then(m => m.scheduleLessonReview(id)).catch(() => {})
  }
  return done
}

export function renderLessonCard(lesson, opts = {}) {
  const L = enrichLesson(lesson)
  const cat = LESSON_CATEGORIES[L.category] || LESSON_CATEGORIES.systems
  const done = getCompletedLessons().includes(L.id)
  const unlocked = isLessonUnlocked(L.id)
  const unlockWeek = getLessonUnlockWeek(L.id)
  if (!unlocked) {
    return `<article class="academy-lesson-card academy-lesson-card--locked">
      <div class="academy-lesson-card__head">
        <span class="academy-lesson-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
        <span class="academy-lesson-lock">🔒 Sem. ${unlockWeek}</span>
      </div>
      <h3 class="academy-lesson-title">${L.title}</h3>
      <p class="academy-lesson-hook academy-lesson-hook--muted">${unlockWeek ? `Se desbloquea la semana ${unlockWeek}` : 'Próximamente'} · catálogo progresivo.</p>
    </article>`
  }
  return `<article class="academy-lesson-card ${done ? 'is-done' : ''} ${opts.featured ? 'academy-lesson-card--featured' : ''} ${opts.weekly ? 'academy-lesson-card--weekly' : ''}">
    <div class="academy-lesson-card__head">
      <span class="academy-lesson-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
      <span class="academy-lesson-time">${opts.weekly && !done ? '✨ Nueva' : ''} ${L.readMin} min ${intensityBadge(L.intensity)}</span>
    </div>
    <h3 class="academy-lesson-title">${L.title}${isLegendaryLesson(L.id) ? ' <span class="academy-legend-badge">🏛️</span>' : ''}</h3>
    ${L.region ? `<p class="text-xs text-muted mt-1">📍 ${L.region}</p>` : ''}
    <p class="academy-lesson-hook">${L.hook}</p>
    ${L.deepCut && opts.featured ? `<p class="academy-card-deep">🔪 ${L.deepCut}</p>` : ''}
    ${opts.featured || opts.weekly ? '' : `<button type="button" onclick="openLesson('${L.id}')" class="btn-secondary text-sm w-full mt-3">${done ? 'Releer →' : 'Leer lección →'}</button>`}
  </article>`
}

export function renderLessonFull(lesson) {
  const L = enrichLesson(lesson)
  const cat = LESSON_CATEGORIES[L.category] || LESSON_CATEGORIES.systems
  const done = getCompletedLessons().includes(L.id)
  const exId = L.relatedExercise
  const exBtn = exId
    ? `<button type="button" onclick="closeLesson();brainState.brainView='lab';startBrain('${exId}')" class="btn-secondary w-full mt-3">🔬 Practicar en laboratorio →</button>`
    : ''
  return `<div class="academy-lesson-full animate-fade-in">
    <button type="button" onclick="closeLesson()" class="btn-ghost mb-4">← Volver a ${typeof brainState !== 'undefined' && brainState.brainView === 'school' ? 'Escuela' : 'Catálogo'}</button>
    <header class="academy-lesson-header">
      <span class="academy-lesson-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
      <h1 class="academy-lesson-full-title">${L.title} ${intensityBadge(L.intensity)}</h1>
      <p class="academy-lesson-full-hook">${L.hook}</p>
      ${L.quote ? `<blockquote class="academy-quote">${L.quote}</blockquote>` : ''}
      ${L.region ? `<p class="text-sm text-muted mt-2">📍 ${L.region}</p>` : ''}
      <span class="academy-lesson-time">${L.readMin} min de lectura</span>
    </header>
    ${L.caseStudy ? `<aside class="academy-case card-static"><p class="academy-case-label">🧪 Caso clínico</p><p class="academy-case-text">${L.caseStudy}</p></aside>` : ''}
    <div class="academy-lesson-body">
      ${L.sections.map(s => `
        <section class="academy-section">
          <h2 class="academy-section-title">${s.h}</h2>
          <p class="academy-section-text">${s.p}</p>
        </section>`).join('')}
    </div>
    ${L.myth ? `<aside class="academy-myth card-static"><p class="academy-myth-label">🚫 Mito vs realidad</p><p class="academy-myth-text">${L.myth}</p></aside>` : ''}
    ${L.deepCut ? `<aside class="academy-deep card-static"><p class="academy-deep-label">🔪 Deep cut</p><p class="academy-deep-text">${L.deepCut}</p></aside>` : ''}
    <aside class="academy-takeaway card-static">
      <p class="academy-takeaway-label">💎 En una frase</p>
      <p class="academy-takeaway-text">${L.takeaway}</p>
    </aside>
    <aside class="academy-apply card-static">
      <p class="academy-apply-label">⚡ Aplica hoy</p>
      <p class="academy-apply-text">${L.apply}</p>
    </aside>
    ${L.cite ? `<p class="academy-cite">📚 ${L.cite}</p>` : ''}
    ${exBtn}
    <div class="academy-reflect">
      <p class="academy-reflect-label">Reflexión</p>
      <p class="academy-reflect-prompt">"${L.reflect}"</p>
      <textarea id="lesson-reflect-text" class="input-field min-h-20 resize-none mt-2" placeholder="Opcional: escribe tu reflexión…"></textarea>
    </div>
    <button type="button" onclick="completeLesson('${L.id}')" class="btn-primary w-full py-4 mt-4">
      ${done ? 'Continuar → quiz y práctica' : 'Completar lección → quiz (+30 XP)'}
    </button>
  </div>`
}
