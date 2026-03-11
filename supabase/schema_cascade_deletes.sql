-- Cascade delete migration for CRM relationships
-- Safe to run multiple times.

-- 1) Company deletion should remove dependent contacts.
DO $$
DECLARE fk_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'company_id'
  ) THEN
    SELECT c.conname
    INTO fk_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'contacts'
      AND a.attname = 'company_id'
      AND c.contype = 'f'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.contacts DROP CONSTRAINT %I', fk_name);
    END IF;

    BEGIN
      ALTER TABLE public.contacts
        ADD CONSTRAINT contacts_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.companies(id)
        ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 2) Company deletion should remove dependent leads.
DO $$
DECLARE fk_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'company_id'
  ) THEN
    SELECT c.conname
    INTO fk_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'leads'
      AND a.attname = 'company_id'
      AND c.contype = 'f'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.leads DROP CONSTRAINT %I', fk_name);
    END IF;

    BEGIN
      ALTER TABLE public.leads
        ADD CONSTRAINT leads_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.companies(id)
        ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 3) Lead deletion should remove dependent tasks when relational columns exist.
DO $$
DECLARE fk_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'related_lead_id'
  ) THEN
    SELECT c.conname
    INTO fk_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'tasks'
      AND a.attname = 'related_lead_id'
      AND c.contype = 'f'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', fk_name);
    END IF;

    BEGIN
      ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_related_lead_id_fkey
        FOREIGN KEY (related_lead_id)
        REFERENCES public.leads(id)
        ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 4) Contact deletion should remove dependent tasks when relational columns exist.
DO $$
DECLARE fk_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'related_contact_id'
  ) THEN
    SELECT c.conname
    INTO fk_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'tasks'
      AND a.attname = 'related_contact_id'
      AND c.contype = 'f'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', fk_name);
    END IF;

    BEGIN
      ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_related_contact_id_fkey
        FOREIGN KEY (related_contact_id)
        REFERENCES public.contacts(id)
        ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;
