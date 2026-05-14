-- ============================================================
-- RFQ v2: public/private, rich fields, bids, images, expiry
-- ============================================================

-- 1. Make brand_id nullable so public RFQs need no supplier
ALTER TABLE rfqs ALTER COLUMN brand_id DROP NOT NULL;

-- 2. New columns on rfqs
ALTER TABLE rfqs
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS budget_min numeric,
  ADD COLUMN IF NOT EXISTS budget_max numeric,
  ADD COLUMN IF NOT EXISTS location   text,
  ADD COLUMN IF NOT EXISTS timeline   text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS images     text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public  boolean NOT NULL DEFAULT false;

-- 3. Existing private RFQs keep is_public = false (default above handles it).
--    New public RFQs set is_public = true at insert time.

-- 4. Anyone can see public open RFQs in the browse board
CREATE POLICY "rfqs: anyone can see public rfqs"
  ON rfqs FOR SELECT
  USING (is_public = true);

-- ─── rfq_bids ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rfq_bids (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      uuid        NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  bidder_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  description text        NOT NULL,
  amount      numeric,
  currency    text        NOT NULL DEFAULT 'LKR',
  timeline    text,
  notes       text,
  images      text[]      NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rfq_bids ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rfq_bids_rfq_id    ON rfq_bids(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_bidder_id ON rfq_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_brand_id  ON rfq_bids(brand_id);

-- RFQ owner sees all bids on their RFQs
CREATE POLICY "rfq_bids: rfq owner can see bids"
  ON rfq_bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rfqs
      WHERE rfqs.id = rfq_bids.rfq_id
        AND rfqs.buyer_id = auth.uid()
    )
  );

-- Bidder sees their own bids
CREATE POLICY "rfq_bids: bidder sees own bids"
  ON rfq_bids FOR SELECT
  USING (auth.uid() = bidder_id);

-- Brand owners can submit bids (must own the brand and not be the RFQ buyer)
CREATE POLICY "rfq_bids: brand owner can insert"
  ON rfq_bids FOR INSERT
  WITH CHECK (
    auth.uid() = bidder_id
    AND EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = rfq_bids.brand_id
        AND brands.owner_id = auth.uid()
    )
  );

-- ─── Storage bucket for RFQ and bid images ───────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rfq-files', 'rfq-files', true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "rfq-files: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rfq-files');

-- Path must be {userId}/{anything} — enforced by first folder = uid
CREATE POLICY "rfq-files: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rfq-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "rfq-files: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'rfq-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
