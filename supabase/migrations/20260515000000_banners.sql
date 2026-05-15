-- ─────────────────────────────────────────────────
-- Marketing banners (CMS-managed)
-- ─────────────────────────────────────────────────
-- Slots: home_hero | brand_about | product_gallery | explore_heading
-- Each slot shows at most one active banner (lowest sort_order wins).
-- The component returns null when no banner is active → zero layout impact.

CREATE TABLE IF NOT EXISTS banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot         text        NOT NULL,
  title        text,
  subtitle     text,
  cta_text     text,
  cta_url      text,
  image_url    text,
  bg_color     text        NOT NULL DEFAULT '#4f46e5',
  text_color   text        NOT NULL DEFAULT '#ffffff',
  is_active    boolean     NOT NULL DEFAULT true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS banners_slot_active_idx ON banners (slot, is_active, sort_order);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION handle_banner_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_banner_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION handle_banner_updated_at();

-- ── RLS ─────────────────────────────────────────
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read currently active banners
CREATE POLICY "Active banners public read" ON banners
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
  );

-- ── Seed data (optional examples — delete when you have real banners) ──
-- INSERT INTO banners (slot, title, subtitle, cta_text, cta_url, bg_color, text_color, is_active)
-- VALUES
--   ('home_hero',        'New: Verified Electronics Suppliers', 'Browse 120+ verified tech suppliers added this month.', 'Explore now', '/listing', '#312e81', '#ffffff', false),
--   ('explore_heading',  'Post an RFQ in 5 minutes',           'Tell us what you need — suppliers come to you.',         'Get quotes',  '/rfq-create', '#15803d', '#ffffff', false),
--   ('brand_about',      'Pro members get priority placement',  'Upgrade for enhanced visibility and direct sales.',      'Learn more',  '/subscription', '#b45309', '#ffffff', false),
--   ('product_gallery',  'Bulk order discounts available',      'Order 50+ units and save up to 15%.',                   'Request quote', '/rfq-create', '#0369a1', '#ffffff', false);
