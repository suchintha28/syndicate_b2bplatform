# Supabase Migrations

All database changes for Syndicate B2B Marketplace are managed as sequential SQL migration files.

## Folder structure

```
supabase/
└── migrations/
    ├── 20260513000000_initial_schema.sql
    ├── 20260513000001_fix_profile_trigger.sql
    ├── 20260514000000_profile_delete_policy.sql
    ├── 20260514000001_business_profile_fields.sql
    ├── 20260514000002_image_uploads.sql
    ├── 20260514000003_product_images.sql
    ├── 20260514000004_rfq_buyer_update.sql
    ├── 20260514000005_rfq_enhancements.sql
    ├── 20260514000006_notifications.sql
    ├── 20260515000000_banners.sql
    ├── 20260515120000_fix_products_storage_policy.sql
    ├── 20260515130000_fix_rfq_files_policy.sql
    ├── 20260515140000_products_add_extended_fields.sql
    ├── 20260515150000_create_reviews.sql
    └── YYYYMMDDHHMMSS_description.sql   ← future migrations
```

## Migration history

| File | What it does |
|---|---|
| `20260513000000_initial_schema.sql` | Initial schema: enums, `profiles`, `brands`, `products`, `rfqs`, `rfq_responses`, indexes, RLS, auto-triggers |
| `20260513000001_fix_profile_trigger.sql` | Fix profile auto-creation trigger |
| `20260514000000_profile_delete_policy.sql` | Add RLS policy: users can delete their own profile |
| `20260514000001_business_profile_fields.sql` | Add `business_name`, `business_industry`, `business_website`, `business_phone` to `profiles` |
| `20260514000002_image_uploads.sql` | Create `avatars` and `logos` Storage buckets with RLS |
| `20260514000003_product_images.sql` | Create `products` Storage bucket (original policies — superseded by `20260515120000`) |
| `20260514000004_rfq_buyer_update.sql` | Allow buyers to UPDATE their own RFQs |
| `20260514000005_rfq_enhancements.sql` | Add `rfq-files` bucket; add `rfq_bids` table with bid lifecycle RLS |
| `20260514000006_notifications.sql` | Add `notifications` table with RLS (users see only their own) |
| `20260515000000_banners.sql` | Add `banners` table (superseded by Sanity CMS — table exists but unused by the app) |
| `20260515120000_fix_products_storage_policy.sql` | **Fix:** products Storage RLS name-collision bug — `name` resolved to `brands.name` instead of `storage.objects.name` in the ownership subquery |
| `20260515130000_fix_rfq_files_policy.sql` | **Fix:** add missing UPDATE policy on `rfq-files`; add PDF to allowed MIME types |
| `20260515140000_products_add_extended_fields.sql` | Add `tiered_pricing`, `variations`, `product_specs`, `tech_specs` JSONB columns to `products` (default `'[]'::jsonb`) |
| `20260515150000_create_reviews.sql` | Add `reviews` table; RLS (public read, auth write/edit/delete own); unique constraint `(reviewer_id, target_type, target_id)`; index for profile join |

## Creating a new migration

1. Create a new file in `supabase/migrations/` with a timestamp prefix:

   ```
   YYYYMMDDHHMMSS_short_description.sql
   ```

   Example: `20260520143000_add_reviews_table.sql`

   The timestamp must be greater than all existing migration timestamps so the sort order reflects the correct application order.

2. Write only the incremental SQL needed for this change (ALTER TABLE, CREATE TABLE, CREATE INDEX, new RLS policies, etc.). Do not copy content from previous migrations.

3. Run the file in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

## Rules

- **Never edit an existing migration file.** Once a file has been run against any environment it is immutable. If you made a mistake, write a new migration that corrects it.
- **Always run migrations in filename order.** Files are named so that lexicographic sort equals chronological order. Run `20260513...` before `20260520...`.
- **One concern per file.** Keep each migration focused so it is easy to review and roll back conceptually.
- **Keep migrations idempotent where practical.** Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS ...` guards where Postgres supports them, so accidental re-runs do not hard-fail.

## Applying to a fresh database

Run every file in `supabase/migrations/` in filename order through the Supabase SQL Editor.
