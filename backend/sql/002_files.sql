-- InfraReport — Migration 002: tabela de arquivos
-- Execute no SQL Editor do Supabase após o schema.sql inicial

create table if not exists public.files (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,          -- caminho local no servidor
  file_url    text,                   -- URL pública (se hospedado no Supabase Storage)
  file_type   text not null check (file_type in ('proposta','relatorio','financeiro')),
  mime_type   text not null,
  size_bytes  bigint,
  ref_id      uuid,                   -- id da proposta / projeto relacionado (opcional)
  created_at  timestamptz not null default now()
);

create index if not exists idx_files_user    on public.files(user_id);
create index if not exists idx_files_type    on public.files(file_type);
create index if not exists idx_files_created on public.files(created_at desc);

-- RLS: cada usuário acessa apenas seus arquivos
alter table public.files enable row level security;

create policy "files_owner" on public.files
  for all using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );
