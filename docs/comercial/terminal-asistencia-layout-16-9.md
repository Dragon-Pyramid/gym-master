# Ajuste Terminal asistencia 16:9

Se ajusta la pantalla de Terminal de asistencia para trabajar como una vista tipo monitor Full HD 16:9, evitando scroll vertical en modo pantalla completa y comprimiendo cards, header, panel QR, panel de avisos y actividad reciente.

## Cambios

- `main` y contenedor principal pasan a `h-screen` / `max-h-screen` con `overflow-hidden`.
- Header más compacto para liberar alto útil.
- Layout principal 50/50 en desktop con altura controlada.
- Card QR y card actividad/avisos quedan dentro del alto disponible.
- QR se reduce levemente para no provocar scroll.
- Avisos Terminal respetan aspecto 5:4 con alto máximo relativo al viewport.
- Cards de asistencia reciente más compactas.
- Avatar de socio se mantiene visible; fallback logo Gym Master.

## QA sugerido

- Abrir `/dashboard/asistencias/terminal`.
- Activar pantalla completa con F11.
- Confirmar que no aparece scroll vertical de página.
- Confirmar que QR queda visible.
- Confirmar que el aviso aparece en panel derecho sin desbordar.
- Registrar asistencia y validar avatar/fallback.
