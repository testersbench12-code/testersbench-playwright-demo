import { expect, test } from '@playwright/test';

test.describe('Key workflow / CRUD state', () => {
  test('adds and deletes an item in the list', async ({ page }) => {
    await page.goto('/items.html');
    await expect(page.getByTestId('item-empty')).toBeVisible();

    await page.getByTestId('item-input').fill('Notebook');
    await page.getByTestId('item-add').click();

    await expect(page.getByTestId('item-empty')).toBeHidden();
    await expect(page.getByTestId('item-row')).toHaveCount(1);
    await expect(page.getByTestId('item-text')).toHaveText('Notebook');

    await page.getByTestId('item-delete').click();
    await expect(page.getByTestId('item-row')).toHaveCount(0);
    await expect(page.getByTestId('item-empty')).toBeVisible();
  });
});
