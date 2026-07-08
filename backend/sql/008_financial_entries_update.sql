BEGIN;

-- Adiciona colunas payment_method e updated_at à tabela financial_entries
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.financial_entries
  DROP CONSTRAINT IF EXISTS financial_entries_payment_check;
ALTER TABLE public.financial_entries
  ADD CONSTRAINT financial_entries_payment_check
  CHECK (payment_method IN ('pix','dinheiro','cartao','boleto','transferencia','cheque'));

-- Trigger updated_at (reutiliza função da migração 006)
DROP TRIGGER IF EXISTS financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índice para queries por tipo + data
CREATE INDEX IF NOT EXISTS idx_financial_user_type_date
  ON public.financial_entries (user_id, type, date DESC);

COMMIT;
