-- SBJain ItemTrace Supabase Storage Configuration (Item Images Bucket)

-- 1. Create a public bucket for item images if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images', 
  'item-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Anyone (public) can read/view uploaded item images
DROP POLICY IF EXISTS "Public read access to item images" ON storage.objects;
CREATE POLICY "Public read access to item images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- 3. RLS Policy: Authenticated users can upload images to their own directory folder
-- Uses split_part(name, '/', 1) to retrieve the top-level folder name (the user's UUID)
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
CREATE POLICY "Authenticated users can upload item images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- 4. RLS Policy: Authenticated users can update their own images
DROP POLICY IF EXISTS "Users can update their own item images" ON storage.objects;
CREATE POLICY "Users can update their own item images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-images' AND 
  (split_part(name, '/', 1) = auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'item-images' AND 
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- 5. RLS Policy: Authenticated users can delete their own images
DROP POLICY IF EXISTS "Users can delete their own item images" ON storage.objects;
CREATE POLICY "Users can delete their own item images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' AND 
  (split_part(name, '/', 1) = auth.uid()::text)
);
