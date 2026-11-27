import type { Locator, Page } from '@playwright/test';

export class ErrorPage {
  readonly title: Locator;
  readonly message: Locator;
  readonly homeLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('error-title');
    this.message = page.getByTestId('error-message');
    this.homeLink = page.getByTestId('error-home');
  }

  async openMissingRoute(): Promise<void> {
    await this.page.goto('/missing.html');
  }

  async goHome(): Promise<void> {
    await this.homeLink.click();
  }
}
