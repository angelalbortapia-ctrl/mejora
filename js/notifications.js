import { getItem, setItem, getToday, getSettings, getHabits, getCompletedHabitsCount } from '/js/core.js'
import { maybeAutoBackup } from '/js/backup.js'
import { getDailyBundle, formatSunsetLocal } from '/js/apis.js'

export function canUseNotifications() {
  return 'Notification' in window
}

export function getNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function showNotification(title, body, url = '/#/plan', tag = 'mejora-reminder') {
  if (!canUseNotifications() || Notification.permission !== 'granted') return false

  const options = {
    body,
    icon: '/public/favicon.svg',
    badge: '/public/favicon.svg',
    tag,
    data: { url },
    vibrate: [100, 50, 100],
  }

  try {
    if (navigator.serviceWorker?.controller) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
    } else {
      new Notification(title, options)
    }
    return true
  } catch {
    return false
  }
}

export async function maybeSendPlanReminder(getPlanProgress) {
  const s = getSettings()
  if (!s.notificationsEnabled || s.reminderHour == null) return

  const today = getToday()
  if (getItem(`notified_plan_${today}`, false)) return

  const now = new Date()
  if (now.getHours() !== s.reminderHour) return

  const progress = getPlanProgress()
  if (progress.allDone) return

  const remaining = progress.total - progress.done
  const sent = await showNotification(
    'Mejora — Plan del día',
    remaining === 1
      ? 'Te queda 1 misión por hoy. ¡Un último empujón!'
      : `Te faltan ${remaining} misiones. Abre la app y continúa tu racha.`,
    '/#/plan'
  )
  if (sent) setItem(`notified_plan_${today}`, true)
}

export async function maybeSendHabitReminder() {
  const s = getSettings()
  if (!s.notificationsEnabled || !s.habitRemindersEnabled || s.habitReminderHour == null) return

  const today = getToday()
  if (getItem(`notified_habits_${today}`, false)) return

  const now = new Date()
  if (now.getHours() !== s.habitReminderHour) return

  const habits = getHabits()
  const done = getCompletedHabitsCount(today)
  if (!habits.length || done >= habits.length) return

  const sent = await showNotification(
    'Mejora — Hábitos',
    `Te faltan ${habits.length - done} hábito${habits.length - done > 1 ? 's' : ''} por hoy. Un minuto puede cambiar tu racha.`,
    '/#/mejora'
  )
  if (sent) setItem(`notified_habits_${today}`, true)
}

export async function maybeSendSunsetReminder() {
  const s = getSettings()
  if (!s.notificationsEnabled || s.sunsetRemindersEnabled === false) return

  const today = getToday()
  if (getItem(`notified_sunset_${today}`, false)) return

  const bundle = getDailyBundle()
  if (!bundle?.sun?.sunset) return

  const sunset = new Date(bundle.sun.sunset)
  const now = new Date()
  const minsToSunset = (sunset - now) / 60000

  // Ventana ~30 min antes del atardecer (compatible con chequeo cada 5 min)
  if (minsToSunset > 35 || minsToSunset <= 10) return

  const timeStr = formatSunsetLocal(bundle.sun.sunset)
  const sent = await showNotification(
    'Mejora — Atardecer',
    `El sol se pone a las ${timeStr}. Reserva 5 min para meditar o respirar con calma.`,
    '/#/meditacion',
    'mejora-sunset',
  )
  if (sent) setItem(`notified_sunset_${today}`, true)
}

let reminderInterval = null
let sunsetInterval = null

export function startReminderChecker(getPlanProgress) {
  if (reminderInterval) clearInterval(reminderInterval)
  if (sunsetInterval) clearInterval(sunsetInterval)

  maybeSendPlanReminder(getPlanProgress)
  maybeSendHabitReminder()
  maybeSendSunsetReminder()
  maybeAutoBackup()

  reminderInterval = setInterval(() => {
    maybeSendPlanReminder(getPlanProgress)
    maybeSendHabitReminder()
    maybeAutoBackup()
  }, 15 * 60 * 1000)

  sunsetInterval = setInterval(maybeSendSunsetReminder, 5 * 60 * 1000)
}
