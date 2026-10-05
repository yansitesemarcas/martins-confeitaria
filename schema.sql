create extension if not exists pgcrypto;

create table if not exists settings(
  key text primary key,
  value jsonb not null
);

create table if not exists products(
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name)<=120),
  description text check(length(description)<=500),
  price numeric(10,2) not null check(price>=0),
  category text,
  image text,
  available boolean default true,
  featured boolean default false,
  sort int default 0,
  created_at timestamptz default now()
);

create table if not exists orders(
  id uuid primary key default gen_random_uuid(),
  customer text not null check(length(customer)<=120),
  phone text not null check(length(phone)<=30),
  receiving text,
  address text check(length(address)<=300),
  payment text,
  notes text check(length(notes)<=500),
  items jsonb not null,
  total numeric(10,2) not null check(total>=0),
  status text not null default 'novo',
  created_at timestamptz default now()
);

create table if not exists custom_cakes(
  id uuid primary key default gen_random_uuid(),
  data jsonb not null check(pg_column_size(data)<5000),
  status text not null default 'novo',
  created_at timestamptz default now()
);

-- =========================================================
-- NOVOS CAMPOS DOS PRODUTOS
-- =========================================================

alter table public.products
  add column if not exists area text default 'cardapio';

alter table public.products
  add column if not exists gramatura numeric;

alter table public.products
  add column if not exists serve_ate integer;

alter table public.products
  add column if not exists discount_percent numeric default 0;

alter table public.products
  add column if not exists appointment_required boolean default false;

-- Corrige registros antigos que estejam sem desconto
update public.products
set discount_percent = 0
where discount_percent is null;

-- Garante os valores padrão
alter table public.products
  alter column area set default 'cardapio';

alter table public.products
  alter column discount_percent set default 0;

alter table public.products
  alter column appointment_required set default false;

-- =========================================================
-- SEGURANÇA
-- =========================================================

alter table settings enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table custom_cakes enable row level security;

-- =========================================================
-- SETTINGS
-- =========================================================

drop policy if exists "ler settings" on settings;

create policy "ler settings"
on settings
for select
using(true);

drop policy if exists "admin settings" on settings;

create policy "admin settings"
on settings
for all
to authenticated
using(true)
with check(true);

-- =========================================================
-- PRODUTOS
-- =========================================================

drop policy if exists "ler produtos" on products;

create policy "ler produtos"
on products
for select
using(true);

drop policy if exists "admin produtos" on products;

create policy "admin produtos"
on products
for all
to authenticated
using(true)
with check(true);

-- =========================================================
-- PEDIDOS
-- =========================================================

drop policy if exists "criar pedido" on orders;

create policy "criar pedido"
on orders
for insert
to anon, authenticated
with check(status='novo');

drop policy if exists "admin pedidos" on orders;

create policy "admin pedidos"
on orders
for select
to authenticated
using(true);

drop policy if exists "admin pedidos upd" on orders;

create policy "admin pedidos upd"
on orders
for update
to authenticated
using(true)
with check(true);

-- =========================================================
-- BOLOS PERSONALIZADOS
-- =========================================================

drop policy if exists "criar bolo" on custom_cakes;

create policy "criar bolo"
on custom_cakes
for insert
to anon, authenticated
with check(status='novo');

drop policy if exists "admin bolos" on custom_cakes;

create policy "admin bolos"
on custom_cakes
for select
to authenticated
using(true);

drop policy if exists "admin bolos upd" on custom_cakes;

create policy "admin bolos upd"
on custom_cakes
for update
to authenticated
using(true)
with check(true);

-- =========================================================
-- STORAGE
-- =========================================================

insert into storage.buckets(id,name,public)
values('media','media',true)
on conflict(id) do nothing;

drop policy if exists "media leitura" on storage.objects;

create policy "media leitura"
on storage.objects
for select
using(bucket_id='media');

drop policy if exists "media admin" on storage.objects;

create policy "media admin"
on storage.objects
for all
to authenticated
using(bucket_id='media')
with check(bucket_id='media');

-- =========================================================
-- CONFIGURAÇÃO INICIAL
-- =========================================================

insert into settings(key,value)
values('site', '{}'::jsonb)
on conflict(key) do nothing;
