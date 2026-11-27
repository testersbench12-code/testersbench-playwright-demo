import type { Locator, Page, Response } from '@playwright/test';

export class ItemsPage {
  readonly title: Locator;
  readonly input: Locator;
  readonly addButton: Locator;
  readonly list: Locator;
  readonly emptyState: Locator;
  readonly errorMessage: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('items-title');
    this.input = page.getByTestId('item-input');
    this.addButton = page.getByTestId('item-add');
    this.list = page.getByTestId('item-list');
    this.emptyState = page.getByTestId('item-empty');
    this.errorMessage = page.getByTestId('items-error');
    this.rows = page.getByTestId('item-row');
  }

  async open(): Promise<void> {
    await this.page.goto('/items.html');
  }

  async addItem(title: string): Promise<Response> {
    await this.input.fill(title);
    const wait = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/items') &&
        response.request().method() === 'POST' &&
        !response.url().match(/\/api\/items\/.+/),
    );
    await this.addButton.click();
    return wait;
  }

  rowByTitle(title: string): Locator {
    return this.rows.filter({ has: this.page.getByTestId('item-text').filter({ hasText: title }) });
  }

  async deleteItem(title: string): Promise<Response> {
    const wait = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/items/') && response.request().method() === 'DELETE',
    );
    await this.rowByTitle(title).getByTestId('item-delete').click();
    return wait;
  }
}
