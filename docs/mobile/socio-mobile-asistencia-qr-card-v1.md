# Socio Mobile Asistencia QR Card v1

## Objetivo

Agregar al dashboard mobile del socio una tarjeta clara de asistencia y QR de ingreso, orientada al uso diario desde Android/PWA instalada.

## Alcance

- Frontend only.
- Sin cambios de base de datos.
- Sin cambios backend.
- Reutiliza el estado de cuota ya cargado en el dashboard.
- Reutiliza el modal existente de QR (`QrDisplayModal`).
- Reutiliza la ruta existente de control de asistencia (`/dashboard/control-asistencia`).

## Cambios principales

- Nuevo componente `SocioMobileAsistenciaQrCard`.
- Inserción de la tarjeta en el home mobile del socio.
- Visualización del estado de cuota y estado de acceso.
- Acción para mostrar QR de acceso.
- Acción para ir al control de asistencia / scanner.
- Accesos a historial de pagos y pago de cuota.
- Mensajes claros si la cuota está al día o si requiere revisión.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/components/dashboard/socio/SocioMobileAsistenciaQrCard.tsx`
- `docs/mobile/socio-mobile-asistencia-qr-card-v1.md`

## QA sugerido

1. Iniciar sesión como socio desde Android/PWA.
2. Abrir `/dashboard`.
3. Confirmar que aparece la tarjeta “QR de ingreso”.
4. Tocar “Mostrar QR” y validar apertura del modal.
5. Tocar “Escanear QR” y validar navegación a `/dashboard/control-asistencia`.
6. Validar textos con cuota al día y con cuota pendiente.
7. Confirmar que admin y usuario interno no ven esta tarjeta mobile.
