import { getItem, setItem, getToday, getSettings, saveSettings, esc } from './core.js'
import { skeletonCard } from './ui.js'

const CACHE_KEY = 'dailyApis'
const BUNDLE_VERSION = 3
const TRIVIA_CACHE = 'triviaCache'

const CURATED_QUOTES = [
  { content: 'No cuentes los días; haz que los días cuenten.', author: 'Muhammad Ali' },
  { content: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
  { content: 'Pequeños hábitos, resultados enormes.', author: 'Mejora' },
  { content: 'Quien domina su atención, domina su día.', author: 'Mejora' },
  { content: 'El progreso silencioso de hoy es el logro visible de mañana.', author: 'Mejora' },
  { content: 'No busques perfección; busca repetición.', author: 'Mejora' },
  { content: 'Tu futuro se construye con lo que haces hoy, no mañana.', author: 'Mejora' },
  { content: 'La calma no es pasividad: es claridad para actuar mejor.', author: 'Mejora' },
  { content: 'Cada sesión de enfoque es un voto por la persona que quieres ser.', author: 'James Clear' },
  { content: 'La constancia vence al talento cuando el talento no es constante.', author: 'Mejora' },
  { content: 'Empieza donde estás. Usa lo que tienes. Haz lo que puedas.', author: 'Arthur Ashe' },
  { content: 'Un día a la vez, pero con intención cada día.', author: 'Mejora' },
  { content: 'Tu cuerpo sigue a tu mente; entrena ambos.', author: 'Mejora' },
  { content: 'Lo difícil y lo correcto suelen ser lo mismo.', author: 'Mejora' },
  { content: 'La mejor versión de ti no llega de golpe; se entrena.', author: 'Mejora' },
  { content: 'Cuida tu energía como cuidas tu tiempo.', author: 'Mejora' },
  { content: 'Cerrar el día con gratitud abre mejor el de mañana.', author: 'Mejora' },
  { content: 'La motivación enciende; el hábito mantiene la llama.', author: 'Mejora' },
  { content: 'Menos ruido, más presencia.', author: 'Mejora' },
  { content: 'Tu racha no mide perfección; mide regreso.', author: 'Mejora' },
]

const COUNTRY_COORDS = {
  MX: { lat: 19.43, lon: -99.13, name: 'Ciudad de México' },
  ES: { lat: 40.42, lon: -3.70, name: 'Madrid' },
  AR: { lat: -34.60, lon: -58.38, name: 'Buenos Aires' },
  CO: { lat: 4.71, lon: -74.07, name: 'Bogotá' },
  CL: { lat: -33.45, lon: -70.67, name: 'Santiago' },
  PE: { lat: -12.05, lon: -77.04, name: 'Lima' },
  US: { lat: 40.71, lon: -74.01, name: 'Nueva York' },
}

const CURATED_WIKI = [
  { slug: 'Neuroplasticidad', tag: 'Cerebro', icon: '🧠' },
  { slug: 'Meditación', tag: 'Calma', icon: '🧘' },
  { slug: 'Hábito', tag: 'Hábitos', icon: '⚡' },
  { slug: 'Sueño', tag: 'Recuperación', icon: '💤' },
  { slug: 'Memoria_(proceso)', tag: 'Memoria', icon: '🧩' },
  { slug: 'Atención', tag: 'Enfoque', icon: '🎯' },
  { slug: 'Ejercicio_físico', tag: 'Cuerpo', icon: '🏃' },
  { slug: 'Mindfulness', tag: 'Presencia', icon: '🌿' },
  { slug: 'Estrés', tag: 'Bienestar', icon: '🫧' },
  { slug: 'Motivación', tag: 'Impulso', icon: '🔥' },
  { slug: 'Autocontrol', tag: 'Disciplina', icon: '🛡️' },
  { slug: 'Dopamina', tag: 'Neurociencia', icon: '⚗️' },
  { slug: 'Corteza_prefrontal', tag: 'Cerebro', icon: '🧠' },
  { slug: 'Respiración', tag: 'Calma', icon: '🌬️' },
  { slug: 'Gratitud', tag: 'Actitud', icon: '🙏' },
  { slug: 'Procrastinación', tag: 'Productividad', icon: '⏳' },
  { slug: 'Felicidad', tag: 'Bienestar', icon: '✨' },
  { slug: 'Aprendizaje', tag: 'Crecimiento', icon: '📚' },
  { slug: 'Consistencia', tag: 'Hábitos', icon: '📈' },
  { slug: 'Sistema_nervioso_central', tag: 'Neurociencia', icon: '🔬' },
]

const WIKI_FALLBACKS = {
  Neuroplasticidad: 'Tu cerebro puede formar nuevas conexiones a cualquier edad. Cada repetición refuerza esas vías.',
  Meditación: 'Meditar con regularidad reduce el estrés y mejora la atención en pocas semanas.',
  Hábito: 'Formar un hábito toma en promedio unos 66 días — la constancia importa más que la perfección.',
  Atención: 'La atención es un músculo: se entrena con bloques cortos y sin distracciones.',
  Sueño: 'Dormir bien consolida la memoria y regula el ánimo — es parte del entrenamiento.',
}

const CURATED_ADVICE = [
  'Haz hoy una cosa pequeña que tu yo de mañana agradecerá.',
  'La disciplina es elegir entre lo que quieres ahora y lo que quieres más.',
  'Cinco minutos de enfoque valen más que una hora distraído.',
  'Tu racha no se rompe por un mal día — se rompe por no volver.',
  'El progreso real es invisible hasta que un día se vuelve obvio.',
  'No necesitas motivación para empezar; necesitas empezar para tener motivación.',
  'Cierra el día con una victoria pequeña, aunque el resto haya sido ruido.',
  'Tu atención es tu recurso más valioso — protégela como tal.',
  'La repetición aburrida construye resultados interesantes.',
  'Mide tu día en presencia, no en perfección.',
  'Antes de abrir otra app, pregúntate: ¿esto me acerca a mi meta de hoy?',
  'Si solo puedes hacer una cosa, que sea la misión más importante del plan.',
  'Respira antes de reaccionar; ganas claridad en diez segundos.',
  'Celebra el avance, no solo el resultado final.',
  'Un hábito a la vez. El que intenta todo a la vez, no sostiene nada.',
  'Tu diario de hoy es el mapa de tu mañana.',
  'La calma es una decisión que se practica, no un estado mágico.',
  'Cuando falte energía, reduce la meta — no abandones el ritual.',
  'El descanso también es parte del rendimiento.',
  'Vuelve mañana. Esa es la verdadera victoria.',
]

const CURATED_BOOKS = [
  { title: 'Hábitos atómicos', author: 'James Clear', year: 2018, url: 'https://openlibrary.org/works/OL20090788W', subject: 'habits' },
  { title: 'El poder del ahora', author: 'Eckhart Tolle', year: 1997, url: 'https://openlibrary.org/works/OL45804W', subject: 'mindfulness' },
  { title: 'Mindset', author: 'Carol Dweck', year: 2006, url: 'https://openlibrary.org/works/OL5738148W', subject: 'psychology' },
  { title: 'Piense y hágase rico', author: 'Napoleon Hill', year: 1937, url: 'https://openlibrary.org/works/OL45883W', subject: 'motivation' },
  { title: 'El monje que vendió su Ferrari', author: 'Robin Sharma', year: 1997, url: 'https://openlibrary.org/works/OL79226W', subject: 'self-help' },
  { title: 'Los cuatro acuerdos', author: 'Miguel Ruiz', year: 1997, url: 'https://openlibrary.org/works/OL45804W', subject: 'wisdom' },
  { title: 'Deep Work', author: 'Cal Newport', year: 2016, url: 'https://openlibrary.org/works/OL17399630W', subject: 'productivity' },
  { title: 'Respira', author: 'James Nestor', year: 2020, url: 'https://openlibrary.org/works/OL20000000W', subject: 'health' },
]

const WMO_WEATHER = {
  0: { icon: '☀️', label: 'Despejado' },
  1: { icon: '🌤️', label: 'Mayormente despejado' },
  2: { icon: '⛅', label: 'Parcialmente nublado' },
  3: { icon: '☁️', label: 'Nublado' },
  45: { icon: '🌫️', label: 'Niebla' },
  48: { icon: '🌫️', label: 'Niebla helada' },
  51: { icon: '🌦️', label: 'Llovizna' },
  53: { icon: '🌦️', label: 'Llovizna' },
  55: { icon: '🌧️', label: 'Llovizna fuerte' },
  61: { icon: '🌧️', label: 'Lluvia' },
  63: { icon: '🌧️', label: 'Lluvia' },
  65: { icon: '🌧️', label: 'Lluvia fuerte' },
  71: { icon: '🌨️', label: 'Nieve' },
  80: { icon: '🌦️', label: 'Chubascos' },
  95: { icon: '⛈️', label: 'Tormenta' },
}

async function fetchJson(url, timeout = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

function decodeB64(str) {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return atob(str)
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function scrambleWord(word) {
  const letters = word.split('')
  for (let i = 0; i < 8; i++) {
    const a = Math.floor(Math.random() * letters.length)
    const b = Math.floor(Math.random() * letters.length)
    ;[letters[a], letters[b]] = [letters[b], letters[a]]
  }
  const scrambled = letters.join('')
  return scrambled === word && word.length > 1 ? scrambleWord(word) : scrambled
}

function curatedIndex(seed, len) {
  const d = new Date()
  return (d.getDate() + d.getMonth() * 31 + seed) % len
}

export function resolveCoords(settings = getSettings()) {
  if (settings.latitude != null && settings.longitude != null) {
    return {
      lat: settings.latitude,
      lon: settings.longitude,
      name: settings.locationName || '',
    }
  }
  const c = COUNTRY_COORDS[settings.country || 'MX'] || COUNTRY_COORDS.MX
  return { lat: c.lat, lon: c.lon, name: c.name }
}

export function requestUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 86400000 },
    )
  })
}

