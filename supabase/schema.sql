-- Enable extensions commonly available on Supabase
create extension if not exists pgcrypto;

-- profiles (optional)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone default now()
);

-- codes: unique by code
create table if not exists public.codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  "desc" text default '',
  heroes text[] default '{}',
  maps text[] default '{}',
  role text default 'Any',
  mode text default 'Other',
  tags text[] default '{}',
  author text,
  updated date default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- likes: one per user per code
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  code_id uuid not null references public.codes(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, code_id)
);

-- RLS
alter table public.codes enable row level security;
alter table public.likes enable row level security;
alter table public.profiles enable row level security;

-- Policies
create policy if not exists "codes_select_all" on public.codes
  for select using (true);
create policy if not exists "codes_insert_owner" on public.codes
  for insert with check (auth.uid() = created_by);
create policy if not exists "codes_update_owner" on public.codes
  for update using (auth.uid() = created_by);
create policy if not exists "codes_delete_owner" on public.codes
  for delete using (auth.uid() = created_by);

create policy if not exists "likes_select_all" on public.likes
  for select using (true);
create policy if not exists "likes_insert_self" on public.likes
  for insert with check (auth.uid() = user_id);
create policy if not exists "likes_delete_self" on public.likes
  for delete using (auth.uid() = user_id);

