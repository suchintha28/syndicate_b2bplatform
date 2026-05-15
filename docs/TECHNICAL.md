# Technical Documentation — Syndicate B2B Marketplace

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, cookie-based sessions) |
| Storage | Supabase Storage |
| CMS | Sanity.io v5 |
| Data fetching | SWR 2.4 |
| Deployment | Vercel (app) + Sanity Studio hosting (CMS editor) |
| Unit testing | Vitest 4 + jsdom |
| E2E testing | Playwright (Chromium) |
| CI | GitHub Actions |

---

## Architecture

### No dedicated backend

There is no Express, Django, or custom API server. Supabase acts as the entire backend:

- **Database** — PostgreSQL with Row-Level Security policies enforcing all access rules in SQL.
- **Auth** — Manages login, sessions, password resets, and cookie refresh automatically.
- **Storage** — Files are uploaded directly from the browser to Supabase Storage, secured by storage-level RLS policies.

The only server-side code is a single Next.js API route (`app/api/delete-account/route.ts`), which exists solely because account deletion requires the Supabase admin (service-role) key, which must never be exposed to the browser.

### Hybrid SPA + SSR

The app uses two patterns side by side:

| Pattern | Where | Why |
|---|---|---|
| **SPA (client-side)** | `app/page.tsx` and all screen components | Fast, native-app-feeling navigation between marketplace, account, and RFQ screens |
| **Server-rendered** | `/brands/[slug]`, `/products/[slug]`, `/login`, `/register` | Shareable URLs, SEO, auth forms |

Inside the SPA, navigation is handled by a `goTo(screen, opts?)` callback that swaps which screen component is rendered — no URL changes, no page loads.

### Auth middleware

`middleware.ts` runs on every request:
- Unauthenticated users on protected routes (`/profile`, `/rfqs`, `/onboarding`, etc.) → redirected to `/login?next=[original]`
- Authenticated users on auth pages (`/login`, `/register`, etc.) → redirected to `/`

---

## Frontend structure

### App Router routes

```
app/
├── page.tsx                     # SPA root — renders all 25+ screens
├── layout.tsx                   # Root layout (fonts, metadata)
├── (auth)/                      # Auth route group
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── auth/
│   ├── callback/route.ts        # Supabase OAuth callback
│   └── reset-password/page.tsx
├── api/
│   └── delete-account/route.ts  # Server-only: uses admin key to delete auth user
├── onboarding/
│   └── brand/page.tsx           # Seller brand setup flow
├── brands/
│   └── [slug]/page.tsx          # Public brand profile (shareable URL)
└── products/
    └── [slug]/page.tsx          # Public product detail (shareable URL)
```

### Screen components

All screens live in `components/screens/` organised by domain:

```
components/screens/
├── marketplace/
│   ├── HomeScreen.tsx           # Featured brands + marketing banner
│   ├── ExploreScreen.tsx        # Searchable, filterable brand listing
│   ├── BusinessDetailScreen.tsx # Brand profile + product grid
│   ├── ProductDetailScreen.tsx  # Product detail + RFQ shortcut
│   └── SavedScreen.tsx          # Saved/favourited brands
├── business/
│   ├── RFQsScreen.tsx           # Buyer's sent + seller's received RFQs
│   ├── RFQCreateScreen.tsx      # New RFQ form (with file attachments)
│   ├── RFQDetailScreen.tsx      # RFQ thread + bids + responses
│   ├── MessagesScreen.tsx       # Direct message inbox
│   ├── MessageFormScreen.tsx    # Compose message
│   └── NotificationsScreen.tsx  # Notification centre
├── account/
│   ├── ProfileScreen.tsx        # User dashboard
│   ├── ManageProfileScreen.tsx  # Edit profile + avatar/logo upload
│   ├── ManageProductsScreen.tsx # Seller's product list
│   ├── ProductFormScreen.tsx    # Add / edit product (with image upload)
│   ├── SettingsScreen.tsx       # Account settings
│   └── SubscriptionScreen.tsx   # Membership tier
└── info/                        # Content pulled from Sanity CMS
    ├── AboutScreen.tsx
    ├── PrivacyScreen.tsx
    └── ContactScreen.tsx
```

### Shared component files

