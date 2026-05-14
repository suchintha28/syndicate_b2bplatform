-- ============================================================
-- Notifications system + rfq_bids read tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL, -- 'bid_received' | 'bid_accepted' | 'bid_declined'
  title      text        NOT NULL,
  body       text        NOT NULL DEFAULT '',
  rfq_id     uuid        REFERENCES rfqs(id) ON DELETE CASCADE,
  bid_id     uuid        REFERENCES rfq_bids(id) ON DELETE CASCADE,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications(user_id, read);

-- Users see only their own notifications
CREATE POLICY "notifications: users see own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Any authenticated user can insert (needed for cross-user notifications)
CREATE POLICY "notifications: authenticated can insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update (mark read) their own notifications
CREATE POLICY "notifications: users update own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Track whether the RFQ buyer has seen each bid
ALTER TABLE rfq_bids ADD COLUMN IF NOT EXISTS read_by_buyer boolean NOT NULL DEFAULT false;
