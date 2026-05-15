-- Reviews table — stores product and brand reviews from buyers/users.
-- Uses a single table with target_type ('product' | 'brand') + target_id
-- so both review types share the same structure and RLS rules.

CREATE TABLE IF NOT EXISTS reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type  TEXT        NOT NULL CHECK (target_type IN ('product', 'brand')),
  target_id    UUID        NOT NULL,
  rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        TEXT,
  body         TEXT        NOT NULL,
  photos       TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review per user per target — prevents spam duplicates
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_user_target
  ON reviews (reviewer_id, target_type, target_id);

-- Fast lookup by target
CREATE INDEX IF NOT EXISTS reviews_target_idx
  ON reviews (target_type, target_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can read all reviews
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

-- Signed-in users can post a review
CREATE POLICY "reviews_insert_auth"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own review
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Users can delete their own review
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);
