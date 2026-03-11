-- Add email column on leads for campaign targeting
-- Safe to run multiple times.

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
