import { chromium, type Page } from '@playwright/test';
import { adminCredentials, urls } from '../config';
import { setEmailCounter } from './emailCounter';

/**
 * Align local +N email counter with the highest sunny.lakhani+N account in admin Users.
 */
export async function seedRegistrationNumberFromAdminOnce(): Promise<void> {
  const key = '__freyachalice_seeded__';
  if ((globalThis as Record<string, unknown>)[key]) return;
  (globalThis as Record<string, unknown>)[key] = true;

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    await page.goto(urls.admin, { waitUntil: 'domcontentloaded' });
    const email = page.locator("[name='email']").first();
    if (await email.isVisible().catch(() => false)) {
      await email.fill(adminCredentials.email);
      await page.locator("[name='password']").fill(adminCredentials.password);
      await page.locator("xpath=//button[normalize-space()='Login']").click();
      await page.waitForTimeout(2000);
    }

    await page.goto(urls.users, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    let highest = 0;
    const account = /sunny\.lakhani\+(\d+)[A-Za-z]*@jhavtech\.com/gi;
    for (let i = 0; i < 25; i++) {
      const body = await page.locator('body').innerText();
      for (const match of body.matchAll(account)) {
        highest = Math.max(highest, Number.parseInt(match[1], 10));
      }
      const next = page.locator("xpath=//button[normalize-space()='Go to next page' and not(@disabled)]").first();
      if (!(await next.isVisible().catch(() => false)) || !(await next.isEnabled().catch(() => false))) {
        break;
      }
      await next.click();
      await page.waitForTimeout(1000);
    }

    if (highest > 0) setEmailCounter(highest);
    console.log(`Registration numbering seeded from admin at +${highest}.`);
    await context.close();
  } catch (error) {
    console.log(`Registration seeding skipped: ${(error as Error).message}`);
  } finally {
    await browser.close();
  }
}

export async function dismissVerificationSuccessPopupIfPresent(page: Page): Promise<void> {
  try {
    const text = await page.locator('body').innerText();
    if (!/Verification Successful/i.test(text)) return;
    await page.mouse.click(10, 10);
  } catch {
    /* ignore */
  }
}
