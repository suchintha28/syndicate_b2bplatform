# Syndicate B2B Marketplace — Product & Technical Overview

---

## 1. What Is Syndicate

Syndicate is a B2B marketplace platform built for the Sri Lankan market. It connects buyers looking to source products and services with verified local suppliers. Buyers can browse supplier listings, view products, post RFQs (requests for quotation), receive bids from suppliers, and manage their sourcing activity. Suppliers can list their business, showcase products, receive inquiries, and submit bids on public RFQs — all from one place.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| File Storage | Supabase Storage |
| Hosting | Vercel |
| Styling | Custom CSS (design tokens, utility classes) |
| CLI | Supabase CLI (linked; migrations applied via `supabase db push`) |

---

## 3. Application Architecture

The app uses a **hybrid pattern**:

- The main experience (`/`) is a **single-page application (SPA)** — a single Next.js page that manages all screens via React state. Navigation between Home, Explore, RFQs, Inbox, Notifications, Profile, and all sub-screens happens without a full page reload.
- Authentication pages (`/login`, `/register`, `/forgot-password`, `/auth/reset-password`) are separate **Next.js App Router pages** with their own layouts.
- The brand onboarding page (`/onboarding/brand`) is a separate full-page route.
- API logic lives in **Next.js Route Handlers** under `/app/api/`.

### SPA Screen Map

```
/ (app/page.tsx)
├── home              — Hero, featured suppliers, trending products
├── listing           — Full explore/search with filters
├── detail            — Individual supplier brand page
├── product-detail    — Individual product page
├── saved             — Saved/favourited suppliers
├── rfqs              — RFQ marketplace (Browse / My RFQs / My Bids tabs)
├── rfq-create        — Create a new RFQ (guests redirected to auth, then back)
├── rfq-detail        — RFQ thread (private) or bid board (public)
├── messages          — Private inbox (private RFQs only)
├── message-form      — Send a direct message to a supplier
├── notifications     — In-app notification feed
├── success           — Post-action success screen
├── auth              — Inline sign-in / sign-up tabs
├── profile           — Unified profile + dashboard hub
├── manage-profile    — Edit personal and business information
├── manage-products   — Manage product listings
├── add-product       — Add a new product
├── edit-product      — Edit an existing product
├── settings          — Account settings
└── subscription      — Pro plan upgrade
```

---

## 4. Features Built

### 4.1 Authentication

- **Sign up** — Email + password registration. Captures full name, role (buyer/seller), and for sellers: business name and industry. Data is stored in `auth.users` metadata and synced to the `profiles` table via a database trigger.
- **Email confirmation** — Supabase sends a confirmation email. On click, the `/auth/callback` route exchanges the code for a session. New sellers without a brand are automatically redirected to `/onboarding/brand`. Everyone else lands on the homepage.
- **Sign in** — Email + password. Success redirects to the homepage.
- **Forgot password** — Sends a reset link via Supabase. The reset link lands on `/auth/reset-password` where the user sets a new password.
- **Session management** — Supabase handles JWTs and refresh tokens. Session state is tracked in `app/page.tsx` via `onAuthStateChange`.
- **Sign out** — Clears session and returns to homepage.
- **Guest access** — Unauthenticated users can browse the marketplace freely. Attempting to access any private screen redirects to the auth screen. The "New RFQ" button is always visible — clicking it as a guest redirects to login, then automatically continues to the RFQ creation screen after sign-in (pending navigation is preserved in React state).

### 4.2 Buyer/Seller Role Model

The `buyer` / `seller` flag is an **onboarding routing signal**, not a hard account type. It determines the post-signup flow:

- **Seller at signup** → redirected to `/onboarding/brand` to create their brand listing
- **Buyer at signup** → lands on the marketplace homepage directly
- **Any user** can create a brand from their Profile page at any time using the "Get listed" call-to-action — this takes them to `/onboarding/brand`

### 4.3 Marketplace — Supplier Directory

