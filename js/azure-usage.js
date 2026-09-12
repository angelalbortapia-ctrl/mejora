/** Uso local de Azure TTS — tope seguro bajo la capa gratis F0 (500k/mes). */

import { getItem, setItem } from './core.js'

export const AZURE_FREE_CHARS_MONTH = 500_000
/** Tope en app: 20k antes del límite real para no pasarte ni un cobro. */
export const AZURE_USAGE_CAP = 480_000
const STORAGE_KEY = 'azureTtsUsage'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function loadRecord() {
  const data = getItem(STORAGE_KEY, { month: currentMonth(), chars: 0 })
  if (data.month !== currentMonth()) return { month: currentMonth(), chars: 0 }
  return { month: data.month, chars: Number(data.chars) || 0 }
}

export function trackAzureChars(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!n) return
  const data = loadRecord()
  data.chars = Math.min(AZURE_USAGE_CAP, data.chars + n)
  setItem(STORAGE_KEY, data)
}

export function getAzureUsage() {
  const data = loadRecord()
  const used = data.chars
  const limit = AZURE_USAGE_CAP
  const remaining = Math.max(0, limit - used)
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const exhausted = used >= limit
  return {
    month: data.month,
    used,
    limit,
    remaining,
    percent,
    exhausted,
    azureFreeLimit: AZURE_FREE_CHARS_MONTH,
  }
}

export function isAzureQuotaAvailable(extraChars = 0) {
  const u = getAzureUsage()
  return u.used + Math.max(0, extraChars) <= AZURE_USAGE_CAP
}

export function isAzureQuotaExhausted() {
  return getAzureUsage().exhausted
}

export function assertAzureQuota(chars) {
  const n = Math.max(0, Math.floor(Number(chars) || 0))
  if (!isAzureQuotaAvailable(n)) {
    throw new Error('AZURE_QUOTA_EXCEEDED')
  }
}

function fmtK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  return String(n)
}

export function formatAzureUsageHint() {
  const u = getAzureUsage()
  if (u.exhausted) {
    return 'Cuota mensual agotada — voz del navegador hasta el próximo mes'
  }
  const rem = fmtK(u.remaining)
  const lim = fmtK(u.limit)
  if (u.percent >= 90) return `⚠️ Casi al tope: ~${rem} restantes (máx. ${lim}/mes)`
  return `~${rem} de ${lim} restantes · tope seguro activo`
}

export function formatAzureUsagePanel() {
  const u = getAzureUsage()
  if (u.exhausted) return `Tope alcanzado (${fmtK(u.used)}/${fmtK(u.limit)}) · voz navegador hasta el próximo mes`
  return `${fmtK(u.used)} usados · ${fmtK(u.remaining)} restantes · tope ${fmtK(u.limit)}/mes`
}
