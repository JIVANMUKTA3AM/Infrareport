-- Migration 009: add supplier column to financial_entries
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS supplier text;

COMMENT ON COLUMN public.financial_entries.supplier IS 'Fornecedor / prestador associado à saída';