export async function ensureUserCoords() {
  const settings = getSettings()
  if (settings.latitude != null && settings.longitude != null) return resolveCoords(settings)
  if (settings.locationAsked) return resolveCoords(settings)

  const geo = await requestUserLocation()
  settings.locationAsked = true
  if (geo) {
    settings.latitude = Math.round(geo.lat * 100) / 100
    settings.longitude = Math.round(geo.lon * 100) / 100
    settings.locationName = 'Tu ubicación'
  }
  saveSettings(settings)
  return resolveCoords(settings)
}

export function getDailyBundle() {
  const cached = getItem(CACHE_KEY, null)
  if (cached?.date === getToday() && cached?.v === BUNDLE_VERSION) return cached
  return null
}

export function getStaleBundle() {
  const cached = getItem(CACHE_KEY, null)
  return cached?.v === BUNDLE_VERSION ? cached : null
}

function buildLocalWiki(day) {
  const pick = CURATED_WIKI[day % CURATED_WIKI.length]
  const title = pick.slug.replace(/_/g, ' ')
  return {
    title,
    tag: pick.tag,
    icon: pick.icon,
    extract: WIKI_FALLBACKS[pick.slug] || WIKI_FALLBACKS.Neuroplasticidad,
    url: `https://es.wikipedia.org/wiki/${pick.slug}`,
    source: 'local',
  }
}

