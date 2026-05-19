# PR — Auditoría técnica inicial de Gym Master

## Descripción

Este PR incorpora documentación técnica inicial para continuar el desarrollo de Gym Master luego del checkpoint single-tenant mergeado a `main`.

El objetivo es dejar una radiografía clara del estado actual del sistema, tomando como base el repositorio exportado y el backup SQL del 19/05/2026. No se modifica lógica productiva; el cambio es documental y de organización técnica.

## Cambios incluidos

- Se actualiza `README.md` con el estado arquitectónico actual single-tenant.
- Se agrega `docs/auditoria-tecnica-gym-master.md` con el análisis inicial del repo, módulos, riesgos y prioridades.
- Se agrega `docs/database/estado-base-datos.md` con inventario de tablas, funciones/RPC, relaciones y puntos de atención del DER.
- Se agrega este documento de PR en `docs/pr/pr-auditoria-tecnica-gym-master.md`.
- Se agrega `docs/informes/informe-ejecutivo-auditoria-inicial.md` como cierre ejecutivo del bloque.

## Hallazgos principales

- No se detectaron referencias activas a `dbName` en el paquete inspeccionado.
- La arquitectura vigente queda documentada como single-tenant por instancia/deploy.
- El backup contiene 33 tablas públicas y 29 funciones/RPC públicas.
- El flujo de rutinas se mantiene basado en el RPC `generar_rutina_socio`.
- Existen módulos amplios, pero varios están parciales o requieren hardening.
- Se detectan riesgos prioritarios en RLS, Stripe, Data Science, DER y testing.

## Validaciones realizadas

- Inspección estática del repositorio exportado.
- Inspección del backup SQL completo.
- Búsqueda de referencias `dbName`.
- Inventario de API Routes, páginas dashboard, servicios y RPC usados.
- Comparación entre RPC consumidos por código y funciones existentes en backup.

## Nota

Este PR no corrige todavía las inconsistencias detectadas. Su objetivo es ordenar el punto de partida para que las próximas ramas se trabajen con documentación, prioridades y trazabilidad.

## Próximo paso recomendado

Crear una rama específica para DER y seguridad:

```bash
git checkout main
git pull origin main
git checkout -b chore/database-der-and-rls-audit
```

En esa rama se debería preparar el DER real, la matriz de permisos y la primera propuesta de hardening RLS.
