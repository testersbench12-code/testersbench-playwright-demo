import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly title: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('login-title');
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('login-password');
    this.submitButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('login-error');
  }

  async open(): Promise<void> {
    await this.page.goto('/login.html');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForSession(email: string, password: string): Promise<void> {
    const loginResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/login') &&
        response.request().method() === 'POST',
    );
    await this.login(email, password);
    const response = await loginResponsePromise;
    if (!response.ok()) {
      throw new Error(`Login API failed with status ${response.status()}`);
    }
    await this.page.waitForURL(/index\.html|\/$/);
  }
}
