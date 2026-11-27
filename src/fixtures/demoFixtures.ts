import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/demo/LoginPage';
import { HomePage } from '../pages/demo/HomePage';
import { FormPage } from '../pages/demo/FormPage';
import { ItemsPage } from '../pages/demo/ItemsPage';
import { ErrorPage } from '../pages/demo/ErrorPage';

type DemoFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  formPage: FormPage;
  itemsPage: ItemsPage;
  errorPage: ErrorPage;
};

export const test = base.extend<DemoFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  formPage: async ({ page }, use) => {
    await use(new FormPage(page));
  },
  itemsPage: async ({ page }, use) => {
    await use(new ItemsPage(page));
  },
  errorPage: async ({ page }, use) => {
    await use(new ErrorPage(page));
  },
});

export { expect };
