import { expect, test } from '@playwright/test';

test.describe('Responsive viewport', () => {
  test('home layout remains usable on mobile and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByTestId('brand')).toBeVisible();
    await expect(page.getByTestId('nav-form')).toBeVisible();
    await expect(page.getByTestId('home-title')).toBeVisible();

    const mobileBox = await page.getByTestId('home-title').boundingBox();
    expect(mobileBox).not.toBeNull();
    expect(mobileBox!.width).toBeLessThanOrEqual(375);

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId('home-hero')).toBeVisible();
    await expect(page.getByTestId('nav-items')).toBeVisible();
  });
});
