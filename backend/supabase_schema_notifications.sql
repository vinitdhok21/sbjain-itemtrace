-- ====================================================================
-- SBJain ItemTrace Database Schema: Realtime Notifications System (Stage 14)
-- Safe, idempotent SQL migration for creating and configuring notifications.
-- ====================================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_message', 'new_match', 'item_update', 'general')),
  title TEXT NOT NULL,
  message TEXT,
  related_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  matched_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_conversation ON public.notifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_item ON public.notifications(related_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_matched_item ON public.notifications(matched_item_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Non-recursive RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ====================================================================
-- 5. AUTOMATED NEW MESSAGE NOTIFICATION TRIGGER
-- Automatically creates a notification for the recipient when a message is sent
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Identify the recipient participant in the conversation (excluding the sender)
  FOR v_recipient_id IN
    SELECT cp.user_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id <> NEW.sender_id
  LOOP
    -- Insert a single new_message notification for the recipient
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      conversation_id,
      is_read
    ) VALUES (
      v_recipient_id,
      'new_message',
      'New Message',
      'You received a new message.',
      NEW.conversation_id,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure clean idempotency
DROP TRIGGER IF EXISTS on_new_message_created ON public.messages;
CREATE TRIGGER on_new_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_notification();


-- ====================================================================
-- 6. MATCH NOTIFICATION RPC FUNCTION (WITH DEDUPLICATION)
-- Securely notifies item owners of strong matches without duplicates
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_match_notification(
  p_recipient_user_id UUID,
  p_new_item_id UUID,
  p_matched_item_id UUID,
  p_title TEXT,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
  v_notification_id UUID;
BEGIN
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Protect against self-notification
  IF p_recipient_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', true, 'created', false, 'reason', 'self_notification_prevented');
  END IF;

  -- Deduplication check: Do not create duplicate notification for the same item pair
  SELECT EXISTS (
    SELECT 1
    FROM public.notifications
    WHERE user_id = p_recipient_user_id
      AND type = 'new_match'
      AND (
        (related_item_id = p_new_item_id AND matched_item_id = p_matched_item_id) OR
        (related_item_id = p_matched_item_id AND matched_item_id = p_new_item_id) OR
        (related_item_id = p_new_item_id AND matched_item_id IS NULL)
      )
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', true, 'created', false, 'reason', 'duplicate_prevented');
  END IF;

  -- Insert the match notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_item_id,
    matched_item_id,
    is_read
  ) VALUES (
    p_recipient_user_id,
    'new_match',
    COALESCE(p_title, 'Potential Match Found'),
    COALESCE(p_message, 'A newly reported item strongly matches your report.'),
    p_new_item_id,
    p_matched_item_id,
    false
  )
  RETURNING id INTO v_notification_id;

  RETURN jsonb_build_object('success', true, 'created', true, 'id', v_notification_id);
END;
$$;

-- Secure execution permissions
REVOKE ALL ON FUNCTION public.create_match_notification(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_match_notification(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;


-- ====================================================================
-- 7. SUPABASE REALTIME CONFIGURATION
-- Enable realtime publication and set REPLICA IDENTITY FULL
-- ====================================================================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
