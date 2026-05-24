# Fix asistencia admin - alertas de morosidad

## Objetivo

Corregir el comportamiento detectado en deploy donde una socia/socio sin pagos mostraba alerta roja correctamente en el celular, pero en el dashboard administrativo aparecía como bienvenida normal.

## Comportamiento esperado

### Socio al día

- Celular: bienvenida.
- Admin: bienvenida.
- Se registra asistencia.

### Socio sin pagos o moroso

- Celular: alerta roja.
- Admin: alerta roja de regularización.
- No debe mostrarse como bienvenida normal en pantalla admin.
- La asistencia puede quedar registrada como intento/ingreso con alerta de deuda según regla actual de esta etapa.

### Socio desactivado

- Celular: alerta de bloqueo.
- Admin: alerta de regularización si recibe el evento de acceso.
- No debe comportarse como acceso normal.

## Cambios técnicos

- `/api/asistencias/recientes` enriquece las últimas asistencias con estado de cuota usando `obtener_estado_cuota_socio`.
- `AsistenciasRecientesTable` conserva `access_status`, `alert_type`, `mensaje_acceso` y `estado_cuota`.
- El dashboard admin decide si muestra bienvenida o alerta roja según `alert_type`.
- El celular emite un evento realtime/broadcast para avisar al dashboard admin cuando el resultado del escaneo es deuda o desactivación.
- `BienvenidaSocio` se reutiliza con `variant="debt"` o `variant="inactive"` para mostrar alerta visual diferenciada.
- Swagger/OpenAPI queda actualizado con la descripción funcional del endpoint.

## Validación requerida en deploy

1. Admin abre QR del día.
2. Socio al día escanea:
   - admin muestra bienvenida.
   - celular muestra bienvenida.
3. Socio sin pagos escanea:
   - celular muestra alerta roja.
   - admin muestra alerta roja, no bienvenida.
4. Socio vencido escanea:
   - celular muestra alerta roja.
   - admin muestra alerta roja, no bienvenida.
5. Socio desactivado escanea:
   - celular muestra bloqueo.
   - admin muestra alerta si recibe evento realtime.