export function buildLocalBundle(country = 'MX', coords = null) {
  const c = coords || resolveCoords(getSettings())
  const day = new Date().getDate()
  return {
    v: BUNDLE_VERSION,
    date: getToday(),
    country,
    coords: c,
    quote: fetchCuratedQuote(),
    wiki: buildLocalWiki(day),
    holiday: { isHoliday: false, country, source: 'local' },
    weather: null,
    advice: fetchCuratedAdvice(),
    sun: null,
    reading: fetchCuratedReading(),
    offline: true,
    loadedAt: Date.now(),
  }
}

export function bundleStatusHTML(bundle) {
  if (!bundle?.offline && !bundle?.stale) return ''
  const label = bundle.offline ? 'Sin conexión' : 'En caché'
  return `<span class="bundle-status-badge" title="Contenido local o guardado">${label}</span>`
}

export function formatWeather(weather) {
  if (!weather) return null
  const wmo = WMO_WEATHER[weather.code] || { icon: '🌡️', label: 'Clima' }
  return {
    icon: wmo.icon,
    label: wmo.label,
    temp: weather.temp,
    text: `${wmo.icon} ${Math.round(weather.temp)}° · ${wmo.label}`,
  }
}

export async function fetchWeather(lat, lon) {
  const data = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
  )
  const cur = data.current
  return {
    temp: cur.temperature_2m,
    code: cur.weather_code,
    source: 'open-meteo',
  }
}

