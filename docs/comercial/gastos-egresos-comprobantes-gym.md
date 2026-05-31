# Gastos / egresos con comprobantes

## Objetivo

Evolucionar el módulo legacy `Otros gastos` hacia un módulo operativo de gastos y egresos para Gym Master.

## Alcance

- Clasificación por `tipo_gasto` parametrizable.
- Estado del gasto: pendiente, pagado, vencido o anulado.
- Medio de pago.
- Proveedor / entidad.
- Número de comprobante.
- Carga de comprobante PDF o imagen vía Cloudinary.
- URL de comprobante externa.
- Fecha de gasto, vencimiento y pago.
- Período cubierto desde / hasta.
- Observaciones internas.
- Anulación lógica.
- Exportación Excel.
- PDF membretado Gym Master.

## Flujo técnico

1. Validar migración local contra DB QA restaurada desde dump.
2. Ejecutar `database/scripts/validar_gastos_egresos_comprobantes_gym.sql` local.
3. Backup remoto previo.
4. Aplicar `npx supabase db push`.
5. Refrescar schema cache remoto.
6. Validar en Supabase Studio con el script de validación.
7. Probar `/dashboard/otros-gastos`.

## Archivos principales

- `src/app/dashboard/otros-gastos/page.tsx`
- `src/app/api/otros_gastos/route.ts`
- `src/app/api/otros_gastos/comprobante-upload/route.ts`
- `src/components/forms/OtrosGastosForm.tsx`
- `src/components/modal/OtrosGastosModal.tsx`
- `src/components/modal/OtrosGastosViewModal.tsx`
- `src/components/tables/OtrosGastosTable.tsx`
- `src/services/otrosGastosService.ts`
- `src/interfaces/otros_gastos.interface.ts`
