-- SBJain ItemTrace Database Schema (Private Chat System)

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lost_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  found_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'resolved')) NOT NULL,
  
  -- Uniqueness constraint: only one conversation per lost + found pair
  CONSTRAINT unique_item_pair UNIQUE (lost_item_id, found_item_id)
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Uniqueness constraint: a user can participate once per conversation
  CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_conversations_items ON public.conversations(lost_item_id, found_item_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ==========================================

-- 1. Check if authenticated user is a participant of target conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(target_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = target_conversation_id
      AND cp.user_id = auth.uid()
  );
$$;

-- 2. Verify caller has permission to create conversation for lost/found items
CREATE OR REPLACE FUNCTION public.can_create_conversation(lost_id uuid, found_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items lost_item
    JOIN public.items found_item ON found_item.id = found_id
    WHERE lost_item.id = lost_id
      -- One must be lost, one must be found
      AND lost_item.type = 'lost'
      AND found_item.type = 'found'
      -- Both must be active
      AND lost_item.status = 'active'
      AND found_item.status = 'active'
      -- The reporters must be different users (self-conversation protection)
      AND lost_item.reported_by <> found_item.reported_by
      -- Caller (auth.uid()) must be the reporter of either the lost or found item
      AND (lost_item.reported_by = auth.uid() OR found_item.reported_by = auth.uid())
  );
$$;

-- 3. Verify user has permission to insert participant record into a conversation
CREATE OR REPLACE FUNCTION public.can_insert_participant(target_conversation_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.items lost_item ON lost_item.id = c.lost_item_id
    JOIN public.items found_item ON found_item.id = c.found_item_id
    WHERE c.id = target_conversation_id
      -- Caller (auth.uid()) must be reporter of lost or found item
      AND (lost_item.reported_by = auth.uid() OR found_item.reported_by = auth.uid())
      -- User being added (target_user_id) must be one of the reporters
      AND (target_user_id = lost_item.reported_by OR target_user_id = found_item.reported_by)
  );
$$;


-- ==========================================
-- FUNCTION EXECUTION PRIVILEGE LOCKDOWNS
-- ==========================================
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.can_create_conversation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_create_conversation(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.can_insert_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_insert_participant(uuid, uuid) TO authenticated;


-- ==========================================
-- DROP PREVIOUS POLICIES TO AVOID DUPLICATES
-- ==========================================
DROP POLICY IF EXISTS "Users can select conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can select conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can select conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to conversations they participate in" ON public.messages;


-- ==========================================
-- RECREATE CORRECT NON-RECURSIVE RLS POLICIES
-- ==========================================

-- Conversations RLS Policies
CREATE POLICY "Users can select conversations they participate in" 
ON public.conversations
FOR SELECT 
TO authenticated 
USING (
  public.is_conversation_participant(id)
);

CREATE POLICY "Authenticated users can insert conversations" 
ON public.conversations
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = created_by
  AND public.can_create_conversation(lost_item_id, found_item_id)
);

CREATE POLICY "Participants can update conversations" 
ON public.conversations
FOR UPDATE 
TO authenticated 
USING (
  public.is_conversation_participant(id)
);

-- Conversation Participants RLS Policies
CREATE POLICY "Users can select conversation participants" 
ON public.conversation_participants
FOR SELECT 
TO authenticated 
USING (
  public.is_conversation_participant(conversation_id)
);

CREATE POLICY "Users can insert conversation participants" 
ON public.conversation_participants
FOR INSERT 
TO authenticated 
WITH CHECK (
  public.can_insert_participant(conversation_id, user_id)
);

-- Messages RLS Policies
CREATE POLICY "Users can select conversation messages" 
ON public.messages
FOR SELECT 
TO authenticated 
USING (
  public.is_conversation_participant(conversation_id)
);

CREATE POLICY "Users can insert messages to conversations they participate in" 
ON public.messages
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(conversation_id)
);


-- ==========================================
-- REALTIME REGISTRATION
-- ==========================================
-- Configure Supabase Realtime for messages table
-- Check if the table is already in supabase_realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
