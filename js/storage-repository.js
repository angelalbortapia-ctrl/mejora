/**
 * Capa de persistencia unificada — única fuente de verdad intermedia.
 * localStorage + cola offline IndexedDB para sync posterior.
 */

import { PREFIX, getItem, setItem } from '/js/core.js'

const DB_NAME = 'mejora_offline'
const DB_VERSION = 1
const QUEUE_STORE = 'sync_queue'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function storageKey(key) {
  return key.startsWith(PREFIX) ? key : PREFIX + key
}

/** Lectura con fallback */
export function repoGet(key, fallback = null) {
  return getItem(key, fallback)
}

/** Escritura + marca de modificación local */
export function repoSet(key, value, { queue = false, type = 'data' } = {}) {
  setItem(key, value)
  if (queue) {
    enqueueSyncEvent({ type, key, payload: value, ts: Date.now() })
  }
  return value
}

export async function enqueueSyncEvent(event) {
  const db = await openDb()
  if (!db) return false
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).add({ ...event, queuedAt: Date.now() })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  }).catch(() => false)
}

export async function drainSyncQueue(handler) {
  const db = await openDb()
  if (!db || !handler) return 0
  const events = await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const req = tx.objectStore(QUEUE_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  }).catch(() => [])

  let processed = 0
  for (const ev of events) {
    try {
      await handler(ev)
      await deleteQueueItem(ev.id)
      processed++
    } catch {
      break
    }
  }
  return processed
}

async function deleteQueueItem(id) {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Resolución de conflictos timestamp-first al fusionar remoto vs local.
 * @returns {'local'|'remote'|'merge'}
 */
export function resolveByTimestamp(localMeta, remoteMeta) {
  const lt = localMeta?.updatedAt ? Date.parse(localMeta.updatedAt) : 0
  const rt = remoteMeta?.updatedAt ? Date.parse(remoteMeta.updatedAt) : 0
  if (!rt) return 'local'
  if (!lt) return 'remote'
  if (rt > lt) return 'remote'
  if (lt > rt) return 'local'
  return 'merge'
}

/** Guarda resultado de protocolo clínico con cola offline */
export function saveClinicalResult(exerciseId, metrics) {
  const key = 'brainProtocolHistory'
  const hist = repoGet(key, {})
  if (!hist[exerciseId]) hist[exerciseId] = []
  const entry = { date: new Date().toISOString().slice(0, 10), metrics, ts: Date.now() }
  hist[exerciseId].unshift(entry)
  hist[exerciseId] = hist[exerciseId].slice(0, 10)
  repoSet(key, hist, { queue: true, type: 'clinical_metrics' })
  return entry
}
