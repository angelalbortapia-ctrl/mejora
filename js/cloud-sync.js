import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { PREFIX, setItem, getSettings, saveSettings } from './core.js'
import { exportAllData } from './backup.js'
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js'

const META_KEY = 'cloudSync'
let client = null
let session = null
let pushTimer = null
let syncing = false
let applyingRemote = false
const listeners = new Set()

function getMeta() {
  try {
    const raw = localStorage.getItem(PREFIX + META_KEY)
    return raw ? JSON.parse(raw) : { lastSyncedAt: null, lastRemoteAt: null }
  } catch {
    return { lastSyncedAt: null, lastRemoteAt: null }
  }
}

function saveMeta(meta) {
  localStorage.setItem(PREFIX + META_KEY, JSON.stringify(meta))
}

function notify() {
  const status = getCloudStatus()
  listeners.forEach(fn => { try { fn(status) } catch {} })
  window.dispatchEvent(new CustomEvent('mejora:cloud', { detail: status }))
}

export function getCloudStatus() {
  return {
    configured: isSupabaseConfigured(),
    signedIn: Boolean(session?.user),
    email: session?.user?.email || null,
    syncing,
    lastSyncedAt: getMeta().lastSyncedAt,
    lastRemoteAt: getMeta().lastRemoteAt,
  }
}

export function onCloudStatus(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getClient() {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

function applyRemotePayload(payload) {
  if (!payload || typeof payload !== 'object') return
  applyingRemote = true
  try {
    Object.entries(payload).forEach(([key, value]) => {
      if (key === META_KEY) return
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    })
    const settings = getSettings()
    saveSettings(settings)
  } finally {
    applyingRemote = false
  }
}

function hasLocalProgress() {
  const data = exportAllData()
  const keys = Object.keys(data).filter(k => k !== META_KEY)
  if (keys.length === 0) return false
  if (keys.length === 1 && keys[0] === 'settings') {
    const s = data.settings || {}
    return Boolean(s.onboardingComplete || s.userName)
  }
  return keys.some(k => {
    if (k === 'settings') return false
    const v = data[k]
    if (Array.isArray(v)) return v.length > 0
    if (v && typeof v === 'object') return Object.keys(v).length > 0
    return v != null
  })
}

export async function initCloudSync() {
  const sb = getClient()
  if (!sb) return getCloudStatus()

  const { data } = await sb.auth.getSession()
  session = data.session

  sb.auth.onAuthStateChange(async (_event, newSession) => {
    session = newSession ?? null
    if (session?.user) {
      try {
        await pullFromCloud({ silent: true })
      } catch {}
    }
    notify()
  })

  if (session?.user) {
    try {
      await pullFromCloud({ silent: true })
    } catch {}
  }

  notify()
  return getCloudStatus()
}

export async function signUp(email, password) {
  const sb = getClient()
  if (!sb) throw new Error('Supabase no configurado')
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  session = data.session
  if (session?.user && hasLocalProgress()) await pushToCloud({ force: true })
  notify()
  return data
}

export async function signIn(email, password) {
  const sb = getClient()
  if (!sb) throw new Error('Supabase no configurado')
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  session = data.session
  await pullFromCloud({ mergeLocal: hasLocalProgress() })
  notify()
  return data
}

export async function signOut() {
  const sb = getClient()
  if (!sb) return
  await sb.auth.signOut()
  session = null
  notify()
}

export async function pullFromCloud(opts = {}) {
  const sb = getClient()
  if (!sb || !session?.user) return null
  syncing = true
  notify()
  try {
    const { data, error } = await sb
      .from('user_data')
      .select('payload, updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (error) throw error

    const remoteAt = data?.updated_at || null
    const meta = getMeta()

    if (opts.mergeLocal && hasLocalProgress()) {
      await pushToCloud({ force: true })
    } else if (data?.payload && Object.keys(data.payload).length > 0) {
      const remoteNewer = !meta.lastRemoteAt || (remoteAt && remoteAt > meta.lastRemoteAt)
      if (remoteNewer || !hasLocalProgress()) {
        applyRemotePayload(data.payload)
      }
    } else if (hasLocalProgress()) {
      await pushToCloud({ force: true })
    }

    meta.lastRemoteAt = remoteAt
    meta.lastSyncedAt = new Date().toISOString()
    saveMeta(meta)
    return data
  } finally {
    syncing = false
    notify()
  }
}

export async function pushToCloud(opts = {}) {
  const sb = getClient()
  if (!sb || !session?.user) return null
  if (syncing && !opts.force) return null

  syncing = true
  notify()
  try {
    const payload = exportAllData()
    delete payload[META_KEY]

    const { data, error } = await sb
      .from('user_data')
      .upsert({
        user_id: session.user.id,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('updated_at')
      .single()

    if (error) throw error

    const meta = getMeta()
    meta.lastSyncedAt = new Date().toISOString()
    meta.lastRemoteAt = data?.updated_at || meta.lastSyncedAt
    saveMeta(meta)
    return data
  } finally {
    syncing = false
    notify()
  }
}

export function scheduleCloudPush() {
  if (!session?.user || syncing || applyingRemote) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushToCloud().catch(() => {})
  }, 2500)
}
