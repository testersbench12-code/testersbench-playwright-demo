# TestersBench Playwright + TypeScript Demo

[![Playwright Tests](https://github.com/testersbench12-code/testersbench-playwright-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/testersbench12-code/testersbench-playwright-demo/actions/workflows/playwright.yml)

**Instant proof for SaaS founders, CTOs, and engineering leads** — open this repo, see the green CI badge, clone, run tests, and download the HTML report. No video required.

## What this proves

A production-style **Playwright + TypeScript** suite with local, deterministic fixtures (no flaky third-party dependency for the core pack). Covered SaaS QA areas:

| Area | What you get |
|------|----------------|
| **Smoke & Navigation** | Home loads; nav across Form / Items / Home |
| **Form Validation** | Required fields + invalid/valid email handling |
| **Core User Flows** | Add/delete list item (CRUD / state) |
| **Responsive Viewports** | Mobile (375) and desktop (1280) checks |
| **Negative / Error Handling** | 404 page + broken-link recovery |

Optional live Freya woman register → verify → admin approve E2E remains in-repo (`RUN_LIVE_E2E=1` + `.env`); default CI/local runs use the core pack above.

## Run locally (copy-paste)

```bash
npm install
npx playwright install
npx playwright test
npx playwright show-report
```

Node.js 18+ (20 recommended). Core tests need no secrets. For live E2E only: copy `.env.example` → `.env` (never commit `.env`).

## CI / proof artifact

On every `push` and `pull_request`, GitHub Actions runs `npx playwright test` and **always uploads** the `playwright-report` artifact — download it from the Actions run page to audit results without a local install.

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

## TestersBench

[TestersBench](https://testersbench.netlify.app) helps SaaS teams ship reliable QA faster:

- **14-day 0-to-1 Playwright setups** — first green suite in two weeks
- **Legacy suite migrations** — Selenium/Cypress → Playwright without rewriting your product
- **Dedicated QA retainers** — ongoing coverage as you ship
- **Manual + automation collaboration** — explorers and pipelines working together

→ Start at [testersbench.netlify.app](https://testersbench.netlify.app)
