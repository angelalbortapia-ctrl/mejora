/** Polyfills para ejecutar tests en Node (CI) */
const store = new Map()

globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null },
  setItem(key, value) { store.set(String(key), String(value)) },
  removeItem(key) { store.delete(key) },
  clear() { store.clear() },
  key(i) { return [...store.keys()][i] ?? null },
  get length() { return store.size },
}
