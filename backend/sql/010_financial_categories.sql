-- Migration 010: tabela de categorias financeiras por usuário
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('entrada', 'saida')),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  color       text        NOT NULL DEFAULT '#64748B',
  icon        text        NOT NULL DEFAULT '📌',
  is_active   boolean     NOT NULL DEFAULT true,
  is_default  boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, slug)
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_owner" ON public.financial_categories
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_categories_user_type
  ON public.financial_categories (user_id, type);
