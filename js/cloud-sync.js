import { PREFIX, getSettings, saveSettings } from '/js/core.js'
import { exportAllData } from '/js/backup.js'
import {
  ensureSupabaseConfig, isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY,
} from '/js/supabase-config.js'

const META_KEY = 'cloudSync'
const ENC_MARKER = '__mejora_enc'
const ENC_VERSION = 1
const PBKDF2_ITER = 100_000

let client = null
let clientReady = null
let session = null
let pushTimer = null
let syncing = false
let applyingRemote = false
let lastError = null
let pendingConflict = null
let syncPassphrase = null
const listeners = new Set()

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function generateSaltB64() {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)))
}

export function isSyncEncryptionEnabled() {
  return Boolean(getSettings().syncEncryptionEnabled)
}

export function hasSyncPassphrase() {
  return Boolean(syncPassphrase)
}

export function setSyncPassphrase(passphrase) {
  syncPassphrase = passphrase ? String(passphrase) : null
  clearSyncError()
}

export function clearSyncPassphrase() {
  syncPassphrase = null
}

function getSyncSalt() {
  const s = getSettings()
  if (!s.syncEncryptionSalt) {
    s.syncEncryptionSalt = generateSaltB64()
    saveSettings(s)
  }
  return s.syncEncryptionSalt
}

async function deriveSyncKey(passphrase, saltB64) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: PBKDF2_ITER, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function isEncryptedCloudPayload(payload) {
  return Boolean(payload && typeof payload === 'object' && payload[ENC_MARKER])
}

export async function encryptCloudPayload(data, passphrase) {
  const salt = getSyncSalt()
  const key = await deriveSyncKey(passphrase, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  )
  return {
    [ENC_MARKER]: true,
    v: ENC_VERSION,
    salt,
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ct)),
  }
}

export async function decryptCloudPayload(wrapped, passphrase) {
  if (!isEncryptedCloudPayload(wrapped)) return wrapped
  const salt = wrapped.salt || getSyncSalt()
  const key = await deriveSyncKey(passphrase, salt)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(wrapped.iv) },
    key,
    b64ToBytes(wrapped.ct),
  )
  return JSON.parse(new TextDecoder().decode(plain))
}

export async function enableSyncEncryption(passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('La frase de cifrado debe tener al menos 8 caracteres')
  }
  const s = getSettings()
  if (!s.syncEncryptionSalt) s.syncEncryptionSalt = generateSaltB64()
  s.syncEncryptionEnabled = true
  saveSettings(s)
  setSyncPassphrase(passphrase)
  if (session?.user) await pushToCloud({ force: true })
  notify()
  return true
}

export async function disableSyncEncryption(passphrase) {
  if (!isSyncEncryptionEnabled()) return true
  if (!passphrase) throw new Error('Introduce la frase de cifrado para desactivar')
  const wrapped = await encryptCloudPayload({ probe: true }, passphrase)
  try {
    await decryptCloudPayload(wrapped, passphrase)
  } catch {
    throw new Error('Frase de cifrado incorrecta')
  }
  const s = getSettings()
  s.syncEncryptionEnabled = false
  saveSettings(s)
  clearSyncPassphrase()
  if (session?.user) await pushToCloud({ force: true })
  notify()
  return true
}

async function preparePushPayload() {
  const payload = exportAllData()
  delete payload[META_KEY]
  if (!isSyncEncryptionEnabled()) return payload
  if (!syncPassphrase) throw new Error('Introduce tu frase de cifrado en Ajustes → Cuenta')
  return encryptCloudPayload(payload, syncPassphrase)
}

async function unwrapRemotePayload(payload) {
  if (!isEncryptedCloudPayload(payload)) return payload
  if (!syncPassphrase) throw new Error('Los datos en la nube están cifrados — introduce tu frase en Ajustes')
  return decryptCloudPayload(payload, syncPassphrase)
}

function getMeta() {
  try {
    const raw = localStorage.getItem(PREFIX + META_KEY)
    return raw ? JSON.parse(raw) : {
      lastSyncedAt: null,
      lastRemoteAt: null,
      localModifiedAt: null,
    }
  } catch {
    return { lastSyncedAt: null, lastRemoteAt: null, localModifiedAt: null }
  }
}

function saveMeta(meta) {
  localStorage.setItem(PREFIX + META_KEY, JSON.stringify(meta))
}

function touchLocalModified() {
  const meta = getMeta()
  meta.localModifiedAt = new Date().toISOString()
  saveMeta(meta)
}

function clearSyncError() {
  lastError = null
}

function setSyncError(err) {
  lastError = err?.message || (err ? String(err) : 'Error de sincronización')
}

export function detectSyncConflict(meta, { remoteAt, remoteHasData, localHasProgress }) {
  if (!remoteHasData || !localHasProgress || !remoteAt) return false
  const remoteNewer = !meta.lastRemoteAt || remoteAt > meta.lastRemoteAt
  if (!remoteNewer) return false
  const localChangedSinceSync = Boolean(
    meta.localModifiedAt
    && meta.lastSyncedAt
    && meta.localModifiedAt > meta.lastSyncedAt
  )
  return localChangedSinceSync
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
    lastError,
    encryptionEnabled: isSyncEncryptionEnabled(),
    passphraseReady: hasSyncPassphrase(),
    pendingConflict: pendingConflict
      ? { remoteAt: pendingConflict.remoteAt }
      : null,
  }
}

