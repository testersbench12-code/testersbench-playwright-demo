import { expect, test } from '../../src/fixtures/demoFixtures';

test.describe('Form input & validation (API + UI)', () => {
  test.beforeEach(async ({ formPage }) => {
    await formPage.open();
  });

  test('shows required validation when submitting empty form', async ({ formPage }) => {
    const response = await formPage.submitAndWaitForApi();
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBeFalsy();
    expect(body.errors.name).toBe('Name is required');
    expect(body.errors.email).toBe('Email is required');

    await expect(formPage.nameError).toHaveText('Name is required');
    await expect(formPage.emailError).toHaveText('Email is required');
    await expect(formPage.successMessage).toBeHidden();
  });

  test('rejects invalid email and accepts valid input via API payload', async ({ formPage }) => {
    await formPage.fill('Ada Lovelace', 'not-an-email');
    let response = await formPage.submitAndWaitForApi();
    expect(response.status()).toBe(400);
    expect((await response.json()).errors.email).toBe('Enter a valid email');
    await expect(formPage.emailError).toHaveText('Enter a valid email');

    await formPage.fill('Ada Lovelace', 'ada@example.com');
    response = await formPage.submitAndWaitForApi();
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.ok).toBeTruthy();
    expect(body.contact.email).toBe('ada@example.com');

    await expect(formPage.successMessage).toBeVisible();
    await expect(formPage.successMessage).toHaveText('Form submitted successfully');
  });
});
