# TestersBench Playwright + TypeScript Demo

[![Playwright Tests](https://github.com/testersbench12-code/testersbench-playwright-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/testersbench12-code/testersbench-playwright-demo/actions/workflows/playwright.yml)

**Instant proof for SaaS founders, CTOs, and engineering leads** — green CI, Page Object Model, `storageState` auth, hybrid API + UI assertions, Chromium + Firefox, HTML + JUnit reports. No video required.

## Architecture (what CI proves every run)

| Capability | Implementation |
|------------|----------------|
| **Auth / session** | Setup project logs into the local SaaS demo and saves `playwright/.auth/user.json` (`storageState`); authenticated projects reuse it |
| **Page Object Model** | Zero raw selectors in `tests/core/*.spec.ts` — locators/actions live in `src/pages/demo/` + `src/fixtures/demoFixtures.ts` |
| **API + UI** | `/api/health`, `/api/login`, `/api/me`, `/api/items`, `/api/contact` with `request` checks and `page.waitForResponse` payload asserts |
| **Coverage pack** | Smoke/Navigation, Form Validation, CRUD, Responsive Viewports, Negative/Error (incl. 401) |
| **Browsers** | `chromium` + `firefox` projects (after shared `setup`) |
| **Resilience** | `retries: 2` on CI, `trace: on-first-retry`, screenshot + video on failure |
| **Reporting** | HTML report + JUnit (`test-results/junit.xml`) — both uploaded as Actions artifacts |

Local demo app: `fixtures/demo-site` + `scripts/static-server.mjs` (no third-party SaaS dependency for the core pack).

## Run locally

```bash
npm install
npx playwright install
npx playwright test
npx playwright show-report
```

Demo login (public showcase creds): `demo@example.com` / `demopass`  
Auth file is generated at runtime and gitignored (`playwright/.auth/`).

## CI artifacts

Every push / pull request runs the full suite and uploads:

- `playwright-report` — HTML report
- `junit-results` — `test-results/junit.xml` for dashboards / gates

## TestersBench

[TestersBench](https://testersbench.netlify.app) helps SaaS teams ship reliable QA faster:

- **14-day 0-to-1 Playwright setups**
- **Legacy suite migrations** (Selenium/Cypress → Playwright)
- **Dedicated QA retainers**
- **Manual + automation collaboration**

→ [testersbench.netlify.app](https://testersbench.netlify.app)
