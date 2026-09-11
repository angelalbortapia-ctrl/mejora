export const LOGIC_PUZZLES = [
  { q: 'Si todos los gatos son animales y algunos animales son salvajes, ¿cuál es cierto?', options: ['Todos los gatos son salvajes', 'Algunos gatos pueden ser salvajes', 'Ningún gato es salvaje', 'Todos los animales son gatos'], answer: 1, diff: 'facil', explain: '“Algunos animales son salvajes” no excluye a los gatos. Pueden existir gatos salvajes sin que todos lo sean. Es lógica de conjuntos, no de certeza absoluta.' },
  { q: '¿Qué palabra no encaja? Rosa, Tulipán, Girasol, Mesa', options: ['Rosa', 'Tulipán', 'Girasol', 'Mesa'], answer: 3, diff: 'facil', explain: 'Las tres primeras son flores; “Mesa” es mueble. Este tipo de puzzle entrena categorización rápida — habilidad verbal del razonamiento fluido.' },
  { q: 'Continúa: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], answer: 1, diff: 'medio', explain: 'Diferencias: +4, +6, +8… la siguiente diferencia es +10. 20+10=30. Patrón de incrementos crecientes en la diferencia.' },
  { q: 'Un padre tiene 3 hijos. Cada hijo tiene una hermana. ¿Cuántos hijos tiene?', options: ['4', '3', '6', '5'], answer: 0, diff: 'medio', explain: 'Una sola hermana compartida por los 3 hermanos = 3 hijos + 1 hija = 4 hijos en total. El truco es no contar la hermana cuatro veces.' },
  { q: 'Si A > B y B > C, entonces:', options: ['C > A', 'A > C', 'A = C', 'No se puede saber'], answer: 1, diff: 'facil' },
  { q: 'Continúa: 1, 1, 2, 3, 5, 8, ?', options: ['11', '13', '12', '10'], answer: 1, diff: 'medio' },
  { q: 'En un grupo de 100, 70 hablan inglés y 50 francés. Si 30 hablan ambos, ¿cuántos solo inglés?', options: ['40', '50', '30', '20'], answer: 0, diff: 'dificil' },
  { q: '¿Qué número falta? 3, 9, 27, ?', options: ['54', '81', '72', '63'], answer: 1, diff: 'medio' },
  { q: 'Si giras una palabra "AMOR" 180°, ¿se lee igual?', options: ['Sí', 'No', 'Depende del idioma', 'Solo en mayúsculas'], answer: 1, diff: 'facil' },
  { q: 'Continúa: 1, 4, 9, 16, 25, ?', options: ['30', '36', '35', '49'], answer: 1, diff: 'facil' },
  { q: 'Tres interruptores controlan 3 bombillas en otra habitación. Solo puedes entrar una vez. ¿Cómo saber cuál es cuál?', options: ['Imposible', 'Encender uno 5 min, apagar, encender otro y entrar', 'Encender todos', 'Preguntar'], answer: 1, diff: 'experto' },
  { q: 'Si 5 máquinas hacen 5 widgets en 5 min, ¿cuánto tardan 100 máquinas en 100 widgets?', options: ['100 min', '5 min', '20 min', '1 min'], answer: 1, diff: 'dificil' },
  { q: '¿Cuál es el siguiente? ○ △ ○ △ ○ ?', options: ['○', '△', '□', '◇'], answer: 1, diff: 'facil' },
  { q: 'Un reloj se atrasa 2 min/hora. ¿Cuánto tarda en marcar bien de nuevo si empieza a las 12:00?', options: ['Nunca', '360 horas', '720 horas', '24 horas'], answer: 2, diff: 'experto' },
  { q: 'Continúa: 2, 3, 5, 7, 11, ?', options: ['12', '13', '14', '15'], answer: 1, diff: 'medio', explain: 'Serie de primos: 2, 3, 5, 7, 11 — el siguiente primo es 13.' },
  { q: 'Un granjero tiene 17 ovejas. Todas menos 9 mueren. ¿Cuántas quedan?', options: ['8', '9', '17', '0'], answer: 1, diff: 'facil', explain: '“Todas menos 9” = 9 sobreviven. Lee el lenguaje literal antes de restar 17−9.' },
  { q: 'Si ayer era mañana del jueves, ¿qué día es hoy?', options: ['Miércoles', 'Viernes', 'Sábado', 'Domingo'], answer: 2, diff: 'dificil', explain: 'Si ayer era “mañana del jueves”, ayer era viernes → hoy es sábado. Razonamiento temporal inverso.' },
  { q: 'Tienes una moneda falsa entre 12. Pesa distinto pero no sabes si más o menos. Con una balanza de dos platos, ¿mínimo de pesadas para encontrarla?', options: ['2', '3', '4', '6'], answer: 1, diff: 'experto', explain: 'Divide en 3 grupos de 4. Primera pesada identifica el grupo; segunda entre 4; tercera entre 2. Máximo 3 pesadas.' },
  { q: '¿Cuál afirmación es siempre verdadera? “Si llueve, llevo paraguas” vs “Si llevo paraguas, llueve”', options: ['Ambas', 'Solo la primera implica la segunda', 'Solo la segunda implica la primera', 'Ninguna implica la otra'], answer: 3, diff: 'medio', explain: 'Correr es condición suficiente para sudar, no necesaria. Llevar paraguas no implica lluvia (puede ser preventivo). Falacia del afirmar el consecuente.' },
]

export const WORD_GROUPS = {
  facil: [
    { words: ['Sol', 'Luna', 'Estrella', 'Casa'], odd: 'Casa' },
    { words: ['Perro', 'Gato', 'Pájaro', 'Mesa'], odd: 'Mesa' },
    { words: ['Rojo', 'Azul', 'Verde', 'Correr'], odd: 'Correr' },
    { words: ['Pan', 'Arroz', 'Pasta', 'Silla'], odd: 'Silla' },
  ],
  medio: [
    { words: ['Metáfora', 'Símil', 'Hipérbole', 'Sustantivo'], odd: 'Sustantivo' },
    { words: ['Fotosíntesis', 'Clorofila', 'Estoma', 'Hidrógeno'], odd: 'Hidrógeno' },
    { words: ['Democracia', 'República', 'Monarquía', 'Triángulo'], odd: 'Triángulo' },
    { words: ['Allegro', 'Adagio', 'Presto', 'Pianissimo'], odd: 'Pianissimo' },
  ],
  dificil: [
    { words: ['Epistemología', 'Ontología', 'Fenomenología', 'Biología'], odd: 'Biología' },
    { words: ['Mitocondria', 'Ribosoma', 'Lisosoma', 'Neurona'], odd: 'Neurona' },
    { words: ['Catalizador', 'Reactivo', 'Producto', 'Gravedad'], odd: 'Gravedad' },
    { words: ['Surrealismo', 'Cubismo', 'Impresionismo', 'Capitalismo'], odd: 'Capitalismo' },
  ],
  experto: [
    { words: ['Heurística', 'Algoritmo', 'Recursión', 'Empatía'], odd: 'Empatía' },
    { words: ['Entropía', 'Enthalpía', 'Termodinámica', 'Filosofía'], odd: 'Filosofía' },
    { words: ['Isócrona', 'Período', 'Frecuencia', 'Melancolía'], odd: 'Melancolía' },
    { words: ['Axioma', 'Teorema', 'Corolario', 'Metáfora'], odd: 'Metáfora' },
  ],
}

export const HABIT_CATEGORIES = {
  salud: { name: 'Salud', icon: '❤️', color: '#ef4444' },
  mente: { name: 'Mente', icon: '🧠', color: '#00d4ff' },
  productividad: { name: 'Productividad', icon: '⚡', color: '#d4864a' },
  sabiduria: { name: 'Sabiduría', icon: '📖', color: '#14b8a6' },
  relaciones: { name: 'Relaciones', icon: '💬', color: '#ec4899' },
}

export const REFLECTION_PROMPTS = {
  facil: [
    '¿Qué me hizo sonreír hoy?', '¿Por qué estoy agradecido/a?', '¿Qué fue lo mejor del día?',
    '¿A quién le agradeciste hoy, aunque sea con un pensamiento?', '¿Qué momento te dio calma?',
    '¿Qué comiste o bebiste que te hizo sentir bien?', '¿Qué canción, sonido o silencio te acompañó?',
    '¿Qué pequeña victoria casi no notaste?', '¿Qué persona te hizo sentir visto/a?',
    '¿Qué parte del día querrías repetir mañana?', '¿Qué te sorprendió de forma buena?',
    '¿Qué hiciste por ti que antes posponías?', '¿Qué risa o ligereza hubo hoy?',
    '¿Qué vista, luz o color te gustó?', '¿Qué te dio energía aunque fuera poco?',
  ],
  medio: [
    '¿Qué aprendí hoy?', '¿Qué haría diferente?', '¿Qué me sacó de mi zona de confort?',
    '¿En qué momento perdí la atención y por qué?', '¿Qué conversación me dejó pensando?',
    '¿Qué decisión tomé por impulso?', '¿Qué postergué y qué eso dice de mis prioridades?',
    '¿Cómo traté a alguien — incluido yo mismo/a?', '¿Qué miedo apareció y cómo lo manejé?',
    '¿Qué hábito me costó más hoy?', '¿Qué me distrajo y cómo puedo reducirlo mañana?',
    '¿Qué feedback recibí o me di a mí mismo/a?', '¿Qué harías si tuvieras el mismo día otra vez?',
    '¿Qué te enseñó un error pequeño?', '¿Qué relación necesita más presencia tuya?',
  ],
  dificil: [
    '¿Qué patrón negativo noté hoy?', '¿Cómo reaccioné bajo presión?', '¿Qué miedo me frenó?',
    '¿Qué historia me conté sobre mí que quizá no es cierta?', '¿Dónde actué en automático?',
    '¿Qué emoción evité sentir?', '¿Qué límite no puse cuando debía?', '¿Qué comparación me restó?',
    '¿Qué creencia sobre el éxito o el fracaso apareció?', '¿Cómo respondí al estrés en el cuerpo?',
    '¿Qué conversación difícil evité?', '¿Qué sacrificaste por comodidad?', '¿Qué resentimiento llevas sin nombrar?',
    '¿Qué parte de ti necesita más compasión?', '¿Qué harías si no tuvieras miedo al juicio?',
  ],
  experto: [
    '¿Qué creencia limitante descubrí?', '¿Cómo mis acciones reflejan mis valores?', '¿Qué legado estoy construyendo?',
    '¿Qué versión de ti estás entrenando con las decisiones de hoy?', '¿Qué trade-off aceptaste conscientemente?',
    '¿Qué sistema personal falló y cómo lo mejorarías?', '¿Qué identidad estás reforzando con tus hábitos?',
    '¿Qué verdad incómoda evitaste mirar?', '¿Cómo cambiaría tu día si vivieras con 10× más intención?',
    '¿Qué harías si supieras que nadie está mirando?', '¿Qué relación con el tiempo tienes hoy?',
    '¿Qué significa "suficiente" para ti en este momento?', '¿Qué herencia emocional repites o rompes?',
    '¿Qué pregunta deberías hacerte más seguido?', '¿Qué harías distinto si tu yo de 80 años te escribiera una carta?',
  ],
}

export function getDayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d - start) / 86400000)
}

