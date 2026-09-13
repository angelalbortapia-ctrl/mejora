# Contribuir a Mejora

Gracias por mejorar Mejora. Este proyecto es una PWA vanilla (HTML/CSS/JS) sin bundler.

## Requisitos

- Node.js 20+ (tests y lint)
- Python 3 (servidor local con proxy Fish)

## Flujo de trabajo

1. Clona el repo y crea una rama desde `main`.
2. Instala dependencias: `npm install`
3. Sirve localmente: `npm run serve` o `./start-server.command`
4. Antes de abrir PR:
   - `npm test`
   - `npm run typecheck`
   - `npm run lint`
5. Si cambias assets versionados: edita `js/version.js` y ejecuta `npm run sync-version`.

## Estilo de código

- ES modules, sin frameworks en runtime
- Minimiza el alcance del diff
- Reutiliza tokens CSS (`--m-*`) y helpers existentes
- Textos de UI nuevos → añade claves en `js/locales/es.js` y `js/locales/en.js`
- Eventos de producto → `trackProductEvent` en `js/product-analytics.js`

## i18n

La interfaz usa `t('clave')` desde `js/i18n.js`. El contenido educativo (lecciones, meditaciones) permanece en español hasta una migración explícita.

## Tests

- Unitarios/smoke: `tests/*.test.js` (Node test runner)
- Navegador legacy: `tests/run.html`

## Commits

Mensajes concisos en inglés o español, enfocados en el *por qué*.