| File | Contains |
|---|---|
| `components/ui.tsx` | Core UI primitives: Button, Avatar, Field, TextArea, PageHeader, BackLink, SkeletonCard, etc. |
| `components/cards.tsx` | BusinessCard, ProductCard |
| `components/nav.tsx` | TopNav, BottomNav, Footer |
| `components/icons.tsx` | Icon component wrapper |
| `components/MarketingBanner.tsx` | Sanity-powered banner (renders nothing when no active banner) |
| `components/screens/account/_shared.tsx` | `uploadImage()`, `ImageUploadCircle`, `ProductImageUploader`, `StatusPill`, `ProLock`, `DeleteAccountModal` |
| `components/screens/business/_shared.tsx` | Shared RFQ utilities |

---

## Data fetching

### Supabase clients

| File | Usage |
|---|---|
| `lib/supabase/client.ts` | Browser components — uses anon key |
| `lib/supabase/server.ts` | Server components and middleware — handles cookie-based session refresh |
| `lib/supabase/admin.ts` | Server-only API routes — uses service-role key, bypasses RLS |

### SWR hooks (`hooks/`)

| Hook | Fetches | Cache |
|---|---|---|
| `useUserData(userId)` | User profile + brand | 5 s dedup |
| `useBrandProducts(brandId)` | Seller's products | 60 s dedup |
| `useNotifCount(userId)` | Notification badge count | 30 s auto-refresh |
| `useBanner(slot)` | Sanity marketing banner | 5 min dedup |
| `useAboutPage()` | Sanity About page content | 1 hour dedup |
| `usePrivacyPage()` | Sanity Privacy page content | 1 hour dedup |
| `useContactPage()` | Sanity Contact page content | 1 hour dedup |
| `useSiteSettings()` | Sanity site-wide settings | 1 hour dedup |

All mutation operations (create RFQ, update product, etc.) use direct Supabase client calls followed by a manual SWR `mutate()` to bust the relevant cache.

### Data transformation layer (`lib/data.ts`)

Raw database rows are transformed to clean UI types before being passed to components:

- `dbBrandToBusiness(DbBrand) → Business`
- `dbProductToProduct(DbProduct) → Product`
- `generateSlug(name: string) → string`

TypeScript types for all database tables live in `types/database.ts`.

---

## Database

### Schema overview

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Stores display name, role (`buyer`/`seller`), avatar URL, phone. Auto-created via trigger on signup. |
| `brands` | Seller-owned storefronts. Name, slug, logo, cover image, categories, contact info, verification status. |
| `products` | Catalogue items belonging to a brand. Images array, price range, MOQ, unit, tags, tiered pricing, variations, specs, active flag. |
| `rfqs` | Quote requests sent by a buyer to a brand (optionally for a specific product). Status: `pending → read → responded → closed`. |
| `rfq_responses` | Thread replies on an RFQ, visible to both the buyer and the seller. |
| `rfq_bids` | Supplier bids on public RFQs. Status: `pending → accepted / declined`. |
| `notifications` | In-app notifications for bid events (`bid_received`, `bid_accepted`, `bid_declined`). |
| `reviews` | Product and brand reviews. One review per reviewer per target (enforced by unique constraint). |

### Extended product fields (JSONB)

Four JSONB columns on the `products` table store structured data:

| Column | Type | Shape | Purpose |
|---|---|---|---|
| `tiered_pricing` | `jsonb` | `[{l: number, v: number}]` | Price breaks — `l` = min quantity, `v` = unit price (LKR) |
| `variations` | `jsonb` | `[{name, unitPrice}]` | Product variants (size, colour, etc.) with per-variant pricing |
| `product_specs` | `jsonb` | `[{l: string, v: string}]` | Label/value pairs shown in the Product specs tab |
| `tech_specs` | `jsonb` | `[{l: string, v: string}]` | Label/value pairs shown in the Technical specs tab |

All four default to `'[]'::jsonb` so existing rows are never null.

### Reviews table

```sql
reviews (
  id            uuid PRIMARY KEY,
  reviewer_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   text CHECK (target_type IN ('product', 'brand')),
  target_id     uuid,
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  title         text,
  body          text NOT NULL,
  photos        text[] DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
)
```

Unique constraint on `(reviewer_id, target_type, target_id)` — one review per user per item. Upsert with `onConflict: 'reviewer_id,target_type,target_id'` allows editing an existing review.

### Row Level Security

RLS is enabled on every table. Policy summary:

