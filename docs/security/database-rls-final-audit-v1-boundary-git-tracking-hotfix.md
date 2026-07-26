# Database RLS Final Audit V1 — Git tracking boundary hotfix

## Contexto

El gate inicial inspeccionaba físicamente `supabase/migrations`, `database/private` y `database/scripts`. En Gym Master esas carpetas pueden existir en el entorno local porque contienen migraciones, validaciones y material privado necesario para Supabase CLI y QA, pero están excluidas por `.gitignore` y no deben formar parte del repositorio público.

Por esa razón, el verificador generaba un falso positivo aun cuando los archivos SQL no estaban rastreados por Git.

## Corrección

`test:database-rls-boundary` ahora utiliza `git ls-files` y falla únicamente cuando un archivo `.sql` de las rutas privadas está efectivamente versionado.

Se mantienen las reglas:

- `supabase/migrations/**/*.sql` puede existir localmente, pero no debe estar rastreado;
- `database/private/**/*.sql` puede existir localmente, pero no debe estar rastreado;
- `database/scripts/**/*.sql` puede existir localmente, pero no debe estar rastreado;
- el kit privado de auditoría continúa fuera del repositorio;
- ninguna migración RLS se genera ni aplica en este bloque.

## Validación

El gate debe aprobar con SQL local ignorado y debe fallar si uno de esos archivos se fuerza al índice de Git.

Comprobación manual:

```bash
git ls-files \
  'supabase/migrations/**' \
  'database/private/**' \
  'database/scripts/**'
```

El resultado esperado es sin salida.
