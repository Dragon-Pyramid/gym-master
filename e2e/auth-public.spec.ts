import { expect, test } from '@playwright/test';
import { expectNoCriticalAppError, waitForAppReady } from './helpers/assertions';

test.describe('Auth público', () => {
  test('muestra selector de ingreso para socios y administración', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForAppReady(page);

    await expect(page.getByRole('link', { name: /Entrar como socio/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Entrar al panel/i })).toBeVisible();
    await expectNoCriticalAppError(page);
  });

  test('muestra formulario de administración bloqueado a rol admin/usuario', async ({ page }) => {
    await page.goto('/auth/login/admin');
    await waitForAppReady(page);

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible();    await expectNoCriticalAppError(page);
  });

  test('redirige rutas protegidas sin sesión hacia login', async ({ page }) => {
    await page.goto('/dashboard/socios');
    await page.waitForURL(/\/auth\/login(\/.*)?$/, { timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Entrar al panel/i })).toBeVisible();
  });
});
