import { expect, Page, test } from '@playwright/test';
import { waitForAppReady } from './assertions';

type LoginOptions = {
  email?: string;
  password?: string;
  role?: 'admin' | 'usuario' | 'socio';
};

export function getAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
    role: (process.env.E2E_ADMIN_ROLE ?? 'admin') as 'admin' | 'usuario' | 'socio',
  };
}

export function skipIfMissingAdminCredentials() {
  const { email, password } = getAdminCredentials();
  test.skip(!email || !password, 'Definir E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar pruebas autenticadas.');
}

export async function loginAsAdmin(page: Page, options: LoginOptions = {}) {
  const defaults = getAdminCredentials();
  const email = options.email ?? defaults.email;
  const password = options.password ?? defaults.password;
  const role = options.role ?? defaults.role;

  if (!email || !password) {
    throw new Error('Faltan credenciales E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD.');
  }

  const loginPath = role === 'socio' ? '/auth/login/socio' : '/auth/login/admin';

  await page.goto(loginPath);
  await waitForAppReady(page);

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Iniciar sesión/i }).click();

  await page.waitForURL(/\/(dashboard|auth\/change-password)(\/.*)?$/, { timeout: 20_000 });

  if (page.url().includes('/auth/change-password')) {
    throw new Error('El usuario E2E tiene must_change_password=true. Usar un admin QA con contraseña definitiva.');
  }

  await expect(page).toHaveURL(/\/dashboard(\/.*)?$/);
  await waitForAppReady(page);
}
