-- ====================================================================
-- SBJain ItemTrace Stage 17: Admin Monitoring & Role Security
-- Adds role system, public.is_admin() helper function,
-- and administrative monitoring RLS policies.
-- ====================================================================

-- 1. Add role column to profiles table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'student' 
    CHECK (role IN ('student', 'admin'));
  END IF;
END $$;

-- 2. Ensure dhokvinit@gmail.com is set as Admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'dhokvinit@gmail.com' 
   OR id IN (SELECT id FROM auth.users WHERE email = 'dhokvinit@gmail.com');

-- 3. Create non-recursive is_admin() SECURITY DEFINER helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = auth.uid() 
      AND (u.email = 'dhokvinit@gmail.com' OR p.role = 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Update items RLS to allow admins full administrative overview and status moderation
DROP POLICY IF EXISTS "Authenticated users can read items" ON public.items;
CREATE POLICY "Authenticated users can read items" 
ON public.items 
FOR SELECT 
TO authenticated 
USING (
  status = 'active' 
  OR auth.uid() = reported_by 
  OR public.is_item_conversation_participant(id)
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
CREATE POLICY "Users can update their own items" 
ON public.items 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = reported_by 
  OR public.is_admin()
)
WITH CHECK (
  auth.uid() = reported_by 
  OR public.is_admin()
);

-- 5. Update profiles RLS so admins can view user directory and statistics
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- 6. Indexes for role and admin operations
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
