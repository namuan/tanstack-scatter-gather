import { test, expect } from '@playwright/test';

test.describe('Search Aggregator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search Aggregator' }).click();
  });

  test('shows loading indicator while searching', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('test');

    await expect(page.getByText('Searching across 3 sources...')).toBeVisible({ timeout: 1000 });
  });

  test('displays results from multiple search sources on success', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('scatter');

    await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.metadata')).toContainText('Found results from');
    await expect(page.locator('.metadata')).toContainText('/3 sources');

    const sourceHeaders = page.locator('.source-results h3');
    await expect(sourceHeaders).toHaveText([
      /^GOOGLE/,
      /^BING/,
      /^DUCKDUCKGO/,
    ]);
  });

  test('shows result counts per source', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('scatter');

    await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });

    const sourceResults = page.locator('.source-results');
    const count = await sourceResults.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('shows error when not enough sources respond', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    // Use a worker URL that will fail by hitting non-existent endpoints
    await input.fill('_error_trigger');

    const errorMsg = page.getByText('Search failed: Unable to gather enough results');
    await expect(errorMsg).toBeVisible({ timeout: 15000 });
  });

  test('does not search with short query', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('ab');

    await page.waitForTimeout(500);
    await expect(page.locator('.metadata')).not.toBeVisible();
  });

  test('shows refresh button and triggers refetch', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('scatter');

    await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });

    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();
    await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });
  });

  test('displays result items with JSON content', async ({ page }) => {
    const input = page.getByPlaceholder('Search...');
    await input.fill('scatter');

    await expect(page.locator('.metadata')).toBeVisible({ timeout: 10000 });

    const resultItems = page.locator('.result-item');
    const count = await resultItems.count();
    expect(count).toBeGreaterThan(0);

    const text = await resultItems.first().textContent();
    expect(text).toContain('title');
    expect(text).toContain('snippet');
  });
});
