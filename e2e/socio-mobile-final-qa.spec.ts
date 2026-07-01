import { devices, expect, test } from '@playwright/test';
import { expectNoAccessDenied, expectNoCriticalAppError, waitForAppReady } from './helpers/assertions';
import { loginAsSocio, skipIfMissingSocioCredentials } from './helpers/auth';

const socioMobileRoutes = [
  '/dashboard',
  '/dashboard/control-asistencia',
  '/dashboard/mi-cuenta/pagar-cuota',
  '/dashboard/mi-cuenta/historial-pagos',
  '/dashboard/rutinas',
  '/dashboard/rutinas/asistente',
  '/dashboard/dietas',
  '/dashboard/coach',
  '/dashboard/evolucion-fisica',
  '/dashboard/ficha-medica',
  '/dashboard/mensajes',
];

const { defaultBrowserType: _defaultBrowserType, ...iPhone12ProDevice } = devices['iPhone 12 Pro'];

// No usamos defaultBrowserType dentro de describe porque Playwright lo trata como opción
// de worker y no permite configurarlo en un grupo de tests. El perfil mobile se mantiene
// con viewport, userAgent, isMobile, hasTouch y deviceScaleFactor.
test.use({
  ...iPhone12ProDevice,
  viewport: { width: 390, height: 844 },
});

test.describe('Smoke E2E socio mobile/PWA final', () => {
  test.beforeEach(() => {
    skipIfMissingSocioCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsSocio(page);
  });

  test('dashboard mobile muestra el feed priorizado sin errores críticos', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppReady(page);

    const body = page.locator('body');

    await expect(body).toContainText(/Tu plan de acción/i);
    await expect(body).toContainText(/Acceso y estado/i);
    await expect(body).toContainText(/Pagos y recibos|Mi cuota|Pagar cuota/i);
    await expect(body).toContainText(/Mi salud|Ficha médica/i);
    await expect(body).toContainText(/Agenda del gimnasio/i);
    await expect(body).toContainText(/Soporte del gimnasio|Mensajes/i);

    await expectNoAccessDenied(page);
    await expectNoCriticalAppError(page);
  });

  for (const path of socioMobileRoutes) {
    test(`carga ${path} como socio mobile sin bloqueo RBAC`, async ({ page }) => {
      await page.goto(path);
      await waitForAppReady(page);

      await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expectNoAccessDenied(page);
      await expectNoCriticalAppError(page);
    });
  }
});
