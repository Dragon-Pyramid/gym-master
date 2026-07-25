# Hotfix de nombres de hojas Excel en Respaldo del negocio

## Rama

`feature/security-auth-rbac-final-audit-v1`

## Incidencia

La exportación XLSX fallaba al crear hojas cuyos rótulos contenían caracteres prohibidos por Excel. El caso visible era `Gastos / egresos`, pero cualquier rótulo presente o futuro con `\`, `/`, `*`, `?`, `:`, `[` o `]` podía provocar el mismo error.

La función de normalización existente tenía expresiones regulares mal escapadas, por lo que no eliminaba correctamente los caracteres inválidos ni normalizaba los espacios.

## Corrección

- Sanitización centralizada de caracteres prohibidos y de control.
- Límite estricto de 31 caracteres por hoja.
- Eliminación de apóstrofes al inicio o final.
- Nombres alternativos para hojas vacías.
- Resolución determinista de nombres duplicados mediante sufijos `(2)`, `(3)`, etc.
- Aplicación de la misma regla a la hoja Resumen y a todos los módulos exportables.
- Gate automático `npm run test:business-backup-export`.

## Resultado esperado

`Gastos / egresos` se exporta como `Gastos - egresos`. La exportación completa de todos los módulos puede generarse en XLSX sin fallar por nombres de hojas. La exportación JSON no cambia.

## Alcance técnico

No modifica base de datos, migraciones, RLS, RPC, contratos de API, contenido exportado ni permisos Auth/RBAC.
