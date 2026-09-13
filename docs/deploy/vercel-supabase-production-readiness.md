# Vercel + Supabase Production Readiness

## Objetivo

Documentar la validación de preparación de producción de Gym Master realizada sobre Vercel y Supabase, incluyendo configuración crítica, alineación de base de datos, build productivo y smoke tests no mutativos.

Esta guía no contiene valores de secretos, credenciales ni claves operativas.

## Alcance validado

Fecha de validación: 2026-09-13.

Aplicación productiva:

- dominio canónico: `https://gym-master-ecru.vercel.app`;
- rama productiva: `main`;
- commit validado: `7c95b7e`;
- proyecto Supabase vinculado: `hayxcxooyndpecxjzpoj`;
- esquema comparado: `public`.

## Supabase

### Proyecto remoto

La CLI local quedó vinculada al proyecto productivo de Gym Master con reference ID:

```text
hayxcxooyndpecxjzpoj
```

La conexión fue verificada mediante `supabase projects list` antes de cualquier auditoría remota.

### Historial de migraciones

Se verificaron 63 migraciones locales y 63 migraciones registradas en remoto.

`supabase migration list` mostró correspondencia completa entre Local y Remote desde:

```text
202605200001
```

hasta:

```text
202607292256
```

No se detectaron versiones exclusivamente locales ni exclusivamente remotas.

### Migraciones pendientes

Se ejecutó únicamente:

```bash
npx --no-install supabase db push --dry-run
```

Resultado:

```text
Remote database is up to date.
```

No se ejecutó `db push` real, `migration repair`, `db reset --linked`, `db pull` ni SQL remoto durante esta validación.

### Comparación estructural real

La reconstrucción del esquema desde las migraciones públicas no puede utilizarse como prueba completa de drift porque parte del histórico remoto está representado por migraciones placeholder sin SQL.

Por ese motivo se compararon directamente:

```text
Base local real:  supabase_db_gym-master
Base remota real: hayxcxooyndpecxjzpoj
Schema:           public
```

El comando de diff entre la base local real y la base remota real terminó correctamente con:

```text
DIFF_BYTES=0
DIFF_LINES=0
SCHEMA_DRIFT_SIGNAL=0
```

Conclusión: no se detectó drift estructural en el esquema `public` entre la base local validada y producción.

Esta comparación no implica igualdad de datos ni certifica automáticamente esquemas administrados por Supabase como `auth` o `storage`.

## Baseline y recuperación

El repositorio público conserva parte del histórico remoto como archivos placeholder sin SQL.

Durante una reconstrucción de shadow database desde las migraciones públicas, una migración posterior requirió `public.usuario`, objeto perteneciente al histórico no incluido en los placeholders.

Por lo tanto:

- el historial de migraciones remoto sí está alineado;
- la base local real y la remota coinciden en `public`;
- el repositorio público no debe considerarse por sí solo un backup completo;
- la recuperación desde cero requiere un baseline o backup privado validado.

La estrategia completa de backup/restore y disaster recovery se documentará en el bloque específico correspondiente.

## Vercel

### Dominio productivo

Vercel reporta como dominio Production válido:

```text
https://gym-master-ecru.vercel.app
```

Production está asociado a la rama `main`.

### Variables críticas verificadas

Se confirmó la presencia de las variables principales de Supabase, JWT, Stripe, Cloudinary, Brevo y servicios opcionales requeridos por las capacidades actualmente desplegadas.

Durante la auditoría se detectaron y corrigieron cuatro puntos:

```text
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL
PAGO_RECEIPT_VERIFICATION_SECRET
DRAGON_PYRAMID_LICENSE_SYNC_SECRET
```

Estado final:

- `NEXTAUTH_URL` apunta al dominio canónico de producción y está limitado a Production;
- `NEXT_PUBLIC_APP_URL` fue agregado con el dominio canónico y está limitado a Production;
- `PAGO_RECEIPT_VERIFICATION_SECRET` fue agregado como Secret sólo para Production;
- `DRAGON_PYRAMID_LICENSE_SYNC_SECRET` fue agregado como Secret sólo para Production.

Los valores secretos no deben documentarse ni versionarse.

### Variables públicas y de prueba

Las variables E2E no fueron detectadas como requeridas en Production.

Los flags:

```text
NEXT_PUBLIC_EXPOSE_INTERNAL_TEST_ENDPOINTS
NEXT_PUBLIC_QA_FILE_BADGES
EXPOSE_SWAGGER_DOCUMENTATION
```

no necesitan estar presentes para mantener el comportamiento seguro por defecto según el código validado.

La separación completa entre secretos de Production y Preview debe revisarse de forma independiente antes de habilitar Preview como entorno operativo de QA.

## Redeploy productivo

Después de completar las variables críticas se realizó un único redeploy final de Production utilizando el mismo source code de `main`.

El deployment validado:

- utilizó commit `7c95b7e`;
- fue construido sin reutilizar build cache;
- terminó en estado `Ready`;
- quedó marcado como `Production` y `Current`;
- conservó el dominio `gym-master-ecru.vercel.app`.

El build de Next.js 14.2.33:

- compiló correctamente;
- completó validación de tipos;
- generó 85 de 85 páginas;
- creó correctamente las funciones serverless;
- finalizó el deployment sin errores bloqueantes.

## Smoke test de producción

Después del redeploy se realizó un smoke manual no mutativo.

Rutas verificadas:

```text
/auth/login
/auth/login/admin
/dashboard
/dashboard/socios
/dashboard/actividades
/dashboard/asistencias
```

Resultados:

- selector de acceso público: PASS;
- formulario administrativo: PASS;
- autenticación administrativa: PASS;
- dashboard principal: PASS;
- carga de datos y BI: PASS;
- Socios: PASS;
- Actividades: PASS;
- Asistencias: PASS.

No se realizaron altas, ediciones, bajas, pagos, recuperación de contraseña, registros de asistencia ni sincronizaciones comerciales durante el smoke.

La advertencia comercial observada en el dashboard corresponde al estado de datos de licencia del cliente demo y no a un fallo del deployment.

## E2E

No se repitió la batería E2E completa durante esta validación.

Los flujos E2E de Administrador, Socio y Comercial ya habían sido cerrados y revalidados previamente. Este bloque modificó configuración de infraestructura y entorno, no auth/RBAC, navegación ni menús.

Un E2E completo sólo debe repetirse cuando un cambio pueda invalidar esos contratos funcionales.

## Hallazgos pendientes

Durante el build productivo, `npm audit` reportó vulnerabilidades de dependencias.

Este hallazgo debe revisarse de forma separada antes del Release Candidate. No se debe ejecutar `npm audit fix --force` sin análisis porque puede introducir cambios incompatibles.

También quedan como bloques posteriores:

- estrategia formal de backup/restore y disaster recovery;
- revisión de aislamiento de secretos entre Production y Preview;
- revisión de dependencias vulnerables;
- documentación final de usuario;
- documentación técnica final;
- preparación del Release Candidate.

## Estado

Con la evidencia de esta validación:

```text
Supabase migration history     PASS
Supabase pending migrations    PASS
Supabase public schema drift   PASS
Vercel critical env contract   PASS
Vercel fresh production build  PASS
Production smoke               PASS
```

El bloque Vercel + Supabase Production Readiness queda técnicamente validado, sujeto a los hallazgos pendientes documentados arriba.
