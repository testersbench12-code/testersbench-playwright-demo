import { expect, test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { authFile, demoAuth } from '../src/config/demoAuth';
import { LoginPage } from '../src/pages/demo/LoginPage';

setup('authenticate and save storageState', async ({ page, request, playwright }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect((await health.json()).ok).toBeTruthy();

  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginAndWaitForSession(demoAuth.email, demoAuth.password);

  await expect(page.getByTestId('home-auth-state')).toContainText(demoAuth.email);

  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === 'tb_session')).toBeTruthy();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });

  const authed = await playwright.request.newContext({
    storageState: authFile,
    baseURL: 'http://127.0.0.1:4173',
  });
  const meAuthed = await authed.get('/api/me');
  expect(meAuthed.ok()).toBeTruthy();
  expect((await meAuthed.json()).user.email).toBe(demoAuth.email);
  await authed.dispose();
});
