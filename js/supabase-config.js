/** Credenciales públicas de Supabase (anon key). RLS protege los datos. */
export let SUPABASE_URL = ''
export let SUPABASE_ANON_KEY = ''

let configReady = null

export function ensureSupabaseConfig() {
  if (!configReady) {
    configReady = import('./supabase-config.local.js')
      .then((local) => {
        if (local.SUPABASE_URL) SUPABASE_URL = local.SUPABASE_URL
        if (local.SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY
      })
      .catch(() => {})
  }
  return configReady
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
