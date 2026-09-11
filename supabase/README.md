# Supabase — Mejora

## Setup rápido

1. [Crear proyecto](https://supabase.com/dashboard) → New project
2. **SQL Editor** → pegar y ejecutar `schema.sql`
3. **Authentication → Providers → Email** → Enable
4. **Project Settings → API** → copiar URL y `anon` public key
5. Local: `cp ../js/supabase-config.example.js ../js/supabase-config.local.js` y pegar credenciales

## Tablas

| Tabla | Uso |
|-------|-----|
| `user_data` | Snapshot JSON de todo el progreso (`mejora_*`) |
| `profiles` | Nombre display (auto al registrarse) |

RLS activo: cada usuario solo ve sus filas.

## Producción (GitHub Pages)

En el repo de GitHub → **Settings → Secrets → Actions**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

El deploy las inyecta en `js/supabase-config.js`.