export async function fetchCuratedWiki() {
  const day = new Date().getDate()
  const pick = CURATED_WIKI[day % CURATED_WIKI.length]
  try {
    const data = await fetchJson(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pick.slug)}`,
    )
    const extract = data.extract?.split('. ').slice(0, 2).join('. ')
    return {
      title: data.title || pick.slug.replace(/_/g, ' '),
      tag: pick.tag,
      icon: pick.icon,
      extract: extract + (extract?.endsWith('.') ? '' : '.'),
      url: data.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${pick.slug}`,
      source: 'wikipedia',
      lang: 'es',
    }
  } catch {
    const title = pick.slug.replace(/_/g, ' ')
    return {
      title,
      tag: pick.tag,
      icon: pick.icon,
      extract: WIKI_FALLBACKS[pick.slug] || WIKI_FALLBACKS.Neuroplasticidad,
      url: `https://es.wikipedia.org/wiki/${pick.slug}`,
      source: 'local',
      lang: 'es',
    }
  }
}

export function fetchCuratedQuote() {
  const idx = curatedIndex(3, CURATED_QUOTES.length)
  return { ...CURATED_QUOTES[idx], source: 'curated', lang: 'es' }
}

export async function fetchDailyQuote() {
  return fetchCuratedQuote()
}

export function fetchCuratedAdvice() {
  const idx = curatedIndex(7, CURATED_ADVICE.length)
  return {
    advice: CURATED_ADVICE[idx],
    id: idx,
    source: 'curated',
    lang: 'es',
  }
}

export async function fetchAdviceSlip() {
  return fetchCuratedAdvice()
}

export async function fetchSunTimes(lat, lon, date = getToday()) {
  const data = await fetchJson(
    `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`,
  )
  if (data.status !== 'OK') throw new Error('Sun API error')
  return {
    sunrise: data.results.sunrise,
    sunset: data.results.sunset,
    solarNoon: data.results.solarNoon,
    source: 'sunrise-sunset',
  }
}

export function formatSunsetLocal(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })
}

export function getSunsetTip(sun) {
  if (!sun?.sunset) return null
  const sunset = new Date(sun.sunset)
  const now = new Date()
  const minsToSunset = (sunset - now) / 60000
  const timeStr = formatSunsetLocal(sun.sunset)

  if (minsToSunset > 0 && minsToSunset <= 90) {
    return {
      type: 'soon',
      icon: '🌅',
      title: 'Atardecer cercano',
      text: `El sol se pone a las ${timeStr}. Ideal para 5 min de respiración consciente o escaneo corporal.`,
    }
  }
  if (minsToSunset <= 0 && minsToSunset > -120) {
    return {
      type: 'now',
      icon: '🌙',
      title: 'Hora de cerrar el día',
      text: 'Anochece. Cierra con meditación breve o una reflexión en tu diario.',
    }
  }
  if (minsToSunset > 90) {
    return {
      type: 'later',
      icon: '🌤️',
      title: 'Atardecer hoy',
      text: `El atardecer será a las ${timeStr}. Reserva un momento para meditar antes.`,
    }
  }
  return null
}

export function fetchCuratedReading() {
  const idx = curatedIndex(11, CURATED_BOOKS.length)
  const book = CURATED_BOOKS[idx]
  return { ...book, cover: null, source: 'curated', lang: 'es' }
}

export async function fetchReadingPick() {
  const day = new Date().getDate()
  const subjects = ['self-help', 'psychology', 'meditation', 'habits', 'productivity', 'mindfulness']
  const subject = subjects[day % subjects.length]
  try {
    const data = await fetchJson(`https://openlibrary.org/subjects/${subject}.json?limit=20`)
    const works = (data.works || []).filter((w) => w.title && w.authors?.length)
    if (!works.length) throw new Error('empty')
    const pick = works[day % works.length]
    const coverId = pick.cover_id
    return {
      title: pick.title,
      author: pick.authors[0]?.name || 'Autor desconocido',
      year: pick.first_publish_year,
      url: `https://openlibrary.org${pick.key}`,
      cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      subject,
      source: 'openlibrary',
      lang: 'es',
    }
  } catch {
    return fetchCuratedReading()
  }
}

