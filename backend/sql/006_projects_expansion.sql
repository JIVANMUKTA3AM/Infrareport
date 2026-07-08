-- ══════════════════════════════════════════════════════════════════════════════
--  006_projects_expansion.sql
--  Execute no SQL Editor do Supabase (painel → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Novas colunas na tabela projects ──────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS proposal_id        uuid        REFERENCES public.proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS address            text,
  ADD COLUMN IF NOT EXISTS scope              text,
  ADD COLUMN IF NOT EXISTS material_cost      numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost         numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date         date,
  ADD COLUMN IF NOT EXISTS expected_end_date  date,
  ADD COLUMN IF NOT EXISTS end_date           date,
  ADD COLUMN IF NOT EXISTS team               jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes              text,
  ADD COLUMN IF NOT EXISTS report_url         text,
  ADD COLUMN IF NOT EXISTS segment            text,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- ── 2. Migra valores de status (inglês → português) ──────────────────────────
UPDATE public.projects SET status = 'em_andamento' WHERE status = 'active';
UPDATE public.projects SET status = 'concluido'    WHERE status = 'completed';
UPDATE public.projects SET status = 'cancelado'    WHERE status = 'cancelled';

-- ── 3. Constraint de status ───────────────────────────────────────────────────
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('aguardando', 'em_andamento', 'concluido', 'cancelado'));

ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'em_andamento';

-- ── 4. Trigger updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. Garante RLS na tabela projects ────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_owner" ON public.projects;
CREATE POLICY "projects_owner" ON public.projects
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ── 6. Tabela project_history ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_history (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.users(id),
  status_from text,
  status_to   text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_history_owner" ON public.project_history;
CREATE POLICY "project_history_owner" ON public.project_history
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

COMMIT;