| Table | Read | Write |
|---|---|---|
| `profiles` | Public | Self only |
| `brands` | Public (active brands only) | Owner only |
| `products` | Public (active products only) | Brand owner only |
| `rfqs` | Buyer (own RFQs) + Seller (for their brands) | Buyer inserts; Seller updates status |
| `rfq_responses` | Both parties to the RFQ | Both parties can insert |
| `rfq_bids` | Both parties to the RFQ | Seller inserts; both can read |
| `notifications` | Recipient only | System inserts |
| `reviews` | Public | Authenticated users insert/update own reviews; delete own reviews |

### Auto-triggers

- `trg_on_auth_user_created` — Creates a `profiles` row automatically when a user signs up via Supabase Auth.
- `trg_profiles_updated_at`, `trg_brands_updated_at`, `trg_products_updated_at` etc. — Keep `updated_at` timestamps current on every row update.

---

## Storage

### Buckets

| Bucket | Used for | Max size | Allowed types |
|---|---|---|---|
| `avatars` | User profile photos | 2 MB | JPG, PNG, WebP |
| `logos` | Brand logo images | 2 MB | JPG, PNG, WebP |
| `products` | Product photos | 5 MB | JPG, PNG, WebP |
| `rfq-files` | RFQ attachments | 5 MB | JPG, PNG, WebP, PDF |

All buckets are **public** (anyone can read a file if they have its URL). Write access is controlled by storage RLS policies.

### Storage path conventions

| Bucket | Path pattern | Policy check |
|---|---|---|
| `avatars` | `{userId}/{timestamp}.{ext}` | First path segment must equal `auth.uid()` |
| `logos` | `{userId}/{timestamp}.{ext}` | First path segment must equal `auth.uid()` |
| `products` | `{brandId}/{timestamp}-{random}.{ext}` | First path segment must be a brand ID owned by `auth.uid()` |
| `rfq-files` | `{userId}/{timestamp}-{random}.{ext}` | First path segment must equal `auth.uid()` |

### Upload components

| Component | Bucket | Location |
|---|---|---|
| `ImageUploadCircle` | `avatars` or `logos` | `components/screens/account/_shared.tsx` |
| `ProductImageUploader` | `products` | `components/screens/account/_shared.tsx` |
| `RfqImageUploader` | `rfq-files` | `components/screens/business/RFQCreateScreen.tsx` + `RFQDetailScreen.tsx` |
| Logo upload (inline) | `logos` | `app/onboarding/brand/page.tsx` |

All upload call sites surface errors to the user via `alert()` if the upload fails.

---

## CMS (Sanity.io)

### Overview

Sanity manages all content that needs to be editable without a code deploy. The Next.js app fetches content from Sanity's CDN at runtime; all info screens fall back to hardcoded content if Sanity returns nothing.

### Schema types (`sanity/schemaTypes/`)

| Type | Kind | Content |
|---|---|---|
| `banner` | Repeatable document | Marketing banners: slot, title, subtitle, CTA, image, colours, date range, active flag |
| `siteSettings` | Singleton | Site name, tagline, footer text, contact details, social links |
| `aboutPage` | Singleton | Eyebrow, title, stats, values, CTA section |
| `privacyPage` | Singleton | Last-updated date, sections array with Portable Text body |
| `contactPage` | Singleton | Methods array, form title/subtitle, topic options |

### Banner slots

| Slot | Location |
|---|---|
| `home_hero` | Top of HomeScreen, above featured brands |
| `explore_heading` | Top of ExploreScreen, above the search/filter bar |
| `product_gallery` | ProductDetailScreen, between the image gallery and specifications |
| `brand_about` | BusinessDetailScreen, in the brand about section |

### Sanity client config

```
Project ID:  mx1vcbbk
Dataset:     production
API version: 2024-01-01
CDN:         enabled (useCdn: true)
```

Config files:
- `sanity/lib/client.ts` — Sanity client instance
- `sanity/lib/queries.ts` — All GROQ queries and TypeScript interfaces
- `sanity/lib/image.ts` — `urlFor()` image URL builder
- `sanity/structure.ts` — Custom Studio structure (singletons + banner list)
- `sanity.config.ts` — Studio configuration (plugins, schema)
- `sanity.cli.ts` — CLI configuration (project ID, studioHost)

### Studio deployment

The Sanity Studio editor runs separately from the Next.js app to avoid React 18/19 conflicts (Studio v5 requires React 19; the Next.js app uses React 18).

| | URL |
|---|---|
| Studio editor | `https://syndicate-b2b-cms.sanity.studio` |
| Studio source | `studio/` directory (own `package.json` with React 19) |

