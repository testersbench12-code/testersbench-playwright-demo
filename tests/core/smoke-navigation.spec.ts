import { expect, test } from '../../src/fixtures/demoFixtures';
import { demoAuth } from '../../src/config/demoAuth';

test.describe('Smoke & navigation + auth session', () => {
  test('API health is green and authenticated home navigation works', async ({
    page,
    request,
    homePage,
    formPage,
    itemsPage,
  }) => {
    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();
    expect((await health.json()).ok).toBeTruthy();

    const me = await request.get('/api/me');
    expect(me.ok()).toBeTruthy();
    expect((await me.json()).user.email).toBe(demoAuth.email);

    await homePage.open();
    await expect(homePage.brand).toHaveText('TestersBench Demo');
    await expect(homePage.title).toBeVisible();
    await expect(homePage.authState).toContainText(demoAuth.email);

    await homePage.goToForm();
    await expect(page).toHaveURL(/form\.html$/);
    await expect(formPage.title).toHaveText('Contact form');

    await homePage.goToItems();
    await expect(page).toHaveURL(/items\.html$/);
    await expect(itemsPage.title).toHaveText('Items');

    await homePage.goToHome();
    await expect(homePage.hero).toBeVisible();
  });
});
