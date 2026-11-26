import type { Page } from '@playwright/test';
import { registerCredentials, urls } from '../config';
import { bodyText, setReactInput, waitUntil } from '../helpers/dom';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(urls.login, { waitUntil: 'networkidle' });
    await this.page.locator("[name='email']").first().waitFor({ state: 'visible', timeout: 20_000 });
    await this.page.waitForTimeout(500);
  }

  async login(email: string, password: string): Promise<void> {
    await setReactInput(this.page, this.page.locator("[name='email']").first(), email);
    await setReactInput(this.page, this.page.locator("[name='password']").first(), password);
    await this.page.locator("button[type='submit']").first().click();
    const left = await waitUntil(
      this.page,
      async () => !this.page.url().toLowerCase().includes('/login'),
      30,
    );
    if (!left) {
      throw new Error(`Timed out waiting to leave login. URL=${this.page.url()} body=${await bodyText(this.page)}`);
    }
  }
}
