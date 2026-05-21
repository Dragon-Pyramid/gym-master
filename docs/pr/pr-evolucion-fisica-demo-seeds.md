# PR: Add demo seeds for physical evolution

## Resumen

Esta PR agrega datos demo/QA para validar el módulo de evolución física de Gym Master.

Se crean un socio hombre y una socia mujer nuevos, específicamente destinados a pruebas de evolución corporal, con registros históricos mensuales y métricas completas.

## Cambios principales

- Agrega migración `202605211230_evolucion_fisica_demo_seeds.sql`.
- Crea usuarios QA con rol socio.
- Crea socios QA específicos para evolución física.
- Inserta 10 registros en `public.evolucion_socio`.
- Marca el primer registro de cada socio como registro inicial.
- Simula progreso real entre enero y mayo de 2026.
- Agrega script de validación SQL.
- Documenta el objetivo y alcance de los seeds.

## Validaciones esperadas

- 2 socios QA creados.
- 10 registros de evolución física cargados.
- 5 registros por socio.
- 1 registro inicial por socio.
- Línea temporal ordenada por fecha.
- Comparación antes/después disponible para futuras features.

## Notas

Esta PR no modifica frontend. Su objetivo es dejar datos consistentes para las próximas etapas:

- CRUD de evolución física.
- Dashboard.
- Silueta dinámica.
- PDF de evolución.
