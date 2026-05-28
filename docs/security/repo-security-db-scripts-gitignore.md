# Seguridad del repositorio — SQL, migraciones y scripts de base de datos

## Objetivo

El repositorio público de Gym Master debe exponer solamente el código necesario de la aplicación y su documentación funcional/técnica no sensible.

A partir de esta política, no deben versionarse en el repositorio público:

- dumps;
- backups;
- exports de base de datos;
- scripts SQL operativos;
- migraciones reales de Supabase;
- seeds sensibles;
- snippets SQL privados;
- archivos generados por Supabase CLI;
- scripts de diagnóstico o validación que revelen estructura sensible del negocio;
- cualquier archivo que contenga claves, tokens, service role, datos productivos o estrategia comercial sensible.

## Nuevo criterio de trabajo

Los scripts SQL pueden seguir existiendo para trabajo local y validación, pero deben quedar fuera de Git.

Flujo recomendado:

```txt
1. Crear script/migración SQL local en carpeta privada ignorada.
2. Validar en Supabase local.
3. Hacer backup remoto si corresponde.
4. Aplicar en Supabase remoto.
5. Documentar la feature sin publicar el SQL sensible.
6. Mantener trazabilidad privada en un repositorio separado o almacenamiento interno.
```

## Estructura recomendada

Repositorio público:

```txt
gym-master/
├─ src/
├─ docs/
├─ public/
├─ package.json
├─ .gitignore
└─ README.md
```

Repositorio privado sugerido:

```txt
gym-master-db-private/
├─ supabase/
│  ├─ migrations/
│  ├─ seeds/
│  └─ snippets/
├─ database/
│  ├─ scripts/
│  ├─ diagnostics/
│  ├─ validations/
│  └─ backups/
└─ README.md
```

## Carpetas ignoradas

La política actual ignora:

```txt
database/scripts/
database/migrations/
database/pending_migrations/
database/private/
database/local/
database/remote/
database/backups/
database/dumps/
database/seeds/
supabase/migrations/
supabase/snippets/
supabase/seeds/
supabase/.branches/
supabase/.temp/
supabase/.shadow/
supabase/.data/
backups/
dumps/
exports/
logs/
```

También se ignoran extensiones frecuentes de base de datos:

```txt
*.sql
*.sql.gz
*.sql.zip
*.dump
*.backup
*.bak
*.pgdump
*.psql
*.sqlite
*.sqlite3
*.db
```

## Archivos ya versionados

Agregar reglas al `.gitignore` no elimina archivos que ya fueron versionados.

Para dejar de trackearlos sin borrarlos del disco local, ejecutar:

```bash
git rm -r --cached database/scripts database/migrations database/pending_migrations supabase/migrations supabase/snippets 2>/dev/null || true
git rm -r --cached supabase/.branches supabase/.temp 2>/dev/null || true
git status
```

En Git Bash sobre Windows, si algún path no existe o no está trackeado, el comando puede devolver aviso. En ese caso revisar con:

```bash
git ls-files "database/*" "supabase/*" "*.sql"
```

Luego confirmar qué se va a retirar del índice:

```bash
git status
```

Y commitear:

```bash
git add .gitignore docs/security/repo-security-db-scripts-gitignore.md
git commit -m "chore: protect private database scripts from public repo"
```

## Consideración importante

Si se retiran migraciones del repositorio público, el despliegue de base de datos deja de depender del repo público.

Por eso se recomienda mantener un repositorio privado de base de datos, por ejemplo:

```txt
gym-master-db-private
```

Ese repositorio debe ser la fuente interna de verdad para:

- migraciones SQL;
- seeds;
- validaciones;
- diagnósticos;
- backups;
- scripts operativos;
- documentación privada de DB.

## Qué sí puede quedar en el repo público

Puede quedar documentación conceptual no sensible, por ejemplo:

- explicación funcional del módulo;
- endpoints de Swagger/OpenAPI;
- criterios de uso;
- decisiones de arquitectura generales;
- documentación de pruebas sin SQL interno;
- guías de usuario/admin.

## Qué no debe quedar en el repo público

No debe quedar:

- schema completo productivo;
- dumps;
- backups;
- scripts con datos reales;
- scripts con estructura sensible;
- seeds comerciales completos;
- funciones/RPC estratégicas si exponen lógica de negocio;
- service role keys;
- URLs de DB privadas;
- credenciales;
- SQL de hardening o grants productivos.
