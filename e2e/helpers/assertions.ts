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
