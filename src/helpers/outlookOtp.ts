import type { Page } from '@playwright/test';
import { registerCredentials } from '../config';
import { bodyText } from './dom';

const contextOtp =
  /(?:code|otp|verification|digit|access)\D{0,50}(\d{6})|\b(\d{6})\D{0,25}(?:code|otp|verification)/i;
const anyOtp = /\b(\d{6})\b/;

function isLogin(url: string): boolean {
  return /login\.(microsoftonline|live|microsoft)\.com/i.test(url);
}

function buildInboxUrl(): string {
  const hint = encodeURIComponent(registerCredentials.outlookEmail);
  return `${registerCredentials.outlookInboxUrl}?login_hint=${hint}`;
}

async function fillVisible(page: Page, selector: string, value: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  if (!(await locator.isVisible().catch(() => false))) return false;
  await locator.fill(value);
  return true;
}

async function clickVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  if (!(await locator.isVisible().catch(() => false))) return false;
  await locator.click();
  return true;
}

async function ensureInbox(page: Page): Promise<void> {
  await page.goto(buildInboxUrl(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (!isLogin(page.url())) return;

  for (let step = 0; step < 30 && isLogin(page.url()); step++) {
    if (await clickVisible(page, '#otherTile, #otherTileText, #otherTileHint')) {
      await page.waitForTimeout(1200);
      continue;
    }
    if (await fillVisible(page, "#i0116, input[name='loginfmt'], input[type='email']", registerCredentials.outlookEmail)) {
      await clickVisible(page, "#idSIButton9, input[type='submit'], button[type='submit']");
      await page.waitForTimeout(1500);
      continue;
    }
    if (await fillVisible(page, "#i0118, input[name='passwd'], input[type='password']", registerCredentials.outlookPassword)) {
      await clickVisible(page, "#idSIButton9, input[type='submit'], button[type='submit']");
      await page.waitForTimeout(2000);
      await clickVisible(page, "#idSIButton9, input[type='submit']");
      await page.waitForTimeout(2000);
      continue;
    }
    if (!(await clickVisible(page, "#idSIButton9, input[type='submit'], button[type='submit']"))) {
      await page.waitForTimeout(1000);
    }
  }

  await page.goto(buildInboxUrl(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
}

async function focusTodaysMail(page: Page, recipientEmail: string): Promise<void> {
  const search = page
    .locator(
      "input[aria-label*='Search mail'], input[aria-label*='Search'], input[placeholder*='Search'], input[type='search']",
    )
    .first();
  if (!(await search.isVisible().catch(() => false))) return;
  await search.click();
  await search.fill(`received:today ${recipientEmail}`);
  await search.press('Enter');
  await page.waitForTimeout(2500);
}

async function readAllText(page: Page): Promise<string> {
  let text = await bodyText(page);
  for (const frame of page.frames()) {
    try {
      text += `\n${await frame.locator('body').innerText()}`;
    } catch {
      /* ignore */
    }
  }
  return text;
}

function extractOtp(text: string, recipient: string): string | null {
  const start = text.toLowerCase().indexOf(recipient.toLowerCase());
  const relevant =
    start >= 0
      ? text.substring(Math.max(0, start - 400), Math.min(text.length, start + 500))
      : text;
  let match = relevant.match(contextOtp) ?? text.match(contextOtp);
  if (match) return match[1] || match[2] || null;
  match = relevant.match(anyOtp);
  return match?.[1] ?? null;
}

function looksLikeRegistrationMail(text: string): boolean {
  return /access code|verification code|otp|testersbench|demo/i.test(text);
}

async function tryReadOtp(page: Page, recipientEmail: string): Promise<string | null> {
  const messages = page.locator(
    "[role='listbox'] [role='option'], [data-app-section='MailList'] [role='option'], [data-convid]",
  );
  const count = Math.min(await messages.count(), 12);
  for (let i = 0; i < count; i++) {
    try {
      await messages.nth(i).click();
      await page.waitForTimeout(1200);
      const text = await readAllText(page);
      if (
        !text.toLowerCase().includes(recipientEmail.toLowerCase()) &&
        !looksLikeRegistrationMail(text)
      ) {
        continue;
      }
      const otp = extractOtp(text, recipientEmail);
      if (otp) return otp;
    } catch {
      /* next */
    }
  }
  return extractOtp(await readAllText(page), recipientEmail);
}

export async function waitForOtp(
  appPage: Page,
  recipientEmail: string,
  timeoutMs: number,
  notBeforeUtc: Date,
): Promise<string> {
  const manual = process.env.REGISTRATION_OTP?.trim();
  if (manual) return manual;

  const outlook = await appPage.context().newPage();
  try {
    await ensureInbox(outlook);
    await outlook.waitForTimeout(15_000);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (isLogin(outlook.url())) await ensureInbox(outlook);
      await focusTodaysMail(outlook, recipientEmail);
      const otp = await tryReadOtp(outlook, recipientEmail);
      if (otp) return otp;
      await outlook.waitForTimeout(10_000);
      try {
        await outlook.reload({ waitUntil: 'domcontentloaded' });
      } catch {
        /* retry */
      }
    }

    throw new Error(
      `Timed out waiting for OTP for ${recipientEmail} after ${notBeforeUtc.toISOString()}. URL: ${outlook.url()}`,
    );
  } finally {
    await outlook.close().catch(() => undefined);
    await appPage.bringToFront().catch(() => undefined);
  }
}
