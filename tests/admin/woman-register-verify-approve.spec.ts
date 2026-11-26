import { expect, test } from '../../src/fixtures';
import { getRandomIdVerificationImages } from '../../src/helpers/verificationImages';
import { RegisterPage } from '../../src/pages/RegisterPage';
import { VerifyProfilePage } from '../../src/pages/VerifyProfilePage';
import { AdminLoginPage, AdminVerificationPage } from '../../src/pages/AdminPages';

/**
 * TypeScript Playwright equivalent of the C# test
 * RegisterVerifyAndApproveWomanProfileInAdmin — with a distinct TS test name.
 */
test('womanRegisterVerifyAndApproveInAdmin', async ({ page }) => {
  const images = getRandomIdVerificationImages();

  const register = new RegisterPage(page);
  await register.open();
  const email = await register.registerWomanProfile();

  const verify = new VerifyProfilePage(page);
  await verify.openVerificationFromPrompt();
  await verify.completeWomanVerification(images);
  expect(await verify.isSubmissionSuccessful()).toBeTruthy();

  const adminLogin = new AdminLoginPage(page);
  await adminLogin.open();
  await adminLogin.login();

  const admin = new AdminVerificationPage(page);
  await admin.openVerificationSection();
  await admin.filterByEmail(email);
  await admin.openVerificationView(email);
  await admin.submitApproval();

  expect(await admin.isApprovalSuccessful()).toBeTruthy();
  await admin.completePostApprovalFlow();
});
