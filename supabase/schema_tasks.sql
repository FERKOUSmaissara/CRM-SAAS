-- Tasks table schema for Supabase
-- Creates `public.tasks` with RLS and user policies

-- Ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing table if present to allow idempotent runs
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  related_type text CHECK (related_type IN ('lead','contact','company')),
  related_id uuid,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow users to SELECT their own tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT
  USING (auth.uid() = owner_id::text);

-- Allow users to INSERT tasks where they are the owner
CREATE POLICY "Users can insert their own tasks" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id::text);

-- Allow users to UPDATE their own tasks
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = owner_id::text)
  WITH CHECK (auth.uid() = owner_id::text);

-- Allow users to DELETE their own tasks
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE
  USING (auth.uid() = owner_id::text);

-- Optional: index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks (owner_id);

-- Optional: index on related_type + related_id for relationship queries
CREATE INDEX IF NOT EXISTS idx_tasks_related ON public.tasks (related_type, related_id);

-- End of tasks schema
