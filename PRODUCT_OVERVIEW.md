# Syndicate B2B Marketplace — Product & Technical Overview

---

## 1. What Is Syndicate

Syndicate is a B2B marketplace platform built for the Sri Lankan market. It connects buyers looking to source products and services with verified local suppliers. Buyers can browse supplier listings, view products, send RFQs (requests for quotation), and manage their sourcing activity. Suppliers can list their business, showcase products, and receive inquiries — all from one place.

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

---

## 3. Application Architecture

The app uses a **hybrid pattern**:

- The main experience (`/`) is a **single-page application (SPA)** — a single Next.js page that manages all screens via React state. Navigation between Home, Explore, RFQs, Inbox, Profile, and all sub-screens happens without a full page reload.
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
├── rfqs              — RFQ board (public view + signed-in view)
├── rfq-create        — Create a new RFQ (auth required)
├── messages          — Inbox list
├── message-form      — Send a message to a supplier
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
- **Guest access** — Unauthenticated users can browse the marketplace freely. Attempting to access any private screen (profile, messages, RFQ creation, etc.) redirects to the auth screen.

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

- Buyers can submit an RFQ to any supplier directly from the supplier's detail page
- RFQ form captures: subject, message, quantity, unit
- Unauthenticated users attempting to submit are redirected to the auth screen
- RFQs are stored in the `rfqs` table, linked to the buyer and the target brand
- Status lifecycle: `pending → read → responded → closed`
- Suppliers see incoming RFQs in their Profile dashboard
- Buyers see their sent RFQs with status in their Profile dashboard

### 4.5 Profile — Unified Hub

The Profile screen is the single hub for all account activity. Its content adapts based on the signed-in user:

**For all users:**
- Identity card with name, role badge, plan badge, member since date
- Quick actions (Explore, Post RFQ, Inbox, Edit Profile)
- Saved count
- Edit profile, Settings, Subscription links
- Sign out
- Delete account (with password confirmation)

**For users with a brand:**
- Live stats: total products, active products, incoming RFQs, pending RFQs (for brand owners) — or RFQs sent, responses, pending, closed (for buyers)
- Product list (brand owners) — shows up to 5 most recent products with price and status
- Incoming inquiries list (brand owners) — shows up to 5 recent RFQs with buyer name, date, status pill
- Sent RFQs list (buyers) — shows recent RFQs with supplier name and status

**For users without a brand:**
- "Get listed" dark card CTA to create a brand listing

### 4.6 Brand / Business Onboarding

- Sellers are redirected here after email confirmation
- Any user can also reach it via "Get listed" in their profile
- Form fields: brand logo (upload), business name (pre-filled from signup), industry (pre-filled from signup), city, description, website
- On submit, creates a row in `brands` and redirects to the homepage

### 4.7 Profile Editing

**Personal information:**
- Profile photo upload (click avatar to upload — JPG/PNG/WebP, max 2 MB)
- Full name, phone

**Business information:**
- Brand logo upload (click logo to upload — same format/size limits)
- Business name, industry, phone, website
- Description (for users with a marketplace brand listing)
- All business fields are optional for buyers; required for sellers

Changes are saved to both the `profiles` table (personal + business fields) and the `brands` table (for users with a brand listing).

### 4.8 Image Uploads

- **Profile photos** — stored in the `avatars` Supabase Storage bucket. Path: `{userId}/{timestamp}.{ext}`
- **Brand logos** — stored in the `logos` Supabase Storage bucket. Same path convention.
- Both buckets are **public read** (images are accessible via URL without auth)
- Write access is restricted to the file owner via RLS policies on `storage.objects`
- Images appear everywhere the business or user avatar is displayed: nav bar, homepage cards, explore cards, product cards, supplier detail page, profile screen
- Falls back to auto-generated initials from the name if no image is uploaded

### 4.9 Account Deletion

- Available from the Profile screen under the Danger Zone section
- Triggers a password confirmation modal
- Calls the `/api/delete-account` server-side route
- Server re-authenticates the user with the provided password, then calls `auth.admin.deleteUser()` using the service role key
- Cascade deletes remove all associated data: profile, brands, products, RFQs, RFQ responses, business members
- Local state (favourites, recently viewed) is also cleared

### 4.10 Navigation

- **Top nav** (desktop): Syndicate logo, main nav links, saved heart, notifications bell, upgrade button (for free users), profile avatar
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
Buyer inquiries sent to a supplier brand.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `buyer_id` | uuid | References `profiles(id)` → CASCADE delete |
| `brand_id` | uuid | References `brands(id)` → CASCADE delete |
| `product_id` | uuid | Optional — references `products(id)` → SET NULL |
| `subject` | text | |
| `message` | text | |
| `quantity` | integer | |
| `unit` | text | |
| `status` | rfq_status enum | `pending`, `read`, `responded`, `closed` |

#### `rfq_responses`
Threaded replies to an RFQ from either party.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `rfq_id` | uuid | References `rfqs(id)` → CASCADE delete |
| `sender_id` | uuid | References `profiles(id)` → CASCADE delete |
| `message` | text | |

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
          → business_members (via brand_id)
      → rfqs (via buyer_id)
      → rfq_responses (via sender_id)
      → business_members (via profile_id)
