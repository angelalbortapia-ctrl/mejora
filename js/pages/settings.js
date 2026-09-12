/** Ajustes — general, cuenta, datos */

import {
  PREFIX, DIFFICULTIES, esc, getToday, getItem, setItem, getSettings, saveSettings,
  getPlanProgress, resetAllData,
} from '../core.js'
import { guardDifficulty } from '../page-helpers.js'
import { isUnlocked, applyTheme } from '../unlocks.js'
import {
  canUseNotifications, getNotificationPermission, requestNotificationPermission, startReminderChecker,
} from '../notifications.js'
import {
  getCloudStatus, signIn, signUp, signOut, pullFromCloud, pushToCloud,
} from '../cloud-sync.js'
import { exportMonthlyReportText } from '../backup.js'
import { restartOnboarding, resetOnboardingCache } from '../onboarding-ui.js'
import { startTour } from '../tour.js'
import { listSectionGuides, startSectionGuide, resetSectionGuides } from '../section-guides.js'
import { tabBar, settingGroup, settingRow, pageLead } from '../ui.js'
import { applyCompactSidebar } from '../layout.js?v=78'
import { playSuccess } from '../sounds.js'

let settingsTab = 'general'

export function getSettingsTab() { return settingsTab }
export function setSettingsTab(v) { settingsTab = v }

