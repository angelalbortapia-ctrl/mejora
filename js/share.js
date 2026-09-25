/** Compartir logros — Web Share API + fallback clipboard */

import { getRank, getStreak, getTotalLevel, getStats, getAchievements } from '/js/core.js'
import { getJourneySummary } from '/js/analytics.js'
import { trackProductEvent, EVENTS } from '/js/product-analytics.js'
import { t } from '/js/i18n.js'

function appUrl() {
  try {
    return location.href.split('#')[0]
  } catch {
    return ''
  }
}

export function buildStreakShareText() {
  const streak = getStreak()
  const rank = getRank()
  return `${t('share.streakTitle')} 🔥\n${streak} días de racha · ${rank.icon} ${rank.title} (Nv. ${getTotalLevel()})\n${t('share.cta')}\n${appUrl()}`
}

export function buildProfileShareText() {
  const rank = getRank()
  const stats = getStats()
  const achievements = getAchievements().filter(a => a.unlocked).length
  return `${t('share.profileTitle')} ${rank.icon}\n${rank.title} · Nv. ${getTotalLevel()} · ${achievements} logros\n${stats.habitsCompleted} hábitos · ${stats.meditationMinutes} min calma · ${stats.brainSessions} sesiones mente\n${t('share.cta')}\n${appUrl()}`
}

export function buildJourneyShareText() {
  const s = getJourneySummary()
  return `${t('share.journeyTitle')} 📊\n${s.streak} días de racha · ${s.consistency30}% consistencia (30d)\n${s.habitsCompleted} hábitos · ${s.brainSessions} sesiones · ${s.meditationMinutes || 0} min calma\n${t('share.cta')}\n${appUrl()}`
}

export function buildAchievementShareText(achievement) {
  if (!achievement) return buildProfileShareText()
  return `${t('share.achievementTitle')} ${achievement.icon}\n${achievement.name} — ${achievement.desc}\n${t('share.cta')}\n${appUrl()}`
}

export async function shareText(text, { title, kind = 'generic' } = {}) {
  const shareTitle = title || 'Mejora'
  try {
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text })
      trackProductEvent(EVENTS.SHARE, { kind, channel: 'native' })
      return { ok: true, channel: 'native' }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      trackProductEvent(EVENTS.SHARE, { kind, channel: 'clipboard' })
      return { ok: true, channel: 'clipboard' }
    }
    throw new Error('share_unavailable')
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: false, aborted: true }
    throw err
  }
}

export async function shareStreak() {
  return shareText(buildStreakShareText(), { title: t('share.streakTitle'), kind: 'streak' })
}

export async function shareProfile() {
  return shareText(buildProfileShareText(), { title: t('share.profileTitle'), kind: 'profile' })
}

export async function shareJourney() {
  return shareText(buildJourneyShareText(), { title: t('share.journeyTitle'), kind: 'journey' })
}

export async function shareTopAchievement() {
  const unlocked = getAchievements().filter(a => a.unlocked)
  const pick = unlocked[unlocked.length - 1] || null
  const text = buildAchievementShareText(pick)
  return shareText(text, { title: t('share.achievementTitle'), kind: 'achievement' })
}
