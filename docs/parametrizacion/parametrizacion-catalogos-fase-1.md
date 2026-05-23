# Parametrización de catálogos - fase 1

## Objetivo

Crear la base visual y de navegación para administrar catálogos del sistema Gym Master sin depender siempre de seeds o valores hardcodeados.

## Alcance de este patch

Esta primera fase es segura y no invasiva:

- agrega el ítem **Parametrización** al menú lateral para administradores;
- crea la ruta `/dashboard/parametrizacion`;
- muestra un mapa de catálogos existentes y planificados;
- enlaza módulos existentes como Actividades, Productos, Servicios, Equipamiento, Otros gastos y Entrenadores;
- no modifica base de datos;
- no modifica APIs;
- no agrega dependencias.

## Catálogos relevados

### Con base existente

- Actividades
- Productos
- Servicios
- Proveedores
- Otros gastos
- Equipamiento
- Entrenadores

### Planificados para próximas fases

- Medios de pago
- Tipos de gasto
- Tipos de ingreso
- Categorías de productos
- Tipos de equipamiento
- Ubicaciones de equipamiento
- Tipos de mantenimiento
- Tipos de empleado

## Próximas fases recomendadas

1. Diseñar migraciones para catálogos faltantes.
2. Probar migraciones con Supabase CLI local.
3. Crear servicios e interfaces para catálogos simples.
4. Integrar esos catálogos en formularios existentes.
5. Avanzar hacia equipamiento/mantenimiento avanzado.


## Nota operativa: evolución de entrenadores hacia empleados

Se registra como decisión de producto que la entidad actual `entrenadores` deberá evolucionar hacia una entidad más general de `empleados`.

### Catálogo mínimo futuro `tipo_empleado`

- Administrativo
- Entrenador
- Mantenimiento de equipamientos
- Limpieza
- Mayordomía / bar-snack

### Criterio funcional

Cada empleado deberá tener un `id_tipo_empleado` editable desde el frontend. Esto permitirá cambiar el tipo de empleado sin eliminar ni recrear el registro, por ejemplo:

- de entrenador a administrativo;
- de limpieza a mayordomía/bar-snack;
- de mantenimiento a otro rol operativo.

### Impacto futuro

Esta definición será necesaria para:

- planillas mensuales de sueldos;
- pagos discriminados por tipo de empleado;
- recibos PDF;
- reportes administrativos;
- relación con tipos de gasto, especialmente sueldos.

### Restricción

No se implementa todavía la migración real de `entrenadores` a `empleados`. Debe hacerse en una feature específica, con validación previa de impacto en base de datos, servicios, formularios, interfaces, tablas, reportes y compatibilidad de datos existentes.