export function getReflectionPrompt(difficulty) {
  const pool = REFLECTION_PROMPTS[difficulty] || REFLECTION_PROMPTS.medio
  return pool[getDayOfYear() % pool.length]
}

export const HABIT_TEMPLATES = [
  { id: 'tpl_water', name: 'Beber agua', icon: '💧', category: 'salud', type: 'counter', target: 8, unit: 'vasos', difficulty: 1, xp: 20 },
  { id: 'tpl_walk', name: 'Caminar 20 min', icon: '🚶', category: 'salud', type: 'check', target: 1, unit: 'vez', difficulty: 2, xp: 30 },
  { id: 'tpl_stretch', name: 'Estirar', icon: '🤸', category: 'salud', type: 'check', target: 1, unit: 'vez', difficulty: 1, xp: 20 },
  { id: 'tpl_sleep', name: 'Dormir 7+ horas', icon: '💤', category: 'salud', type: 'check', target: 1, unit: 'noche', difficulty: 3, xp: 35 },
  { id: 'tpl_noscreen', name: '10 min sin pantalla', icon: '📵', category: 'salud', type: 'check', target: 1, unit: 'bloque', difficulty: 2, xp: 25 },
  { id: 'tpl_vitamins', name: 'Vitaminas / suplementos', icon: '💊', category: 'salud', type: 'check', target: 1, unit: 'vez', difficulty: 1, xp: 15 },
  { id: 'tpl_read', name: 'Leer 15 min', icon: '📖', category: 'sabiduria', type: 'check', target: 1, unit: 'sesión', difficulty: 2, xp: 30 },
  { id: 'tpl_journal', name: 'Escribir en diario', icon: '📝', category: 'sabiduria', type: 'check', target: 1, unit: 'entrada', difficulty: 2, xp: 30 },
  { id: 'tpl_learn', name: 'Aprender algo nuevo', icon: '🎓', category: 'sabiduria', type: 'check', target: 1, unit: 'vez', difficulty: 2, xp: 35 },
  { id: 'tpl_podcast', name: 'Podcast educativo', icon: '🎧', category: 'sabiduria', type: 'check', target: 1, unit: 'episodio', difficulty: 1, xp: 20 },
  { id: 'tpl_meditate', name: 'Meditar', icon: '🧘', category: 'mente', type: 'check', target: 1, unit: 'sesión', difficulty: 2, xp: 35 },
  { id: 'tpl_breath', name: 'Respiración consciente', icon: '🌬️', category: 'mente', type: 'check', target: 1, unit: 'vez', difficulty: 1, xp: 20 },
  { id: 'tpl_brain', name: 'Gimnasia cerebral', icon: '🧠', category: 'mente', type: 'check', target: 1, unit: 'sesión', difficulty: 2, xp: 35 },
  { id: 'tpl_gratitude', name: 'Tres gratitudes', icon: '🙏', category: 'mente', type: 'check', target: 1, unit: 'lista', difficulty: 1, xp: 20 },
  { id: 'tpl_focus', name: 'Bloque de enfoque', icon: '🎯', category: 'productividad', type: 'check', target: 1, unit: 'bloque', difficulty: 3, xp: 40 },
  { id: 'tpl_plan', name: 'Planificar el día', icon: '📋', category: 'productividad', type: 'check', target: 1, unit: 'vez', difficulty: 2, xp: 25 },
  { id: 'tpl_inbox', name: 'Bandeja en cero', icon: '📬', category: 'productividad', type: 'check', target: 1, unit: 'vez', difficulty: 2, xp: 30 },
  { id: 'tpl_tidy', name: 'Ordenar espacio', icon: '🧹', category: 'productividad', type: 'check', target: 1, unit: 'zona', difficulty: 1, xp: 20 },
  { id: 'tpl_nophone', name: 'Sin teléfono al despertar', icon: '⏰', category: 'productividad', type: 'check', target: 1, unit: 'mañana', difficulty: 3, xp: 35 },
  { id: 'tpl_call', name: 'Llamar a alguien querido', icon: '💬', category: 'relaciones', type: 'check', target: 1, unit: 'llamada', difficulty: 2, xp: 30 },
  { id: 'tpl_kind', name: 'Gesto amable', icon: '💝', category: 'relaciones', type: 'check', target: 1, unit: 'gesto', difficulty: 1, xp: 20 },
  { id: 'tpl_family', name: 'Tiempo en familia', icon: '👨‍👩‍👧', category: 'relaciones', type: 'check', target: 1, unit: 'momento', difficulty: 2, xp: 30 },
  { id: 'tpl_exercise', name: 'Ejercicio', icon: '🏃', category: 'salud', type: 'check', target: 1, unit: 'sesión', difficulty: 3, xp: 40 },
  { id: 'tpl_fruit', name: 'Comer fruta/verdura', icon: '🥗', category: 'salud', type: 'counter', target: 3, unit: 'porciones', difficulty: 2, xp: 25 },
  { id: 'tpl_sun', name: 'Salir al sol', icon: '☀️', category: 'salud', type: 'check', target: 1, unit: 'vez', difficulty: 1, xp: 20 },
  { id: 'tpl_music', name: 'Música sin distracciones', icon: '🎵', category: 'mente', type: 'check', target: 1, unit: 'sesión', difficulty: 1, xp: 15 },
  { id: 'tpl_review', name: 'Revisar el día', icon: '🌙', category: 'sabiduria', type: 'check', target: 1, unit: 'noche', difficulty: 2, xp: 25 },
  { id: 'tpl_stairs', name: 'Usar escaleras', icon: '🪜', category: 'salud', type: 'check', target: 1, unit: 'vez', difficulty: 1, xp: 15 },
]