- Live supplier listings fetched from the `brands` table
- **Featured suppliers** section on homepage (most recently joined)
- **Trending products** section on homepage
- **Explore / Search** page with filters: category, price range, rating, location
- **Supplier detail page** — full brand profile with description, category, verification status, contact, and product listing
- **Product detail page** — product info, pricing, MOQ, images, link back to supplier
- **Saved / Favourites** — bookmark suppliers; persisted to `localStorage`
- **Recently viewed** — tracks last 10 viewed suppliers in `localStorage`; shown on homepage
- Brand logos and product images load from Supabase Storage; fall back to category-based Unsplash images

### 4.4 RFQ System (Request for Quotation)

The RFQ system supports two modes: **public RFQs** (open to all suppliers) and **private RFQs** (direct message to a specific supplier).

#### 4.4.1 Public RFQs

- Created without selecting a supplier — visible on the RFQ marketplace browse board
- Any supplier with a brand can view and submit a bid
- Rich fields: subject, message, category, quantity, unit, budget range (min/max in LKR), location, delivery timeline, expiry (2 weeks / 1 month / 2 months / 3 months), images (up to 3)
- Buyers are informed that RFQs expire and are automatically removed after the chosen period
- Status lifecycle: `pending → responded → closed`
- Browse board includes filters: industry/category, budget range, posting time (today / this week / this month)
- Each public RFQ card on the "My RFQs" tab shows how many bids have been received
- Buyers can **accept** or **decline** individual bids:
  - **Accept** → bid marked `accepted`, all other pending bids auto-declined, RFQ closed, winning supplier notified, buyer shown a "Message supplier" CTA
  - **Decline** → bid marked `declined`, supplier notified

#### 4.4.2 Private RFQs

- Created by selecting a specific supplier — sent directly to that brand
- Appears in the supplier's Messages/Inbox screen
- Supports a full conversation thread: both parties can reply
- Auto-marks as `read` when the supplier opens it
- Buyer can close the RFQ at any time
- Status lifecycle: `pending → read → responded → closed`

#### 4.4.3 RFQ Creation

- Toggle between Public and Private at creation time
- For private RFQs, supplier is pre-filled when navigating from a brand or product page
- Images can be uploaded to the `rfq-files` storage bucket
- Guests clicking "New RFQ" are redirected to sign-in, then returned to the creation form

#### 4.4.4 Bid System (Public RFQs)

- Suppliers with a brand can submit bids on any open public RFQ they did not create
- Bid fields: description (required), price (LKR, optional), delivery timeline, notes, images (up to 2)
- One bid per brand per RFQ
- After submitting, a notification is sent to the RFQ buyer
- Bid status: `pending → accepted` or `declined`

### 4.5 Notifications

- **In-app notification feed** accessible via the bell icon in the top nav
- Bell shows a red badge with the unread count
- Clicking the bell opens the Notifications screen
- Opening the screen automatically marks all notifications as read and resets the badge
- Clicking any notification navigates directly to the relevant RFQ detail screen
- **Notification types:**
  - `bid_received` — buyer is notified when a supplier submits a bid on their public RFQ
  - `bid_accepted` — supplier is notified when their bid is accepted
  - `bid_declined` — supplier is notified when their bid is declined or another bid is selected
- Notifications are stored in the `notifications` table with RLS (users see only their own)

### 4.6 Messages / Inbox

- Shows all **private** RFQs (direct messages to/from suppliers)
- Public RFQ interactions (bids) are handled through the RFQs screen, not the inbox
- Sellers see inbound private RFQs with buyer info and status
- Buyers see their sent private RFQs with supplier info and status
- Unread badge on the Inbox nav item counts pending (unread) private RFQs

### 4.7 RFQs Screen

Three tabs:
1. **Browse (Open requests)** — Public RFQs from all buyers, with filters. Visible to guests.
2. **My RFQs** — Signed-in buyer's own RFQs (both public and private) with status and bid counts.
3. **My Bids** — Signed-in seller's submitted bids with status.

### 4.8 Profile — Unified Hub

The Profile screen is the single hub for all account activity. Its content adapts based on the signed-in user:

**For all users:**
- Identity card with name, role badge, plan badge
- Quick action buttons
- Edit profile, Settings, Subscription links
- Sign out and Delete account

**For buyers (4-stat grid):**
- RFQs Sent · Bids Received · Responded · Saved
- Recent sent RFQs list (clickable, navigates to RFQ detail)

**For sellers with a brand (4-stat grid):**
- Products · Active · Incoming RFQs · Pending
- Recent product list
- Recent incoming RFQ list (clickable)

