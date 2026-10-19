-- LedgerFlow initial schema: mirrored tables, ownership policies and indexes.
create extension if not exists "pgcrypto";

-- ---- tables ----

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'CNY' check (currency in ('CNY', 'USD', 'EUR', 'JPY')),
  month_budget_cents integer not null default 0 check (month_budget_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null,
  color text not null,
  kind text not null check (kind in ('expense', 'income')),
  sort integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  kind text not null check (kind in ('expense', 'income')),
  category_id text not null,
  note text not null default '',
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.budgets (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, period)
);

-- ---- indexes ----

create index if not exists entries_user_date_idx
  on public.entries (user_id, occurred_on desc);
create index if not exists entries_user_updated_idx
  on public.entries (user_id, updated_at);
create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort);
create index if not exists budgets_user_period_idx
  on public.budgets (user_id, period);

-- ---- updated_at trigger ----

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'categories', 'entries', 'budgets']
  loop
    execute format(
      'drop trigger if exists touch_updated_at on public.%I', table_name
    );
    execute format(
      'create trigger touch_updated_at before update on public.%I
       for each row execute function public.touch_updated_at()', table_name
    );
  end loop;
end;
$$;

-- ---- row level security ----

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.budgets enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['categories', 'entries', 'budgets']
  loop
    execute format('drop policy if exists %I_owner_select on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_select on public.%I for select using (auth.uid() = user_id)',
      table_name, table_name
    );
    execute format('drop policy if exists %I_owner_insert on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_insert on public.%I for insert with check (auth.uid() = user_id)',
      table_name, table_name
    );
    execute format('drop policy if exists %I_owner_update on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_update on public.%I for update using (auth.uid() = user_id)
       with check (auth.uid() = user_id)',
      table_name, table_name
    );
    execute format('drop policy if exists %I_owner_delete on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_delete on public.%I for delete using (auth.uid() = user_id)',
      table_name, table_name
    );
  end loop;
end;
$$;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ---- profile bootstrap ----

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