To deploy studio changes: `cd studio && npx sanity deploy`

---

## Testing

### Overview

| Type | Tool | Location | Runs |
|---|---|---|---|
| Unit tests | Vitest 4 + jsdom | `tests/unit/` | Instant, no server needed |
| E2E tests | Playwright (Chromium) | `tests/e2e/` | Requires the Next.js app to be running |
| CI | GitHub Actions | `.github/workflows/ci.yml` | On every push/PR to `main` |

### Playwright projects

The E2E suite is split into four projects:

| Project | Auth | Matches |
|---|---|---|
| `setup` | Logs in as seller → saves `tests/e2e/.auth/user.json` | `setup/auth.setup.ts` |
| `setup-buyer` | Logs in as buyer → saves `tests/e2e/.auth/buyer.json` | `setup/auth.buyer.setup.ts` |
| `chromium` | None (guest) | All files except `setup/` and `workflows/` |
| `chromium-authenticated` | Seller session | `workflows/` (non-`buyer-` files) |
| `chromium-buyer` | Buyer session | `workflows/buyer-*.spec.ts` |

### Test accounts

Two dedicated Supabase accounts are pre-created for E2E testing:

| Account | Email | Role |
|---|---|---|
| Seller | `e2e_seller@syndicate-test.dev` | seller |
| Buyer | `e2e_buyer@syndicate-test.dev` | buyer |

Credentials are in `.env.local` (local) and GitHub Secrets (CI). See `.env.test.example`.

### Unit test files

| File | What it covers |
|---|---|
| `tests/unit/generateSlug.test.ts` | `generateSlug()` — slug rules, edge cases |
| `tests/unit/dbAdapters.test.ts` | `dbBrandToBusiness()`, `dbProductToProduct()` — including tiered pricing, variations, specs mapping, null safety |
| `tests/unit/authContext.test.tsx` | Supabase auth contract — session presence, `onAuthStateChange`, `signOut` (all mocked) |
| `tests/unit/navOpts.test.ts` | Navigation logic — private screen guard, opt passing, guest redirects |
| `tests/unit/reviews.test.ts` | `reviewerInitials()`, `formatReviewDate()`, `isReviewSubmittable()`, `DbReview` shape |

### E2E test files

**Guest / smoke tests:**

| File | What it covers |
|---|---|
| `tests/e2e/guest-browsing.spec.ts` | Homepage, Explore, RFQs as a guest; auth redirect on protected actions |
| `tests/e2e/auth.spec.ts` | `/register`, `/login`, `/forgot-password` — field presence, validation, errors |
| `tests/e2e/navigation.spec.ts` | Bottom nav tabs, logo click, mobile viewport (375 px) |
| `tests/e2e/marketplace.spec.ts` | Homepage, Explore, brand detail, product detail smoke tests |

**Authenticated workflow tests (`tests/e2e/workflows/`):**

| File | Role | What it covers |
|---|---|---|
| `seller-product.spec.ts` | Seller | Add product, image upload, product visible on listing |
| `image-upload.spec.ts` | Seller | Profile photo, logo, product image upload flows |
| `explore-search.spec.ts` | Seller | Search bar, keyword results, clear search |
| `explore-filters.spec.ts` | Seller | Industry/location/rating/price filters, sort chips, tab switching, active chips, Reset button, multi-filter combos |
| `rfq-workflow.spec.ts` | Seller | Post a request, My requests tab, write a review |
| `messaging.spec.ts` | Seller | Inbox load, compose, thread reply, bid submission |
| `edit-flows.spec.ts` | Seller | Edit product fields (name/desc/price/tiers/variations/specs), edit brand profile fields, cancel, active toggle |
| `buyer-rfq.spec.ts` | Buyer | Buyer dashboard, explore as buyer, post RFQ, inbox |

### NPM scripts

```bash
npm run test:unit          # Run all unit tests once
npm run test:unit:watch    # Re-run on file save (development)
npm run test:unit:coverage # Run with HTML coverage report → coverage/index.html
npm run test:e2e           # Run all E2E tests (starts dev server automatically)
npm run test:e2e:ui        # Interactive Playwright UI for debugging
npm run test:e2e:report    # Open the last Playwright HTML report
npm run test               # Run unit tests then E2E tests
```

### Standing rule — test maintenance

Every new feature must include tests for all user-facing flows — both guest and authenticated. After any code change that affects user-visible behaviour, the test suite must be updated in the same commit. Tests are never deleted without a deliberate reason.

