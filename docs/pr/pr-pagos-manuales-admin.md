# PR: feat: add manual membership payments from admin dashboard

## Resumen

Este PR implementa el registro de pagos manuales desde el panel administrativo de Gym Master. La mejora permite registrar pagos en efectivo, transferencia u otro método manual, asociarlos a un socio, calcular el período cubierto y reflejar el resultado en el estado de cuota.

## Cambios principales

- Se agrega servicio backend `pagoServerService` para centralizar la lógica de pagos.
- Se refactoriza `/api/pagos` para operar con autenticación y service role server-side.
- Se agrega cliente browser `pagoApiClient` para consumir la API desde el frontend.
- Se actualiza el formulario de pagos para seleccionar socio, cuota, meses cubiertos, período, método y observaciones.
- Se actualiza la tabla de pagos para mostrar cobertura, método, estado y monto.
- Se actualiza `/dashboard/pagos` para crear, editar, eliminar y exportar pagos con la nueva estructura.
- Se agrega script SQL de validación operativa.
- Se documenta el flujo de pagos manuales.

## Validaciones sugeridas

- `npm run build`
- Login como administrador.
- Crear pago manual para un socio QA sin pagos.
- Confirmar que aparece en el listado.
- Confirmar que `obtener_socios_estado_cuota()` refleja el nuevo estado.
- Ejecutar `database/scripts/validar_pagos_manuales_admin.sql`.

## Notas técnicas

- No se agregan migraciones de base de datos en esta feature.
- Esta feature depende de las migraciones previas de foundation y demo seeds de cuotas/pagos.
- No se actualiza `pago.total` desde código, para respetar la columna generada en Supabase remoto.