**For users without a brand:**
- "Get listed" dark card CTA to create a brand listing

### 4.9 Brand / Business Onboarding

- Sellers are redirected here after email confirmation
- Any user can also reach it via "Get listed" in their profile
- Form fields: brand logo (upload), business name (pre-filled from signup), industry (pre-filled from signup), city, description, website
- On submit, creates a row in `brands` and redirects to the homepage

### 4.10 Profile Editing

**Personal information:**
- Profile photo upload (click avatar to upload — JPG/PNG/WebP, max 2 MB)
- Full name, phone

**Business information:**
- Brand logo upload (click logo to upload — same format/size limits)
- Business name, industry, phone, website
- Description (for users with a marketplace brand listing)

Changes are saved to both the `profiles` table (personal + business fields) and the `brands` table (for users with a brand listing).

### 4.11 Image Uploads

- **Profile photos** — stored in the `avatars` Supabase Storage bucket
- **Brand logos** — stored in the `logos` Supabase Storage bucket
- **RFQ and bid images** — stored in the `rfq-files` Supabase Storage bucket. Path: `{userId}/{timestamp}-{random}.{ext}`
- All buckets are **public read** (images accessible via URL without auth)
- Write access is restricted to the file owner via RLS policies on `storage.objects`
- File naming convention: `{userId}/{timestamp}.{ext}` (avatars/logos) or `{userId}/{timestamp}-{random}.{ext}` (rfq-files)

### 4.12 Account Deletion

- Available from the Profile screen under the Danger Zone section
- Triggers a password confirmation modal
- Calls the `/api/delete-account` server-side route
- Server re-authenticates the user with the provided password, then calls `auth.admin.deleteUser()` using the service role key
- Cascade deletes remove all associated data: profile, brands, products, RFQs, RFQ responses, bids, notifications, business members
- Local state (favourites, recently viewed) is also cleared

### 4.13 Navigation & Branding

- **Logo** — Business Syndicate Group logo in the top nav. Light version shown in light mode; dark version shown when the OS is in dark mode (via CSS `prefers-color-scheme`).
- **Top nav** (desktop): Logo, main nav links, saved heart, notifications bell with unread badge, upgrade button (free users), profile avatar
- **Bottom nav** (mobile): Home, Explore, RFQs, Inbox, Profile tabs with active indicators and unread badge on Inbox
- Profile avatar in the nav bar shows the uploaded profile photo, or initials if none

---

## 5. Database Schema

### Tables

#### `profiles`
Automatically created when a user signs up (via trigger). One row per `auth.users` account.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, references `auth.users` |
| `full_name` | text | |
| `email` | text | |
| `role` | user_role enum | `buyer` or `seller` |
| `avatar_url` | text | Profile photo (Supabase Storage URL) |
| `phone` | text | |
| `business_name` | text | Optional; filled in for buyers/sellers |
| `business_industry` | text | |
| `business_website` | text | |
| `business_phone` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

#### `brands`
Public supplier/business listings on the marketplace.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `owner_id` | uuid | References `profiles(id)` → CASCADE delete |
| `name` | text | |
| `slug` | text | Unique; used in public URLs |
| `description` | text | |
| `logo_url` | text | Brand logo (Supabase Storage URL) |
| `cover_image_url` | text | Banner image |
| `website` | text | |
| `phone` | text | |
| `email` | text | |
| `city` | text | |
| `categories` | text[] | Array of industry categories |
| `is_verified` | boolean | Set by admin |
| `is_active` | boolean | Controls marketplace visibility |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

#### `products`
Product listings attached to a brand.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `brand_id` | uuid | References `brands(id)` → CASCADE delete |
| `name` | text | |
| `slug` | text | Unique |
| `description` | text | |
| `images` | text[] | Array of image URLs |
| `category` | text | |
| `subcategory` | text | |
| `min_order_quantity` | integer | |
| `price_range_min` | decimal(12,2) | Displayed in LKR |
| `price_range_max` | decimal(12,2) | |
| `unit` | text | e.g. "units", "kg", "boxes" |
| `tags` | text[] | |
| `is_active` | boolean | Controls visibility |