export async function fetchHoliday(country = 'MX') {
  const today = getToday()
  const year = today.slice(0, 4)
  try {
    const list = await fetchJson(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
    const match = list.find((h) => h.date === today)
    if (match) {
      return {
        isHoliday: true,
        name: match.localName || match.name,
        country,
        source: 'nager',
        lang: 'es',
      }
    }
    return { isHoliday: false, country, source: 'nager' }
  } catch {
    return { isHoliday: false, country, source: 'local' }
  }
}

function pickBundleField(result, localBundle, key) {
  if (result.status === 'fulfilled' && result.value != null) return result.value
  return localBundle[key]
}

export async function fetchDailyBundle(country = 'MX', coords = null) {
  const c = coords || resolveCoords(getSettings())
  const local = buildLocalBundle(country, c)
  const [quoteR, wikiR, holidayR, weatherR, adviceR, sunR, readingR] = await Promise.allSettled([
    fetchDailyQuote(),
    fetchCuratedWiki(),
    fetchHoliday(country),
    fetchWeather(c.lat, c.lon),
    fetchAdviceSlip(),
    fetchSunTimes(c.lat, c.lon),
    fetchReadingPick(),
  ])
  const failed = [quoteR, wikiR, holidayR, weatherR, adviceR, sunR, readingR].some((r) => r.status === 'rejected')
  const bundle = {
    v: BUNDLE_VERSION,
    date: getToday(),
    country,
    coords: c,
    quote: pickBundleField(quoteR, local, 'quote'),
    wiki: pickBundleField(wikiR, local, 'wiki'),
    holiday: pickBundleField(holidayR, local, 'holiday'),
    weather: weatherR.status === 'fulfilled' ? weatherR.value : null,
    advice: pickBundleField(adviceR, local, 'advice'),
    sun: sunR.status === 'fulfilled' ? sunR.value : null,
    reading: pickBundleField(readingR, local, 'reading'),
    offline: !navigator.onLine || failed,
    loadedAt: Date.now(),
  }
  setItem(CACHE_KEY, bundle)
  return bundle
}

export async function ensureDailyBundle(country = 'MX') {
  const coords = await ensureUserCoords()
  const cached = getDailyBundle()
  if (cached && cached.country === country) {
    const sameCoords = cached.coords?.lat === coords.lat && cached.coords?.lon === coords.lon
    if (sameCoords) return cached
  }

  if (!navigator.onLine) {
    if (cached) return { ...cached, stale: cached.date !== getToday() }
    const stale = getStaleBundle()
    if (stale?.country === country) {
      return { ...stale, stale: true, offline: true }
    }
    return buildLocalBundle(country, coords)
  }

  try {
    return await fetchDailyBundle(country, coords)
  } catch {
    if (cached) return { ...cached, stale: cached.date !== getToday(), offline: true }
    const stale = getStaleBundle()
    if (stale) return { ...stale, stale: true, offline: true }
    return buildLocalBundle(country, coords)
  }
}

export async function fetchTriviaQuestions(amount = 5, difficulty = 'medium') {
  const diffMap = { facil: 'easy', medio: 'medium', dificil: 'hard', experto: 'hard' }
  const diff = diffMap[difficulty] || 'medium'
  const cacheKey = `${getToday()}_${diff}_${amount}`
  const cached = getItem(TRIVIA_CACHE, {})
  if (cached[cacheKey]) return cached[cacheKey]

  try {
    const data = await fetchJson(
      `https://opentdb.com/api.php?amount=${amount}&type=multiple&difficulty=${diff}&encode=base64`,
    )
    if (data.response_code !== 0) throw new Error('Trivia API error')
    const questions = data.results.map((q, i) => ({
      id: i,
      category: decodeB64(q.category),
      question: decodeB64(q.question),
      correct: decodeB64(q.correct_answer),
      options: shuffle([decodeB64(q.correct_answer), ...q.incorrect_answers.map(decodeB64)]),
      difficulty: q.difficulty,
    }))
    cached[cacheKey] = questions
    setItem(TRIVIA_CACHE, cached)
    return questions
  } catch {
    return getLocalTrivia(amount)
  }
}

function getLocalTrivia(amount) {
  const pool = [
    { category: 'Ciencia', question: '¿Cuál es el órgano más grande del cuerpo humano?', correct: 'La piel', options: ['El hígado', 'La piel', 'El cerebro', 'El corazón'] },
    { category: 'Historia', question: '¿En qué año llegó el hombre a la Luna?', correct: '1969', options: ['1965', '1969', '1972', '1980'] },
    { category: 'Geografía', question: '¿Cuál es la capital de Japón?', correct: 'Tokio', options: ['Seúl', 'Pekín', 'Tokio', 'Bangkok'] },
    { category: 'Matemáticas', question: '¿Cuántos lados tiene un hexágono?', correct: '6', options: ['5', '6', '7', '8'] },
    { category: 'Biología', question: '¿Qué gas absorben las plantas durante la fotosíntesis?', correct: 'Dióxido de carbono', options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'] },
    { category: 'Cultura', question: '¿Quién pintó la Mona Lisa?', correct: 'Leonardo da Vinci', options: ['Picasso', 'Van Gogh', 'Leonardo da Vinci', 'Miguel Ángel'] },
    { category: 'Astronomía', question: '¿Qué planeta es conocido como el planeta rojo?', correct: 'Marte', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'] },
    { category: 'Salud', question: '¿Cuántas horas de sueño recomienda la OMS para adultos?', correct: '7-9 horas', options: ['4-5 horas', '5-6 horas', '7-9 horas', '10-12 horas'] },
  ]
  return shuffle(pool).slice(0, amount).map((q, i) => ({
    ...q,
    id: i,
    options: shuffle(q.options),
    difficulty: 'medium',
  }))
}

const SPANISH_WORDS = [
  'mente', 'calma', 'habito', 'fuerza', 'logro', 'rumbo', 'pulso', 'brillo',
  'ritmo', 'enfoque', 'meta', 'ruta', 'saber', 'valor', 'clima', 'energia',
  'sueno', 'calma', 'avance', 'racha', 'nivel', 'calma', 'pausa', 'flujo',
  'orden', 'claridad', 'impulso', 'constancia', 'presencia', 'equilibrio',
]

export async function fetchAnagramWords(count = 6) {
  const words = shuffle(SPANISH_WORDS).slice(0, count)
  return words.map((word) => ({
    scrambled: scrambleWord(word.toUpperCase()),
    answer: word.toUpperCase(),
    hint: `${word.length} letras · español`,
  }))
}

function getTimeTip() {
  const h = new Date().getHours()
  if (h < 10) return { icon: '🌅', label: 'Mañana', text: 'Bloquea 25 min sin distracciones para tu rutina — es tu ventana de mayor claridad.' }
  if (h < 14) return { icon: '☀️', label: 'Mediodía', text: 'Revisa el plan: ¿qué misión te acerca más al cierre del día?' }
  if (h < 18) return { icon: '🌤️', label: 'Tarde', text: 'Ideal para hábitos y gimnasia cerebral antes de que baje tu energía.' }
  return { icon: '🌙', label: 'Noche', text: 'Cierra con reflexión y calma. Mañana empieza con lo que registres hoy.' }
}

export function adviceCardHTML(advice) {
  if (!advice?.advice) return ''
  return `<div class="advice-card card-static">
    <div class="advice-card-head">
      <span class="pulse-card-tag">Consejo del día</span>
      <span class="advice-card-icon">💡</span>
    </div>
    <p class="advice-card-text">"${esc(advice.advice)}"</p>
    <p class="text-xs text-muted mt-2">Úsalo como prompt para tu reflexión ↓</p>
  </div>`
}

export function readingCardHTML(reading) {
  if (!reading?.title) return ''
  const cover = reading.cover
    ? `<img src="${esc(reading.cover)}" alt="" class="reading-cover" loading="lazy">`
    : `<div class="reading-cover reading-cover--placeholder">📚</div>`
  return `<a href="${esc(reading.url)}" target="_blank" rel="noopener" class="reading-card card-static no-underline">
    ${cover}
    <div class="reading-body">
      <span class="pulse-card-tag">Lectura sugerida</span>
      <h4 class="reading-title">${esc(reading.title)}</h4>
      <p class="reading-meta">${esc(reading.author)}${reading.year ? ` · ${reading.year}` : ''}</p>
      <span class="reading-cta">Ver en Open Library →</span>
    </div>
  </a>`
}

export function sunsetBannerHTML(sun) {
  const tip = getSunsetTip(sun)
  if (!tip) return ''
  return `<div class="sunset-banner card-static">
    <span class="sunset-banner-icon">${tip.icon}</span>
    <div>
      <p class="sunset-banner-title">${tip.title}</p>
      <p class="sunset-banner-text">${tip.text}</p>
    </div>
    <a href="#/meditacion" class="btn-secondary text-sm no-underline sunset-banner-cta">Meditar</a>
  </div>`
}

export function dailyContentHTML(bundle, loading = false) {
  return homePulseHTML(bundle, loading)
}

export function homePulseHTML(bundle, loading = false) {
  if (loading && !bundle) {
    return `<div class="pulse-grid pulse-grid--wide">${skeletonCard(3)}${skeletonCard(3)}${skeletonCard(3)}${skeletonCard(3)}</div>`
  }
  if (!bundle) return ''

  const { quote, wiki, holiday, advice, sun, reading, weather } = bundle
  const timeTip = getTimeTip()
  const sunsetTip = getSunsetTip(sun)
  const w = formatWeather(weather)
  const holidayChip = holiday?.isHoliday
    ? `<span class="pulse-chip pulse-chip--fest">🎉 ${esc(holiday.name)}</span>`
    : w
      ? `<span class="pulse-chip pulse-chip--weather">${w.text}</span>`
      : `<span class="pulse-chip">${timeTip.icon} ${timeTip.label}</span>`

  const nowCard = sunsetTip
    ? `<div class="pulse-card pulse-card--sunset card-static">
        <div class="pulse-card-head"><span class="pulse-card-tag">${sunsetTip.title}</span><span>${sunsetTip.icon}</span></div>
        <p class="pulse-now-text">${sunsetTip.text}</p>
        <a href="#/meditacion" class="text-xs no-underline mt-2 inline-block" style="color:var(--neon)">Ir a meditación →</a>
      </div>`
    : `<div class="pulse-card pulse-card--now card-static">
        <div class="pulse-card-head"><span class="pulse-card-tag">Ahora mismo</span></div>
        <p class="pulse-now-text">${timeTip.text}</p>
      </div>`

  const statusBadge = bundleStatusHTML(bundle)

  return `<div class="pulse-grid pulse-grid--wide">
    ${statusBadge ? `<div class="pulse-status-row">${statusBadge}</div>` : ''}
    <div class="pulse-card pulse-card--quote card-static">
      <div class="pulse-card-head">
        <span class="pulse-card-tag">Inspiración</span>
        ${holidayChip}
      </div>
      <p class="pulse-quote">"${esc(quote.content)}"</p>
      <p class="pulse-author">— ${esc(quote.author)}</p>
    </div>
    <div class="pulse-card pulse-card--wiki card-static">
      <div class="pulse-card-head">
        <span class="pulse-card-tag">${wiki?.tag || 'Ciencia'}</span>
        <span class="pulse-card-icon">${wiki?.icon || '🧠'}</span>
      </div>
      <h4 class="pulse-tip-title">${esc(wiki?.title || 'Neurociencia')}</h4>
      <p class="pulse-tip-text">${esc(wiki?.extract || '')}</p>
      ${wiki?.url ? `<a href="${esc(wiki.url)}" target="_blank" rel="noopener" class="pulse-wiki-link">Leer más →</a>` : ''}
    </div>
    <div class="pulse-card pulse-card--advice card-static">
      <div class="pulse-card-head">
        <span class="pulse-card-tag">Consejo</span>
        <span class="pulse-card-icon">💡</span>
      </div>
      <p class="pulse-quote" style="font-size:0.9rem">"${esc(advice?.advice || '')}"</p>
    </div>
    ${nowCard}
    ${readingCardHTML(reading)}
  </div>`
}
