# Supabase Migrations

All database changes for Syndicate B2B Marketplace are managed as sequential SQL migration files.

## Folder structure

```
supabase/
└── migrations/
    ├── 20260513000000_initial_schema.sql
    └── YYYYMMDDHHMMSS_description.sql   ← future migrations
```

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