See `tests/README.md` for the full guide on running, debugging, and adding tests.

---

## Migrations

Database changes are managed as sequential SQL files in `supabase/migrations/`.

**File naming:** `YYYYMMDDHHMMSS_short_description.sql`

**Rules:**
- Each change gets a **new file** — existing migration files are never edited.
- Files run in lexicographic (chronological) order.
- Apply with: `supabase db push` from the project root.

### Migration history

| File | Description |
|---|---|
| `20260513000000_initial_schema.sql` | Initial schema: enums, all five tables, indexes, RLS policies, auto-triggers |
| `20260513000001_fix_profile_trigger.sql` | Fix: profile auto-creation trigger |
| `20260514000000_profile_delete_policy.sql` | Add RLS policy allowing users to delete their own profile |
| `20260514000001_business_profile_fields.sql` | Add business profile fields to `profiles` table |
| `20260514000002_image_uploads.sql` | Create `avatars` and `logos` storage buckets with RLS policies |
| `20260514000003_product_images.sql` | Create `products` storage bucket (original policies — superseded by fix below) |
| `20260514000004_rfq_buyer_update.sql` | Allow buyers to update their own RFQs |
| `20260514000005_rfq_enhancements.sql` | Add `rfq-files` storage bucket; add `rfq_bids` table; RFQ detail improvements |
| `20260514000006_notifications.sql` | Add `notifications` table with RLS |
| `20260515000000_banners.sql` | Add `banners` table (superseded by Sanity CMS — table unused) |
| `20260515120000_fix_products_storage_policy.sql` | **Fix:** Products storage RLS name collision bug (see below) |
| `20260515130000_fix_rfq_files_policy.sql` | **Fix:** Add missing UPDATE policy on `rfq-files`; add PDF to allowed types |
| `20260515140000_products_add_extended_fields.sql` | Add `tiered_pricing`, `variations`, `product_specs`, `tech_specs` JSONB columns to `products` (all default `'[]'::jsonb`) |
| `20260515150000_create_reviews.sql` | Add `reviews` table with RLS, unique constraint on `(reviewer_id, target_type, target_id)`, and reviewer profile join index |

---

## Known fixes and notable bugs resolved

### Products storage RLS — name collision bug

**Migration:** `20260515120000_fix_products_storage_policy.sql`

The original `products` storage policies used an `EXISTS (SELECT 1 FROM brands WHERE ...)` subquery to check ownership. Inside that subquery, the bare column reference `name` was resolved by PostgreSQL to `brands.name` (the brand's display name) rather than `storage.objects.name` (the file path). This caused the ownership check to always fail, silently blocking all product image uploads.

**Fix:** Restructured policies to use `split_part(name, '/', 1) IN (SELECT id::text FROM brands WHERE owner_id = auth.uid())` at the outer level, where `name` unambiguously refers to `storage.objects.name`.

### rfq-files missing UPDATE policy

**Migration:** `20260515130000_fix_rfq_files_policy.sql`

The `rfq-files` bucket had INSERT and DELETE policies but no UPDATE policy. Because the upload code uses `upsert: true`, any re-upload of a file at the same path would silently fail. Fixed by adding a matching UPDATE policy with the same `auth.uid()` path check.

### Silent upload failures

All upload call sites previously swallowed errors silently (`if (!error) { ... }` with no else branch). Any failure — policy rejection, network error, file type mismatch at the bucket level — would cause the spinner to disappear with no feedback. Fixed across all four buckets by adding `alert()` calls with the Supabase error message in the failure branch.

---

## Environment variables

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client (server-only, never sent to browser) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client (default: `production`) |

Set in `.env.local` for local development. Set in Vercel project settings for production.

---

## Deployment

| Target | Platform | Trigger |
|---|---|---|
| Next.js app | Vercel | Automatic on every `git push origin main` |
| Database migrations | Supabase | Manual: `supabase db push` |
| Sanity Studio | Sanity hosting | Manual: `cd studio && npx sanity deploy` |

### Vercel build notes

- `.npmrc` contains `legacy-peer-deps=true` to resolve peer dependency conflicts between `next-sanity` and React 18.
- `next.config.mjs` transpiles Sanity packages (`sanity`, `next-sanity`, `@sanity/ui`, `@sanity/icons`) so they compile correctly under Next.js.
- The `studio/` directory is excluded from the Vercel build (it has its own deployment target). Make sure it is not tracked under `app/studio/` in git.