export const WEEKLY_REVIEW_PROMPTS = [
  '¿Cuál fue tu mayor logro esta semana?',
  '¿Qué hábito te costó más mantener?',
  '¿Qué aprendiste sobre ti mismo/a?',
  '¿Cuál es tu meta principal para la próxima semana?',
]

export function genMathProblem(difficulty) {
  const configs = {
    facil: { ops: ['+', '-'], maxA: 20, maxB: 15, minA: 1 },
    medio: { ops: ['+', '-', '×'], maxA: 50, maxB: 12, minA: 5 },
    dificil: { ops: ['+', '-', '×', '÷'], maxA: 99, maxB: 15, minA: 10 },
    experto: { ops: ['+', '-', '×', '÷'], maxA: 150, maxB: 25, minA: 20 },
  }
  const c = configs[difficulty] || configs.medio
  const op = c.ops[Math.floor(Math.random() * c.ops.length)]
  let a, b, result
  if (op === '+') {
    a = Math.floor(Math.random() * c.maxA) + c.minA
    b = Math.floor(Math.random() * c.maxB) + c.minA
    result = a + b
  } else if (op === '-') {
    a = Math.floor(Math.random() * c.maxA) + c.minA + 10
    b = Math.floor(Math.random() * Math.min(a - 1, c.maxB)) + 1
    result = a - b
  } else if (op === '×') {
    a = Math.floor(Math.random() * c.maxB) + 2
    b = Math.floor(Math.random() * c.maxB) + 2
    result = a * b
  } else {
    b = Math.floor(Math.random() * 11) + 2
    result = Math.floor(Math.random() * 12) + 2
    a = b * result
  }
  return { a, b, op, result }
}

