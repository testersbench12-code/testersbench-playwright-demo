import type { Page } from '@playwright/test';
import { urls, verifyProfileFields } from '../config';
import { bodyText, waitUntil } from '../helpers/dom';
import type { VerificationImageSet } from '../helpers/verificationImages';

const loc = {
  verifyMyAccount: "xpath=//button[normalize-space()='Verify My Account']",
  takeSelfie: "xpath=//button[normalize-space()='Take Selfie']",
  capturePhoto: "xpath=//button[normalize-space()='Capture photo']",
  verifyMyProfile: "xpath=//button[normalize-space()='Verify my profile']",
  fileUploads: "input[type='file']",
  pageHeading: "xpath=//h1[normalize-space()='Verify Your Profile']",
};

export class VerifyProfilePage {
  constructor(private readonly page: Page) {
    this.page.on('dialog', async (dialog) => {
      await dialog.accept().catch(() => undefined);
    });
  }

  async openVerificationFromPrompt(): Promise<void> {
    if (await this.isVerificationAlreadySubmitted()) return;

    if (!this.page.url().toLowerCase().includes('/verify-profile')) {
      const prompt = this.page.locator(loc.verifyMyAccount).first();
      try {
        if (await prompt.isVisible()) await prompt.click();
        else await this.page.goto(urls.verifyProfile, { waitUntil: 'networkidle' });
      } catch {
        await this.page.goto(urls.verifyProfile, { waitUntil: 'networkidle' });
      }
    }

    await this.page.locator(loc.pageHeading).first().waitFor({ state: 'visible', timeout: 45_000 });
  }

  async completeWomanVerification(images: VerificationImageSet): Promise<void> {
    await this.page.locator(loc.pageHeading).first().waitFor({ state: 'visible', timeout: 45_000 });

    await this.page.context().grantPermissions(['camera'], {
      origin: new URL(urls.app).origin,
    });

    try {
      const takeSelfie = this.page.locator(loc.takeSelfie).first();
      await takeSelfie.waitFor({ state: 'visible', timeout: 30_000 });
      await takeSelfie.scrollIntoViewIfNeeded();
      await takeSelfie.click();

      const capture = this.page.locator(loc.capturePhoto).first();
      await capture.waitFor({ state: 'visible', timeout: 60_000 });
      await this.page.waitForTimeout(4000);
      await capture.click();
      await capture.waitFor({ state: 'hidden', timeout: 60_000 });
      await this.page.waitForTimeout(1500);
    } finally {
      await this.page.evaluate(() => {
        for (const video of document.querySelectorAll('video')) {
          const stream = (video as HTMLVideoElement).srcObject as MediaStream | null;
          if (stream?.getTracks) for (const track of stream.getTracks()) track.stop();
          (video as HTMLVideoElement).srcObject = null;
        }
      });
    }

    const uploads = this.page.locator(loc.fileUploads);
    const ready = await waitUntil(this.page, async () => (await uploads.count()) >= 2, 30);
    if (!ready) throw new Error('ID upload inputs did not appear.');

    await uploads.nth(0).setInputFiles(images.idFrontPath);
    await this.page.waitForTimeout(2500);
    await uploads.nth(1).setInputFiles(images.idBackPath);
    await this.page.waitForTimeout(2500);

    // Match C#: wait until Verify my profile is visible AND enabled
    const submit = this.page.locator(loc.verifyMyProfile).first();
    const clickable = await waitUntil(
      this.page,
      async () => (await submit.isVisible()) && (await submit.isEnabled()),
      90,
    );
    if (!clickable) {
      throw new Error(
        `Verify my profile stayed disabled. Body=${(await bodyText(this.page)).slice(0, 800)}`,
      );
    }

    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    let ok = await waitUntil(this.page, async () => this.isSubmissionSuccessful(), 60);
    if (!ok && (await submit.isVisible().catch(() => false)) && (await submit.isEnabled().catch(() => false))) {
      await submit.click();
      ok = await waitUntil(this.page, async () => this.isSubmissionSuccessful(), 60);
    }
    if (!ok) {
      throw new Error(
        `Verification submission did not complete. URL=${this.page.url()} Body=${(await bodyText(this.page)).slice(0, 800)}`,
      );
    }
  }

  async isSubmissionSuccessful(): Promise<boolean> {
    if (await this.isVerificationAlreadySubmitted()) return true;
    const body = await bodyText(this.page);
    return (
      body.toLowerCase().includes(verifyProfileFields.submissionSuccessMessage.toLowerCase()) ||
      /submitted successfully|submit successfully|verification underway|under review|pending verification/i.test(
        body,
      )
    );
  }

  private async isVerificationAlreadySubmitted(): Promise<boolean> {
    return /Verification Underway/i.test(await bodyText(this.page));
  }
}
