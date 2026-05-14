-- ============================================================
-- Product images storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 'products', true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "products: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Brand owner can upload
CREATE POLICY "products: brand owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id::text = (storage.foldername(name))[1]
        AND brands.owner_id = auth.uid()
    )
  );

-- Brand owner can update
CREATE POLICY "products: brand owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id::text = (storage.foldername(name))[1]
        AND brands.owner_id = auth.uid()
    )
  );

-- Brand owner can delete
CREATE POLICY "products: brand owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id::text = (storage.foldername(name))[1]
        AND brands.owner_id = auth.uid()
    )
  );
