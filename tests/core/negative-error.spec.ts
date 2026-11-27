import { expect, test } from '../../src/fixtures/demoFixtures';

test.describe('Negative / error state handling (API + UI)', () => {
  test('shows not-found page for missing routes and recovers to home', async ({
    page,
    request,
    errorPage,
    homePage,
  }) => {
    const apiMissing = await request.get('/api/does-not-exist');
    expect(apiMissing.status()).toBe(404);
    expect((await apiMissing.json()).ok).toBeFalsy();

    const response = await page.goto('/missing.html');
    expect(response?.status()).toBe(404);
    await expect(errorPage.title).toHaveText('Page not found');
    await expect(errorPage.message).toContainText('does not exist');

    await errorPage.goHome();
    await expect(homePage.title).toBeVisible();
  });

  test('broken nav link lands on error page', async ({ homePage, errorPage }) => {
    await homePage.open();
    await homePage.openBrokenLink();
    await expect(errorPage.title).toBeVisible();
  });

  test('unauthenticated items API is rejected', async ({ playwright }) => {
    const anon = await playwright.request.newContext({
      baseURL: 'http://127.0.0.1:4173',
      // Explicit empty state — otherwise project storageState is inherited.
      storageState: { cookies: [], origins: [] },
    });
    const response = await anon.get('/api/items');
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe('Unauthorized');
    await anon.dispose();
  });
});
