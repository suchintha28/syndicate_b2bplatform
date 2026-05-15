# Syndicate B2B Marketplace

A B2B marketplace platform built for the Sri Lankan market — connecting buyers with verified local suppliers for browsing, quoting, messaging, and sourcing.

**Live app:** deployed on Vercel (auto-deploys on every push to `main`)
**CMS editor:** https://syndicate-cms.sanity.studio

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password, cookie sessions) |
| Storage | Supabase Storage |
| CMS | Sanity.io v5 |
| Data fetching | SWR 2.4 |
| React | React 19 |
| Hosting | Vercel (app) + Sanity hosting (CMS) |
| Unit tests | Vitest 4 + jsdom |
| E2E tests | Playwright (Chromium) |
| CI | GitHub Actions |

---

## Getting started locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.test.example` to `.env.local` and fill in the real values:

```bash
cp .env.test.example .env.local
```

The required variables are:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Apply database migrations (first-time setup)

Run every file in `supabase/migrations/` in filename order through the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

---

## Available scripts

```bash
npm run dev                  # Start dev server (hot reload)
npm run build                # Production build
npm run start                # Start production server

npm run studio:dev           # Start Sanity Studio locally
npm run studio:deploy        # Deploy Sanity Studio to syndicate-cms.sanity.studio

npm run test:unit            # Run unit tests (Vitest)
npm run test:unit:watch      # Watch mode
npm run test:unit:coverage   # Coverage report → coverage/index.html

npm run test:e2e             # Run all E2E tests (Playwright)
npm run test:e2e:ui          # Interactive Playwright UI
npm run test:e2e:report      # Open last HTML report

npm run test                 # Unit tests then E2E tests
```

---

## Project structure

```
app/                         # Next.js App Router routes
components/
  screens/                   # All 25+ screen components
    marketplace/             # HomeScreen, ExploreScreen, ProductDetailScreen, BusinessDetailScreen
    business/                # RFQsScreen, MessagesScreen, NotificationsScreen
    account/                 # ProfileScreen, ManageProductsScreen, ProductFormScreen
    info/                    # AboutScreen, PrivacyScreen, ContactScreen
  ui.tsx                     # Core UI primitives
  cards.tsx                  # BusinessCard, ProductCard
  nav.tsx                    # TopNav, BottomNav, Footer
hooks/                       # SWR data hooks
lib/
  supabase/                  # Supabase client, server, admin, queries
  data.ts                    # DB row → UI type transformers
types/
  database.ts                # TypeScript interfaces for every DB table
sanity/                      # Sanity schema, client, queries
studio/                      # Sanity Studio (separate React 19 app)
supabase/
  migrations/                # Sequential SQL migration files
tests/
  unit/                      # Vitest unit tests
  e2e/                       # Playwright E2E tests
    setup/                   # Auth setup projects (seller + buyer)
    workflows/               # Authenticated workflow tests
```

---

## Testing

See [tests/README.md](tests/README.md) for a full guide on running tests, understanding the project structure, and adding new tests.

The test suite has two layers:

- **Unit tests** (`tests/unit/`) — pure function tests, run instantly, no server needed
- **E2E tests** (`tests/e2e/`) — real Chromium browser tests against a running app

E2E tests run in four Playwright projects:

| Project | Description |
|---|---|
| `setup` | Logs in as the seller test account; saves session |
| `setup-buyer` | Logs in as the buyer test account; saves session |
| `chromium` | Guest smoke tests (no auth) |
| `chromium-authenticated` | Seller workflow tests |
| `chromium-buyer` | Buyer workflow tests (`buyer-*.spec.ts`) |

---

## Database migrations

All schema changes live in `supabase/migrations/` as timestamped SQL files.
See [supabase/README.md](supabase/README.md) for the full migration history and rules.

**Never edit existing migration files.** Always create a new file for every change.

---

## CMS (Sanity)

The Sanity Studio editor manages marketing banners, static page content (About, Privacy, Contact), and the curated "Discover suppliers" section on the home page.

Studio URL: https://syndicate-cms.sanity.studio

To deploy studio changes after editing schemas or structure:
```bash
npm run studio:deploy
```

### Sanity content types

| Type | Kind | Purpose |
|---|---|---|
| `banner` | Repeatable | Marketing banners shown at specific page slots |
| `siteSettings` | Singleton | Site name, tagline, contact details, social links |
| `aboutPage` | Singleton | About page content |
| `privacyPage` | Singleton | Privacy policy sections |
| `contactPage` | Singleton | Contact page methods and form config |
| `featuredMerchants` | Singleton | Up to 6 brand slugs shown in "Discover suppliers" on the home page |

---

## CI / CD

GitHub Actions runs on every push and pull request to `main`:

1. **Unit tests** — Vitest with coverage report uploaded as an artifact
2. **E2E tests** — Playwright (Chromium) against a production build
3. **Deploy** — Vercel production deploy (pushes to `main` only, runs after both test jobs pass)
4. **Smoke test** — Curls the deployed Vercel URL and verifies HTTP 200 immediately after deploy

Required GitHub Secrets (all are set):

| Secret | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `E2E_USER_EMAIL` | Seller test account email |
| `E2E_USER_PASSWORD` | Seller test account password |
| `E2E_USER_ROLE` | `seller` |
| `E2E_BUYER_EMAIL` | Buyer test account email |
| `E2E_BUYER_PASSWORD` | Buyer test account password |

The PAT used to set these secrets (`syndicate-e2e-secrets`) expires **13 August 2026**.
