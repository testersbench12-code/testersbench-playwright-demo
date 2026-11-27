import { expect, test } from '../../src/fixtures/demoFixtures';

test.describe('Responsive viewport', () => {
  test('home layout remains usable on mobile and desktop', async ({ homePage }) => {
    await homePage.page.setViewportSize({ width: 375, height: 812 });
    await homePage.open();
    await expect(homePage.brand).toBeVisible();
    await expect(homePage.navForm).toBeVisible();
    await expect(homePage.title).toBeVisible();

    const mobileBox = await homePage.title.boundingBox();
    expect(mobileBox).not.toBeNull();
    expect(mobileBox!.width).toBeLessThanOrEqual(375);

    await homePage.page.setViewportSize({ width: 1280, height: 720 });
    await expect(homePage.hero).toBeVisible();
    await expect(homePage.navItems).toBeVisible();
  });
});
