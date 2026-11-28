import type { Page } from '@playwright/test';
import { appHostname, cookieDomainsFor, registerCredentials, registerFields, urls } from '../config';
import { emailAt, getNextStartNumber, setEmailCounter } from '../helpers/emailCounter';
import { bodyText, setReactInput, waitUntil, xpathLiteral } from '../helpers/dom';
import { seedRegistrationNumberFromAdminOnce } from '../helpers/adminSeed';
import { waitForOtp } from '../helpers/outlookOtp';
import { LoginPage } from './LoginPage';

const loc = {
  accountMenu:
    "xpath=//button[contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'account menu')]",
  signOut:
    "xpath=//*[self::button or self::a or self::div[@role='menuitem']][contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'sign out') or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'log out') or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'logout')]",
  next: "xpath=//button[normalize-space()='Next']",
  displayName: "[name='displayName']",
  bio: "[name='bio']",
  email: "input[name='email'], input[type='email']",
  accessCode:
    "xpath=//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'access code')]",
  verify: "xpath=//button[normalize-space()='Verify']",
  otpInputs: "xpath=//input[@inputmode='numeric' and (@maxlength='1' or @maxlength='6')]",
  otpSingle: "xpath=//input[@inputmode='numeric' and @maxlength='6']",
  password: "[name='password']",
  confirmPassword: "[name='confirmPassword']",
  locationSelect: "[name='location']",
  citySelect: "[name='city']",
  locationCombo:
    "xpath=//button[@role='combobox' and @name='location'] | //label[contains(.,'Location')]/following::button[@role='combobox'][1]",
  cityCombo:
    "xpath=//button[@role='combobox' and @name='city'] | //label[contains(.,'City')]/following::button[@role='combobox'][1]",
  createAccount: "xpath=//button[normalize-space()='Create an Account']",
  step: (heading: string) => `xpath=//h2[normalize-space()=${xpathLiteral(heading)}]`,
  option: (heading: string, option: string) =>
    `xpath=//h2[normalize-space()=${xpathLiteral(heading)}]/following::button[normalize-space()=${xpathLiteral(option)}][1]`,
  picker: (heading: string, column: number, value: string) =>
    `xpath=//h2[normalize-space()=${xpathLiteral(heading)}]/following::div[contains(@class,'overflow-y-auto')][${column}]//div[contains(@class,'snap-center') and normalize-space()=${xpathLiteral(value)}]`,
  locationOption: (value: string) =>
    `xpath=//*[@role='option'][contains(normalize-space(),${xpathLiteral(value)})]`,
  cityOption: (value: string) =>
    `xpath=//*[@role='option'][contains(normalize-space(),${xpathLiteral(value)})]`,
};

export class RegisterPage {
  private otpRequestedAt = new Date();

  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(urls.register, { waitUntil: 'networkidle' });
    if (await this.isGenderStepVisible()) return;

    if (await this.isLoggedInToApp()) {
      await this.signOutFromApp();
    }

