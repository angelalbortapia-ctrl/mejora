/** Credenciales públicas de Supabase (anon key). RLS protege los datos. */
export let SUPABASE_URL = ''
export let SUPABASE_ANON_KEY = ''

try {
  const local = await import('./supabase-config.local.js')
  if (local.SUPABASE_URL) SUPABASE_URL = local.SUPABASE_URL
  if (local.SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY
} catch {
  // Sin archivo local — usa valores vacíos o inyectados en deploy
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
