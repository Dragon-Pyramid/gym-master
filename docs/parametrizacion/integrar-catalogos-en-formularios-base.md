# Integración de catálogos parametrizables en formularios base

## Objetivo

Conectar los catálogos parametrizables reales con formularios operativos de Gym Master, reduciendo valores hardcodeados y preparando la evolución funcional hacia parametrización completa.

## Alcance

Esta feature integra catálogos en formularios base sin crear nuevas migraciones.

Formularios alcanzados:

- Pagos
- Productos
- Equipamiento
- Mantenimiento
- Entrenadores / empleados

## Cambios funcionales

### Pagos

El campo **Método de pago** pasa a consumir el catálogo `medio_pago`.

Se mantiene compatibilidad con el campo legacy `metodo_pago`, usando el `codigo` del catálogo, y se incorpora `id_medio_pago` para la nueva FK opcional.

### Productos

El formulario incorpora selector de **Categoría** desde `categoria_producto`.

Se agrega `id_categoria_producto` al payload de creación/edición para empezar a usar la FK opcional creada en la base.

### Equipamiento

Los campos **Tipo de equipo** y **Ubicación** pasan a consumir:

- `tipo_equipamiento`
- `ubicacion_equipamiento`

Se conserva compatibilidad con los campos legacy `tipo` y `ubicacion`, y se agregan las FK opcionales:

- `id_tipo_equipamiento`
- `id_ubicacion_equipamiento`

### Mantenimiento

El campo **Tipo de mantenimiento** pasa a consumir `tipo_mantenimiento`.

Se conserva `tipo_mantenimiento` como código operativo y se agrega `id_tipo_mantenimiento`.

### Entrenadores / empleados

El formulario de entrenadores incorpora selector de **Tipo de empleado** desde `tipo_empleado`.

Esto prepara la futura migración conceptual de `entrenadores` hacia `empleados`, permitiendo discriminar roles como:

- administrativo
- entrenador
- mantenimiento
- limpieza
- mayordomía/bar-snack

## Swagger / OpenAPI

También se actualiza Swagger para corregir la documentación del endpoint:

- `GET /api/parametrizacion/catalogos`
- `POST /api/parametrizacion/catalogos`
- `PATCH /api/parametrizacion/catalogos`

El repositorio anterior documentaba solo `GET`; esta feature agrega los métodos CRUD faltantes.

## Fuera de alcance

No se implementa todavía:

- migración completa de `entrenadores` a `empleados`;
- recibos de sueldo;
- integración profunda de BI por tipo de empleado;
- hard delete de catálogos;
- cambios de estructura de base de datos.

## Validación funcional sugerida

1. Abrir `/dashboard/parametrizacion` y confirmar catálogos activos.
2. Crear o editar un pago y verificar medios de pago desde catálogo.
3. Crear o editar producto y seleccionar categoría.
4. Crear o editar equipamiento y seleccionar tipo/ubicación.
5. Registrar mantenimiento y seleccionar tipo desde catálogo.
6. Crear entrenador y seleccionar tipo de empleado.
7. Abrir `/swagger` y confirmar que `/api/parametrizacion/catalogos` muestre GET, POST y PATCH.
