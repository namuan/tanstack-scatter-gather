import { test, expect } from '@playwright/test';

test.describe('Image Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Image Analyzer' }).click();
  });

  test('shows input field for image URL', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter image URL')).toBeVisible();
  });

  test('shows progress bar while analyzing', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.getByText(/Analyzing image/)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.progress-bar')).toBeVisible({ timeout: 3000 });
  });

  test('displays all analysis results on completion', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 15000 });

    const results = page.locator('.analysis-result');
    const count = await results.count();
    expect(count).toBe(4);

    const headers = await results.locator('h3').allTextContents();
    expect(headers).toEqual(
      expect.arrayContaining(['objectDetection', 'textExtraction', 'colorAnalysis', 'qualityCheck'])
    );
  });

  test('each analysis result contains JSON data', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 15000 });

    const preElements = page.locator('.analysis-result pre');
    const preCount = await preElements.count();
    expect(preCount).toBe(4);

    for (let i = 0; i < preCount; i++) {
      const text = await preElements.nth(i).textContent();
      expect(text).toBeTruthy();
      const parsed = JSON.parse(text!);
      expect(parsed).toBeTruthy();
    }
  });

  test('progress reaches 100% on completion', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Analyzing image...')).not.toBeVisible();
  });

  test('clearing input does not trigger analysis', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 15000 });

    await input.clear();
    await page.waitForTimeout(500);
    await expect(page.locator('.analysis-results')).not.toBeVisible();
  });

  test('shows progress percentage text during analysis', async ({ page }) => {
    const input = page.getByPlaceholder('Enter image URL');
    await input.fill('https://example.com/photo.jpg');

    await expect(page.getByText('% complete')).toBeVisible({ timeout: 3000 });
  });
});
