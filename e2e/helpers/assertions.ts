import { expect, Page } from '@playwright/test';

const CRITICAL_ERROR_PATTERNS = [
  /Application error/i,
  /Unhandled Runtime Error/i,
  /Internal Server Error/i,
  /Failed to compile/i,
  /ChunkLoadError/i,
  /TypeError:\s+Cannot/i,
];

export async function expectNoCriticalAppError(page: Page) {
  const body = page.locator('body');

  for (const pattern of CRITICAL_ERROR_PATTERNS) {
    await expect(body).not.toContainText(pattern);
  }
}

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await expectNoCriticalAppError(page);
}

export async function expectNoAccessDenied(page: Page) {
  const body = page.locator('body');

  await expect(body).not.toContainText(/USTED NO TIENE ACCESO A ESTE MENÚ/i);
  await expect(body).not.toContainText(/Tu usuario no tiene permisos para ingresar a esta sección/i);
}
