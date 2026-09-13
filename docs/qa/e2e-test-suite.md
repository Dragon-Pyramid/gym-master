# E2E test suite — Gym Master

**Rama sugerida:** `feature/e2e-test-suite`  
**Tipo:** QA / hardening / smoke tests de flujos críticos.  
**Migración DB:** No requiere.

## Objetivo

Mantener una suite E2E con Playwright para proteger los flujos principales de Gym Master antes de demo comercial, campaña publicitaria y despliegues por cliente.

La suite valida autenticación pública, login Admin con credenciales QA, rutas críticas, flujos comerciales smoke y cobertura read-only de todas las rutas habilitadas para el rol `admin` en `MENU_PERMISSION_GROUPS`.

La cobertura Admin final también detecta redirects inesperados, errores JavaScript no controlados, respuestas HTTP 5xx same-origin y cualquier intento de request mutativa durante la navegación read-only.

## Archivos agregados

```txt
playwright.config.ts
e2e/auth-public.spec.ts
e2e/admin-critical-routes.spec.ts
e2e/admin-menu-routes.spec.ts
e2e/business-flows.spec.ts
e2e/commercial-final-qa.spec.ts
e2e/socio-mobile-final-qa.spec.ts
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
export E2E_ADMIN_EMAIL="<qa-admin-email>"
export E2E_ADMIN_PASSWORD="<qa-admin-password>"
export E2E_ADMIN_ROLE="admin"

export E2E_SOCIO_EMAIL="<qa-socio-email>"
export E2E_SOCIO_PASSWORD="<qa-socio-password>"
```

Usar usuarios QA con contraseña definitiva. Si un usuario tiene `must_change_password=true`, el test falla con un mensaje explícito porque no debe usarse para smoke/regresión.

La configuración Playwright fija `locale: es-AR` para que los asserts de copy en español no dependan del idioma ambiental del navegador.

El helper de login espera la navegación autenticada hasta 30 segundos y usa `domcontentloaded`, reduciendo falsos negativos por cold start de `next dev`.

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

### Cobertura completa del menú Admin

`e2e/admin-menu-routes.spec.ts` obtiene dinámicamente las rutas cuyo `roles` incluye `admin` desde `src/lib/permissions/menuPermissions.ts`.

La prueba:

- navega todas las rutas Admin sin duplicar manualmente la matriz de permisos;
- bloquea requests `POST`, `PUT`, `PATCH` y `DELETE` después del login;
- exige que cada ruta permanezca en su path esperado;
- detecta errores críticos visibles y acceso denegado;
- detecta `pageerror` de navegador;
- detecta respuestas HTTP 5xx same-origin para `document`, `xhr` y `fetch`;
- exige body no vacío;
- no acciona botones de creación, actualización, eliminación, pagos, scanner, cámara, RAG ni providers externos.

Baseline validado en la rama Admin final QA: **51/51 rutas Admin read-only**.

### Regresión final Comercial y Stock

`e2e/commercial-final-qa.spec.ts` ejecuta una regresión autenticada read-only del grupo `Comercial y Stock` definido en `MENU_PERMISSION_GROUPS`.

La cobertura incluye:

- **13 rutas directas** del grupo `Comercial y Stock`;
- autenticación con usuario Admin QA;
- permanencia en el `pathname` esperado para cada ruta;
- bloqueo de requests `POST`, `PUT`, `PATCH` y `DELETE` después del login;
- detección de `pageerror`;
- detección de respuestas HTTP 5xx same-origin para `document`, `xhr` y `fetch`;
- detección de bloqueo RBAC y errores críticos visibles;
- validación de `body` renderizado no vacío.

La suite no ejecuta acciones comerciales mutativas. Quedan fuera de esta regresión la creación o anulación de ventas y compras, apertura/cierre o movimientos de caja, recepción de órdenes, cambios de stock, CRUD de productos/proveedores/servicios, creación de packs/promociones/cupones y generación persistente de códigos QR.

Baseline validado: **13/13 rutas Comercial y Stock read-only**.

### Regresión final Socio mobile/PWA

`e2e/socio-mobile-final-qa.spec.ts` ejecuta la regresión autenticada del rol `socio` con perfil mobile equivalente a iPhone 12 Pro.

La cobertura incluye:

- **14 rutas directas** habilitadas para `socio` desde `MENU_PERMISSION_GROUPS`;
- la ruta personal adicional `/dashboard/rutinas`, conservada explícitamente porque forma parte del flujo funcional del socio;
- 1 test funcional específico del dashboard mobile.

Cada navegación Socio:

- exige permanecer en el `pathname` esperado;
- bloquea requests `POST`, `PUT`, `PATCH` y `DELETE` después del login;
- detecta `pageerror`;
- detecta respuestas HTTP 5xx same-origin para `document`, `xhr` y `fetch`;
- detecta bloqueo RBAC y errores críticos visibles;
- exige que el `body` renderizado no esté vacío.

Baseline final validado: **15 rutas Socio + 1 test funcional de dashboard = 16/16 tests passed**.

## Alcance intencional

La suite combina **smoke/regresión** con cobertura Admin, Comercial y Socio. Las coberturas Admin y Comercial se ejecutan en modo read-only y no generan datos destructivos ni registran pagos, ventas, compras, movimientos de caja o stock reales. Sirve para detectar errores de compilación visual, rutas rotas, permisos mal aplicados, pantallas críticas que dejan de cargar, errores JavaScript y fallos HTTP 5xx durante navegación autenticada.

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
