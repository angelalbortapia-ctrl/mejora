# Mejora

PWA de mejora continua en español: plan del día, hábitos, gimnasia cerebral, meditación y gamificación.

## Demo en vivo

**[https://angelalbortapia-ctrl.github.io/mejora/](https://angelalbortapia-ctrl.github.io/mejora/)**

## Desarrollo local

**Recomendado** — doble clic en `start-server.command` o **Mejora.app** (incluye proxy Fish Audio para la voz de Calma).

```bash
cd ~/Downloads/Mejora
./start-server.command
# o: python3 scripts/mejora-dev-server.py 5173
# o: npm run serve
```

Abre [http://127.0.0.1:5173](http://127.0.0.1:5173) y haz hard refresh (`Cmd+Shift+R`) si no ves cambios.

No uses `python3 -m http.server` — la voz guiada de Calma no funcionará.

## Ciclo PDCA

1. **Plan** — 4 misiones diarias + bonus XP
2. **Hacer** — Rutina, gimnasia, hábitos, meditación
3. **Verificar** — Gráficas, Mi viaje, consistencia
4. **Actuar** — Metas, revisiones y ajustes de hábitos

## Stack

- HTML / CSS / JavaScript (ES modules)
- `localStorage` · Service Worker (PWA)
- **Supabase** (opcional) — auth + sync en la nube
- APIs: Open-Meteo, Wikipedia ES, Open Library, Sunrise-Sunset
- Contenido curado en español (citas, consejos, trivia local)
- **i18n** — UI en español/inglés (`js/i18n.js`)
- **Analytics local** — eventos de producto sin terceros (`docs/ANALYTICS.md`)

## Licencia

MIT — ver [LICENSE](LICENSE).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Docs extra: [docs/I18N.md](docs/I18N.md), [docs/ANALYTICS.md](docs/ANALYTICS.md).

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
npm install
npm test          # unitarios + smoke (CI)
npm run typecheck
npm run lint
```

Navegador (opcional):

```bash
python3 scripts/mejora-dev-server.py 5173
# Abre http://127.0.0.1:5173/tests/run.html
```

El deploy a GitHub Pages **solo corre si `npm test` y typecheck pasan**.

## Privacidad y datos

- Política: [`privacy.html`](privacy.html) (también en Ajustes → Cuenta / Datos)
- **Local:** Ajustes → Datos → *Empezar desde cero*
- **Nube:** Ajustes → Cuenta → *Borrar datos en la nube* (requiere sesión Supabase)

## Offline

Tras una visita con red, el service worker guarda el shell de la app (HTML, CSS, JS del import map) para uso sin conexión en hábitos y navegación básica.

**No offline:** voz Fish Audio (requiere `mejora-dev-server.py` o clave propia), APIs de clima/Wikipedia en tiempo real, sync Supabase.
