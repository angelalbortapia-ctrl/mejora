/** Página Rutina — respiración, Stroop, reflexión */

import { DIFFICULTIES, getSettings, isRoutineDoneToday, getStats, updateStats } from '../core.js'
import { getReflectionPrompt } from '../content.js'
import { pageLead } from '../ui.js'
import { difficultyPicker, guardDifficulty } from '../page-helpers.js'
import { playTone } from '../sounds.js'
import {
  routineState, ROUTINE_STROOP_INK, genRoutineStroop,
  startRoutine as startRoutineCore, finishRoutine as finishRoutineCore,
  startExpress as startExpressCore, exitRoutine,
} from '../routine-service.js'

export function renderRoutine() {
  if (!routineState.active && routineState.step !== 4) {
    if (isRoutineDoneToday()) return `<div class="animate-fade-in text-center page-shell page-wide page-routine"><div class="card span-full">
      <p class="text-4xl mb-4">✨</p><h2 class="font-display text-2xl font-bold text-main mb-2">Rutina completada</h2>
      <p class="text-muted mb-6">Vuelve mañana para más XP.</p><a href="#/plan" class="btn-primary inline-block no-underline">Ver plan</a></div></div>`
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <div class="ds-page ds-page--full">
      ${pageLead('Respiración + Stroop rápido + reflexión · protocolos con evidencia')}
      <div class="page-dashboard routine-intro-grid">
        <div class="routine-intro-main ds-panel ds-panel--flat">
          <p class="ds-section-title">Dificultad</p>
          ${difficultyPicker(routineState.difficulty || getSettings().defaultDifficulty, 'setRoutineDiff')}
        </div>
        <div class="ds-panel ds-panel--flat space-y-3 text-left routine-intro-steps">
          <div class="flex gap-3"><span>🌬️</span><div><p class="font-medium text-main">Respiración</p><p class="text-xs text-muted">2-3 min según nivel</p></div></div>
          <div class="flex gap-3"><span>🎨</span><div><p class="font-medium text-main">Stroop rápido</p><p class="text-xs text-muted">5 trials · cíngulo anterior</p></div></div>
          <div class="flex gap-3"><span>📝</span><div><p class="font-medium text-main">Reflexión</p><p class="text-xs text-muted">Pregunta según dificultad</p></div></div>
        </div>
        <button onclick="startRoutine()" class="btn-primary w-full text-lg py-4 routine-intro-cta">Comenzar rutina</button>
      </div>
      </div>
    </div>`
  }
  if (routineState.step === 4) {
    const d = DIFFICULTIES[routineState.difficulty]
    return `<div class="animate-fade-in text-center page-shell page-wide"><div class="card level-up">
      <p class="text-4xl mb-4">🎉</p><h2 class="font-display text-2xl font-bold text-main mb-2">¡${routineState.express ? 'Express completado' : 'Rutina completada'}!</h2>
      <p class="text-muted mb-6">${routineState.express ? '5 minutos bien invertidos' : `Modo ${d?.label || 'Medio'}`}</p>
      <a href="#/plan" class="btn-primary inline-block no-underline">Ver plan del día</a></div></div>`
  }

  const steps = routineState.express ? ['Respirar', 'Stroop'] : ['Respirar', 'Stroop', 'Reflexionar']
  const stepHtml = `<div class="step-indicator span-full">${steps.map((_, i) =>
    `<div class="step-dot ${i + 1 < routineState.step ? 'done' : i + 1 === routineState.step ? 'current' : ''}"></div>`
  ).join('')}</div>`

  if (routineState.step === 1) {
    const b = routineState.breathing
    const scale = b.phase === 'inhale' ? 1.15 : b.phase === 'exhale' ? 0.85 : 1.05
    const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
    return `<div class="page-shell page-wide page-routine">
      <button type="button" onclick="exitRoutine()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 1 · Respiración</p>
          <p class="text-main font-medium">${DIFFICULTIES[routineState.difficulty].icon} ${DIFFICULTIES[routineState.difficulty].label}</p>
          <p id="routine-remaining" class="text-xs text-muted mt-3">${b.total - b.elapsed}s restantes</p>
        </div>
        <div class="routine-stage card card-static">
          <div class="relative w-44 h-44 mx-auto">
            <div id="routine-breathe-circle" class="absolute inset-0 rounded-full breathe-circle meditation-ring" style="transform:scale(${scale});transition:transform 4s"></div>
            <div class="absolute inset-0 flex items-center justify-center"><span id="routine-phase-text" class="font-display text-2xl meditation-text">${phase[b.phase]}</span></div>
          </div>
        </div>
      </div></div>`
  }
  if (routineState.step === 2) {
    const br = routineState.brain
    const t = br.trial
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <button type="button" onclick="exitRoutine()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 2 · Stroop</p>
          <p class="text-main font-medium">Trial ${br.round + 1} de ${br.total}</p>
          <p class="text-xs text-muted mt-2">Nombra el color de la tinta, no la palabra.</p>
        </div>
        <div class="card text-center exercise-stage">
          <p class="font-display text-4xl font-bold mb-6" style="color:${t.ink.css}">${t.word.name}</p>
          <div class="flex flex-col gap-2">
            ${ROUTINE_STROOP_INK.map(c => `
              <button type="button" onclick="routineStroopPick('${c.key}')" class="btn-secondary w-full">${c.label}</button>`).join('')}
          </div>
          ${br.feedback === 'correct' ? '<p class="text-green-500 mt-3">✓ Cíngulo + PFC</p>' : ''}
          ${br.feedback === 'wrong' ? `<p class="text-red-400 mt-3">✗ Era ${t.ink.label}</p>` : ''}
        </div>
      </div></div>`
  }
  if (routineState.step === 3) {
    const prompt = getReflectionPrompt(routineState.difficulty)
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <button type="button" onclick="exitRoutine()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 3 · Reflexión</p>
          <p class="text-main text-sm italic">"${prompt}"</p>
        </div>
        <div class="card exercise-stage">
          <h3 class="font-display text-lg font-semibold text-main mb-2">Tu reflexión</h3>
          <textarea id="routine-reflection" class="input-field min-h-32 resize-none mb-4" placeholder="Mínimo 20 caracteres..."></textarea>
          <button onclick="routineFinishReflection()" class="btn-primary w-full">Completar rutina</button>
        </div>
      </div></div>`
  }
}

export function bindRoutineGlobals() {
  const render = () => window.render?.()

  window.startRoutine = () => startRoutineCore(render)
  window.startExpress = () => startExpressCore(render)
  window.exitRoutine = exitRoutine
  window.setRoutineDiff = (d) => { routineState.difficulty = guardDifficulty(d); render() }
  window.routineStroopPick = function(key) {
    const br = routineState.brain
    if (br.feedback) return
    if (key === br.trial.ink.key) { br.score++; br.feedback = 'correct'; playTone(523) }
    else { br.feedback = 'wrong'; playTone(200) }
    br.round++
    render()
    setTimeout(() => {
      br.feedback = null
      if (br.round >= br.total) {
        if (routineState.express) finishRoutineCore(true, render)
        else routineState.step = 3
      } else br.trial = genRoutineStroop()
      render()
    }, 700)
  }
  window.routineFinishReflection = function() {
    const text = document.getElementById('routine-reflection')?.value?.trim()
    if (!text || text.length < 20) { alert('Escribe al menos 20 caracteres.'); return }
    if (!routineState.express) {
      updateStats({ reflections: getStats().reflections + 1 })
    }
    finishRoutineCore(routineState.express, render)
  }
}
