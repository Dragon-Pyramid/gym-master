# Admin commercial dashboard final polish v1

## Rama

`feature/admin-commercial-dashboard-final-polish-v1`

## Alcance

Pulido final del dashboard comercial administrativo en `/dashboard/comercial`, orientado a lectura ejecutiva, operación rápida y soporte mobile/desktop.

## Cambios principales

- Se consolidó un header ejecutivo para la operación comercial de Gym Master.
- Se reorganizaron métricas clave: total vendido, ticket promedio, inventario estimado y stock crítico.
- Se agregó radar comercial operativo con estado de salud: operativo, atención o crítico.
- Se agregaron acciones rápidas para POS/Kiosco, caja, packs/promos y reposición.
- Se ampliaron accesos a productos, stock ledger, ventas, proveedores, gastos, servicios, packs, BI y finanzas.
- Se mejoró la lectura de productos críticos con estado vacío cuando no hay alertas.
- Se preservaron rutas existentes y comportamiento funcional previo.
- Se aplicó shell vertical Header / Contenido / Footer para evitar espacio blanco después del footer al salir de F12 mobile.

## Validación requerida

- Entrar como admin a `/dashboard/comercial`.
- Confirmar métricas y radar comercial.
- Probar accesos rápidos.
- Revisar productos críticos y estado vacío.
- Probar F12 mobile y desktop.
- Confirmar que no hay scroll horizontal ni espacio blanco después del footer.
- Ejecutar `npm run build`.

## DB / Swagger

No requiere migración DB.
No modifica endpoints.
No requiere actualización Swagger.
