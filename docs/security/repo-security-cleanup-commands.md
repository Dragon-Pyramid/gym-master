# Comandos de saneamiento del repo público

> Ejecutar desde Git Bash en la raíz del repo `gym-master`.

## 1. Confirmar rama

```bash
git branch --show-current
git status
```

## 2. Ver SQL/DB actualmente trackeados

```bash
git ls-files "*.sql" "database/*" "supabase/migrations/*" "supabase/snippets/*" "supabase/.branches/*" "supabase/.temp/*"
```

## 3. Retirar del índice sin borrar del disco

```bash
git rm -r --cached database/scripts database/migrations database/pending_migrations 2>/dev/null || true
git rm -r --cached supabase/migrations supabase/snippets supabase/.branches supabase/.temp 2>/dev/null || true
git rm --cached *.sql 2>/dev/null || true
```

## 4. Confirmar estado

```bash
git status
```

## 5. Commit

```bash
git add .gitignore docs/security/repo-security-db-scripts-gitignore.md docs/security/repo-security-cleanup-commands.md
git commit -m "chore: protect private database scripts from public repo"
git push -u origin feature/repo-security-db-scripts-gitignore
```

## Nota

Si el repo necesita conservar algún archivo SQL público de ejemplo, crear una excepción explícita en `.gitignore` y revisar que no contenga información sensible.
