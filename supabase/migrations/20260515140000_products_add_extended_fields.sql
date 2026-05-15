-- Add extended product fields that were previously UI-only placeholders.
-- All columns use JSONB with empty-array defaults so existing rows are
-- automatically back-filled without any data loss.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tiered_pricing  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS variations      JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS product_specs   JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tech_specs      JSONB NOT NULL DEFAULT '[]'::jsonb;