#### `rfqs`
Buyer RFQs — either public (open to all suppliers) or private (direct to one supplier).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `buyer_id` | uuid | References `profiles(id)` → CASCADE delete |
| `brand_id` | uuid | **Nullable** — null = public RFQ; set = private RFQ to that brand |
| `product_id` | uuid | Optional — references `products(id)` → SET NULL |
| `subject` | text | |
| `message` | text | |
| `quantity` | integer | |
| `unit` | text | |
| `category` | text | Industry/category for browse filtering |
| `budget_min` | numeric | LKR |
| `budget_max` | numeric | LKR |
| `location` | text | Buyer's location |
| `timeline` | text | Required delivery timeline |
| `expires_at` | timestamptz | Auto-set at creation; up to 3 months |
| `images` | text[] | Uploaded to `rfq-files` bucket |
| `is_public` | boolean | true = browse board; false = private inbox |
| `status` | text | `pending`, `read`, `responded`, `closed` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `rfq_responses`
Threaded replies within a private RFQ conversation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `rfq_id` | uuid | References `rfqs(id)` → CASCADE delete |
| `sender_id` | uuid | References `profiles(id)` → CASCADE delete |
| `message` | text | |
| `created_at` | timestamptz | |

#### `rfq_bids`
Supplier bids on public RFQs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `rfq_id` | uuid | References `rfqs(id)` → CASCADE delete |
| `bidder_id` | uuid | References `profiles(id)` → CASCADE delete |
| `brand_id` | uuid | References `brands(id)` → CASCADE delete |
| `description` | text | Required; bid details |
| `amount` | numeric | Optional; bid price in LKR |
| `currency` | text | Default `LKR` |
| `timeline` | text | Optional; delivery timeline |
| `notes` | text | Optional; extra terms, conditions |
| `images` | text[] | Uploaded to `rfq-files` bucket |
| `status` | text | `pending`, `accepted`, `declined` |
| `read_by_buyer` | boolean | Whether buyer has viewed this bid |
| `created_at` | timestamptz | |

#### `notifications`
In-app notifications for bid activity.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Recipient — references `profiles(id)` → CASCADE delete |
| `type` | text | `bid_received`, `bid_accepted`, `bid_declined` |
| `title` | text | Short notification title |
| `body` | text | Full notification message |
| `rfq_id` | uuid | References `rfqs(id)` → CASCADE delete (nullable) |
| `bid_id` | uuid | References `rfq_bids(id)` → CASCADE delete (nullable) |
| `read` | boolean | Default false; set to true when user views notification feed |
| `created_at` | timestamptz | |

#### `business_members`
Membership table linking users to brands (provision for multi-user brand accounts).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `brand_id` | uuid | References `brands(id)` → CASCADE delete |
| `profile_id` | uuid | References `profiles(id)` → CASCADE delete |
| `member_role` | text | `owner`, `admin`, or `member` |
| `invited_by` | uuid | References `profiles(id)` |
| `joined_at` | timestamptz | |

When a new brand is created, the creator is automatically inserted as `owner` via the `trg_on_brand_created` trigger.

### Cascade Delete Chain

Deleting a user from `auth.users` cascades in this order:
```
auth.users
  → profiles
      → brands (via owner_id)
          → products
          → rfqs (via brand_id)
          → rfq_bids (via brand_id)
          → business_members (via brand_id)
      → rfqs (via buyer_id)
          → rfq_responses
          → rfq_bids (via rfq_id)
          → notifications (via rfq_id)
      → rfq_responses (via sender_id)
      → rfq_bids (via bidder_id)
      → notifications (via user_id)
      → business_members (via profile_id)
```

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | Who can read | Who can write |
|---|---|---|
| `profiles` | Anyone | Owner only (update/delete) |
| `brands` | Anyone (active brands) | Owner only |
| `products` | Anyone (active products) | Brand owner only |
| `rfqs` | Buyer (own) + brand owner + anyone (if public) | Buyer (insert), buyer/brand owner (update) |
| `rfq_responses` | Buyer + brand owner of that RFQ | Buyer or brand owner |
| `rfq_bids` | RFQ owner (all bids on their RFQs) + bidder (own bids) | Brand owner (insert, must own brand) |
| `notifications` | Owner only | Any authenticated user (insert for cross-user notify) |
| `business_members` | Own record + brand owner/admin | Brand owner only |
| `storage.objects` (avatars/logos) | Anyone (public read) | File owner only |
| `storage.objects` (rfq-files) | Anyone (public read) | File owner only (path enforced) |

