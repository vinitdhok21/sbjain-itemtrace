-- ====================================================================
-- SBJain ItemTrace Stage 15: Report Management & Lifecycle Security
-- Ensures strict status constraints, owner-only update/delete policies,
-- and non-recursive RLS for items and conversation participants.
-- ====================================================================

-- 1. Ensure status validation constraint on public.items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'items_status_check' 
      AND conrelid = 'public.items'::regclass
  ) THEN
    ALTER TABLE public.items 
    ADD CONSTRAINT items_status_check 
    CHECK (status IN ('active', 'claimed', 'returned', 'closed'));
  END IF;
END $$;

-- 2. Verify and enforce RLS enabled on items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 3. SELECT Policy: Authenticated users can view active items, items they reported, or inactive items in their conversations
DROP POLICY IF EXISTS "Authenticated users can read items" ON public.items;
CREATE POLICY "Authenticated users can read items"
ON public.items
FOR SELECT
TO authenticated
USING (
  status = 'active'
  OR auth.uid() = reported_by
  OR public.is_item_conversation_participant(id)
);

-- 4. INSERT Policy: Authenticated users can only report items under their own auth UID
DROP POLICY IF EXISTS "Authenticated users can insert their own items" ON public.items;
CREATE POLICY "Authenticated users can insert their own items"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

-- 5. UPDATE Policy: Only the original reporter can update the report details or lifecycle status
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
CREATE POLICY "Users can update their own items"
ON public.items
FOR UPDATE
TO authenticated
USING (auth.uid() = reported_by)
WITH CHECK (auth.uid() = reported_by);

-- 6. DELETE Policy: Only the original reporter can delete their report
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
CREATE POLICY "Users can delete their own items"
ON public.items
FOR DELETE
TO authenticated
USING (auth.uid() = reported_by);

-- 7. Ensure performance indexes exist for fast status filtering and queries
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items (status);
CREATE INDEX IF NOT EXISTS items_reported_by_status_idx ON public.items (reported_by, status);
CREATE INDEX IF NOT EXISTS items_type_status_idx ON public.items (type, status);
