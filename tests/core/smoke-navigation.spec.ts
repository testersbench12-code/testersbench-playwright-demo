import { expect, test } from '@playwright/test';

test.describe('Smoke & navigation', () => {
  test('loads home and navigates to form and items', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('brand')).toHaveText('TestersBench Demo');
    await expect(page.getByTestId('home-title')).toBeVisible();

    await page.getByTestId('nav-form').click();
    await expect(page).toHaveURL(/form\.html$/);
    await expect(page.getByTestId('form-title')).toHaveText('Contact form');

    await page.getByTestId('nav-items').click();
    await expect(page).toHaveURL(/items\.html$/);
    await expect(page.getByTestId('items-title')).toHaveText('Items');

    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('home-hero')).toBeVisible();
  });
});
