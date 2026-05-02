-- InfraReport — Schema Supabase
-- Execute no SQL Editor do Supabase

-- ────────────────────────────────────────────
-- EXTENSÕES
-- ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────
-- TABELAS
-- ────────────────────────────────────────────

create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  auth_id     uuid unique references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,
  company     text,
  plan        text not null default 'starter' check (plan in ('starter','pro','agency')),
  proposals_used integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  client      text not null,
  revenue     numeric(12,2) not null default 0,
  cost        numeric(12,2) not null default 0,
  status      text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at  timestamptz not null default now()
);

create table if not exists public.proposals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  project_id    uuid references public.projects(id),
  client_name   text not null,
  client_email  text not null,
  service       text not null,
  segment       text check (segment in ('ac','cftv','ti','eletrica','hidraulica')),
  equipments    jsonb,
  value         numeric(12,2),
  status        text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
  docx_url      text,
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.financial_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  project_id  uuid references public.projects(id),
  type        text not null check (type in ('entrada','saida')),
  value       numeric(12,2) not null,
  category    text,
  description text,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists public.whatsapp_sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.users(id) on delete set null,
  phone        text not null unique,
  active_flow  text check (active_flow in ('comercial','financeiro',null)),
  context_json jsonb default '{}',
  updated_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────
create index if not exists idx_proposals_user     on public.proposals(user_id);
create index if not exists idx_financial_user     on public.financial_entries(user_id);
create index if not exists idx_financial_date     on public.financial_entries(date desc);
create index if not exists idx_projects_user      on public.projects(user_id);
create index if not exists idx_whatsapp_phone     on public.whatsapp_sessions(phone);

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────
alter table public.users               enable row level security;
alter table public.projects            enable row level security;
alter table public.proposals           enable row level security;
alter table public.financial_entries   enable row level security;
alter table public.whatsapp_sessions   enable row level security;

-- users: cada usuário vê/edita apenas si mesmo
create policy "users_self" on public.users
  for all using (auth.uid() = auth_id);

-- projects
create policy "projects_owner" on public.projects
  for all using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );

-- proposals
create policy "proposals_owner" on public.proposals
  for all using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );

-- financial_entries
create policy "financial_owner" on public.financial_entries
  for all using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );

-- whatsapp_sessions: service_role acessa tudo (backend usa service key)
create policy "whatsapp_service_only" on public.whatsapp_sessions
  for all using (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- FUNÇÃO: saldo financeiro por usuário
-- ────────────────────────────────────────────
create or replace function public.get_balance(p_user_id uuid)
returns numeric language sql stable as $$
  select coalesce(
    sum(case when type = 'entrada' then value else -value end), 0
  )
  from public.financial_entries
  where user_id = p_user_id;
$$;
