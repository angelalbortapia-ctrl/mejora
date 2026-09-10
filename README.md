# Mejora

PWA de mejora continua en español: plan del día, hábitos, gimnasia cerebral, meditación y gamificación.

## Demo en vivo

**[https://angelalbortapia-ctrl.github.io/mejora/](https://angelalbortapia-ctrl.github.io/mejora/)**

## Desarrollo local

```bash
python3 -m http.server 5190
```

Abre [http://localhost:5190](http://localhost:5190) y haz hard refresh (`Cmd+Shift+R`) si no ves cambios.

## Ciclo PDCA

1. **Plan** — 4 misiones diarias + bonus XP
2. **Hacer** — Rutina, gimnasia, hábitos, meditación
3. **Verificar** — Gráficas, Mi viaje, consistencia
4. **Actuar** — Diario, revisiones semanal/mensual

## Stack

- HTML / CSS / JavaScript (ES modules)
- `localStorage` · Service Worker (PWA)
- APIs: Open-Meteo, Wikipedia ES, Open Library, Sunrise-Sunset
- Contenido curado en español (citas, consejos, trivia local)

## Tests

```bash
python3 -m http.server 5190
# Abre http://localhost:5190/tests/run.html
```