export function getMemoryConfig(difficulty) {
  const configs = {
    facil: { start: 3, colors: 4, speed: 700 },
    medio: { start: 4, colors: 5, speed: 550 },
    dificil: { start: 5, colors: 6, speed: 450 },
    experto: { start: 6, colors: 6, speed: 350 },
  }
  return configs[difficulty] || configs.medio
}

export function getSimonConfig(difficulty) {
  const configs = {
    facil: { start: 3, max: 9, speed: 800 },
    medio: { start: 4, max: 9, speed: 650 },
    dificil: { start: 5, max: 9, speed: 500 },
    experto: { start: 6, max: 9, speed: 400 },
  }
  return configs[difficulty] || configs.medio
}

export function getLogicPuzzles(difficulty, count = 5) {
  const filtered = LOGIC_PUZZLES.filter(p => {
    const order = ['facil', 'medio', 'dificil', 'experto']
    return order.indexOf(p.diff) <= order.indexOf(difficulty)
  })
  return filtered.sort(() => Math.random() - 0.5).slice(0, count)
}

export function getWordGroup(difficulty) {
  const groups = WORD_GROUPS[difficulty] || WORD_GROUPS.medio
  return groups[Math.floor(Math.random() * groups.length)]
}

export const COLORS = ['#00f5d4', '#00d4ff', '#00b4d8', '#2dd4bf', '#5dffe8', '#00fff0']

