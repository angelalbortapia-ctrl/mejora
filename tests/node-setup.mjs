/** Polyfills y resolución /js/* para ejecutar tests en Node (CI) */
import { register } from 'node:module'

register('./test-import-hook.mjs', import.meta.url)

const store = new Map()

globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null },
  setItem(key, value) { store.set(String(key), String(value)) },
  removeItem(key) { store.delete(key) },
  clear() { store.clear() },
  key(i) { return [...store.keys()][i] ?? null },
  get length() { return store.size },
}

if (!globalThis.document) {
  const root = {
    lang: 'es',
    classList: {
      toggle() {},
      add() {},
      remove() {},
    },
  }
  globalThis.document = {
    documentElement: root,
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  }
}

if (!globalThis.window) {
  globalThis.window = globalThis
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, opts = {}) {
      this.type = type
      this.detail = opts.detail
    }
  }
  globalThis.dispatchEvent = () => true
}
