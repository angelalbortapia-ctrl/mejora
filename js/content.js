export const LOGIC_PUZZLES = [
  { q: 'Si todos los gatos son animales y algunos animales son salvajes, ¿cuál es cierto?', options: ['Todos los gatos son salvajes', 'Algunos gatos pueden ser salvajes', 'Ningún gato es salvaje', 'Todos los animales son gatos'], answer: 1, diff: 'facil' },
  { q: '¿Qué palabra no encaja? Rosa, Tulipán, Girasol, Mesa', options: ['Rosa', 'Tulipán', 'Girasol', 'Mesa'], answer: 3, diff: 'facil' },
  { q: 'Continúa: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], answer: 1, diff: 'medio' },
  { q: 'Un padre tiene 3 hijos. Cada hijo tiene una hermana. ¿Cuántos hijos tiene?', options: ['4', '3', '6', '5'], answer: 0, diff: 'medio' },
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
  { q: 'Continúa: 2, 3, 5, 7, 11, ?', options: ['12', '13', '14', '15'], answer: 1, diff: 'medio' },
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
  facil: ['¿Qué me hizo sonreír hoy?', '¿Por qué estoy agradecido/a?', '¿Qué fue lo mejor del día?'],
  medio: ['¿Qué aprendí hoy?', '¿Qué haría diferente?', '¿Qué me sacó de mi zona de confort?'],
  dificil: ['¿Qué patrón negativo noté hoy?', '¿Cómo reaccioné bajo presión?', '¿Qué miedo me frenó?'],
  experto: ['¿Qué creencia limitante descubrí?', '¿Cómo mis acciones reflejan mis valores?', '¿Qué legado estoy construyendo?'],
}

export const BODY_SCAN_STEPS = [
  { text: 'Cierra los ojos. Toma tres respiraciones profundas.', duration: 30 },
  { text: 'Lleva la atención a tus pies. Nota temperatura y presión.', duration: 40 },
  { text: 'Sube por pantorrillas, rodillas y muslos.', duration: 40 },
  { text: 'Observa tu abdomen. Siente cómo sube y baja.', duration: 40 },
  { text: 'Relaja hombros, mandíbula y frente.', duration: 40 },
  { text: 'Abre los ojos cuando estés listo.', duration: 30 },
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
  { scrambled: 'LOGRO', answer: 'GROLO', hint: 'Éxito alcanzado' },
  { scrambled: 'PAN', answer: 'NAP', hint: 'Siesta breve (inglés)' },
  { scrambled: 'SOL', answer: 'LOS', hint: 'Artículo plural' },
  { scrambled: 'RIO', answer: 'ROI', hint: 'Rey (francés)' },
  { scrambled: 'MAR', answer: 'RAM', hint: 'Memoria de computadora (inglés)' },
  { scrambled: 'PASTA', answer: 'TAPAS', hint: 'Comida española' },
]

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
