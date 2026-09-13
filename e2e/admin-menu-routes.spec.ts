import { expect, test } from '@playwright/test';
import { MENU_PERMISSION_GROUPS } from '../src/lib/permissions/menuPermissions';
import {
  expectNoAccessDenied,
  expectNoCriticalAppError,
  waitForAppReady,
} from './helpers/assertions';
import {
  loginAsAdmin,
  skipIfMissingAdminCredentials,
} from './helpers/auth';

const adminRoutes = Array.from(
  new Set(
    MENU_PERMISSION_GROUPS
      .flatMap((group) => group.items)
      .filter((item) => item.roles.includes('admin'))
      .map((item) => item.path),
  ),
).sort();

test.describe('Admin menu - cobertura read-only', () => {
  test('todas las rutas habilitadas para admin cargan sin mutaciones ni errores críticos', async ({
    page,
  }) => {
    skipIfMissingAdminCredentials();

    test.setTimeout(15 * 60 * 1000);

    await loginAsAdmin(page);

    const appOrigin = new URL(page.url()).origin;

    let currentRoute = '[post-login]';

    const routeFailures: string[] = [];
    const blockedMutations: string[] = [];
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(`${currentRoute} :: ${error.message}`);
    });

    page.on('response', (response) => {
      const request = response.request();
      const resourceType = request.resourceType();

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
        ['document', 'xhr', 'fetch'].includes(resourceType)
      ) {
        serverErrors.push(
          `${currentRoute} :: HTTP ${response.status()} ${request.method()} ${responseUrl.pathname}`,
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

      blockedMutations.push(
        `${currentRoute} :: ${method} ${request.url()}`,
      );

      await route.abort('blockedbyclient');
    });

    expect(adminRoutes.length).toBeGreaterThan(0);

    console.log(`ADMIN_MENU_ROUTES=${adminRoutes.length}`);

    for (const path of adminRoutes) {
      currentRoute = path;

      try {
        const response = await page.goto(path, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });

        await waitForAppReady(page);
        await page.waitForTimeout(800);

        const finalUrl = new URL(page.url());

        const finalPath =
          finalUrl.pathname.replace(/\/$/, '') || '/';

        const expectedPath =
          path.replace(/\/$/, '') || '/';

        if (finalPath !== expectedPath) {
          throw new Error(
            `redirect inesperado: esperado=${expectedPath} final=${finalPath}`,
          );
        }

        if (response && response.status() >= 400) {
          throw new Error(`HTTP ${response.status()}`);
        }

        await expectNoAccessDenied(page);
        await expectNoCriticalAppError(page);

        const bodyText = (
          await page.locator('body').innerText()
        ).trim();

        if (!bodyText) {
          throw new Error('body vacío');
        }

        const heading = await page
          .locator('h1, h2, [role="heading"]')
          .first()
          .innerText()
          .catch(() => '');

        console.log(
          `[PASS] ${path}${
            heading
              ? ` | ${heading.replace(/\s+/g, ' ').slice(0, 100)}`
              : ''
          }`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        routeFailures.push(`${path} :: ${message}`);
        console.log(`[FAIL] ${path} :: ${message}`);
      }
    }

    console.log('');
    console.log('=== ADMIN MENU ROUTE SUMMARY ===');
    console.log(`TOTAL=${adminRoutes.length}`);
    console.log(`ROUTE_FAILURES=${routeFailures.length}`);
    console.log(`BLOCKED_MUTATIONS=${blockedMutations.length}`);
    console.log(`PAGE_ERRORS=${pageErrors.length}`);
    console.log(`SERVER_5XX=${serverErrors.length}`);

    if (blockedMutations.length > 0) {
      console.log('');
      console.log('=== BLOCKED NON-READ REQUESTS ===');

      for (const entry of blockedMutations) {
        console.log(entry);
      }
    }

    if (pageErrors.length > 0) {
      console.log('');
      console.log('=== PAGE ERRORS ===');

      for (const entry of pageErrors) {
        console.log(entry);
      }
    }

    if (serverErrors.length > 0) {
      console.log('');
      console.log('=== SAME-ORIGIN SERVER 5XX ===');

      for (const entry of serverErrors) {
        console.log(entry);
      }
    }

    if (routeFailures.length > 0) {
      console.log('');
      console.log('=== ROUTE FAILURES ===');

      for (const entry of routeFailures) {
        console.log(entry);
      }
    }

    expect(
      blockedMutations,
      'Una ruta Admin intentó emitir una request mutativa durante navegación read-only.',
    ).toEqual([]);

    expect(
      pageErrors,
      'Se detectaron errores JavaScript no controlados.',
    ).toEqual([]);

    expect(
      serverErrors,
      'Se detectaron respuestas HTTP 5xx same-origin.',
    ).toEqual([]);

    expect(
      routeFailures,
      'Una o más rutas del menú Admin no superaron la cobertura read-only.',
    ).toEqual([]);
  });
});
