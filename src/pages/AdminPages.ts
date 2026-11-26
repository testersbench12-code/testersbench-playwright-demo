import type { Page } from '@playwright/test';
import { adminCredentials, adminFields, urls } from '../config';
import { bodyText, setReactInput, waitUntil } from '../helpers/dom';
import { dismissVerificationSuccessPopupIfPresent } from '../helpers/adminSeed';

export class AdminLoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(urls.admin, { waitUntil: 'domcontentloaded' });
    if (!this.page.url().includes('admin-freyas.jhavtechninjas.com.au')) {
      throw new Error(`Admin site did not open: ${this.page.url()}`);
    }
  }

  async login(email = adminCredentials.email, password = adminCredentials.password): Promise<void> {
    await waitUntil(
      this.page,
      async () =>
        (await this.page.locator("[name='email']").first().isVisible().catch(() => false)) ||
        this.page.url().includes('/users') ||
        this.page.url().includes('/verifications') ||
        (await this.page
          .locator("xpath=//a[contains(@href,'/verifications') or normalize-space()='Verifications']")
          .first().isVisible()
          .catch(() => false)),
      45,
    );

    const input = this.page.locator("[name='email']").first();
    if (!(await input.isVisible().catch(() => false))) return;

    await setReactInput(this.page, input, email);
    await setReactInput(this.page, this.page.locator("[name='password']").first(), password);
    await this.page.locator("xpath=//button[normalize-space()='Login']").click();

    const done = await waitUntil(
      this.page,
      async () => !(await this.page.locator("[name='email']").first().isVisible().catch(() => false)),
      45,
    );
    if (!done) throw new Error(`Admin login did not complete. URL: ${this.page.url()}`);
  }
}

export class AdminVerificationPage {
  constructor(private readonly page: Page) {}

  async openVerificationSection(): Promise<void> {
    const nav = this.page.locator("xpath=//a[normalize-space()='Verifications']").first();
    if (await nav.isVisible().catch(() => false)) await nav.click();
    else await this.page.goto(urls.verifications, { waitUntil: 'domcontentloaded' });
    await this.page
      .locator("input[placeholder*='Filter by email']")
      .first().waitFor({ state: 'visible', timeout: 45_000 });
  }

  async filterByEmail(email: string): Promise<void> {
    const filter = this.page.locator("input[placeholder*='Filter by email']").first();
    await filter.waitFor({ state: 'visible', timeout: 30_000 });
    await setReactInput(this.page, filter, email);
    await this.page
      .locator(`xpath=//tr[contains(.,'${email}')]//a[normalize-space()='View']`)
      .first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  async openVerificationView(email: string): Promise<void> {
    const view = this.page
      .locator(`xpath=//tr[contains(.,'${email}')]//a[normalize-space()='View']`)
      .first();
    await view.waitFor({ state: 'visible', timeout: 30_000 });
    try {
      await view.click();
    } catch {
      await view.evaluate((el) => (el as HTMLElement).click());
    }
    await this.page
      .locator("xpath=//button[normalize-space()='Approve']")
      .first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  async submitApproval(reason = adminFields.approvalReason): Promise<void> {
    const reasonInput = this.page
      .locator(
        "xpath=//textarea[contains(@placeholder,'Identity documents verified')] | //label[contains(normalize-space(),'Reason for approval')]/following::textarea[1]",
      )
      .first();
    await setReactInput(this.page, reasonInput, reason);
    await this.page.locator("xpath=//button[normalize-space()='Approve']").first().click();
    const ok = await waitUntil(this.page, async () => this.isApprovalSuccessful(), 30);
    if (!ok) throw new Error('Admin approval did not reach APPROVED.');
  }

  async isApprovalSuccessful(): Promise<boolean> {
    return /APPROVED/i.test(await bodyText(this.page));
  }

  async completePostApprovalFlow(): Promise<void> {
    const back = this.page.locator("xpath=//a[normalize-space()='Back to verifications']").first();
    if (await back.isVisible().catch(() => false)) await back.click();
    else await this.page.goto(urls.verifications, { waitUntil: 'domcontentloaded' });

    await this.page
      .locator("input[placeholder*='Filter by email']")
      .first().waitFor({ state: 'visible', timeout: 30_000 });
    await dismissVerificationSuccessPopupIfPresent(this.page);
    await this.page.goto(urls.app, { waitUntil: 'domcontentloaded' });
    await dismissVerificationSuccessPopupIfPresent(this.page);
  }
}
