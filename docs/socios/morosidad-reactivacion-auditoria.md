# Morosidad, reactivación y auditoría

**Rama:** `feature/morosidad-reactivacion-auditoria`  
**Fecha:** 2026-05-26

## Objetivo

Cerrar el ciclo operativo de socios con cuotas vencidas o sin pagos, evitando inconsistencias entre login, asistencia QR, pagos manuales, Stripe y dashboard administrativo.

## Alcance

- Auditoría de cambios de estado de socio por morosidad o regularización.
- Desactivación centralizada por:
  - socio sin pagos activos;
  - socio vencido por más de 7 días.
- Reactivación automática cuando un pago deja al socio `al_dia`.
- Compatibilidad con pagos manuales, edición de pagos, cancelación lógica de pagos y Stripe webhook.
- Control de asistencia QR alineado con la misma regla de morosidad.
- Opciones de pago manual permiten seleccionar socios inactivos para regularizarlos.

## Base de datos

Nueva tabla:

```txt
public.socio_estado_auditoria
```

Funciones nuevas:

```txt
public.registrar_auditoria_estado_socio(...)
public.desactivar_socio_por_morosidad(...)
public.reactivar_socio_por_pago(...)
public.sincronizar_morosidad_socios(...)
```

## Reglas de negocio

```txt
sin_pagos → desactivar/bloquear
vencido con dias_vencido > 7 → desactivar/bloquear
pago activo/pagado que cubre fecha actual → reactivar si estaba inactivo
pago cancelado → revalidar si corresponde desactivar nuevamente
```

## Flujos afectados

### Login socio

Al iniciar sesión, se consulta `obtener_estado_cuota_socio`. Si el socio no tiene pagos o está vencido fuera de tolerancia, se invoca `desactivar_socio_por_morosidad` y se devuelve mensaje de regularización.

### Asistencia QR

Antes de registrar asistencia, se evalúa la misma regla. Si corresponde desactivar, no se registra asistencia y se devuelve alerta de bloqueo.

### Pagos manuales

El alta de pago manual invoca `reactivar_socio_por_pago`. Si el pago regulariza el período, el socio se reactiva automáticamente.

### Stripe

El webhook usa el mismo flujo de creación de pago y sincroniza la reactivación por pago.

### Cancelación de pago

Al cancelar un pago, se vuelve a evaluar morosidad. Si el socio queda sin pagos o vencido fuera de tolerancia, se desactiva y se audita.

## Validación local

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_morosidad_reactivacion_auditoria.sql
```

## Notas

Esta feature no implementa aún un scheduler automático productivo. Deja preparada la función `sincronizar_morosidad_socios('scheduler')` para una futura tarea programada.
