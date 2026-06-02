# Fix — Notificaciones en Terminal de asistencia

## Objetivo

Conectar las notificaciones configuradas para Terminal con la pantalla `/dashboard/asistencias/terminal`, sin ocultar nunca el QR de asistencia.

## Cambios

- Agrega `fecha_vigencia_hasta` para cortar promociones vencidas.
- Agrega campo en formulario: `Fecha/hora visible hasta`.
- Agrega endpoint `GET /api/notificaciones/terminal`.
- La Terminal consulta avisos activos y vigentes.
- El aviso aparece en el panel derecho, donde normalmente se ven las asistencias recientes.
- Si ingresa un socio, el aviso se oculta automáticamente y vuelven las asistencias.
- Soporta frecuencia de aparición, duración, imagen/banner, fallback al logo y color neón.

## Regla de visibilidad Terminal

Una notificación aparece si cumple:

- `activo = true`
- `mostrar_terminal = true`
- `terminal_visible = true`
- `estado NOT IN ('cancelada', 'error')`
- `fecha_programada IS NULL OR fecha_programada <= now()`
- `fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= now()`

## Prueba recomendada

Para ver un aviso cada 15 segundos:

- Canal: Terminal
- Estado: Programada / activa
- Mostrar en Terminal: Sí
- Visible/habilitada: Sí
- Visible desde: ahora o una hora anterior
- Visible hasta: mañana o una fecha futura
- Frecuencia de aparición: 15
- Duración en pantalla: 6 a 8
- Imagen: opcional
