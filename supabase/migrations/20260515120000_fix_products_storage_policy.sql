-- Fix: products storage upload/update/delete policies had a name collision.
-- Inside the EXISTS (SELECT 1 FROM brands WHERE ...) subquery, the bare
-- column reference "name" was resolving to "brands.name" (the brand display
-- name) instead of "storage.objects.name" (the file path).
-- The fix rewrites the check to resolve the path fragment at the outer level,
-- where "name" unambiguously refers to storage.objects.name.

DROP POLICY IF EXISTS "products: brand owner upload"  ON storage.objects;
DROP POLICY IF EXISTS "products: brand owner update"  ON storage.objects;
DROP POLICY IF EXISTS "products: brand owner delete"  ON storage.objects;

-- Upload: the first path segment must be a brand UUID owned by the user
CREATE POLICY "products: brand owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND (split_part(name, '/', 1)) IN (
      SELECT id::text FROM brands WHERE owner_id = auth.uid()
    )
  );

-- Update: same check for updates (upsert)
CREATE POLICY "products: brand owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products'
    AND (split_part(name, '/', 1)) IN (
      SELECT id::text FROM brands WHERE owner_id = auth.uid()
    )
  );

-- Delete: same check for deletes
CREATE POLICY "products: brand owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND (split_part(name, '/', 1)) IN (
      SELECT id::text FROM brands WHERE owner_id = auth.uid()
    )
  );
