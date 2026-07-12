# Patch fix: otrosGastosI18n duplicate object keys

Este patch corrige el error de build:

```txt
Type error: An object literal cannot have multiple properties with the same name.
src/utils/otrosGastosI18n.ts
```

## Aplicación con robocopy

Desde Git Bash:

```bash
cd /e/gym-master-2026/sistema/gym-master

mkdir -p ../temp-robocopy/i18n_es_en_admin_dashboard_final_sweep_v2_otros_gastos_i18n_duplicates_fix_v1
```

Descomprimí este ZIP en:

```txt
E:\gym-master-2026\sistema\temp-robocopy\i18n_es_en_admin_dashboard_final_sweep_v2_otros_gastos_i18n_duplicates_fix_v1
```

Luego aplicá:

```bash
cd /e/gym-master-2026/sistema/gym-master

robocopy   "E:\gym-master-2026\sistema\temp-robocopy\i18n_es_en_admin_dashboard_final_sweep_v2_otros_gastos_i18n_duplicates_fix_v1\chatgpt_patch"   "."   /E /XD .git node_modules .next .vercel /XF package-lock.json
```

Robocopy puede devolver `1` aunque haya salido bien.

## Ejecutar corrección

```bash
node scripts/fix-otros-gastos-i18n-duplicates.mjs
```

## Validar build

```bash
rm -rf .next
npm run build
```

## Limpiar PWA antes del commit

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```

## Opcional: no commitear el script temporal

Si el build pasa, podés borrar el script antes de `git add`:

```bash
rm -f scripts/fix-otros-gastos-i18n-duplicates.mjs
git status --short
```

El cambio real debe quedar únicamente en `src/utils/otrosGastosI18n.ts`.
