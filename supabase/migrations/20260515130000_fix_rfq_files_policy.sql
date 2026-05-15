-- Fix: rfq-files bucket was missing an UPDATE policy, causing upsert to fail
-- silently when a file already existed at the same path.
-- Also updates the bucket to allow PDF attachments in addition to images.

-- Add the missing UPDATE policy (same path check as INSERT and DELETE)
CREATE POLICY "rfq-files: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'rfq-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow PDFs in the rfq-files bucket (RFQ attachments commonly include spec sheets)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]
WHERE id = 'rfq-files';
