/** Store central — patrón observador sobre localStorage */

export const STORE_PREFIX = 'mejora_'

const DEFAULT_PROGRESS = {
  xp: { mental: 0, mindfulness: 0, discipline: 0, wisdom: 0 },
  achievements: [],
  records: {},
  habitData: {},
  daily: { date: null, ids: [], done: [] },
  weekly: { week: null, done: 0, target: 5 },
}

const DEFAULT_STATS = {
  brainSessions: 0,
  meditationMinutes: 0,
  reflections: 0,
  habitsCompleted: 0,
  routinesCompleted: 0,
  challengesWon: 0,
}

const DEFAULT_SETTINGS = {
  darkMode: false,
  sound: true,
  reminderHour: 20,
  notificationsEnabled: false,
  habitRemindersEnabled: false,
  habitReminderHour: 18,
  sunsetRemindersEnabled: true,
  defaultDifficulty: 'medio',
  onboardingComplete: false,
  userName: '',
  theme: 'default',
  country: 'MX',
  compactSidebar: false,
  reducedMotion: false,
  tourComplete: false,
  autoBackupEnabled: false,
  lastAutoBackup: null,
  latitude: null,
  longitude: null,
  locationName: '',
  locationAsked: false,
  medAmbient: 'off',
  medAmbientVolume: 0.28,
  medVoice: true,
  medVoiceURI: '',
  medVoiceRate: 0.48,
  medVoiceEngine: 'browser',
  fishApiKey: '',
  fishVoiceId: '',
  fishModel: 's2.1-pro-free',
  fishSpeed: 0.96,
  fishProxyUrl: '',
  azureSpeechKey: '',
  azureSpeechRegion: 'eastus',
  azureVoice: 'es-MX-DaliaNeural',
  geminiApiKey: '',
  geminiVoice: 'Despina',
  locale: 'es',
}

let persistHook = null

/** Registra callback post-persistencia (p.ej. cloud sync) sin import circular */
export function setStorePersistHook(fn) {
  persistHook = fn
}

export class Store {
  constructor(prefix = STORE_PREFIX) {
    this.prefix = prefix
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map()
  }

  _storageKey(key) {
    return `${this.prefix}${key}`
  }

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._storageKey(key))
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  set(key, value) {
    localStorage.setItem(this._storageKey(key), JSON.stringify(value))
    this._emit(key, value)
    try { persistHook?.(key, value) } catch { /* ignore */ }
    return value
  }

  subscribe(key, listener) {
    const bucket = key === '*' ? '*' : key
    if (!this._listeners.has(bucket)) this._listeners.set(bucket, new Set())
    this._listeners.get(bucket).add(listener)
    return () => this._listeners.get(bucket)?.delete(listener)
  }

  _emit(key, value) {
    this._listeners.get(key)?.forEach(fn => {
      try { fn(value, key) } catch (err) { console.error('[store]', key, err) }
    })
    this._listeners.get('*')?.forEach(fn => {
      try { fn(value, key) } catch (err) { console.error('[store:*]', key, err) }
    })
  }

  getProgress() {
    return this.get('progress', { ...DEFAULT_PROGRESS })
  }

  saveProgress(progress) {
    return this.set('progress', progress)
  }

  patchProgress(mutator) {
    const next = typeof mutator === 'function' ? mutator(this.getProgress()) : { ...this.getProgress(), ...mutator }
    return this.saveProgress(next)
  }

  getStats() {
    return this.get('stats', { ...DEFAULT_STATS })
  }

  updateStats(updates) {
    const merged = { ...this.getStats(), ...updates }
    return this.set('stats', merged)
  }

  getSettings() {
    return this.get('settings', { ...DEFAULT_SETTINGS })
  }

  saveSettings(settings) {
    return this.set('settings', settings)
  }

  patchSettings(mutator) {
    const next = typeof mutator === 'function' ? mutator(this.getSettings()) : { ...this.getSettings(), ...mutator }
    return this.saveSettings(next)
  }

  getHabits(fallback = []) {
    return this.get('habits', fallback)
  }

  saveHabits(habits) {
    return this.set('habits', habits)
  }
}

export const appStore = new Store(STORE_PREFIX)
