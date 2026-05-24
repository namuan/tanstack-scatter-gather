import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.describe('Search Aggregator with failures', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Search Aggregator' }).click();
    });

    test('shows error state when all sources fail', async ({ page }) => {
      const input = page.getByPlaceholder('Search...');
      // All searches will fail on the mock server with high error rate

      await page.route('**/api/search/**', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'simulated failure' }) });
      });

      await input.fill('test');

      await expect(page.getByText('Search failed: Unable to gather enough results')).toBeVisible({ timeout: 15000 });
    });

    test('shows partial results when some sources fail', async ({ page }) => {
      const input = page.getByPlaceholder('Search...');

      await page.route('**/api/search/google**', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'google down' }) });
      });

      await input.fill('scatter');

      // Bing and duckduckgo should still succeed — majority is 2/3
      await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });

      const sourceHeaders = page.locator('.source-results h3');
      const texts = await sourceHeaders.allTextContents();
      expect(texts.some(t => t.startsWith('GOOGLE'))).toBe(false);
      expect(texts.some(t => t.startsWith('BING'))).toBe(true);
      expect(texts.some(t => t.startsWith('DUCKDUCKGO'))).toBe(true);
    });

    test('shows error when only one source succeeds with majority strategy', async ({ page }) => {
      const input = page.getByPlaceholder('Search...');

      await page.route('**/api/search/**', route => {
        const url = route.request().url();
        if (url.includes('/bing') || url.includes('/ddg')) {
          route.fulfill({ status: 500, body: JSON.stringify({ error: 'down' }) });
        } else {
          route.continue();
        }
      });

      await input.fill('scatter');

      await expect(page.getByText('Search failed: Unable to gather enough results')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Dashboard with failures', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Dashboard' }).click();
    });

    test('shows partial failure warning', async ({ page }) => {
      await page.route('**/api/analytics/dashboard', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'analytics down' }) });
      });

      await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('.status')).toContainText('unavailable');
      await expect(page.locator('.error-card')).toBeVisible();
    });

    test('failed source shows retry button', async ({ page }) => {
      await page.route('**/api/users/current', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'users down' }) });
      });

      await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

      const errorCards = page.locator('.error-card');
      await expect(errorCards).toBeVisible();
      await expect(errorCards.locator('button', { hasText: 'Retry' })).toBeVisible();
    });

    test('retry button on error card triggers refetch', async ({ page }) => {
      let failCount = 0;
      await page.route('**/api/notifications/unread', route => {
        failCount++;
        if (failCount <= 1) {
          route.fulfill({ status: 500, body: JSON.stringify({ error: 'notif down' }) });
        } else {
          route.continue();
        }
      });

      await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });

      const retryButton = page.locator('.error-card button', { hasText: 'Retry' }).first();
      await expect(retryButton).toBeVisible();

      await retryButton.click();
      await expect(page.locator('.error-card')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Tab navigation works after errors', () => {
    test('can switch between all tabs without crash', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: 'Dashboard' }).click();
      await page.getByRole('button', { name: 'Image Analyzer' }).click();
      await page.getByRole('button', { name: 'Search Aggregator' }).click();

      await expect(page.getByPlaceholder('Search...')).toBeVisible();
    });
  });
});
