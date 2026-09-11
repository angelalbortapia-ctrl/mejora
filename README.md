# Mejora

PWA de mejora continua en español: plan del día, hábitos, gimnasia cerebral, meditación y gamificación.

## Demo en vivo

**[https://angelalbortapia-ctrl.github.io/mejora/](https://angelalbortapia-ctrl.github.io/mejora/)**

## Desarrollo local

```bash
python3 -m http.server 5173
```

Abre [http://localhost:5173](http://localhost:5173) y haz hard refresh (`Cmd+Shift+R`) si no ves cambios.

También puedes hacer doble clic en **Mejora.app** (Escritorio) o `start-server.command`.

## Ciclo PDCA

1. **Plan** — 4 misiones diarias + bonus XP
2. **Hacer** — Rutina, gimnasia, hábitos, meditación
3. **Verificar** — Gráficas, Mi viaje, consistencia
4. **Actuar** — Diario, revisiones semanal/mensual

## Stack

- HTML / CSS / JavaScript (ES modules)
- `localStorage` · Service Worker (PWA)
- **Supabase** (opcional) — auth + sync en la nube
- APIs: Open-Meteo, Wikipedia ES, Open Library, Sunrise-Sunset
- Contenido curado en español (citas, consejos, trivia local)

## Supabase (sync en la nube)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En **SQL Editor**, ejecuta el archivo `supabase/schema.sql`
3. En **Authentication → Providers**, activa Email (puedes desactivar confirmación por correo en desarrollo)
4. Copia credenciales de **Project Settings → API**:
   ```bash
   cp js/supabase-config.example.js js/supabase-config.local.js
   ```
   Pega `SUPABASE_URL` y `SUPABASE_ANON_KEY` en ese archivo local (no se sube a git).
5. En la app: **Ajustes → Cuenta** → crear cuenta o iniciar sesión

Para GitHub Pages, añade los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el repo; el workflow de deploy los inyecta automáticamente.

## Tests

```bash
python3 -m http.server 5173
# Abre http://localhost:5173/tests/run.html
```
