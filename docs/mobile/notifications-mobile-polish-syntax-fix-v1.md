# Notifications mobile polish syntax fix v1

Corrección puntual del primer renglón de `src/components/tables/NotificacionTable.tsx`.

## Problema
El archivo quedó con `use client';`, generando error de compilación.

## Corrección
Se restauró la directiva correcta de Next.js/React Client Component: `'use client';`.

No modifica lógica, DB, endpoints ni Swagger.
