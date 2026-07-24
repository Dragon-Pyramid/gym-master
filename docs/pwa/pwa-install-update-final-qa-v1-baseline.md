# PWA Install & Update Final QA v1 — Baseline

## Rama

`feature/pwa-install-update-final-qa-v1`

## Objetivo

Cerrar la instalación y actualización de Gym Master como PWA en Chrome, Edge,
Android y modo standalone sin debilitar la política de caché segura ya aprobada.

## Cambios de este lote

- El service worker deja de activarse automáticamente mediante `skipWaiting`.
- Una versión nueva queda en espera hasta que el usuario elige actualizar.
- La recarga ocurre después de `controllerchange`, con un timeout de recuperación.
- Se comprueban actualizaciones al abrir, volver a primer plano, recuperar conexión
  y de forma periódica.
- Los avisos PWA también alcanzan a administradores y usuarios internos cuando
  Gym Master se ejecuta como aplicación instalada.
- Prompt de instalación, avisos de conexión y pulido standalone se montan desde
  `SessionWrapper`, por lo que están disponibles desde el login y no dependen de
  que `AppHeader` ya se haya renderizado.
- El manifest permite cualquier orientación para no bloquear escritorio, tablets,
  POS ni pantallas apaisadas.
- Se agrega `npm run test:pwa-install-update`.
- Los artefactos generados `sw.js`, `workbox-*` y `fallback-*` deben quedar fuera
  del índice de Git.

## Política conservada

- `/api/*`: `NetworkOnly`.
- Navegaciones: `NetworkOnly`.
- `/_next/static/*`: caché versionada.
- Imágenes públicas locales: caché controlada.
- Fallback documental: `/offline`.

## Decisión sobre actualizaciones

Gym Master usa chunks con hashes y carga diferida. Workbox recomienda evitar la
activación inmediata en este escenario. La nueva versión permanece esperando y
el usuario confirma el cambio. El cliente envía `SKIP_WAITING`, espera
`controllerchange` y recién entonces recarga.

Esto reduce el riesgo de:

- `ChunkLoadError`.
- mezcla de bundles anteriores y nuevos;
- recarga inesperada durante una venta, pago, ficha médica o formulario;
- activación silenciosa en una sesión operativa.

## Manifest e iconos

El manifest conserva su identidad y `start_url` existentes para no crear una
segunda instalación. Los iconos fueron comprobados en dimensiones reales:

- 192 × 192.
- 512 × 512.
- maskable 192 × 192.
- maskable 512 × 512.
- Apple Touch Icon 180 × 180.

`orientation` cambia de `portrait` a `any`, permitiendo vertical, horizontal,
tablet, escritorio y ventanas PWA redimensionables.

## Validación automática

```bash
npm run build
npm run test:pwa-cache
npm run test:pwa-install-update
```

El último comando valida:

- manifest y campos críticos;
- dimensiones reales de iconos PNG;
- registro explícito del service worker;
- actualización controlada;
- montaje global de experiencia PWA;
- ausencia de montajes duplicados;
- service worker generado;
- artefactos PWA no versionados.

## Acción Git requerida

Como los archivos generados estaban versionados previamente, deben retirarse una
sola vez del índice:

```bash
git rm --cached --ignore-unmatch public/sw.js

git ls-files   'public/workbox-*.js'   'public/fallback-*.js'   | xargs -r git rm --cached --
```

El build continuará generándolos localmente y `.gitignore` impedirá que vuelvan
al repositorio.

## QA manual previsto

1. Manifest en Chrome DevTools sin errores.
2. Instalación en Chrome y Edge.
3. Apertura standalone sin barra de direcciones.
4. Persistencia de idioma y tema.
5. Versión A instalada.
6. Build de versión B con cambio visual controlado.
7. Aviso de nueva versión.
8. Opción “Más tarde” sin recarga.
9. Opción “Actualizar” y recarga tras `controllerchange`.
10. Formulario abierto sin pérdida antes de aceptar.
11. Login, logout y rutas por rol después de actualizar.
12. Desinstalación y reinstalación sin sesiones privadas heredadas.

## Sin cambios

- Base de datos.
- Migraciones.
- RLS.
- RPC.
- Seeds.
- Contratos API.
- Reglas comerciales.
