# TestersBench Playwright + TypeScript Demo

Standalone Playwright + TypeScript demo repository showcasing an end-to-end woman registration, profile verification, and admin approval flow.

> This repo is isolated from the original Freya project. Source tests/helpers were **copied** (not moved) into this demo.

## Prerequisites

- Node.js 18+ (20 recommended)
- Google Chrome (used with a persistent profile for Outlook OTP / camera flows)
- For the optional live Freya E2E: copy `.env.example` → `.env` and set credentials/URLs (never commit `.env`)
- Local ID images path: `ID_VERIFICATION_IMAGE_FOLDER` in `.env`

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then edit .env for live E2E only
```

## Run tests

Default run (local core SaaS demos, no secrets needed):

```bash
npx playwright test
# or: npm test
```

Live Freya woman E2E (requires `.env` + Chrome):

```bash
# PowerShell: $env:RUN_LIVE_E2E=1; npx playwright test
RUN_LIVE_E2E=1 npx playwright test --grep womanRegisterVerifyAndApproveInAdmin
```

## HTML report

After a run, view the HTML report:

```bash
npm run test:report
```

Or:

```bash
npx playwright show-report
```

## Project layout

```
tests/admin/          # Playwright specs
src/fixtures.ts       # Persistent Chrome context fixture
src/config.ts         # URLs / credentials / field values
src/helpers/          # OTP, seeding, DOM helpers
src/pages/            # Page objects
playwright.config.ts
.github/workflows/    # CI workflow
```

## CI

GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on every `push` and `pull_request`, installs Chromium, executes `npx playwright test`, and always uploads `playwright-report/` as an artifact.
