# Gym Master — Catálogo global de ubicaciones del gimnasio

## Rama

`feature/catalogo-ubicaciones-gimnasio`

## Objetivo

Convertir el campo de ubicación de los turnos de actividades en un catálogo parametrizable de zonas, salas y sectores físicos del gimnasio.

La ubicación deja de depender de texto libre y pasa a administrarse desde Parametrización, con reutilización progresiva en actividades, equipamiento, mantenimiento, asistencia/aforo y reportes BI.

## Alcance

- Nueva tabla `public.ubicacion_gimnasio`.
- Catálogo editable desde `/dashboard/parametrizacion`.
- API existente de catálogos ampliada con `ubicacion_gimnasio`.
- Selector de ubicación en `/dashboard/actividades` para crear/editar turnos.
- Fallback a texto libre si el catálogo no existe o todavía no fue migrado.
- Seed inicial de ubicaciones frecuentes: sala principal, funcional, spinning, cardio, fuerza, box, wellness, recepción, depósito, bar/snack y vestuarios.
- Seed adicional desde ubicaciones existentes de equipamiento y turnos.

## Módulos impactados

- Parametrización.
- Actividades / turnos / cupos.
- Swagger/OpenAPI.

## Módulos preparados para integración futura

- Equipamiento.
- Mantenimiento.
- Asistencia / aforo.
- Reportes BI por zona/sala.

## Seguridad

La tabla queda con RLS habilitado. Las operaciones administrativas de catálogo continúan pasando por API Routes server-side con service role, respetando el patrón de parametrización actual.

## Validación esperada

1. Aplicar migración privada `202606130801_ubicaciones_gimnasio_catalogo.sql`.
2. Ejecutar script de validación privado.
3. Abrir `/dashboard/parametrizacion` y verificar el catálogo “Ubicaciones del gimnasio”.
4. Crear/editar una ubicación.
5. Abrir `/dashboard/actividades` y verificar que el formulario de turnos muestre selector de ubicación.
6. Crear un turno usando una ubicación parametrizada.
7. Confirmar que el turno queda guardado y reflejado en BI/listado.
