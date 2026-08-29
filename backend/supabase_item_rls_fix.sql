-- SQL Migration: Update Items SELECT RLS Policy to allow chat participants to read inactive items

-- 1. Create a SECURITY DEFINER helper function to verify if user is a participant of a conversation involving the item
CREATE OR REPLACE FUNCTION public.is_item_conversation_participant(target_item_id uuid)
RETURNS boolean
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

-- 2. Restrict privileges on the helper function for security
REVOKE ALL ON FUNCTION public.is_item_conversation_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_item_conversation_participant(uuid) TO authenticated;

-- 3. Drop existing SELECT policy on the items table
DROP POLICY IF EXISTS "Authenticated users can read items" ON public.items;

-- 4. Create the new non-recursive SELECT policy on the items table
CREATE POLICY "Authenticated users can read items" 
ON public.items 
FOR SELECT 
TO authenticated 
USING (
  status = 'active' 
  OR auth.uid() = reported_by 
  OR public.is_item_conversation_participant(id)
);
