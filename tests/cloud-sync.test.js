import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectSyncConflict } from '../js/cloud-sync.js'

describe('detectSyncConflict', () => {
  it('no conflicto si la nube no tiene datos', () => {
    const meta = { lastSyncedAt: '2026-01-01T00:00:00Z', lastRemoteAt: null, localModifiedAt: '2026-01-02T00:00:00Z' }
    assert.equal(detectSyncConflict(meta, {
      remoteAt: '2026-01-03T00:00:00Z',
      remoteHasData: false,
      localHasProgress: true,
    }), false)
  })

  it('no conflicto si no hay progreso local', () => {
    const meta = { lastSyncedAt: null, lastRemoteAt: null, localModifiedAt: null }
    assert.equal(detectSyncConflict(meta, {
      remoteAt: '2026-01-03T00:00:00Z',
      remoteHasData: true,
      localHasProgress: false,
    }), false)
  })

  it('detecta conflicto cuando remoto es nuevo y local cambió desde sync', () => {
    const meta = {
      lastSyncedAt: '2026-01-01T10:00:00Z',
      lastRemoteAt: '2026-01-01T10:00:00Z',
      localModifiedAt: '2026-01-02T12:00:00Z',
    }
    assert.equal(detectSyncConflict(meta, {
      remoteAt: '2026-01-03T08:00:00Z',
      remoteHasData: true,
      localHasProgress: true,
    }), true)
  })

  it('no conflicto si local no cambió desde última sync', () => {
    const meta = {
      lastSyncedAt: '2026-01-02T12:00:00Z',
      lastRemoteAt: '2026-01-01T10:00:00Z',
      localModifiedAt: '2026-01-01T11:00:00Z',
    }
    assert.equal(detectSyncConflict(meta, {
      remoteAt: '2026-01-03T08:00:00Z',
      remoteHasData: true,
      localHasProgress: true,
    }), false)
  })
})