export function onCloudStatus(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

async function getClient() {
  await ensureSupabaseConfig()
  if (!isSupabaseConfigured()) return null
  if (client) return client
  if (!clientReady) {
    clientReady = import('https://esm.sh/@supabase/supabase-js@2.49.1')
      .then(({ createClient }) => {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
        return client
      })
      .catch((err) => {
        clientReady = null
        throw err
      })
  }
  return clientReady
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
  const keys = Object.keys(data).filter(k => k !== META_KEY && k !== 'syncEncryptionSalt')
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

function markSynced(remoteAt) {
  const meta = getMeta()
  meta.lastSyncedAt = new Date().toISOString()
  meta.lastRemoteAt = remoteAt || meta.lastSyncedAt
  meta.localModifiedAt = null
  saveMeta(meta)
  clearSyncError()
  pendingConflict = null
}

export async function initCloudSync() {
  try {
    const sb = await getClient()
    if (!sb) return getCloudStatus()

    const { data } = await sb.auth.getSession()
    session = data.session

    sb.auth.onAuthStateChange(async (_event, newSession) => {
      session = newSession ?? null
      if (session?.user) {
        try {
          await pullFromCloud({ silent: true })
        } catch (err) {
          setSyncError(err)
        }
      } else {
        pendingConflict = null
        clearSyncError()
      }
      notify()
    })

    if (session?.user) {
      try {
        await pullFromCloud({ silent: true })
      } catch (err) {
        setSyncError(err)
      }
    }
  } catch (err) {
    setSyncError(err)
  }

  notify()
  return getCloudStatus()
}

export async function signUp(email, password) {
  const sb = await getClient()
  if (!sb) throw new Error('Supabase no configurado')
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  session = data.session
  if (session?.user && hasLocalProgress()) await pushToCloud({ force: true })
  notify()
  return data
}

export async function signIn(email, password) {
  const sb = await getClient()
  if (!sb) throw new Error('Supabase no configurado')
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  session = data.session
  await pullFromCloud({ mergeLocal: hasLocalProgress() })
  notify()
  return data
}

export async function signOut() {
  const sb = await getClient()
  if (!sb) return
  await sb.auth.signOut()
  session = null
  pendingConflict = null
  clearSyncPassphrase()
  clearSyncError()
  notify()
}

export async function pullFromCloud(opts = {}) {
  const sb = await getClient()
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
    const remoteHasData = Boolean(data?.payload && Object.keys(data.payload).length > 0)

    if (opts.mergeLocal && hasLocalProgress()) {
      await pushToCloud({ force: true })
    } else if (detectSyncConflict(meta, {
      remoteAt,
      remoteHasData,
      localHasProgress: hasLocalProgress(),
    }) && !opts.forceRemote && !opts.resolveConflict) {
      pendingConflict = { remoteAt, remotePayload: data.payload }
      notify()
      return data
    } else if (remoteHasData) {
      const remoteNewer = !meta.lastRemoteAt || (remoteAt && remoteAt > meta.lastRemoteAt)
      if (remoteNewer || !hasLocalProgress() || opts.forceRemote) {
        const plain = await unwrapRemotePayload(data.payload)
        applyRemotePayload(plain)
        markSynced(remoteAt)
      }
    } else if (hasLocalProgress()) {
      await pushToCloud({ force: true })
    } else {
      markSynced(remoteAt)
    }

    if (!pendingConflict) notify()
    return data
  } catch (err) {
    setSyncError(err)
    if (!opts.silent) throw err
    return null
  } finally {
    syncing = false
    notify()
  }
}

export async function pushToCloud(opts = {}) {
  const sb = await getClient()
  if (!sb || !session?.user) return null
  if (syncing && !opts.force) return null

  syncing = true
  notify()
  try {
    const payload = await preparePushPayload()

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

    markSynced(data?.updated_at)
    return data
  } catch (err) {
    setSyncError(err)
    throw err
  } finally {
    syncing = false
    notify()
  }
}

export async function resolveCloudConflict(choice) {
  if (!pendingConflict) return null
  if (choice === 'remote') {
    const plain = await unwrapRemotePayload(pendingConflict.remotePayload)
    applyRemotePayload(plain)
    markSynced(pendingConflict.remoteAt)
    pendingConflict = null
    notify()
    return 'remote'
  }
  if (choice === 'local') {
    pendingConflict = null
    await pushToCloud({ force: true })
    return 'local'
  }
  throw new Error('Opción de conflicto inválida')
}

export async function deleteCloudData() {
  const sb = await getClient()
  if (!sb || !session?.user) throw new Error('Inicia sesión para borrar datos en la nube')
  syncing = true
  notify()
  try {
    const { error } = await sb
      .from('user_data')
      .delete()
      .eq('user_id', session.user.id)
    if (error) throw error
    const meta = getMeta()
    meta.lastRemoteAt = null
    meta.lastSyncedAt = new Date().toISOString()
    saveMeta(meta)
    pendingConflict = null
    clearSyncError()
    return true
  } catch (err) {
    setSyncError(err)
    throw err
  } finally {
    syncing = false
    notify()
  }
}

export function scheduleCloudPush() {
  if (!session?.user || syncing || applyingRemote) return
  touchLocalModified()
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushToCloud().catch(err => setSyncError(err))
  }, 2500)
}
