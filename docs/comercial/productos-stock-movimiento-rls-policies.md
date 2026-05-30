# Productos / Stock - Fix RLS para movimientos de stock

## Rama

`feature/productos-stock-devoluciones-ajustes`

## Problema detectado

Durante la prueba funcional de movimientos manuales de stock, la UI mostró el error:

```txt
new row violates row-level security policy for table "producto_stock_movimiento"
```

El endpoint actualiza correctamente el stock del producto, pero al intentar insertar la trazabilidad en `producto_stock_movimiento`, Supabase bloquea la operación por RLS.

## Corrección

Se agrega la migración privada/temporal:

```txt
supabase/migrations/202605301930_productos_stock_movimiento_rls_policies.sql
```

La migración:

- habilita RLS sobre `public.producto_stock_movimiento` si no estaba habilitado;
- recrea la policy `dev_all_producto_stock_movimiento`;
- otorga permisos operativos a `anon` y `authenticated` para que el endpoint pueda registrar movimientos;
- mantiene trazabilidad de ventas, reversiones, ajustes, devoluciones, mermas y compras.

## Validación

Script:

```txt
database/scripts/validar_productos_stock_movimiento_rls_policies.sql
```

Resultado esperado:

```txt
NOTICE: productos_stock_movimiento_rls_policies OK - policy, grants e insert QA validados
ROLLBACK
```

## Nota de seguridad

Esta policy sigue el patrón actual del proyecto durante la etapa de desarrollo/QA. En una futura fase de hardening se recomienda reemplazar policies amplias por reglas específicas por rol/permiso y/o ejecutar operaciones críticas desde endpoints server-side con service role controlado.
