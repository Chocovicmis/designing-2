-- Create Card Backgrounds Storage Bucket
--
-- Overview: Creates a Supabase Storage bucket for storing AI-generated card background images
-- 
-- New Storage Bucket:
-- - card-backgrounds: Public bucket for storing background images from DALL-E
-- - Public access enabled for easy image retrieval
-- - 5MB file size limit
-- - Accepts image types: png, jpeg, webp
--
-- Security:
-- - Public read access for all images
-- - Authenticated users can upload images
-- - Users can delete their own uploads
--
-- Notes:
-- - Stores DALL-E images to avoid CORS issues
-- - Images are publicly accessible via direct URLs

-- Create storage bucket for card backgrounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-backgrounds',
  'card-backgrounds',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-backgrounds');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'card-backgrounds');

-- Policy: Authenticated users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'card-backgrounds');
