-- InfraReport — Migration 005
-- Execute no SQL Editor do Supabase

-- ── 1. Tabela de histórico de mensagens dos agentes ───────────────────────
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent      text        NOT NULL CHECK (agent IN ('comercial', 'tecnico', 'financeiro')),
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_user_agent
  ON public.agent_messages(user_id, agent, created_at);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_messages_owner" ON public.agent_messages
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ── 2. Unifica statuses das propostas (inglês → português) ────────────────
-- Migra registros existentes
UPDATE public.proposals SET status = 'pendente'  WHERE status = 'draft';
UPDATE public.proposals SET status = 'enviada'   WHERE status = 'sent';
UPDATE public.proposals SET status = 'aprovada'  WHERE status = 'accepted';
UPDATE public.proposals SET status = 'rejeitada' WHERE status = 'rejected';

-- Recria constraint com valores em português
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('pendente', 'enviada', 'aprovada', 'rejeitada'));

-- Ajusta default
ALTER TABLE public.proposals ALTER COLUMN status SET DEFAULT 'pendente';

-- ── 3. Expande segmentos permitidos nas propostas ─────────────────────────
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_segment_check;
ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_segment_check
  CHECK (segment IS NULL OR segment IN (
    'ac', 'cftv', 'ti', 'eletrica', 'hidraulica',
    'alarme', 'automacao', 'telecom'
  ));
