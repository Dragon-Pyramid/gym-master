# Admin Socios Risk Alerts Hook Order Fix v1

## Alcance

Corrección puntual sobre la feature `admin-socios-risk-alerts-v1`.

## Problema detectado

Al abrir/cerrar el modal 360° del socio, React podía lanzar el error:

`Rendered more hooks than during the previous render`

El origen era que `SocioViewModal` ejecutaba un `useMemo` para el resumen de riesgo después de un retorno condicional `if (!socio) return null;`. Cuando el modal no tenía socio y luego recibía uno, cambiaba la cantidad de hooks ejecutados entre renders.

## Solución aplicada

- Se movió el cálculo `riskSummary` antes del retorno condicional.
- Se agregó un resumen seguro por defecto cuando todavía no hay socio.
- Se mantiene la misma UI de alertas de riesgo.
- No se tocan endpoints, DB, Swagger ni contratos.

## Validación sugerida

1. Entrar como admin a `/dashboard/socios`.
2. Abrir un modal 360°.
3. Cerrarlo.
4. Abrir otro socio o reabrir el mismo.
5. Confirmar que no aparece el error de hooks.
6. Confirmar que las alertas de riesgo se siguen mostrando.
7. Ejecutar `npm run build`.
