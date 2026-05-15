# Testing Guide — Syndicate B2B Marketplace

## Overview

The project has two types of tests:

| Type | Tool | Location | What it tests |
|---|---|---|---|
| **Unit tests** | Vitest 4 + jsdom | `tests/unit/` | Pure functions — slug generation, data adapters, auth contract, navigation logic, review helpers |
| **E2E tests** | Playwright (Chromium) | `tests/e2e/` | Real browser — page loads, navigation, forms, guest access, authenticated user workflows |

Tests run automatically on every push to `main` and on every pull request via GitHub Actions.

---

## Running unit tests locally

Unit tests run in milliseconds — no browser, no server, no database needed.

```bash
# Run all unit tests once
npm run test:unit

# Watch mode — re-runs affected tests as you type
npm run test:unit:watch

# Run with a coverage report
npm run test:unit:coverage
```

After running with coverage, open `coverage/index.html` in your browser to see which lines are covered.

---

## Running E2E tests locally

E2E tests open a real Chromium browser and test the full app.

**Option A — let Playwright start the server automatically:**
```bash
npm run test:e2e
```

**Option B — start the dev server yourself first (faster for repeated runs):**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

**Interactive Playwright UI (easiest way to debug failures):**
```bash
npm run test:e2e:ui
```

**Run a single file:**
```bash
npx playwright test tests/e2e/auth.spec.ts
```

**Run tests matching a name pattern:**
```bash
npx playwright test --grep "homepage loads"
```

**Run only a specific project (e.g. seller workflows):**
```bash
npx playwright test --project=chromium-authenticated
```

---

## Viewing test reports

```bash
# Unit test coverage report
npm run test:unit:coverage
open coverage/index.html

# Playwright HTML report (screenshots + traces)
npm run test:e2e:report
```

Or open `playwright-report/index.html` directly after a test run.

---

## Playwright projects

The E2E suite is split into four Playwright projects defined in `playwright.config.ts`:

| Project | Auth | Runs |
|---|---|---|
| `setup` | Logs in as seller (`E2E_USER_EMAIL`) → saves `tests/e2e/.auth/user.json` | Runs first |
| `setup-buyer` | Logs in as buyer (`E2E_BUYER_EMAIL`) → saves `tests/e2e/.auth/buyer.json` | Runs first (parallel) |
| `chromium` | None (guest) | All files except `setup/` and `workflows/` |
| `chromium-authenticated` | Seller session (`user.json`) | All `workflows/*.spec.ts` not prefixed `buyer-` |
| `chromium-buyer` | Buyer session (`buyer.json`) | All `workflows/buyer-*.spec.ts` |

The `.auth/` directory is gitignored — sessions are created fresh on every CI run and every local `npm run test:e2e`.

---

## Test file structure

```
tests/
├── README.md                          ← this file
│
├── unit/
│   ├── setup.ts                       ← imports jest-dom matchers (auto-loaded by Vitest)
│   ├── generateSlug.test.ts           ← generateSlug() slug rules and edge cases
│   ├── dbAdapters.test.ts             ← dbBrandToBusiness(), dbProductToProduct() — including
│   │                                     tiered pricing, variations, product/tech specs, null safety
│   ├── authContext.test.tsx           ← Supabase auth contract (fully mocked)
│   ├── navOpts.test.ts                ← navigation logic, private screen guard, guest redirects
│   └── reviews.test.ts                ← reviewerInitials(), formatReviewDate(),
│                                         isReviewSubmittable(), DbReview shape
│
└── e2e/
    ├── setup/
    │   ├── auth.setup.ts              ← Seller login → saves tests/e2e/.auth/user.json
    │   └── auth.buyer.setup.ts        ← Buyer login → saves tests/e2e/.auth/buyer.json
    │
    ├── guest-browsing.spec.ts         ← Everything a visitor can do without signing in
    ├── auth.spec.ts                   ← /login, /register, /forgot-password pages
    ├── navigation.spec.ts             ← Bottom nav tabs, logo click, mobile viewport (375 px)
    ├── marketplace.spec.ts            ← Homepage, Explore, RFQs, brand/product detail pages
    │
    └── workflows/                     ← Authenticated user workflow tests
        ├── seller-product.spec.ts     ← Add product, image upload, product visibility
        ├── image-upload.spec.ts       ← Profile photo, logo, product image upload flows
        ├── explore-search.spec.ts     ← Search bar, keyword results, clear search
        ├── explore-filters.spec.ts    ← Industry/location/rating/price filters, sort chips,
        │                                 tab switching, active chips, Reset button, combinations
        ├── rfq-workflow.spec.ts       ← Post a request, My requests tab, write a review (seller)
        ├── messaging.spec.ts          ← Inbox load, compose, thread reply, bid submission
        ├── edit-flows.spec.ts         ← Edit product (name/desc/price/tiers/variations/specs),
        │                                 edit brand profile (all fields), cancel, active toggle
        └── buyer-rfq.spec.ts          ← Buyer dashboard, explore as buyer, post RFQ, inbox
```

