# Ajuste Dashboard Admin — Bandeja de entrada

## Rama

`feature/socios-mensajeria-admin-inbox`

## Objetivo

Ajustar la card **Bandeja de entrada** del dashboard principal del administrador para mostrar dos métricas en una misma card:

- **Nuevos / en espera:** mensajes con estado `pendiente`.
- **Sin responder:** mensajes con estado `pendiente` o `leido`.

## Criterio funcional

Un mensaje leído por administración pero todavía no respondido sigue requiriendo atención. Por eso no alcanza con contar solo los mensajes `pendiente`.

## Alcance técnico

- Se consulta `/api/admin/socios-mensajes` sin filtrar por estado.
- El frontend calcula:
  - `pendiente`: mensajes nuevos/en espera.
  - `pendiente + leido`: mensajes sin responder.
- No requiere migración.
- No modifica contratos API.
