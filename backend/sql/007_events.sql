BEGIN;

CREATE TABLE IF NOT EXISTS public.events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  type             text        NOT NULL DEFAULT 'outro',
  date             date        NOT NULL,
  start_time       text,
  end_time         text,
  all_day          boolean     NOT NULL DEFAULT false,
  client_name      text,
  location         text,
  notes            text,
  responsible      text,
  status           text        NOT NULL DEFAULT 'agendado',
  project_id       uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  proposal_id      uuid        REFERENCES public.proposals(id) ON DELETE SET NULL,
  google_event_id  text,
  reminder_minutes int         NOT NULL DEFAULT 60,
  color            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type IN ('visita', 'execucao', 'vencimento', 'followup', 'outro'));

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check
  CHECK (status IN ('agendado', 'concluido', 'cancelado'));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_owner" ON public.events;
CREATE POLICY "events_owner" ON public.events
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Reutiliza set_updated_at() criada na migração 006
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS events_user_date_idx ON public.events (user_id, date);
CREATE INDEX IF NOT EXISTS events_user_status_idx ON public.events (user_id, status);

COMMIT;
