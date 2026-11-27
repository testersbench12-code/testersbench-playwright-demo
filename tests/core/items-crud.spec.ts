import { expect, test } from '../../src/fixtures/demoFixtures';

test.describe('Key workflow / CRUD state (API + UI)', () => {
  test('adds and deletes an item with hybrid API/UI checks', async ({ request, itemsPage }, testInfo) => {
    const title = `Notebook-${testInfo.project.name}-${testInfo.parallelIndex}-${Date.now()}`;

    const before = await request.get('/api/items');
    expect(before.ok()).toBeTruthy();
    const beforeCount = (await before.json()).items.length;

    await itemsPage.open();
    const createResponse = await itemsPage.addItem(title);
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    expect(created.ok).toBeTruthy();
    expect(created.item.title).toBe(title);
    expect(created.items.length).toBe(beforeCount + 1);

    await expect(itemsPage.rowByTitle(title)).toHaveCount(1);
    await expect(itemsPage.rowByTitle(title).getByTestId('item-text')).toHaveText(title);

    const listAfterCreate = await request.get('/api/items');
    const listed = await listAfterCreate.json();
    expect(listed.items.some((item: { title: string }) => item.title === title)).toBeTruthy();

    const deleteResponse = await itemsPage.deleteItem(title);
    expect(deleteResponse.ok()).toBeTruthy();
    expect(
      (await deleteResponse.json()).items.some((item: { title: string }) => item.title === title),
    ).toBeFalsy();

    await expect(itemsPage.rowByTitle(title)).toHaveCount(0);
  });
});
