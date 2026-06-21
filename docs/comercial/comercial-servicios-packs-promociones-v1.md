# Gym Master - Comercial / Servicios, packs y promociones v1

## Rama

`feature/comercial-servicios-packs-promociones-v1`

## Objetivo

Extender el módulo Comercial para vender más que productos físicos: servicios, packs, combos, promociones, cupones, canales de venta y grupos de clientes.

## Alcance funcional

- Nueva pantalla: `Comercial y Stock > Servicios / Packs / Promos`.
- Ruta: `/dashboard/comercial/servicios-promociones`.
- Endpoint: `GET/POST /api/comercial/servicios-promociones`.
- Canales de venta: administración, kiosco, socio web futuro y app mobile futura.
- Grupos de cliente: general, socio activo, socio premium, no socio y empleado.
- Packs comerciales compuestos por productos y/o servicios.
- Promociones con descuento porcentual, descuento fijo, combo o beneficio.
- Cupones asociados a promociones.
- Vista unificada de ítems vendibles: productos, servicios y packs.

## Base de datos privada

Migración privada sugerida:

`202606201930_comercial_servicios_packs_promociones_v1.sql`

Nuevas entidades:

- `comercial_canal_venta`
- `comercial_grupo_cliente`
- `comercial_pack`
- `comercial_pack_item`
- `comercial_promocion`
- `comercial_cupon`
- `vw_comercial_items`

## Validación

Validación privada sugerida:

`validar_comercial_servicios_packs_promociones_v1.sql`

Debe validar:

- Existencia de tablas nuevas.
- Existencia de vista unificada.
- Seed de canal `kiosco`.
- Seed de grupo `socio_activo`.
- Consulta básica sobre `vw_comercial_items`.

## Consideraciones

Esta fase deja el motor comercial preparado para vender servicios y packs desde POS/Kiosco o desde canales futuros. La venta online, checkout avanzado y reglas complejas de promoción quedan para fases posteriores.

## Próximos pasos

- Scanner celular hacia PC.
- BI comercial e IA.
- Integración avanzada de promociones con POS y ventas online.
