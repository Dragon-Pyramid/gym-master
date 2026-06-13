import { expect, test } from '@playwright/test';
import { expectNoCriticalAppError, waitForAppReady } from './helpers/assertions';
import { loginAsAdmin, skipIfMissingAdminCredentials } from './helpers/auth';

const criticalRoutes = [
  { path: '/dashboard', label: /Gym Master|Inicio|Dashboard/i },
  { path: '/dashboard/socios', label: /Socios|Listado de Socios/i },
  { path: '/dashboard/pagos', label: /Pagos|Listado de Pagos/i },
  { path: '/dashboard/asistencias', label: /Asistencias/i },
  { path: '/dashboard/actividades', label: /Actividades|turnos|cupos/i },
  { path: '/dashboard/socios-ranking-bonificacion', label: /Ranking|Bonificación/i },
  { path: '/dashboard/equipamientos', label: /Equipamientos|mantenimiento/i },
  { path: '/dashboard/ventas', label: /Ventas/i },
  { path: '/dashboard/compras', label: /Compras/i },
  { path: '/dashboard/finanzas', label: /Finanzas|BI/i },
  { path: '/dashboard/parametrizacion', label: /Parametrización|Catálogos/i },
];

test.describe('Smoke E2E autenticado - rutas críticas admin', () => {
  test.beforeEach(() => {
    skipIfMissingAdminCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const route of criticalRoutes) {
    test(`carga ${route.path} sin errores críticos`, async ({ page }) => {
      await page.goto(route.path);
      await waitForAppReady(page);

      await expect(page).toHaveURL(new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      await expect(page.locator('body')).toContainText(route.label);
      await expectNoCriticalAppError(page);
    });
  }
});
