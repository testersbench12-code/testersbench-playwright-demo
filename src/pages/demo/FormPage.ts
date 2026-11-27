import type { Locator, Page, Response } from '@playwright/test';

export class FormPage {
  readonly title: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('form-title');
    this.nameInput = page.getByTestId('input-name');
    this.emailInput = page.getByTestId('input-email');
    this.nameError = page.getByTestId('error-name');
    this.emailError = page.getByTestId('error-email');
    this.submitButton = page.getByTestId('btn-submit');
    this.successMessage = page.getByTestId('form-success');
  }

  async open(): Promise<void> {
    await this.page.goto('/form.html');
  }

  async fill(name: string, email: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async submitAndWaitForApi(): Promise<Response> {
    const wait = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/contact') && response.request().method() === 'POST',
    );
    await this.submit();
    return wait;
  }
}
