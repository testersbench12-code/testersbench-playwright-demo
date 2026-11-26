import { expect, test } from '@playwright/test';

test.describe('Negative / error state handling', () => {
  test('shows not-found page for missing routes and recovers to home', async ({ page }) => {
    const response = await page.goto('/missing.html');
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('error-title')).toHaveText('Page not found');
    await expect(page.getByTestId('error-message')).toContainText('does not exist');

    await page.getByTestId('error-home').click();
    await expect(page.getByTestId('home-title')).toBeVisible();
  });

  test('broken nav link lands on error page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-error').click();
    await expect(page.getByTestId('error-title')).toBeVisible();
  });
});
