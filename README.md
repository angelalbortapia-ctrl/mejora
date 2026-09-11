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

**Automático** (recomendado):

```bash
# Token en: supabase.com/dashboard/account/tokens
python3 scripts/setup-supabase.py
```

Crea el proyecto `mejora`, aplica `supabase/schema.sql` y escribe `js/supabase-config.local.js`.

**Manual:**

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta `supabase/schema.sql` en SQL Editor
3. `cp js/supabase-config.example.js js/supabase-config.local.js` y pega URL + anon key
4. En la app: **Ajustes → Cuenta** → crear cuenta o iniciar sesión

Para GitHub Pages, añade los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el repo.

## Tests

```bash
python3 -m http.server 5173
# Abre http://localhost:5173/tests/run.html
```
