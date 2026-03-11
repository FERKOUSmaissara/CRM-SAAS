-- Email logs schema for Supabase
-- Required minimal structure + compatibility fields for existing Brevo flows.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  contact_id uuid,
  email text,
  subject text,
  campaign_name text,
  status text,
  provider text default 'brevo',
  message_id text,
  error text
);

-- Keep current backend integrations compatible without changing app logic.
alter table public.email_logs add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.email_logs add column if not exists to_email text;
alter table public.email_logs add column if not exists body text;
alter table public.email_logs add column if not exists sent_at timestamp with time zone;
alter table public.email_logs add column if not exists provider_message_id text;
alter table public.email_logs add column if not exists provider_event text;
alter table public.email_logs add column if not exists event_type text;
alter table public.email_logs add column if not exists source text;
alter table public.email_logs add column if not exists opened_count integer not null default 0;
alter table public.email_logs add column if not exists clicked_count integer not null default 0;
alter table public.email_logs add column if not exists delivered_at timestamp with time zone;
alter table public.email_logs add column if not exists first_opened_at timestamp with time zone;
alter table public.email_logs add column if not exists first_clicked_at timestamp with time zone;
alter table public.email_logs add column if not exists last_event_at timestamp with time zone;
alter table public.email_logs add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_email_logs_created_at on public.email_logs (created_at);
create index if not exists idx_email_logs_campaign_name on public.email_logs (campaign_name);
create index if not exists idx_email_logs_status on public.email_logs (status);
create index if not exists idx_email_logs_message_id on public.email_logs (message_id);
create index if not exists idx_email_logs_provider_message_id on public.email_logs (provider_message_id);
