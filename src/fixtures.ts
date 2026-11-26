import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const outlookProfile = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'FreyasChalse',
  'chrome-outlook-profile',
);

const headless = process.env.PLAYWRIGHT_HEADLESS === 'true';

type Fixtures = {
  context: BrowserContext;
  page: Page;
};

/**
 * Persistent Chrome context so Outlook OTP session cookies are reused.
 */
export const test = base.extend<Fixtures>({
  context: async ({}, use) => {
    fs.mkdirSync(outlookProfile, { recursive: true });
    const context = await chromium.launchPersistentContext(outlookProfile, {
      channel: 'chrome',
      headless,
      viewport: null,
      args: [
        '--start-maximized',
        '--use-fake-ui-for-media-stream',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });
    await context.grantPermissions(['camera'], {
      origin: 'https://app-freyas.jhavtechninjas.com.au',
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export const expect = test.expect;
