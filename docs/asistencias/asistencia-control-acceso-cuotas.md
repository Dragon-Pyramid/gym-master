# Asistencia - Control de acceso con cuotas

## Objetivo

Agregar validación de estado de cuota y estado activo del socio durante el registro de asistencia por QR, preservando el flujo que ya funcionaba.

## Flujo existente verificado

En el repo actual existe el flujo de QR del día desde el dashboard administrativo:

- `src/app/dashboard/page.tsx`
- `src/components/ui/qr-display.tsx`
- `src/components/ui/asistencias-recientes-table.tsx`
- `src/components/ui/BienvenidaSocio.tsx`

El panel admin muestra el QR, las asistencias recientes a la derecha y un splash de bienvenida con foto/nombre cuando ingresa una nueva asistencia. La actualización se hace con Supabase Realtime y fallback polling cada 5 segundos.

## Cambios implementados

### Caso normal

Si el socio está activo y al día:

- se registra la asistencia;
- se mantiene el cartel/splash normal;
- se muestra foto y mensaje de bienvenida.

### Socio activo con deuda

Si el socio está activo pero su estado de cuota es:

- `vencido`;
- `sin_pagos`;

entonces:

- se registra la asistencia;
- se muestra alerta roja;
- se informa que debe regularizar la cuota en administración.

### Socio desactivado

Si el socio está inactivo/desactivado:

- no se registra la asistencia;
- se muestra alerta amarillo/naranja;
- se informa que debe regularizar la situación en administración.

## Cámara / QR

Se agrega ayuda visual para el caso de cuadro gris de cámara:

- revisar permisos del navegador;
- usar HTTPS o localhost;
- verificar que ninguna otra app esté usando la cámara.

También se agrega protección contra lecturas duplicadas del mismo QR durante pocos segundos.

## Archivos modificados

- `src/services/asistenciaService.ts`
- `src/app/api/asistencias/registro-qr/route.ts`
- `src/services/qrService.ts`
- `src/components/ui/RegistrarAsistenciaQR.tsx`
- `src/components/ui/BienvenidaSocio.tsx`
- `src/lib/swagger/openApiSpec.ts`

## Swagger

Se actualiza la descripción de:

- `GET /api/asistencias/qr-dia`
- `GET /api/asistencias/recientes`
- `GET /api/asistencias/registro-qr`
- `POST /api/asistencias/registro-qr`

## Validación funcional

1. Login admin.
2. Abrir dashboard.
3. Presionar **QR del Día**.
4. Login socio desde celular.
5. Ir al lector QR.
6. Escanear el QR del monitor.
7. Validar casos:
   - socio al día: bienvenida normal;
   - socio con deuda: alerta roja;
   - socio desactivado: alerta amarillo/naranja y no registra asistencia.
8. Verificar que la tabla de asistencias recientes se actualice en el panel admin.
