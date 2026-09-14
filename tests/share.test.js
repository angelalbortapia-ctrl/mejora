import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, setItem, saveSettings, getToday, toDateStr } from '../js/core.js'
import { initI18n } from '../js/i18n.js'
import {
  buildStreakShareText, buildJourneyShareText, buildProfileShareText,
} from '../js/share.js'

function clearStorage() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

function seedProgress() {
  const today = getToday()
  const activityLog = {}
  for (let i = 0; i < 3; i++) {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() - i)
    activityLog[toDateStr(d)] = ['habit']
  }
  setItem('progress', {
    xp: { discipline: 200, mindfulness: 50, mental: 80 },
    habitData: {},
    records: {},
    achievements: [],
  })
  setItem('stats', {
    habitsCompleted: 12, brainSessions: 4, meditationMinutes: 45,
    reflections: 1, routinesCompleted: 2, challengesWon: 0,
  })
  setItem('activityLog', activityLog)
  saveSettings({ locale: 'es', onboardingComplete: true, sound: true, darkMode: false })
}

describe('share text builders', () => {
  beforeEach(() => {
    clearStorage()
    initI18n('es')
    seedProgress()
  })

  it('buildStreakShareText incluye racha', () => {
    const text = buildStreakShareText()
    assert.match(text, /3/)
    assert.match(text, /Mejora|racha/i)
  })

  it('buildJourneyShareText incluye métricas', () => {
    const text = buildJourneyShareText()
    assert.match(text, /12/)
  })

  it('buildProfileShareText incluye nivel', () => {
    const text = buildProfileShareText()
    assert.match(text, /Nv\./)
  })
})