export const ANAGRAMS = [
  { scrambled: 'OBRACERE', answer: 'CEREBRO', hint: 'Centro del pensamiento' },
  { scrambled: 'TIRAMED', answer: 'MEDITAR', hint: 'Practicar mindfulness' },
  { scrambled: 'TOHABI', answer: 'HABITO', hint: 'Conducta repetida' },
  { scrambled: 'MACLA', answer: 'CALMA', hint: 'Estado de tranquilidad' },
  { scrambled: 'ROCED', answer: 'DECOR', hint: 'Adornar un espacio' },
  { scrambled: 'SAPO', answer: 'PASO', hint: 'Al caminar' },
  { scrambled: 'ROMA', answer: 'AMOR', hint: 'Sentimiento profundo' },
  { scrambled: 'MALA', answer: 'ALMA', hint: 'Esencia interior' },
  { scrambled: 'SACO', answer: 'COSA', hint: 'Objeto cualquiera' },
  { scrambled: 'ORGOL', answer: 'LOGRO', hint: 'Éxito alcanzado' },
  { scrambled: 'RASO', answer: 'OSAR', hint: 'Atreverse' },
  { scrambled: 'RATA', answer: 'TARA', hint: 'Peso o defecto' },
  { scrambled: 'PASTA', answer: 'TAPAS', hint: 'Comida española' },
  { scrambled: 'METAS', answer: 'TAMES', hint: 'Domar' },
  { scrambled: 'ARCA', answer: 'CARA', hint: 'Rostro' },
  { scrambled: 'RACHA', answer: 'CHARA', hint: 'Pájaro cantor' },
  { scrambled: 'LUNA', answer: 'ANUL', hint: 'Invalidar' },
  { scrambled: 'ONDA', answer: 'DANO', hint: 'Perjuicio' },
  { scrambled: 'SANO', answer: 'ANOS', hint: 'Unidades de tiempo' },
  { scrambled: 'TORMO', answer: 'MOTOR', hint: 'Máquina que impulsa' },
  { scrambled: 'CORTO', answer: 'TROCO', hint: 'Pedazo' },
]

