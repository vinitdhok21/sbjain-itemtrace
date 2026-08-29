-- ====================================================================
-- SBJain ItemTrace Stage 13 Patch: Inactive Item Chat Participant RLS
-- Allows conversation participants to read inactive items in their chats
-- without exposing inactive items publicly or introducing recursion.
-- ====================================================================

-- 1. Create a non-recursive SECURITY DEFINER helper function
CREATE OR REPLACE FUNCTION public.is_item_conversation_participant(target_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = auth.uid()
      AND (c.lost_item_id = target_item_id OR c.found_item_id = target_item_id)
  );
$$;

-- 2. Restrict function execution privileges
REVOKE ALL ON FUNCTION public.is_item_conversation_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_item_conversation_participant(UUID) TO authenticated;

-- 3. Update the SELECT RLS policy on public.items
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
