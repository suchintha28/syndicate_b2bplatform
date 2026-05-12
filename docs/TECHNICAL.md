# Technical Documentation — Syndicate B2B Marketplace

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |

---

## Database

### Schema overview

The database has five tables in the `public` schema:

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Stores display name, role (`buyer`/`seller`), avatar, phone. |
| `brands` | Seller-owned storefronts. One seller can own multiple brands. |
| `products` | Catalogue items belonging to a brand. |
| `rfqs` | Request-for-quote messages sent by buyers to a brand. |
| `rfq_responses` | Thread replies on an RFQ, visible to both parties. |

TypeScript types for all tables live in [`types/database.ts`](../types/database.ts).

### Row Level Security

RLS is enabled on every table. Policy summary:

| Table | Read | Write |
|---|---|---|
| `profiles` | Public | Self only |
| `brands` | Public (active only) | Owner only |
| `products` | Public (active only) | Brand owner only |
| `rfqs` | Buyer (own) + Seller (their brands) | Buyer inserts, Seller updates status |
| `rfq_responses` | Both parties to the RFQ | Both parties |

### Migrations

Database changes are managed as sequential SQL files in `supabase/migrations/`.

**File naming:** `YYYYMMDDHHMMSS_short_description.sql`

**Rules:**
- Each change gets a **new file** — existing migration files are never edited.
- Files must be run in filename order (lexicographic = chronological).
- Apply migrations by pasting each file into the Supabase SQL Editor and running it.

See [`supabase/README.md`](../supabase/README.md) for the full migration guide.

#### Migration history

| File | Description |
|---|---|
| `20260513000000_initial_schema.sql` | Initial schema: enums, all five tables, indexes, RLS, triggers |

---

## Project structure

```
syndicate_b2bplatform/
├── app/                  # Next.js App Router pages and layouts
├── docs/                 # Project documentation
│   └── TECHNICAL.md
├── lib/
│   └── supabase/         # Supabase client helpers
├── supabase/
│   ├── migrations/       # Sequential SQL migration files
│   └── README.md         # Migration guide
├── types/
│   └── database.ts       # TypeScript types for all DB tables
├── next.config.mjs
├── tailwind.config.ts
└── vercel.json
```
