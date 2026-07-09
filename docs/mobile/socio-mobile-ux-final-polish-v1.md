# Socio mobile UX final polish v1

## Objetivo

Pulir la experiencia mobile del panel Socio después de los ajustes de layout, Help Center, i18n y Evolución Física.

## Ajustes incluidos

### Dashboard Socio mobile

- Se marca el feed mobile con `gm-socio-mobile-feed`.
- Se marca cada sección mobile con `gm-socio-mobile-section`.
- Se agrega `scroll-padding-bottom` específico para mejorar navegación con bottom nav.
- Los accesos rápidos mobile mejoran hover/touch feedback.
- Se agrega `aria-label` a los botones de acceso rápido.

### Accesos rápidos

- Se agrega acceso rápido al nuevo Centro de Ayuda:
  - ES: `Ayuda` / `Manual del socio`
  - EN: `Help` / `Member manual`
- Se mejora contraste dark mode de todos los accesos rápidos:
  - cuota;
  - QR/asistencia;
  - Coach IA;
  - rutina;
  - dieta;
  - evolución;
  - ficha médica;
  - mensajes;
  - ayuda.

### Bottom navigation del socio

- Mejor contraste en light/dark mode.
- Fondo translúcido con `backdrop-blur` cuando el navegador lo soporta.
- Mayor área táctil mínima.
- Mejor foco visible por teclado/accesibilidad.
- `aria-label` por item.
- Ajuste de safe-area inferior.

## Alcance

- Solo frontend/UX/mobile/accesibilidad.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica lógica funcional de cuotas, pagos, rutinas, dietas, mensajes ni ficha médica.
