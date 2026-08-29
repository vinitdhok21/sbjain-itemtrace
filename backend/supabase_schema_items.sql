-- SBJain ItemTrace Database Schema (Items System)

-- Create the items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  location TEXT NOT NULL,
  date_occurred DATE NOT NULL,
  approximate_time TEXT,
  identifying_details TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'returned', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Configure Row Level Security Policies
-- 1. SELECT: Authenticated students can read active items OR items they reported
CREATE POLICY "Authenticated users can read items" 
ON public.items 
FOR SELECT 
TO authenticated 
USING (status = 'active' OR auth.uid() = reported_by);

-- 2. INSERT: Authenticated users can insert their own reported items
CREATE POLICY "Authenticated users can insert their own items" 
ON public.items 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reported_by);

-- 3. UPDATE: Authenticated users can update their own reported items
CREATE POLICY "Users can update their own items" 
ON public.items 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = reported_by)
WITH CHECK (auth.uid() = reported_by);

-- 4. DELETE: Authenticated users can delete their own reported items
CREATE POLICY "Users can delete their own items" 
ON public.items 
FOR DELETE 
TO authenticated 
USING (auth.uid() = reported_by);

-- Database Performance Indexes for Queries and Matching
CREATE INDEX IF NOT EXISTS items_type_idx ON public.items (type);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items (category);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items (status);
CREATE INDEX IF NOT EXISTS items_location_idx ON public.items (location);
CREATE INDEX IF NOT EXISTS items_date_occurred_idx ON public.items (date_occurred);
CREATE INDEX IF NOT EXISTS items_reported_by_idx ON public.items (reported_by);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items (created_at DESC);
