# Analytics de producto (local)

Mejora registra eventos de uso **solo en el dispositivo** (`localStorage`, clave `productEvents`). No hay Google Analytics ni telemetría a terceros.

## Eventos

| Evento | Cuándo |
|--------|--------|
| `app_open` | Cada carga de la app |
| `habit_complete` | Hábito marcado completo |
| `meditation_complete` | Sesión de Calma terminada |
| `brain_session` | Sesión diaria de gimnasia |
| `school_lesson` | Lección de escuela completada |
| `level_up` | Subida de nivel |
| `unlock` | Desbloqueo de tema/extra |
| `plan_complete` | Plan del día al 100% |
| `share` | Compartir logro (nativo o portapapeles) |

## API

```js
import { trackProductEvent, EVENTS, getProductAnalyticsSummary } from '/js/product-analytics.js'

trackProductEvent(EVENTS.HABIT_COMPLETE, { habitId: 'water' })
const summary = getProductAnalyticsSummary()
```

## UI

- **Ajustes → General → Actividad en la app**
- **Mi viaje → Resumen** (panel + compartir)

## Privacidad

Los eventos se incluyen en export JSON local si existen bajo el prefijo `mejora_`. No se suben a Supabase salvo que estén dentro del snapshot general del usuario.