```

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | Who can read | Who can write |
|---|---|---|
| `profiles` | Anyone | Owner only (update/delete) |
| `brands` | Anyone (active brands) | Owner only |
| `products` | Anyone (active products) | Brand owner only |
| `rfqs` | Buyer (own RFQs) + brand owner | Buyer (insert), brand owner (update status) |
| `rfq_responses` | Buyer + brand owner | Buyer or brand owner |
| `business_members` | Own record + brand owner/admin | Brand owner only |
| `storage.objects` (avatars/logos) | Anyone (public read) | File owner only |

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

| Bucket | Public | Max file size | Allowed types |
|---|---|---|---|
| `avatars` | Yes | 2 MB | image/jpeg, image/png, image/webp |
| `logos` | Yes | 2 MB | image/jpeg, image/png, image/webp |

File naming convention: `{userId}/{timestamp}.{ext}`

The `upsert: true` flag is used on upload so re-uploading replaces the previous file at the same path.

---

## 8. Key Source Files

| File | Purpose |
|---|---|
| `app/page.tsx` | SPA root — all screen state, auth state, profile data, Supabase fetching |
| `components/screens/marketplace.tsx` | Home, Explore, Business Detail, Product Detail, Saved screens |
| `components/screens/account.tsx` | Profile, ManageProfile, ManageProducts, ProductForm, Settings, Subscription screens |
| `components/screens/business.tsx` | RFQs, RFQ Create, Messages, Message Form, Success screens |
| `components/screens/auth.tsx` | Inline auth screen (sign in + sign up tabs) |
| `components/nav.tsx` | TopNav and BottomNav |
| `components/cards.tsx` | BusinessCard, ProductCard, MessageCard, CategoryTile |
| `components/ui.tsx` | Shared UI primitives: Avatar, Button, Badge, Field, Stars, etc. |
| `components/icons.tsx` | SVG icon library |
| `lib/data.ts` | TypeScript interfaces (Business, Product, UserProfile), INDUSTRIES list, static dummy data |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client (uses cookies) |
| `lib/supabase/admin.ts` | Service-role Supabase client (server only, for account deletion) |
| `lib/supabase/queries.ts` | `dbBrandToBusiness()` and `dbProductToProduct()` adapter functions |
| `types/database.ts` | TypeScript types matching DB table shapes |
| `app/auth/callback/route.ts` | OAuth / email confirmation callback handler |
| `app/api/delete-account/route.ts` | Server route for hard account deletion |
| `app/onboarding/brand/page.tsx` | Brand creation onboarding page |
| `app/(auth)/login/page.tsx` | Standalone login page |
| `app/(auth)/register/page.tsx` | Standalone registration page |
| `app/(auth)/forgot-password/page.tsx` | Password reset request page |
| `app/auth/reset-password/page.tsx` | Password reset completion page |
| `middleware.ts` | Route protection middleware |
| `supabase/migrations/` | All DB migration SQL files |

---

## 9. Database Migrations (Applied in Order)

| File | What it does |
|---|---|
| `20260513000000_initial_schema.sql` | Full base schema: all tables, indexes, RLS, triggers |
| `20260513000001_fix_profile_trigger.sql` | Patches `handle_new_user` to handle edge cases |
| `20260514000000_profile_delete_policy.sql` | Adds DELETE RLS policy on `profiles` for account deletion |
| `20260514000001_business_profile_fields.sql` | Adds `business_name/industry/website/phone` to `profiles`; creates `business_members` table; adds `handle_new_brand` trigger |
| `20260514000002_image_uploads.sql` | Adds `avatar_url` to `profiles`, `logo_url` to `brands`; creates `avatars` and `logos` storage buckets with RLS policies |

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
- **Domain**: Configured in Vercel project settings

To deploy a change:
1. Make code changes locally
2. Run `npm run build` to verify no errors
3. `git add` the changed files
4. `git commit` with a descriptive message
5. `git push origin main` — Vercel picks it up automatically

For database changes, run the migration SQL manually in the **Supabase Dashboard → SQL Editor** after pushing code.

---

## 12. Known Limitations / Future Work

- **Messaging** — The Inbox and message form UI exists but messages are not yet persisted to the database. Currently uses static placeholder data.
- **RFQ board** — The public RFQ board screen shows a list of open RFQs but the data is partially static; full live RFQ board is not yet implemented.
- **Product management UI** — The Manage Products and Product Form screens exist in the SPA but product create/edit is not yet wired to Supabase.
- **Multi-user brand accounts** — The `business_members` table is in place and the `owner` row is auto-created, but the UI for inviting team members is not yet built.
- **Verification** — The `is_verified` flag exists on brands and is displayed in the UI but the admin verification workflow is not yet built.
- **Search** — The Explore screen has filter UI but full-text search against the database is not yet implemented; currently filtering is done client-side on fetched data.
- **Notifications** — The bell icon appears in the nav but notifications are not yet wired up.
- **Cover images** — `brands.cover_image_url` exists in the schema but upload is not yet exposed in the UI; currently falls back to category-based stock images.
