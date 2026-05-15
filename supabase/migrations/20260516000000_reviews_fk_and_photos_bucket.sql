-- Fix reviews → profiles join so PostgREST can resolve the relationship.
-- The original FK points to auth.users(id), which PostgREST cannot use to
-- auto-join the public.profiles table. Adding a direct FK to profiles(id)
-- lets Supabase's query builder resolve `.select('*, profiles(...)')` correctly.
--
-- NOTE: reviews.reviewer_id and profiles.id are both the auth user's UUID,
-- so the values are identical — this constraint never rejects existing rows.

ALTER TABLE reviews
  ADD CONSTRAINT fk_reviewer_profile
  FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── Review photo uploads ──────────────────────────────────────────────────────
-- Create the review-photos storage bucket (public-read, auth-write).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880,   -- 5 MB per photo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Signed-in users can upload their own photos
CREATE POLICY "review_photos_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-photos'
    AND auth.role() = 'authenticated'
  );

-- Anyone can read review photos (public bucket)
CREATE POLICY "review_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- Users can delete their own photos
CREATE POLICY "review_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