function formatCloudTime(iso) {
  if (!iso) return 'Nunca'
  try {
    return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function renderCloudAccountPanel() {
  const cloud = getCloudStatus()
  if (!cloud.configured) {
    return `${pageLead('Sincroniza tu progreso entre dispositivos con Supabase.')}
      ${settingGroup('Configuración pendiente', `
        <p class="ds-setting-hint">Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noopener" class="text-link">supabase.com</a>, ejecuta <code>supabase/schema.sql</code> y copia <code>js/supabase-config.example.js</code> → <code>js/supabase-config.local.js</code> con tu URL y anon key.</p>
      `)}`
  }
  if (cloud.signedIn) {
    return `${pageLead('Tu progreso se guarda en la nube automáticamente.')}
      ${settingGroup('Cuenta', `
        <p class="ds-setting-hint">Conectado como <strong>${esc(cloud.email || '')}</strong></p>
        <p class="ds-setting-hint">Última sync: ${formatCloudTime(cloud.lastSyncedAt)}${cloud.syncing ? ' · sincronizando…' : ''}</p>
        <div class="flex flex-col gap-2 mt-3">
          <button type="button" onclick="cloudSyncNow()" class="btn-primary w-full" ${cloud.syncing ? 'disabled' : ''}>☁️ Sincronizar ahora</button>
          <button type="button" onclick="cloudPullNow()" class="btn-secondary w-full" ${cloud.syncing ? 'disabled' : ''}>⬇️ Traer de la nube</button>
          <button type="button" onclick="cloudSignOut()" class="btn-ghost w-full">Cerrar sesión</button>
        </div>
        <p id="cloud-status-msg" class="text-sm text-muted mt-3 text-center"></p>
      `)}`
  }
  return `${pageLead('Crea una cuenta para no perder tu progreso al cambiar de dispositivo.')}
    ${settingGroup('Iniciar sesión', `
      <div class="flex flex-col gap-2">
        <input id="cloud-email" type="email" class="input-field" placeholder="Correo" autocomplete="email">
        <input id="cloud-password" type="password" class="input-field" placeholder="Contraseña (mín. 6)" autocomplete="current-password">
        <button type="button" onclick="cloudSignIn()" class="btn-primary w-full">Entrar</button>
        <button type="button" onclick="cloudSignUp()" class="btn-secondary w-full">Crear cuenta</button>
      </div>
      <p id="cloud-status-msg" class="text-sm text-muted mt-3 text-center"></p>
      <p class="ds-setting-hint mt-2">Si activas confirmación por correo en Supabase, revisa tu bandeja antes de entrar.</p>
    `)}`
}

const sectionGuideButtons = listSectionGuides().map(g =>
  `<button type="button" onclick="startSectionGuideFromSettings('${g.id}')" class="btn-secondary w-full text-sm">📍 ${g.label}</button>`
).join('')

export function renderSettings() {
  const s = getSettings()
  const notifBlock = !canUseNotifications()
    ? '<p class="ds-setting-hint">Tu navegador no soporta notificaciones.</p>'
    : getNotificationPermission() === 'denied'
      ? '<p class="ds-setting-hint">Permiso bloqueado. Habilítalo en ajustes del navegador.</p>'
      : `<p class="ds-setting-hint">Te avisamos si el plan del día no está completo.</p>
        <select onchange="setReminderHour(parseInt(this.value))" class="input-field mt-2" ${!s.notificationsEnabled ? 'disabled' : ''}>
          <option value="">Sin hora fija</option>
          ${[7, 8, 9, 12, 18, 19, 20, 21, 22].map(h => `<option value="${h}" ${s.reminderHour === h ? 'selected' : ''}>${h}:00</option>`).join('')}
        </select>`

  const content = settingsTab === 'general' ? `
    ${settingGroup('Interfaz', `
      ${settingRow('Sidebar compacto', `<input type="checkbox" ${s.compactSidebar ? 'checked' : ''} onchange="toggleCompactSidebar(this.checked)">`)}
      ${settingRow('Sonidos', `<input type="checkbox" ${s.sound ? 'checked' : ''} onchange="toggleSound(this.checked)">`)}
      ${settingRow('Reducir animaciones', `<input type="checkbox" ${s.reducedMotion ? 'checked' : ''} onchange="toggleReducedMotion(this.checked)">`, 'Menos movimiento y efectos visuales.')}
    `)}
    ${settingGroup('Notificaciones', `
      <div class="ds-setting-row ds-setting-row--stack">
        <label class="flex justify-between items-center w-full">
          <span class="ds-setting-label">Recordatorios del plan</span>
          <input type="checkbox" ${s.notificationsEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
        </label>
        ${notifBlock}
      </div>
      <div class="ds-setting-row ds-setting-row--stack">
        <label class="flex justify-between items-center w-full">
          <span class="ds-setting-label">Recordatorio de hábitos</span>
          <input type="checkbox" ${s.habitRemindersEnabled ? 'checked' : ''} onchange="toggleHabitReminders(this.checked)" ${!s.notificationsEnabled ? 'disabled' : ''}>
        </label>
        <p class="ds-setting-hint">Aviso si faltan hábitos por completar.</p>
        <select onchange="setHabitReminderHour(parseInt(this.value))" class="input-field" ${!s.notificationsEnabled || !s.habitRemindersEnabled ? 'disabled' : ''}>
          <option value="">Sin hora fija</option>
          ${[12, 17, 18, 19, 20, 21].map(h => `<option value="${h}" ${s.habitReminderHour === h ? 'selected' : ''}>${h}:00</option>`).join('')}
        </select>
      </div>
      <div class="ds-setting-row">
        <div>
          <span class="ds-setting-label">Aviso al atardecer</span>
          <p class="ds-setting-hint">~30 min antes del ocaso, invita a meditar.</p>
        </div>
        <input type="checkbox" ${s.sunsetRemindersEnabled !== false ? 'checked' : ''} onchange="toggleSunsetReminders(this.checked)" ${!s.notificationsEnabled ? 'disabled' : ''}>
      </div>
    `)}
    ${settingGroup('Preferencias', `
      <div class="ds-setting-row ds-setting-row--stack">
        <span class="ds-setting-label">Dificultad por defecto</span>
        <select onchange="setDefaultDiff(this.value)" class="input-field">
          ${Object.entries(DIFFICULTIES).map(([k, d]) => {
            const locked = k === 'experto' && !isUnlocked('diff_expert')
            return `<option value="${k}" ${s.defaultDifficulty === k ? 'selected' : ''} ${locked ? 'disabled' : ''}>${locked ? '🔒 ' : ''}${d.icon} ${d.label}</option>`
          }).join('')}
        </select>
      </div>
      <div class="ds-setting-row ds-setting-row--stack">
        <span class="ds-setting-label">País (festivos y clima)</span>
        <select onchange="setCountry(this.value)" class="input-field">
          ${[['MX', 'México'], ['ES', 'España'], ['AR', 'Argentina'], ['CO', 'Colombia'], ['CL', 'Chile'], ['PE', 'Perú'], ['US', 'Estados Unidos']]
            .map(([code, name]) => `<option value="${code}" ${(s.country || 'MX') === code ? 'selected' : ''}>${name}</option>`).join('')}
        </select>
        <p class="ds-setting-hint">El clima usa tu ubicación si la permites, o la capital del país.</p>
        <button type="button" onclick="requestLocationRefresh()" class="btn-secondary w-full text-sm mt-1">📍 Actualizar ubicación</button>
      </div>
    `)}
    ${settingGroup('Tema visual', `
      <p class="ds-setting-hint" style="margin:0">FORGE — tema oscuro fijo. Los temas desbloqueables estarán disponibles en una futura actualización.</p>
    `)}
  ` : settingsTab === 'account' ? renderCloudAccountPanel() : `
    ${pageLead('Respalda tu progreso, niveles y logros.')}
    ${settingRow('Respaldo automático semanal', `<input type="checkbox" ${s.autoBackupEnabled ? 'checked' : ''} onchange="toggleAutoBackup(this.checked)">`, 'Descarga un JSON cada 7 días si la app está abierta.')}
    ${settingGroup('Guías por sección', `
      <p class="ds-setting-hint">Tours cortos para cada área de la app. La primera vez que entres también se ofrecen solos.</p>
      <div class="flex flex-col gap-2 mt-2">${sectionGuideButtons}</div>
      <button type="button" onclick="resetSectionGuidesFromSettings()" class="btn-ghost w-full text-sm mt-2">Reactivar guías automáticas</button>
    `)}
    <div class="flex flex-col gap-2 mt-4">
      <button onclick="exportData()" class="btn-primary w-full">📤 Exportar todo</button>
      <button onclick="exportMonthlyReportText()" class="btn-secondary w-full">📄 Informe mensual (.txt)</button>
      <button type="button" onclick="restartOnboardingGuide()" class="btn-secondary w-full">📖 Ver guía de inicio</button>
      <button onclick="restartTour()" class="btn-ghost w-full">🎯 Repetir tour guiado</button>
      <label class="btn-secondary w-full block text-center cursor-pointer">📥 Importar<input type="file" accept=".json" onchange="importData(event)" class="hidden"></label>
      <button type="button" onclick="confirmResetAll()" class="btn-ghost w-full text-sm" style="color:var(--m-danger)">↺ Empezar desde cero</button>
    </div>
    <p class="ds-setting-hint text-center">Borra progreso, hábitos, rachas y logros. Exporta antes si quieres conservar una copia.</p>
    <p id="import-status" class="text-sm text-muted mt-3 text-center"></p>`

  return `<div class="animate-fade-in page-shell page-wide page-settings">
    <div class="ds-page ds-page--full">
      ${tabBar([
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'account', label: 'Cuenta', icon: '☁️' },
        { id: 'data', label: 'Datos', icon: '💾' },
      ], settingsTab, 'settingsTab')}
      <div class="ds-panel">${content}</div>
    </div>
  </div>`
}

function setCloudMsg(msg, ok = true) {
  const el = document.getElementById('cloud-status-msg')
  if (el) {
    el.textContent = msg
    el.style.color = ok ? '' : 'var(--color-danger, #c44)'
  }
}

export function bindSettingsGlobals(deps = {}) {
  const { invalidateDailyApis, reloadDailyApis } = deps
  const render = () => window.render?.()

  window.toggleDark = (v) => { const s = getSettings(); s.darkMode = v; saveSettings(s); render() }
  window.toggleCompactSidebar = (v) => {
    const s = getSettings(); s.compactSidebar = v; saveSettings(s); applyCompactSidebar(v); render()
  }
  window.toggleSound = (v) => { const s = getSettings(); s.sound = v; saveSettings(s) }
  window.toggleReducedMotion = (v) => { const s = getSettings(); s.reducedMotion = v; saveSettings(s) }
  window.toggleHabitReminders = (v) => {
    const s = getSettings(); s.habitRemindersEnabled = v
    if (v && !s.habitReminderHour) s.habitReminderHour = 18
    saveSettings(s); if (s.notificationsEnabled) startReminderChecker(getPlanProgress); render()
  }
  window.setHabitReminderHour = (h) => { const s = getSettings(); s.habitReminderHour = h || null; saveSettings(s) }
  window.toggleSunsetReminders = (v) => {
    const s = getSettings()
    s.sunsetRemindersEnabled = v
    saveSettings(s)
    if (s.notificationsEnabled) startReminderChecker(getPlanProgress)
    render()
  }
  window.toggleAutoBackup = (v) => { const s = getSettings(); s.autoBackupEnabled = v; saveSettings(s) }

  window.cloudSignIn = async function() {
    const email = document.getElementById('cloud-email')?.value?.trim()
    const password = document.getElementById('cloud-password')?.value
    if (!email || !password) { setCloudMsg('Correo y contraseña requeridos', false); return }
    try {
      await signIn(email, password)
      setCloudMsg('✓ Sesión iniciada')
      playSuccess()
      render()
    } catch (e) {
      setCloudMsg(e?.message || 'No se pudo iniciar sesión', false)
    }
  }

  window.cloudSignUp = async function() {
    const email = document.getElementById('cloud-email')?.value?.trim()
    const password = document.getElementById('cloud-password')?.value
    if (!email || !password || password.length < 6) {
      setCloudMsg('Correo y contraseña (mín. 6 caracteres)', false)
      return
    }
    try {
      const data = await signUp(email, password)
      if (data.session) {
        setCloudMsg('✓ Cuenta creada')
        playSuccess()
        render()
      } else {
        setCloudMsg('Revisa tu correo para confirmar la cuenta')
      }
    } catch (e) {
      setCloudMsg(e?.message || 'No se pudo crear la cuenta', false)
    }
  }

  window.cloudSignOut = async function() {
    await signOut()
    setCloudMsg('Sesión cerrada')
    render()
  }

  window.cloudSyncNow = async function() {
    try {
      await pushToCloud({ force: true })
      setCloudMsg('✓ Subido a la nube')
      playSuccess()
      render()
    } catch (e) {
      setCloudMsg(e?.message || 'Error al sincronizar', false)
    }
  }

  window.cloudPullNow = async function() {
    try {
      await pullFromCloud()
      setCloudMsg('✓ Datos descargados')
      playSuccess()
      render(true)
    } catch (e) {
      setCloudMsg(e?.message || 'Error al descargar', false)
    }
  }

  window.exportMonthlyReportText = exportMonthlyReportText
  window.restartTour = function() {
    const s = getSettings()
    s.tourComplete = false
    saveSettings(s)
    setItem('tourSkipped', false)
    setTimeout(() => startTour(), 300)
  }
  window.restartOnboardingGuide = function() {
    if (!confirm('¿Reabrir la guía de inicio? Te llevará por los 8 pasos de configuración.')) return
    restartOnboarding()
    resetOnboardingCache()
    location.hash = '#/'
    render(true)
  }
  window.startSectionGuideFromSettings = (id) => startSectionGuide(id, () => render())
  window.resetSectionGuidesFromSettings = () => {
    resetSectionGuides()
    alert('Las guías por sección volverán a mostrarse en tu primera visita a cada área.')
  }
  window.toggleNotifications = async function(v) {
    const s = getSettings()
    if (v) {
      const perm = await requestNotificationPermission()
      if (perm !== 'granted') { s.notificationsEnabled = false; saveSettings(s); alert('Necesitas permitir notificaciones para usar recordatorios.'); render(); return }
    }
    s.notificationsEnabled = v
    if (v && !s.reminderHour) s.reminderHour = 20
    saveSettings(s)
    if (v) startReminderChecker(getPlanProgress)
    render()
  }
  window.setReminderHour = (h) => {
    const s = getSettings()
    s.reminderHour = h || null
    saveSettings(s)
  }
  window.setDefaultDiff = (v) => { const s = getSettings(); s.defaultDifficulty = guardDifficulty(v); saveSettings(s) }
  window.setTheme = (id) => {
    if (id !== 'default' && !isUnlocked(id)) return
    const s = getSettings()
    s.theme = id
    saveSettings(s)
    applyTheme(id)
    render()
  }
  window.requestLocationRefresh = async function() {
    const { requestUserLocation } = await import('../apis.js')
    const geo = await requestUserLocation()
    const s = getSettings()
    if (geo) {
      s.latitude = Math.round(geo.lat * 100) / 100
      s.longitude = Math.round(geo.lon * 100) / 100
      s.locationName = 'Tu ubicación'
      s.locationAsked = true
      saveSettings(s)
      invalidateDailyApis?.()
      await reloadDailyApis?.()
      render()
    } else {
      alert('No se pudo obtener tu ubicación. Revisa los permisos del navegador.')
    }
  }
  window.setCountry = (code) => {
    const s = getSettings()
    s.country = code
    s.latitude = null
    s.longitude = null
    s.locationName = ''
    saveSettings(s)
    invalidateDailyApis?.()
    reloadDailyApis?.()
  }
  window.exportData = function() {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith(PREFIX)) data[key.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(key))
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]))
    a.download = `mejora-backup-${getToday()}.json`
    a.click()
  }
  window.importData = function(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        Object.entries(JSON.parse(ev.target.result)).forEach(([k, v]) => setItem(k, v))
        const imported = getSettings()
        saveSettings(imported)
        applyTheme(imported.theme)
        document.getElementById('import-status').textContent = '✓ Importado'
        setTimeout(render, 800)
      } catch {
        document.getElementById('import-status').textContent = '✗ Error'
      }
    }
    reader.readAsText(file)
  }
  window.confirmResetAll = function() {
    if (!confirm('¿Empezar desde cero? Se borrará todo tu progreso local. Esta acción no se puede deshacer.')) return
    resetAllData()
    location.hash = '#/'
    location.reload()
  }
}
