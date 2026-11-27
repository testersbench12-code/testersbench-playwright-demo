import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly brand: Locator;
  readonly title: Locator;
  readonly hero: Locator;
  readonly authState: Locator;
  readonly authUser: Locator;
  readonly navHome: Locator;
  readonly navForm: Locator;
  readonly navItems: Locator;
  readonly navError: Locator;
  readonly navLogin: Locator;

  constructor(readonly page: Page) {
    this.brand = page.getByTestId('brand');
    this.title = page.getByTestId('home-title');
    this.hero = page.getByTestId('home-hero');
    this.authState = page.getByTestId('home-auth-state');
    this.authUser = page.getByTestId('auth-user');
    this.navHome = page.getByTestId('nav-home');
    this.navForm = page.getByTestId('nav-form');
    this.navItems = page.getByTestId('nav-items');
    this.navError = page.getByTestId('nav-error');
    this.navLogin = page.getByTestId('nav-login');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async goToForm(): Promise<void> {
    await this.navForm.click();
  }

  async goToItems(): Promise<void> {
    await this.navItems.click();
  }

  async goToHome(): Promise<void> {
    await this.navHome.click();
  }

  async openBrokenLink(): Promise<void> {
    await this.navError.click();
  }
}
