# Catálogos parametrizables foundation

## Objetivo

Esta rama crea la base real de catálogos parametrizables para Gym Master.

La intención es dejar preparada la base de datos para futuras pantallas CRUD y para eliminar progresivamente valores hardcodeados o dependientes de seeds manuales.

## Alcance de la fase

Incluye migraciones SQL para crear catálogos base y columnas de integración opcionales.

No incluye todavía:

- formularios nuevos de CRUD;
- reemplazo de selects existentes;
- migración completa de `entrenadores` hacia `empleados`;
- módulo de sueldos;
- módulo de mantenimiento avanzado;
- módulo de notificaciones.

## Tablas nuevas

- `public.tipo_empleado`
- `public.medio_pago`
- `public.tipo_gasto`
- `public.tipo_ingreso`
- `public.categoria_producto`
- `public.tipo_equipamiento`
- `public.ubicacion_equipamiento`
- `public.tipo_mantenimiento`

## Columnas opcionales agregadas

Las columnas se agregan defensivamente y no eliminan campos legacy existentes.

- `public.entrenadores.id_tipo_empleado`
- `public.producto.id_categoria_producto`
- `public.equipamiento.id_tipo_equipamiento`
- `public.equipamiento.id_ubicacion_equipamiento`
- `public.mantenimiento.id_tipo_mantenimiento`
- `public.pago.id_medio_pago`
- `public.otros_gastos.id_tipo_gasto`

## Seed mínimo

### Tipo empleado

- Administrativo
- Entrenador
- Mantenimiento de equipamientos
- Limpieza
- Mayordomía / bar-snack

### Medio pago

- Efectivo
- Stripe
- Transferencia
- Tarjeta de débito
- Tarjeta de crédito
- Otro

### Tipo gasto

- Sueldos
- Mantenimiento
- Servicios
- Insumos
- Alquiler
- Impuestos
- Limpieza
- Marketing
- Otros

### Tipo ingreso

- Cuotas
- Ventas
- Servicios
- Clases especiales
- Promociones
- Otros

### Categoría producto

- Bebidas
- Snacks
- Suplementos
- Indumentaria
- Accesorios
- Higiene
- Otros

### Tipo equipamiento

- Cardio
- Fuerza
- Funcional
- Peso libre
- Accesorio
- Otro

### Ubicación equipamiento

- Zona A
- Zona B
- Zona C
- Zona D
- Sala de musculación
- Sala de cardio
- Depósito
- Bar / snack
- Recepción

### Tipo mantenimiento

- Preventivo
- Correctivo
- Lubricación
- Cableado / correas
- Seguridad
- Limpieza técnica
- Ajuste / calibración
- Revisión general

## Validación local sugerida

Antes de aplicar en remoto:

```bash
npx supabase stop --no-backup
npx supabase start
npx supabase db reset
```

Si el baseline local ya está preparado, validar las migraciones nuevas con:

```bash
npx supabase migration up
```

Luego ejecutar diagnóstico SQL:

```sql
select 'tipo_empleado' tabla, count(*) cantidad from public.tipo_empleado
union all select 'medio_pago', count(*) from public.medio_pago
union all select 'tipo_gasto', count(*) from public.tipo_gasto
union all select 'tipo_ingreso', count(*) from public.tipo_ingreso
union all select 'categoria_producto', count(*) from public.categoria_producto
union all select 'tipo_equipamiento', count(*) from public.tipo_equipamiento
union all select 'ubicacion_equipamiento', count(*) from public.ubicacion_equipamiento
union all select 'tipo_mantenimiento', count(*) from public.tipo_mantenimiento;
```

Validar columnas opcionales:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and column_name in (
    'id_tipo_empleado',
    'id_categoria_producto',
    'id_tipo_equipamiento',
    'id_ubicacion_equipamiento',
    'id_tipo_mantenimiento',
    'id_medio_pago',
    'id_tipo_gasto'
  )
order by table_name, column_name;
```

## Próximas fases

1. Crear APIs/servicios para leer catálogos activos.
2. Integrar selects en formularios existentes.
3. Crear CRUD administrativo desde `/dashboard/parametrizacion`.
4. Migrar gradualmente `entrenadores` hacia `empleados`.
5. Construir módulo de sueldos y recibos.
6. Construir mantenimiento avanzado por máquina/tipo/frecuencia.


## Fix de validación local

Durante la validación con Supabase local, el baseline mínimo puede no contener algunas tablas legacy como `entrenadores`, `producto`, `equipamiento`, `mantenimiento` u `otros_gastos`.

Por eso el bloque de foreign keys debe ser defensivo:

- resolver cada tabla con `to_regclass`;
- evitar casteos directos como `'public.entrenadores'::regclass` si la tabla podría no existir;
- ejecutar `ALTER TABLE` con SQL dinámico solo cuando la tabla existe.

Se agregó el script:

```bash
database/scripts/validar_catalogos_parametrizables_foundation.sql
```

para validar tablas catálogo, seeds, columnas opcionales y constraints creadas.
