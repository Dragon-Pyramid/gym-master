# Pagos manuales desde administrador

## Objetivo

Implementar el registro operativo de pagos manuales desde el panel de administración de Gym Master, especialmente para pagos en efectivo en recepción.

Esta mejora utiliza la base preparada en las ramas anteriores:

- columnas extendidas en `pago`, como `periodo_desde`, `periodo_hasta`, `meses_cubiertos`, `metodo_pago`, `estado` y `activo`;
- funciones `obtener_estado_cuota_socio()` y `obtener_socios_estado_cuota()`;
- seeds QA de cuotas/pagos para validar estados `al_dia`, `vencido` y `sin_pagos`.

## Alcance funcional

- Registrar un pago manual desde `/dashboard/pagos`.
- Seleccionar socio activo.
- Seleccionar cuota activa o usar la cuota vigente/última activa.
- Definir fecha de pago.
- Definir cantidad de meses cubiertos.
- Calcular automáticamente el período cubierto.
- Registrar método de pago `efectivo`, `transferencia` u `otro`.
- Guardar observaciones administrativas.
- Registrar automáticamente el usuario administrador que cargó el pago.
- Refrescar el listado después de crear/editar/eliminar.
- Eliminar pagos mediante baja lógica (`activo = false`, `estado = cancelado`).

## Decisiones técnicas

La lógica sensible se mueve al backend mediante `src/services/server/pagoServerService.ts` y la ruta `/api/pagos`.

El frontend ya no llama directamente a Supabase para crear pagos. La pantalla usa `src/services/browser/pagoApiClient.ts`, enviando el token JWT para que el backend resuelva permisos y usuario registrante.

## Reglas aplicadas

- Solo roles `admin` y `usuario` pueden administrar pagos.
- El socio debe estar activo.
- El pago se crea con `estado = pagado`.
- El método por defecto es `efectivo`.
- El período cubierto se calcula a partir de `periodo_desde` y `meses_cubiertos`.
- `fecha_vencimiento` queda alineada con `periodo_hasta`.
- No se actualiza manualmente `pago.total`, porque en remoto puede ser una columna generada.

## Validación sugerida

1. Login como administrador.
2. Entrar a `/dashboard/pagos`.
3. Crear un pago manual para `QA Socia Sin Pagos`.
4. Confirmar que el pago aparece en el listado.
5. Confirmar que el socio pasa a estado `al_dia` en el dashboard de cuotas.
6. Ejecutar `database/scripts/validar_pagos_manuales_admin.sql`.

## Próximos pasos relacionados

- Integrar pago Stripe real y webhook.
- Mejorar dashboard BI de cuotas/pagos.
- Implementar regla de inactividad por cuota vencida.
