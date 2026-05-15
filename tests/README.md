# Testing Guide — Syndicate B2B Marketplace

## Overview

The project has two types of tests:

| Type | Tool | Location | What it tests |
|---|---|---|---|
| **Unit tests** | Vitest | `tests/unit/` | Pure functions — slug generation, data adapters, auth contract, navigation logic |
| **E2E tests** | Playwright | `tests/e2e/` | Real browser — page loads, navigation, forms, guest access |

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

E2E tests open a real browser and test the full app. You need to either have the dev server already running, or Playwright will start it for you.

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

**Run with the interactive Playwright UI (easiest way to debug):**
```bash
npm run test:e2e:ui
```
This opens a visual interface where you can step through tests, see screenshots, and replay failures.

**Run a single test file:**
```bash
npx playwright test tests/e2e/auth.spec.ts
```

**Run tests matching a name pattern:**
```bash
npx playwright test --grep "homepage loads"
```

---

## Viewing test reports

**Unit test coverage report:**
```bash
npm run test:unit:coverage
open coverage/index.html
```

**Playwright HTML report** (shows screenshots and traces for failures):
```bash
npm run test:e2e:report
```
Or open `playwright-report/index.html` directly after a test run.

---

## What to do when a test fails

### Unit test failure

The error output tells you exactly which assertion failed and shows the actual vs expected value. Common causes:

| Symptom | Likely cause |
|---|---|
| `generateSlug` test fails | The slug function in `lib/supabase/queries.ts` was changed |
| `dbAdapters` test fails | `dbBrandToBusiness` or `dbProductToProduct` output shape changed |
| `authContext` test fails | Supabase auth mock contract no longer matches the expected behaviour |
| `navOpts` test fails | A screen was added/removed from the private screens list, or NavOpts fields changed |

Fix the production code or update the test to match the new intended behaviour — never just delete a failing test.

### E2E test failure

1. Run `npm run test:e2e:report` to open the HTML report
2. Click the failing test — you will see a screenshot of the failure and a trace timeline
3. Common causes:
   - A UI element was renamed or restructured (update the selector in the test)
   - A new feature added a loading state that the test didn't wait for (add `waitForSelector`)
   - The dev server wasn't running (check the terminal where `npm run dev` runs)
   - A real Supabase error is blocking the page (check the console logs in the trace)

---

## Test file structure

```
tests/
├── README.md                    ← this file
├── unit/
│   ├── setup.ts                 ← imports jest-dom matchers (auto-loaded by vitest)
│   ├── generateSlug.test.ts     ← tests for the slug generation utility
│   ├── dbAdapters.test.ts       ← tests for dbBrandToBusiness + dbProductToProduct
│   ├── authContext.test.tsx     ← tests for Supabase auth contract (mocked)
│   └── navOpts.test.ts          ← tests for navigation logic + private screen guard
└── e2e/
    ├── guest-browsing.spec.ts   ← everything a visitor can do without signing in
    ├── auth.spec.ts             ← /login, /register, /forgot-password pages
    ├── navigation.spec.ts       ← bottom nav tabs, logo click, mobile viewport
    └── marketplace.spec.ts      ← homepage, Explore screen, RFQs screen
```

---

## Adding tests for a new feature

When you build a new feature, here is the pattern to follow:

### 1. Does it have a pure function (no React, no database)?
Add a test in `tests/unit/`. Example: if you add a `formatCurrency()` helper, create `tests/unit/formatCurrency.test.ts`.

### 2. Does it change what a guest can see or do?
Add cases to `tests/e2e/guest-browsing.spec.ts` or `tests/e2e/marketplace.spec.ts`.

### 3. Does it add a new screen or page?
Add a new spec file: `tests/e2e/my-new-screen.spec.ts`.

### 4. Does it change the auth or navigation flow?
Update `tests/e2e/auth.spec.ts` or `tests/unit/navOpts.test.ts`.

**Standing rule:** After any code change, ask whether existing tests need updating before touching test files. Never delete a test without a deliberate reason. See the main project rules for the full test maintenance policy.

---

## Environment variables for tests

Unit tests require **no environment variables** — they mock all external calls.

E2E tests use the same variables as the app. For local runs these are loaded from `.env.local`. For CI they are set as GitHub secrets:

| Variable | Where to set it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub → Settings → Secrets → Actions |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub → Settings → Secrets → Actions |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | GitHub → Settings → Secrets → Actions |

E2E tests are written to work with an empty database — they test UI structure and guest-accessible flows only, so they do not depend on specific data in Supabase.
