-- InfraReport — Migration 003: Auth trigger + plano demo + stats RPC
-- Execute no SQL Editor do Supabase após schema.sql

-- ── 1. Adiciona plano "demo" ───────────────────────────────────────────────
alter table public.users
  drop constraint if exists users_plan_check;

alter table public.users
  add constraint users_plan_check
  check (plan in ('demo','starter','pro','agency'));

alter table public.users
  alter column plan set default 'demo';

-- ── 2. Tabela de limites por plano ────────────────────────────────────────
create table if not exists public.plan_limits (
  plan              text    primary key,
  label             text    not null,
  proposals_limit   integer not null,   -- -1 = ilimitado
  whatsapp_agent    boolean not null default false,
  multi_user        boolean not null default false,
  price_brl         numeric(8,2)
);

insert into public.plan_limits (plan, label, proposals_limit, whatsapp_agent, multi_user, price_brl) values
  ('demo',    'Demo',    5,   false, false, 0),
  ('starter', 'Starter', 20,  false, false, 97),
  ('pro',     'Pro',     100, true,  false, 197),
  ('agency',  'Agency',  -1,  true,  true,  397)
on conflict (plan) do nothing;

-- ── 3. Trigger: cria perfil de usuário ao se registrar no Supabase Auth ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (auth_id, email, name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'demo'
  )
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. RPC: estatísticas do dashboard (dados reais por usuário) ──────────
create or replace function public.get_dashboard_stats(
  p_user_id uuid,
  p_month   int default extract(month from current_date)::int,
  p_year    int default extract(year  from current_date)::int
)
returns json language sql stable as $$
with
  cur as (
    select type, value, category, date
    from   public.financial_entries
    where  user_id = p_user_id
  ),
  month_cur as (select type, value, category from cur
    where extract(month from date)::int = p_month
      and extract(year  from date)::int = p_year),
  month_prv as (select type, value from cur
    where extract(month from date)::int = case when p_month=1 then 12 else p_month-1 end
      and extract(year  from date)::int = case when p_month=1 then p_year-1 else p_year end),

  kpi as (
    select
      coalesce(sum(case when type='entrada' then value end),0)  as entradas,
      coalesce(sum(case when type='saida'   then value end),0)  as saidas,
      coalesce(sum(case when type='entrada' then value else -value end),0) as saldo_mes
    from month_cur
  ),
  kpi_prv as (
    select
      coalesce(sum(case when type='entrada' then value end),0)  as entradas_prv,
      coalesce(sum(case when type='saida'   then value end),0)  as saidas_prv
    from month_prv
  ),
  acc as (
    select coalesce(sum(case when type='entrada' then value else -value end),0) as acumulado
    from cur
  ),

  -- últimos 6 meses para o gráfico
  monthly as (
    select
      to_char(date_trunc('month', date), 'Mon')          as mes,
      extract(month from date)::int                       as mes_num,
      extract(year  from date)::int                       as ano,
      coalesce(sum(case when type='entrada' then value else 0 end),0) as entradas,
      coalesce(sum(case when type='saida'   then value else 0 end),0) as saidas
    from cur
    where date >= (current_date - interval '6 months')
    group by 1,2,3
    order by 3, 2
  ),

  -- top 5 categorias de saída no mês
  cats as (
    select category, sum(value)::numeric(12,2) as total
    from   month_cur
    where  type = 'saida' and category is not null
    group  by category
    order  by total desc
    limit  5
  ),

  -- resumo de propostas
  prop as (
    select
      count(*)                                          as total,
      count(*) filter (where status='accepted')         as aprovadas,
      coalesce(sum(value) filter (where status='accepted'), 0) as valor_aprovado
    from public.proposals
    where user_id = p_user_id
  )

select json_build_object(
  'entradas',      (select entradas      from kpi),
  'saidas',        (select saidas        from kpi),
  'saldo',         (select saldo_mes     from kpi),
  'acumulado',     (select acumulado     from acc),
  'entradas_pct',
    case when (select entradas_prv from kpi_prv) = 0 then 0
         else round(((select entradas from kpi)-(select entradas_prv from kpi_prv))
                   / nullif((select entradas_prv from kpi_prv),0) * 100, 1) end,
  'saidas_pct',
    case when (select saidas_prv from kpi_prv) = 0 then 0
         else round(((select saidas from kpi)-(select saidas_prv from kpi_prv))
                   / nullif((select saidas_prv from kpi_prv),0) * 100, 1) end,
  'monthly',       (select coalesce(json_agg(row_to_json(monthly)),'[]'::json) from monthly),
  'categories',    (select coalesce(json_agg(row_to_json(cats)),   '[]'::json) from cats),
  'propostas',     (select row_to_json(prop) from prop),
  'has_data',      (select count(*) > 0 from cur)
);
$$;

-- permissão: usuários autenticados podem chamar a RPC
grant execute on function public.get_dashboard_stats(uuid, int, int) to authenticated;
