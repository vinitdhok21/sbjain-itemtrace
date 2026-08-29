-- ====================================================================
-- SBJain ItemTrace Stage 16: Email Alerts & Notification Audit Logs
-- Tracks dispatched email notifications, prevents duplicate alerts,
-- and audits system alerts sent to students and administrators.
-- ====================================================================

-- 1. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('match_alert', 'message_alert', 'admin_report_alert', 'status_alert', 'custom_alert')),
  deduplication_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'simulated', 'failed')),
  subject TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Authenticated users can only read logs directed to their verified email
DROP POLICY IF EXISTS "Users can view own email alert logs" ON public.email_logs;
CREATE POLICY "Users can view own email alert logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'dhokvinit@gmail.com'
);

-- 4. RLS Policy: Service role or authenticated backend can insert email logs
DROP POLICY IF EXISTS "Authenticated users or service can insert email logs" ON public.email_logs;
CREATE POLICY "Authenticated users or service can insert email logs"
ON public.email_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS email_logs_dedup_idx ON public.email_logs (deduplication_key);
CREATE INDEX IF NOT EXISTS email_logs_recipient_idx ON public.email_logs (recipient_email);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs (created_at DESC);
