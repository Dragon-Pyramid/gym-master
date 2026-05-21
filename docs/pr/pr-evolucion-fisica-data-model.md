# feature: evolucion fisica data model

## Resumen

Esta feature amplía el modelo de datos de evolución física de Gym Master sobre la tabla existente `public.evolucion_socio`.

## Cambios principales

- Se mantiene la tabla existente `evolucion_socio`.
- Se agregan métricas corporales avanzadas.
- Se agregan campos de clasificación: tipo corporal y sexo de referencia.
- Se agregan campos para fotos de progreso.
- Se agrega marca de registro inicial.
- Se agrega `actualizado_en` con trigger automático.
- Se agregan constraints defensivos.
- Se agregan índices para consultas por socio y fecha.
- Se agrega script de validación transaccional.

## Validación requerida

1. Aplicar migración en Supabase local.
2. Ejecutar `database/scripts/validar_evolucion_fisica_data_model.sql`.
3. Confirmar que la prueba transaccional inserta registros inicial/actual y luego hace rollback.
4. Aplicar remoto con Supabase CLI solo si local pasa.
5. Validar estructura en Supabase remoto.

## Notas

Esta feature no implementa todavía UI, silueta dinámica ni PDF. Solo deja el modelo de datos listo para esas etapas.