---

## 6. Authentication Flows in Detail

### New user signup (seller)
1. User fills in sign-up form: name, email, password, role=seller, business name, industry
2. `supabase.auth.signUp()` stores data in `auth.users.raw_user_meta_data`
3. `handle_new_user` trigger fires → creates `profiles` row with `business_name` and `business_industry` populated
4. Supabase sends confirmation email
5. User clicks link → `/auth/callback?code=...`
6. Callback exchanges code for session, gets `user` from the response directly
7. Checks if user has a `brands` row — if not, redirects to `/onboarding/brand`
8. Brand onboarding form is pre-filled with business name + industry from the profiles table
9. User completes form (+ optional logo upload) → `brands` row created → `trg_on_brand_created` fires → user added as `owner` in `business_members`
10. Redirect to `/` (homepage)

### New user signup (buyer)
Steps 1–4 same as above, then:
5. User clicks confirmation link → `/auth/callback`
6. Callback sees `role !== 'seller'` → redirects to `/` directly

### Guest → auth → pending destination
1. Guest clicks any auth-required button (e.g. "New RFQ")
2. `goTo()` saves `{ screen, opts }` to `pendingNav` state and navigates to `auth`
3. User signs in or registers
4. `useEffect` watching `[user, pendingNav]` fires — navigates to the saved destination with all opts intact
5. `pendingNav` is cleared after firing

### Password reset
1. User visits `/forgot-password`, enters email
2. `supabase.auth.resetPasswordForEmail()` sends reset link
3. Link goes to `/auth/reset-password`
4. User enters new password → `supabase.auth.updateUser()` → redirected to homepage

### Account deletion
1. User clicks "Delete account" in Profile → password modal appears
2. Frontend calls `POST /api/delete-account` with password
3. Server verifies session, re-authenticates with the password via `signInWithPassword`
4. Server calls `admin.auth.admin.deleteUser(userId)` using service-role key
5. CASCADE deletes remove all data; client clears local state

---

## 7. Storage Buckets

| Bucket | Public | Max file size | Allowed types | Used for |
|---|---|---|---|---|
| `avatars` | Yes | 2 MB | image/jpeg, image/png, image/webp | Profile photos |
| `logos` | Yes | 2 MB | image/jpeg, image/png, image/webp | Brand logos |
| `rfq-files` | Yes | 5 MB | image/jpeg, image/png, image/webp | RFQ images, bid images |

File naming convention:
- `avatars` / `logos`: `{userId}/{timestamp}.{ext}` — uses `upsert: true` so re-upload replaces the file
- `rfq-files`: `{userId}/{timestamp}-{random4chars}.{ext}` — unique per upload

---

## 8. Key Source Files

| File | Purpose |
|---|---|
| `app/page.tsx` | SPA root — all screen state, auth state, profile data, notification count, pending nav |
| `components/screens/marketplace.tsx` | Home, Explore, Business Detail, Product Detail, Saved screens |
| `components/screens/account.tsx` | Profile, ManageProfile, ManageProducts, ProductForm, Settings, Subscription screens |
| `components/screens/business.tsx` | RFQs, RFQ Create, RFQ Detail, Messages, Message Form, Notifications, Success screens |
| `components/screens/auth.tsx` | Inline auth screen (sign in + sign up tabs) |
| `components/nav.tsx` | TopNav and BottomNav (logo, bell badge, unread badge) |
| `components/cards.tsx` | BusinessCard, ProductCard, MessageCard, CategoryTile |
| `components/ui.tsx` | Shared UI primitives: Avatar, Button, Badge, Field, Stars, etc. |
| `components/icons.tsx` | SVG icon library |
| `lib/data.ts` | TypeScript interfaces (Business, Product, UserProfile, Screen, NavOpts), INDUSTRIES list |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client (uses cookies) |
| `lib/supabase/admin.ts` | Service-role Supabase client (server only, for account deletion) |
| `lib/supabase/queries.ts` | `dbBrandToBusiness()` and `dbProductToProduct()` adapter functions |
| `types/database.ts` | TypeScript types: DbBrand, DbProduct, DbProfile, DbRfq, DbRfqBid, DbRfqResponse, DbNotification |
| `app/auth/callback/route.ts` | OAuth / email confirmation callback handler |
| `app/api/delete-account/route.ts` | Server route for hard account deletion |
| `app/onboarding/brand/page.tsx` | Brand creation onboarding page |
| `app/(auth)/login/page.tsx` | Standalone login page |
| `app/(auth)/register/page.tsx` | Standalone registration page |
| `app/(auth)/forgot-password/page.tsx` | Password reset request page |
| `app/auth/reset-password/page.tsx` | Password reset completion page |
| `middleware.ts` | Route protection middleware |
| `supabase/migrations/` | All DB migration SQL files |
| `public/logo-light.jpeg` | Business Syndicate Group logo — light version (used in light mode) |
| `public/logo-dark.jpeg` | Business Syndicate Group logo — dark version (used in dark mode) |