export const SEQUENCE_POOL = {
  facil: [
    { seq: [2, 4, 6, 8], ans: 10, opts: [9, 10, 11, 12] },
    { seq: [1, 3, 5, 7], ans: 9, opts: [8, 9, 10, 11] },
    { seq: [5, 10, 15, 20], ans: 25, opts: [22, 25, 28, 30] },
    { seq: [10, 9, 8, 7], ans: 6, opts: [5, 6, 7, 8] },
    { seq: [3, 6, 9, 12], ans: 15, opts: [14, 15, 16, 18] },
  ],
  medio: [
    { seq: [1, 1, 2, 3, 5], ans: 8, opts: [6, 7, 8, 9] },
    { seq: [3, 9, 27], ans: 81, opts: [54, 72, 81, 90] },
    { seq: [2, 6, 18, 54], ans: 162, opts: [108, 162, 216, 81] },
    { seq: [1, 4, 9, 16], ans: 25, opts: [20, 25, 30, 36] },
    { seq: [2, 3, 5, 7, 11], ans: 13, opts: [12, 13, 14, 15] },
    { seq: [100, 50, 25], ans: 12, opts: [10, 12, 15, 20] },
  ],
  dificil: [
    { seq: [2, 3, 5, 7, 11], ans: 13, opts: [12, 13, 14, 15] },
    { seq: [1, 4, 9, 16, 25], ans: 36, opts: [30, 36, 42, 49] },
    { seq: [1, 2, 4, 8, 16], ans: 32, opts: [24, 32, 40, 64] },
    { seq: [3, 6, 12, 24], ans: 48, opts: [36, 48, 60, 72] },
    { seq: [1, 3, 6, 10, 15], ans: 21, opts: [18, 21, 24, 28] },
  ],
  experto: [
    { seq: [1, 2, 6, 24, 120], ans: 720, opts: [600, 720, 840, 960] },
    { seq: [2, 3, 5, 9, 17], ans: 33, opts: [25, 33, 41, 49] },
    { seq: [1, 1, 2, 6, 24], ans: 120, opts: [60, 120, 180, 240] },
    { seq: [4, 7, 13, 22], ans: 35, opts: [28, 35, 42, 49] },
  ],
}

export function pickSequence(difficulty) {
  const pool = SEQUENCE_POOL[difficulty] || SEQUENCE_POOL.medio
  const item = pool[Math.floor(Math.random() * pool.length)]
  return { ...item, opts: [...item.opts].sort(() => Math.random() - 0.5) }
}

export function getAnagrams(count = 5) {
  return [...ANAGRAMS].sort(() => Math.random() - 0.5).slice(0, count)
}

export const MONTHLY_REVIEW_PROMPTS = [
  '¿Cuál fue tu mayor logro este mes?',
  '¿Qué hábito mejoró más? ¿Cuál necesita atención?',
  '¿Estás más cerca de tu meta? ¿Qué ajuste harías?',
  '¿Qué aprendiste sobre ti mismo/a este mes?',
  '¿Cuál es tu prioridad número uno para el próximo mes?',
]
