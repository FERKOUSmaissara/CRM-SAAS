-- Brevo email tracking patch (non-destructive)
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid,
  email text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  to_email text,
  subject text,
  campaign_name text,
  provider text DEFAULT 'brevo',
  message_id text,
  body text,
  status text DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS campaign_name text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider text DEFAULT 'brevo';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS message_id text;

ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider_event text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS campaign_name text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS opened_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS clicked_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS first_opened_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS first_clicked_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS last_event_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id ON public.email_logs (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_name ON public.email_logs (campaign_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_last_event_at ON public.email_logs (last_event_at);
