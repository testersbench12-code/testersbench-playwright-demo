import { expect, test } from '@playwright/test';

test.describe('Form input & validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/form.html');
  });

  test('shows required validation when submitting empty form', async ({ page }) => {
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('error-name')).toHaveText('Name is required');
    await expect(page.getByTestId('error-email')).toHaveText('Email is required');
    await expect(page.getByTestId('form-success')).toBeHidden();
  });

  test('rejects invalid email and accepts valid input', async ({ page }) => {
    await page.getByTestId('input-name').fill('Ada Lovelace');
    await page.getByTestId('input-email').fill('not-an-email');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('error-email')).toHaveText('Enter a valid email');

    await page.getByTestId('input-email').fill('ada@example.com');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('form-success')).toBeVisible();
    await expect(page.getByTestId('form-success')).toHaveText('Form submitted successfully');
  });
});
