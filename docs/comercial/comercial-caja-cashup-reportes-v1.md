# Gym Master - Comercial Caja Cashup Reportes v1

## Rama

`feature/comercial-caja-cashup-reportes-v1`

## Objetivo

Completar el circuito comercial básico posterior al POS/Kiosco: apertura de caja, ventas asociadas al turno, ingresos, retiros, cierre esperado vs contado, diferencia e impresión de reporte X/Z básico.

## Alcance funcional

- Nueva pantalla `Comercial y Stock -> Caja / Cashup`.
- Nueva ruta `/dashboard/comercial/caja`.
- Apertura de caja con monto inicial.
- Una caja abierta activa por vez.
- Registro de ingresos manuales.
- Registro de retiros manuales.
- Asociación automática de ventas POS/Kiosco a la caja abierta.
- Cálculo de total de ventas del turno.
- Cálculo de ingresos y retiros.
- Cálculo de total esperado.
- Cierre de caja con monto contado.
- Cálculo de diferencia.
- Historial de cierres.
- Reporte X/Z imprimible básico.

## API

Nuevo endpoint:

- `GET /api/comercial/caja`
- `POST /api/comercial/caja`

Acciones soportadas por POST:

- `abrir`
- `movimiento`
- `cerrar`

## Base de datos

Migración privada:

`202606192200_comercial_caja_cashup_reportes_v1.sql`

Agrega:

- `comercial_caja_sesion`
- `comercial_caja_movimiento`
- columna `venta.caja_sesion_id`

## Seguridad

Las nuevas tablas tienen RLS habilitado y forzado. Las operaciones se realizan server-side usando `SUPABASE_SERVICE_ROLE_KEY`.

## Integración con POS/Kiosco

El servicio server de POS/Kiosco fue extendido para buscar la caja abierta y asociar automáticamente la venta creada mediante `venta.caja_sesion_id`.

Si no hay caja abierta, la venta puede quedar sin caja asignada y la pantalla de cashup la muestra como venta del día sin caja para revisión operativa.

## Limitaciones v1

- No incluye cierre ciego.
- No incluye caja multi-terminal.
- No incluye reasignación manual de ventas sin caja.
- No incluye arqueo discriminado por método de pago.
- No incluye aprobación de diferencias.
- No incluye PDF fiscal/profesional avanzado.

## Próximas fases

- Compras y reposición.
- Servicios, packs y promociones.
- Scanner mobile realtime.
- BI comercial con IA.
- Respaldo Excel del negocio completo sin propiedad intelectual de Gym Master.