    await this.page.goto(urls.register, { waitUntil: 'networkidle' });
    await this.waitForHeading('What is your gender?');
  }

  async registerWomanProfile(): Promise<string> {
    await seedRegistrationNumberFromAdminOnce();
    const start = getNextStartNumber();
    await this.registerUpToEmailStep(registerFields.woman, emailAt(start));
    const email = await this.resolveAvailableEmail(start);
    await this.completeOtpVerification(email);
    await this.completePasswordStep();
    await this.signInAfterRegistrationIfNeeded(email);
    return email;
  }

  private async registerUpToEmailStep(profileType: string, emailForDisplayName: string): Promise<void> {
    await this.choose('What is your gender?', profileType);
    await this.choose('What is your orientation?', registerFields.orientation);
    await this.waitForHeading('When is your birthday?');
    await this.click(loc.picker('When is your birthday?', 1, registerFields.birthDay));
    await this.click(loc.picker('When is your birthday?', 2, registerFields.birthMonth));
    await this.click(loc.picker('When is your birthday?', 3, registerFields.birthYear));
    await this.next();
    await this.choose('What is your relationship status?', registerFields.relationshipStatus);
    await this.choose('What is your body type?', registerFields.bodyType);
    await this.waitForHeading('What is your height?');
    await this.click(loc.picker('What is your height?', 1, registerFields.height));
    await this.next();

    await this.waitForHeading('Who are you looking for?');
    for (const option of registerFields.lookingForOptions) {
      await this.click(loc.option('Who are you looking for?', option));
    }
    await this.next();
    await this.waitForHeading('What is your age preference?');
    await this.next();
    await this.waitForHeading('What is you relationship preference?');
    for (const option of registerFields.relationshipPreferences) {
      await this.click(loc.option('What is you relationship preference?', option));
    }
    await this.next();

    await this.waitForHeading('Provide a Display Name');
    const suffix = emailForDisplayName.split('+')[1].split('@')[0];
    await setReactInput(this.page, this.page.locator(loc.displayName).first(), `jhvatechwomen${suffix}`);
    await this.next();
    await this.waitForHeading('Tell us about yourself');
    await setReactInput(this.page, this.page.locator(loc.bio).first(), registerFields.bio);
    await this.next();
    await this.waitForHeading('Create an Account');
  }

  private async resolveAvailableEmail(startNumber: number): Promise<string> {
    for (let number = startNumber; number < startNumber + 50; number++) {
      const email = emailAt(number);
      await setReactInput(this.page, this.page.locator(loc.email).first(), email);
      await this.click(loc.accessCode);
      const responded = await waitUntil(
        this.page,
        async () => (await this.isOtpStep()) || (await this.bodyContains(registerFields.emailExistsMessage)),
        45,
      );
      if (!responded) throw new Error(`No email response for ${email}.`);
      if (await this.isOtpStep()) {
        this.otpRequestedAt = new Date();
        setEmailCounter(number);
        return email;
      }
      await this.page.locator(loc.email).first().fill('');
    }
    throw new Error('Unable to find an available registration email.');
  }

  private async completeOtpVerification(email: string): Promise<void> {
    const otp = await waitForOtp(this.page, email, 8 * 60_000, this.otpRequestedAt);
    await this.enterOtp(otp);
    await this.click(loc.verify);
    const ok = await waitUntil(
      this.page,
      async () => this.page.locator(loc.password).first().isVisible(),
      45,
    );
    if (!ok) {
      throw new Error(
        `OTP verify did not reach password step for ${email}. OTP=${otp} URL=${this.page.url()}`,
      );
    }
  }

  private async enterOtp(otp: string): Promise<void> {
    const single = this.page.locator(loc.otpSingle).first();
    if ((await single.count()) > 0 && (await single.isVisible().catch(() => false))) {
      await setReactInput(this.page, single, otp);
      return;
    }
    const inputs = this.page.locator(loc.otpInputs);
    for (let i = 0; i < otp.length; i++) {
      const box = inputs.nth(i);
      await box.click();
      await box.fill(otp[i]);
    }
  }

  private async completePasswordStep(): Promise<void> {
    await setReactInput(this.page, this.page.locator(loc.password).first(), registerCredentials.accountPassword);
    await setReactInput(
      this.page,
      this.page.locator(loc.confirmPassword).first(),
      registerCredentials.accountPassword,
    );
    await this.selectField(loc.locationSelect, loc.locationCombo, loc.locationOption('New South Wales'), 'New South Wales');
    await this.selectField(loc.citySelect, loc.cityCombo, loc.cityOption('Sydney'), 'Sydney');
    await this.click(loc.createAccount);
    const onLogin = await waitUntil(
      this.page,
      async () => this.page.url().toLowerCase().includes('/login'),
      45,
    );
    if (!onLogin) throw new Error(`Did not reach login after create account. URL=${this.page.url()}`);
  }

  private async signInAfterRegistrationIfNeeded(email: string): Promise<void> {
    if (!this.page.url().toLowerCase().includes('/login')) return;
    const login = new LoginPage(this.page);
    await login.open();
    await login.login(email, registerCredentials.accountPassword);
  }

  private async selectField(
    native: string,
    combo: string,
    optionSelector: string,
    label: string,
  ): Promise<void> {
    const select = this.page.locator(native).first();
    if ((await select.count()) > 0 && (await select.isVisible().catch(() => false))) {
      await select.selectOption({ label });
      return;
    }
    await this.click(combo);
    await this.click(optionSelector);
  }

  private async choose(heading: string, option: string): Promise<void> {
    await this.waitForHeading(heading);
    await this.click(loc.option(heading, option));
    await this.next();
  }

  private async next(): Promise<void> {
    await this.click(loc.next);
  }

  private async click(selector: string): Promise<void> {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 45_000 });
    await el.scrollIntoViewIfNeeded();
    await el.click();
  }

  private async waitForHeading(heading: string): Promise<void> {
    await this.page.locator(loc.step(heading)).first().waitFor({ state: 'visible', timeout: 45_000 });
  }

  private async isGenderStepVisible(): Promise<boolean> {
    return this.page.locator(loc.step('What is your gender?')).first().isVisible().catch(() => false);
  }

  private async isLoggedInToApp(): Promise<boolean> {
    if (this.page.url().toLowerCase().includes('/login') || (await this.isGenderStepVisible())) {
      return false;
    }
    if (await this.page.locator(loc.accountMenu).first().isVisible().catch(() => false)) return true;
    return (
      this.page.url().includes(appHostname) &&
      !this.page.url().toLowerCase().includes('/register')
    );
  }

  private async signOutFromApp(): Promise<void> {
    try {
      if (!(await this.page.locator(loc.accountMenu).first().isVisible().catch(() => false))) {
        await this.page.goto(urls.home, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(2000);
      }
      if (await this.page.locator(loc.accountMenu).first().isVisible().catch(() => false)) {
        await this.click(loc.accountMenu);
        await this.page.waitForTimeout(1000);
        if (await this.page.locator(loc.signOut).first().isVisible().catch(() => false)) {
          await this.click(loc.signOut);
        }
      }
    } catch {
      /* fall through to cookie clear */
    }

    for (const domain of cookieDomainsFor(urls.app)) {
      await this.page.context().clearCookies({ domain }).catch(() => undefined);
    }
    await this.page.goto(urls.login, { waitUntil: 'networkidle' });
  }

  private async isOtpStep(): Promise<boolean> {
    return (
      (await this.bodyContains(registerFields.otpVerificationHeading)) ||
      (await this.page.locator(loc.otpInputs).count()) > 0
    );
  }

  private async bodyContains(text: string): Promise<boolean> {
    return (await bodyText(this.page)).toLowerCase().includes(text.toLowerCase());
  }
}
