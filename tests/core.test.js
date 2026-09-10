/**
 * Tests unitarios para core.js — abrir tests/run.html en el navegador o importar en consola.
 */
import {
  toDateStr, getToday, incrementHabit, decrementHabit, isHabitComplete,
  syncGoals, getGoals, PREFIX,
} from '../js/core.js'

const results = []

function test(name, fn) {
  try {
    fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, error: e.message })
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

function clearStorage() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

clearStorage()

test('toDateStr usa fecha local', () => {
  const d = new Date(2026, 8, 9, 23, 30)
  assert(toDateStr(d) === '2026-09-09', `Expected 2026-09-09 got ${toDateStr(d)}`)
})

test('getToday devuelve formato YYYY-MM-DD', () => {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(getToday()))
})

test('incrementHabit contador completa al llegar a meta', () => {
  clearStorage()
  const habit = { id: 't_water', name: 'Test', type: 'counter', target: 3, xp: 10, difficulty: 1 }
  incrementHabit(habit)
  incrementHabit(habit)
  const r = incrementHabit(habit)
  assert(r?.completed === true, 'Should complete on third increment')
  assert(isHabitComplete(habit), 'isHabitComplete should be true')
})

test('decrementHabit desmarca completado', () => {
  clearStorage()
  const habit = { id: 't2', name: 'T', type: 'counter', target: 2, xp: 10, difficulty: 1 }
  incrementHabit(habit)
  incrementHabit(habit)
  decrementHabit(habit)
  assert(!isHabitComplete(habit), 'Should uncomplete after decrement')
})

test('syncGoals registra hitos intermedios', () => {
  clearStorage()
  const goals = [{
    id: 'g1', title: 'Test', metric: 'habits', target: 100, skill: 'discipline',
    icon: '✅', active: true, completed: false, progress: 0, milestonesHit: [],
    startDate: getToday(), endDate: '2027-01-01',
  }]
  localStorage.setItem(PREFIX + 'goals', JSON.stringify(goals))
  localStorage.setItem(PREFIX + 'stats', JSON.stringify({ habitsCompleted: 30, brainSessions: 0, reflections: 0, routinesCompleted: 0, challengesWon: 0, meditationMinutes: 0 }))
  syncGoals()
  const updated = getGoals()[0]
  assert(updated.milestonesHit?.includes(25), 'Should hit 25% milestone at 30/100')
})

const passed = results.filter(r => r.ok).length
const failed = results.filter(r => !r.ok)

console.log(`\nMejora core tests: ${passed}/${results.length} passed`)
failed.forEach(r => console.error(`✗ ${r.name}: ${r.error}`))
if (failed.length) throw new Error(`${failed.length} test(s) failed`)

export { results }
