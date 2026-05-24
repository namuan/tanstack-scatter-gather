import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dashboard' }).click();
  });

  test('shows loading state initially', async ({ page }) => {
    await expect(page.getByText('Loading dashboard from 4 sources...')).toBeVisible({ timeout: 1000 });
  });

  test('displays all dashboard cards on success', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    const cards = page.locator('.dashboard-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const headers = await cards.locator('h3').allTextContents();
    expect(headers).toEqual(
      expect.arrayContaining(['analytics', 'userData', 'notifications'])
    );
  });

  test('shows metadata with source counts', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    const status = page.locator('.status');
    await expect(status).toContainText('Loaded');
    await expect(status).toContainText('/4 sources');
  });

  test('each dashboard card contains valid JSON data', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    const cards = page.locator('.dashboard-card');
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const pre = cards.nth(i).locator('pre');
      const text = await pre.textContent();
      expect(text).toBeTruthy();
      const parsed = JSON.parse(text!);
      expect(parsed).toBeTruthy();
    }
  });

  test('shows dashboard header with title and refresh button', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('.dashboard-header h2')).toHaveText('Dashboard');
    await expect(page.getByRole('button', { name: 'Refresh All' })).toBeVisible();
  });

  test('refresh button triggers data reload', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

    const refreshBtn = page.getByRole('button', { name: 'Refresh All' });
    await refreshBtn.click();

    await expect(page.locator('.dashboard-card')).toBeVisible({ timeout: 10000 });
  });
});
