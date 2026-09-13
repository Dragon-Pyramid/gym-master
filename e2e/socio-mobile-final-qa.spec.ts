import { devices, expect, test } from '@playwright/test';
import { MENU_PERMISSION_GROUPS } from '../src/lib/permissions/menuPermissions';
import { expectNoAccessDenied, expectNoCriticalAppError, waitForAppReady } from './helpers/assertions';
import { loginAsSocio, skipIfMissingSocioCredentials } from './helpers/auth';

const socioPersonalExtraRoutes = ['/dashboard/rutinas'] as const;

const socioMobileRoutes = Array.from(
  new Set([
    ...MENU_PERMISSION_GROUPS
      .flatMap((group) => group.items)
      .filter((item) => item.roles.includes('socio'))
      .map((item) => item.path),
    ...socioPersonalExtraRoutes,
  ]),
).sort();

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
      const appOrigin = new URL(page.url()).origin;

      const blockedMutations: string[] = [];
      const pageErrors: string[] = [];
      const serverErrors: string[] = [];

      page.on('pageerror', (error) => {
        pageErrors.push(`${path} :: ${error.message}`);
      });

      page.on('response', (response) => {
        const request = response.request();

        let responseUrl: URL;

        try {
          responseUrl = new URL(response.url());
        } catch {
          return;
        }

        if (responseUrl.origin !== appOrigin) {
          return;
        }

        if (
          response.status() >= 500 &&
          ['document', 'xhr', 'fetch'].includes(request.resourceType())
        ) {
          serverErrors.push(
            `${path} :: HTTP ${response.status()} ${request.method()} ${responseUrl.pathname}`,
          );
        }
      });

      await page.route('**/*', async (route) => {
        const request = route.request();
        const method = request.method().toUpperCase();

        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
          await route.continue();
          return;
        }

        blockedMutations.push(`${path} :: ${method} ${request.url()}`);
        await route.abort('blockedbyclient');
      });

      const response = await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      await waitForAppReady(page);
      await page.waitForTimeout(800);

      const finalPath =
        new URL(page.url()).pathname.replace(/\/$/, '') || '/';

      const expectedPath =
        path.replace(/\/$/, '') || '/';

      expect(finalPath).toBe(expectedPath);

      if (response && response.status() >= 400) {
        throw new Error(`HTTP ${response.status()}`);
      }

      await expectNoAccessDenied(page);
      await expectNoCriticalAppError(page);

      const bodyText = (await page.locator('body').innerText()).trim();

      expect(
        bodyText,
        'La página Socio no debe renderizar body vacío.',
      ).not.toBe('');

      expect(
        blockedMutations,
        'La navegación Socio read-only intentó una request mutativa.',
      ).toEqual([]);

      expect(
        pageErrors,
        'Se detectaron errores JavaScript no controlados.',
      ).toEqual([]);

      expect(
        serverErrors,
        'Se detectaron respuestas HTTP 5xx same-origin.',
      ).toEqual([]);
    });
  }
});
