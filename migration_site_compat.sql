-- Martins Confeitaria: compatibilidade do banco com o site/admin atual
-- Execute este SQL no Supabase SQL Editor DEPOIS da estrutura inicial.

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

create table if not exists public.custom_cakes (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'novo',
  created_at timestamptz not null default now()
);

-- Campos usados pelo site atual na tabela products
alter table public.products add column if not exists category text;
alter table public.products add column if not exists image text;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists sort integer not null default 0;

-- Campos usados pelo site atual na tabela orders
alter table public.orders add column if not exists customer text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists receiving text;
alter table public.orders add column if not exists payment text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;

-- A taxa de entrega NÃO é calculada pelo banco. A Martins informa pelo WhatsApp.

alter table public.settings enable row level security;
alter table public.custom_cakes enable row level security;

create policy if not exists "settings_public_read" on public.settings for select to anon, authenticated using (true);
create policy if not exists "settings_admin_write" on public.settings for all to authenticated using (true) with check (true);
create policy if not exists "cakes_public_insert" on public.custom_cakes for insert to anon, authenticated with check (status = 'novo');
create policy if not exists "cakes_admin_read" on public.custom_cakes for select to authenticated using (true);
create policy if not exists "cakes_admin_update" on public.custom_cakes for update to authenticated using (true) with check (true);

-- Compatibilidade com o admin: pedidos podem ser lidos/atualizados por usuários autenticados.
create policy if not exists "orders_admin_read" on public.orders for select to authenticated using (true);
create policy if not exists "orders_admin_update" on public.orders for update to authenticated using (true) with check (true);

insert into public.settings(key,value) values ('site','{}'::jsonb) on conflict (key) do nothing;

-- Bucket para fotos/mídias do painel
insert into storage.buckets(id,name,public) values ('media','media',true) on conflict (id) do nothing;
create policy if not exists "media_public_read" on storage.objects for select to anon, authenticated using (bucket_id='media');
create policy if not exists "media_authenticated_write" on storage.objects for all to authenticated using (bucket_id='media') with check (bucket_id='media');
