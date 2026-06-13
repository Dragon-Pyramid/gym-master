# E2E test suite — Gym Master

**Rama sugerida:** `feature/e2e-test-suite`  
**Tipo:** QA / hardening / smoke tests de flujos críticos.  
**Migración DB:** No requiere.

## Objetivo

Agregar una primera suite E2E con Playwright para proteger los flujos principales de Gym Master antes de avanzar hacia demo comercial, campaña publicitaria y despliegues por cliente.

La suite valida que las rutas críticas carguen sin errores fatales, que el login admin funcione con credenciales QA y que los módulos comerciales principales expongan sus acciones clave.

## Archivos agregados

```txt
playwright.config.ts
e2e/auth-public.spec.ts
e2e/admin-critical-routes.spec.ts
e2e/business-flows.spec.ts
e2e/helpers/auth.ts
e2e/helpers/assertions.ts
docs/qa/e2e-test-suite.md
```

También se agregan scripts en `package.json`:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:install": "playwright install chromium"
}
```

## Instalación inicial

Después de aplicar el patch, instalar dependencia de Playwright:

```bash
cd /e/gym-master-2026/sistema/gym-master
npm install --legacy-peer-deps
npm run test:e2e:install
```

## Variables para pruebas autenticadas

Las pruebas públicas no requieren credenciales. Las pruebas autenticadas se omiten automáticamente si no están definidas estas variables:

```bash
export E2E_ADMIN_EMAIL="admin@gimnasio.com"
export E2E_ADMIN_PASSWORD="PASSWORD_QA"
export E2E_ADMIN_ROLE="admin"
```

Usar un usuario admin QA con contraseña definitiva. Si el usuario tiene `must_change_password=true`, el test falla con un mensaje explícito porque no debe usarse para smoke tests.

## Ejecución

Con servidor automático en `127.0.0.1:3000`:

```bash
npm run test:e2e
```

Con UI:

```bash
npm run test:e2e:ui
```

Si ya está corriendo `npm run dev` manualmente:

```bash
export E2E_SKIP_WEBSERVER=1
export E2E_BASE_URL="http://localhost:3000"
npm run test:e2e
```

## Cobertura inicial

### Auth público

- `/auth/login` muestra ingreso socio y administración.
- `/auth/login/admin` muestra formulario admin.
- Ruta protegida sin sesión redirige a login.

### Rutas críticas admin

- `/dashboard`
- `/dashboard/socios`
- `/dashboard/pagos`
- `/dashboard/asistencias`
- `/dashboard/actividades`
- `/dashboard/socios-ranking-bonificacion`
- `/dashboard/equipamientos`
- `/dashboard/ventas`
- `/dashboard/compras`
- `/dashboard/finanzas`
- `/dashboard/parametrizacion`

### Flujos comerciales smoke

- Pagos: botón de registro manual, PDF y exportación.
- Actividades: BI, formulario crear/editar turno y botón crear turno.
- Ranking/bonificación: ranking, PDF, Excel y actualizar.
- Equipamiento: listado, PDF y filtros.

## Alcance intencional

Esta primera suite es **smoke/regresión inicial**. No genera datos destructivos ni registra pagos reales. Sirve para detectar errores de compilación visual, rutas rotas, permisos mal aplicados y pantallas críticas que dejan de cargar.

Features futuras podrán ampliar:

- creación de socio QA idempotente;
- pago manual en entorno QA aislado;
- asistencia QR simulada;
- creación de turno con cleanup;
- permisos por rol usuario/socio;
- ejecución en CI/CD.

## Validación esperada

```txt
npm run build
npm run test:e2e
```

Resultado esperado:

```txt
passed
```

Si faltan credenciales admin, las pruebas autenticadas se marcan como `skipped`, pero las pruebas públicas deben pasar.
