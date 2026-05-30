# QA recorrido fixes general

Rama sugerida: `feature/qa-recorrido-fixes-general`

## Objetivo

Aplicar el primer bloque de correcciones detectadas durante el recorrido manual de QA con badges de archivo visibles.

## Alcance aplicado

- Reemplazo progresivo de botones `Imprimir` por `Descargar PDF` en listados administrativos.
- PDFs profesionales con membrete Gym Master para socios, actividades, asistencias, pagos, cuotas, usuarios y servicios.
- Paginación visual en listados y gestores con crecimiento esperado de datos.
- Filtros adicionales por período/rango en asistencias y pagos.
- Ordenamiento alfabético en gestores de rutinas, dietas y evolución física.
- Reubicación de `Media de Ejercicios` al bloque Administración.
- Deshabilitación visual de accesos legacy `Rutinas`, `Dietas` y `Evolución Física` del menú Gestión de Gimnasio.
- Ampliación del formulario de socios con sexo, fecha de nacimiento, ubicación y contacto de emergencia.
- Validación mejorada de contraseña en usuarios con confirmación y checklist visual.

## Base de datos

La ficha de socio requiere columnas adicionales en `public.socio`:

- `ciudad`
- `provincia`
- `pais`
- `contacto_emergencia_nombre`
- `contacto_emergencia_telefono`

La migración se genera en `supabase/migrations` como archivo local/ignorado por Git para seguir el flujo de Supabase CLI sin exponer SQL sensible en el repo público.

## Validación recomendada

1. Aplicar migración con backup remoto previo.
2. Ejecutar script de validación SQL en Supabase Studio.
3. Probar creación/edición/detalle de socio.
4. Probar creación/edición de usuario con contraseña válida e inválida.
5. Verificar que los botones digan `Descargar PDF` y generen PDF.
6. Validar paginación en listados y gestores.
7. Ejecutar `npm run build`.
