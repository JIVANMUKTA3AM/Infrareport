-- ── Tabela de integrações OAuth ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      text NOT NULL,                    -- 'gmail', 'outlook', etc.
  provider_email text,                            -- email da conta conectada
  access_token  text,
  refresh_token text NOT NULL,
  token_expiry  timestamptz,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own integrations"
  ON integrations FOR ALL
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();
