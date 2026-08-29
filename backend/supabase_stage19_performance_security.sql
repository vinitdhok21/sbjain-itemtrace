-- ====================================================================
-- SBJain ItemTrace Stage 19: Database Performance Indexes & Hardening
-- Adds composite indexes for query optimization, search acceleration,
-- and pagination performance across collegiate records.
-- ====================================================================

-- 1. Optimized Composite Indexes for Items (Browsing, Filtering, Lifecycle)
CREATE INDEX IF NOT EXISTS idx_items_status_type_created 
  ON public.items (status, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_category_status 
  ON public.items (category, status);

CREATE INDEX IF NOT EXISTS idx_items_reported_by_status 
  ON public.items (reported_by, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_date_occurred 
  ON public.items (date_occurred DESC);

-- 2. Optimized Indexes for Conversations & Messaging
CREATE INDEX IF NOT EXISTS idx_conversations_pair 
  ON public.conversations (lost_item_id, found_item_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_updated 
  ON public.conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created 
  ON public.messages (conversation_id, created_at ASC);

-- 3. Optimized Composite Indexes for Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created 
  ON public.notifications (user_id, is_read, created_at DESC);

-- 4. Optimized Indexes for Email Logs (Audit & Deduplication)
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_alert 
  ON public.email_logs (recipient_email, alert_type, created_at DESC);

-- 5. Profiles Search & Role Index
CREATE INDEX IF NOT EXISTS idx_profiles_role_created 
  ON public.profiles (role, created_at DESC);
