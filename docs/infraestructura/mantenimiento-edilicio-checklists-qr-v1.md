# Gym Master - Infraestructura / Mantenimiento Edilicio Checklists + QR v1

## Rama

`feature/infraestructura-mantenimiento-edilicio-checklists-qr`

## Objetivo

Madurar el módulo de Mantenimiento Edilicio incorporando checklists preventivos, registro de ejecuciones, códigos QR/barra internos y un lector reutilizable con cámara.

## Alcance

- Nuevas tablas privadas para QR/códigos y checklists edilicios.
- Checklists base para matafuegos, luminarias, baños/sanitarios y recorrido general.
- Ejecución rápida de checklist asociada a activo, sector u orden edilicia.
- Generación de código QR/barra para activo edilicio o sector.
- Nueva pantalla `/dashboard/infraestructura/lector-qr-barra`.
- Nuevo ítem de menú `Infraestructura > Lector QR/barra`.
- Base de target types reutilizable: activo edilicio, sector, orden, equipamiento, producto y servicio.
- Swagger actualizado.

## Nota de producto

La sincronización celular → PC para productos/kiosco queda preparada conceptualmente sobre esta base, pero se implementará en la futura línea Comercial/Kiosco para no mezclar flujos de stock/ventas con infraestructura.

## Sin archivos privados en repo

La migración y validación SQL se manejan por el flujo privado de Supabase QA/local/remoto y no deben commitearse al repo público.
