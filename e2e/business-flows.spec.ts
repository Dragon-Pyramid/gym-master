import { expect, test } from '@playwright/test';
import { expectNoCriticalAppError, waitForAppReady } from './helpers/assertions';
import { loginAsAdmin, skipIfMissingAdminCredentials } from './helpers/auth';

test.describe('Smoke E2E - flujos comerciales principales', () => {
  test.beforeEach(() => {
    skipIfMissingAdminCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('pagos expone registro manual y exportaciones', async ({ page }) => {
    await page.goto('/dashboard/pagos');
    await waitForAppReady(page);

    await expect(page.getByRole('button', { name: /Registrar Pago Manual/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Descargar PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible();
    await expectNoCriticalAppError(page);
  });

  test('actividades muestra BI, creaciÃ³n de turno y catÃ¡logo de ubicaciones', async ({ page }) => {
    await page.goto('/dashboard/actividades');
    await waitForAppReady(page);

    await expect(page.getByText(/BI de turnos y cupos/i)).toBeVisible();
    await expect(page.getByText(/Crear\s*\/\s*editar turno/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Crear turno/i })).toBeVisible();
    await expectNoCriticalAppError(page);
  });

  test('ranking y bonificaciÃ³n muestra ranking, exportaciones y acciones comerciales', async ({ page }) => {
    await page.goto('/dashboard/socios-ranking-bonificacion');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { name: /^Ranking mensual$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Excel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Actualizar/i })).toBeVisible();
    await expectNoCriticalAppError(page);
  });

  test('equipamiento expone reporte PDF y filtros operativos', async ({ page }) => {
    await page.goto('/dashboard/equipamientos');
    await waitForAppReady(page);

    await expect(page.getByText(/Listado de equipamientos/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Descargar PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Filtros/i })).toBeVisible();
    await expectNoCriticalAppError(page);
  });
});

