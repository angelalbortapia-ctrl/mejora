/** Versión única de assets — bump aquí y ejecuta: npm run sync-version */
export const ASSET_VERSION = 147

/** Sufijo para URLs estáticas () */
export const ASSET_QUERY = `?v=${ASSET_VERSION}`

/** Añade ?v= a rutas de módulo/CSS (import dinámico) */
export function withVersion(path) {
  if (!path) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('v', String(ASSET_VERSION))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