---

## Test accounts

Two dedicated Supabase accounts exist for E2E testing only:

| Account | Email | Role | Supabase UID |
|---|---|---|---|
| Seller | `e2e_seller@syndicate-test.dev` | seller | `101310ce-f48b-4f7c-84f2-0fa081b7c414` |
| Buyer | `e2e_buyer@syndicate-test.dev` | buyer | `3e2adc04-31f2-425f-8bf4-18d97768b6f1` |

**Do not use these accounts for real data.** They exist solely for automated testing and may have data written and deleted during test runs.

Credentials are stored in `.env.local` for local development and as GitHub Secrets for CI. See `.env.test.example` for the full variable list.

---

## Environment variables

Unit tests require **no environment variables** — all external calls are mocked.

E2E tests load variables from `.env.local` locally. In CI they are read from GitHub Secrets.

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | App + E2E tests |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App + E2E tests |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | App + E2E tests |
| `E2E_USER_EMAIL` | `auth.setup.ts` (seller login) |
| `E2E_USER_PASSWORD` | `auth.setup.ts` |
| `E2E_USER_ROLE` | Workflow tests that branch on role |
| `E2E_BUYER_EMAIL` | `auth.buyer.setup.ts` (buyer login) |
| `E2E_BUYER_PASSWORD` | `auth.buyer.setup.ts` |

All workflow tests check for their required credentials and **skip themselves gracefully** when the variables are absent — CI never fails due to missing secrets.

---

## What to do when a test fails

### Unit test failure

The error output shows which assertion failed and the actual vs expected value.

| Symptom | Likely cause |
|---|---|
| `generateSlug` tests fail | `generateSlug()` in `lib/supabase/queries.ts` was changed |
| `dbAdapters` tests fail | `dbBrandToBusiness` or `dbProductToProduct` output shape changed |
| `authContext` tests fail | Supabase auth mock contract no longer matches expected behaviour |
| `navOpts` tests fail | A screen was added/removed from the private list or NavOpts fields changed |
| `reviews` tests fail | `reviewerInitials`, `formatReviewDate`, or `isReviewSubmittable` logic changed |

### E2E test failure

1. Run `npm run test:e2e:report` to open the HTML report
2. Click the failing test — you will see a screenshot and trace timeline
3. Common causes:
   - A UI element was renamed/restructured → update the selector in the test
   - A new loading state wasn't waited for → add `waitForSelector` or `waitForLoadState`
   - The dev server wasn't running or crashed → check the terminal
   - A real Supabase error is blocking the page → check the console logs in the trace
   - Auth credentials not set → the test will skip, not fail; check that env vars are present

---

## Adding tests for a new feature

**Standing rule: every new feature must include workflow tests for all user-facing flows.** This applies to both guest flows and authenticated flows. When building a feature, ask: "Which user actions does this enable?" — each action should have a corresponding test.

### Decision guide

| What changed | Where to add the test |
|---|---|
| A new pure helper function | `tests/unit/<functionName>.test.ts` |
| A new page or screen a guest can see | `tests/e2e/guest-browsing.spec.ts` or `tests/e2e/marketplace.spec.ts` |
| A new auth or navigation flow | `tests/e2e/auth.spec.ts` or `tests/unit/navOpts.test.ts` |
| A new seller workflow (add, edit, manage) | `tests/e2e/workflows/seller-<feature>.spec.ts` |
| A new buyer workflow (browse, RFQ, message) | `tests/e2e/workflows/buyer-<feature>.spec.ts` |
| A workflow available to both roles | `tests/e2e/workflows/<feature>.spec.ts` (uses seller session; buyer variant if needed) |

### Workflow test checklist

When writing a new workflow spec:

- [ ] Use `test.skip(true, reason)` in `beforeEach` when credentials are absent
- [ ] Use a timestamped `RUN_ID = Date.now().toString().slice(-6)` for unique test data
- [ ] Restore any data changed during the test (edit → verify → restore original)
- [ ] Check for the absence of crash text (`something went wrong`, `application error`) after mutations
- [ ] Place the file in `tests/e2e/workflows/` and prefix with `buyer-` if it requires the buyer session

### Test maintenance rule

After any code change that affects user-visible behaviour, the test suite must be updated in the same commit. Tests are never deleted without a deliberate reason. When a code change causes existing tests to fail, the failures must be flagged and fixed — never skipped.