---

## 9. Database Migrations (Applied in Order)

| File | What it does |
|---|---|
| `20260513000000_initial_schema.sql` | Full base schema: all tables, indexes, RLS, triggers |
| `20260513000001_fix_profile_trigger.sql` | Patches `handle_new_user` to handle edge cases |
| `20260514000000_profile_delete_policy.sql` | Adds DELETE RLS policy on `profiles` for account deletion |
| `20260514000001_business_profile_fields.sql` | Adds `business_name/industry/website/phone` to `profiles`; creates `business_members` table; adds `handle_new_brand` trigger |
| `20260514000002_image_uploads.sql` | Adds `avatar_url` to `profiles`, `logo_url` to `brands`; creates `avatars` and `logos` storage buckets with RLS policies |
| `20260514000003_product_images.sql` | Adds image upload support for product listings |
| `20260514000004_rfq_buyer_update.sql` | Adds RLS UPDATE policy so buyers can close their own RFQs |
| `20260514000005_rfq_enhancements.sql` | Makes `brand_id` nullable (public RFQs); adds `category`, `budget_min/max`, `location`, `timeline`, `expires_at`, `images`, `is_public` to `rfqs`; creates `rfq_bids` table with RLS; creates `rfq-files` storage bucket |
| `20260514000006_notifications.sql` | Creates `notifications` table with RLS; adds `read_by_buyer` column to `rfq_bids` |

---

## 10. Environment Variables

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client only — server-side, never exposed to browser |

Set in `.env.local` for local development. Set in Vercel project settings for production.

---

## 11. Deployment

- **Repository**: GitHub
- **Hosting**: Vercel (auto-deploys on every push to `main`)
- **Database**: Supabase (hosted PostgreSQL, separate project)
- **Supabase CLI**: Linked to the project. Run `supabase db push` to apply any new migrations.
- **Domain**: Configured in Vercel project settings

To deploy a change:
1. Make code changes locally
2. Run `npm run build` to verify no TypeScript/lint errors
3. If a migration file was added, run `/opt/homebrew/bin/supabase db push` — it will prompt before applying
4. `git add` the changed files
5. `git commit` with a descriptive message
6. `git push origin main` — Vercel picks it up automatically

---

## 12. Known Limitations / Future Work

- **Multi-user brand accounts** — The `business_members` table is in place and the `owner` row is auto-created, but the UI for inviting team members is not yet built.
- **Verification** — The `is_verified` flag exists on brands and is displayed in the UI but the admin verification workflow is not yet built.
- **Search** — The Explore screen has filter UI but full-text search against the database is not yet implemented; currently filtering is done client-side on fetched data.
- **Cover images** — `brands.cover_image_url` exists in the schema but upload is not yet exposed in the UI; currently falls back to category-based stock images.
- **RFQ expiry enforcement** — `expires_at` is stored and displayed, and the browse board filters out expired RFQs client-side, but there is no server-side job to hard-delete expired rows. A Supabase cron job or pg_cron task would be needed for automatic cleanup.
- **Push notifications** — Notifications are in-app only. No email or mobile push notifications are sent yet.
- **Bid counter-offers** — Buyers can only accept or decline bids as-is. A negotiation/counter-offer flow is not yet built.
