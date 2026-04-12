-- Naoshi 初期マイグレーション
-- requirements.md 第8章のデータモデル定義に従う
-- 対象テーブル: profiles / subscriptions / usage / conversions
-- すべて RLS 有効化、本人のみ SELECT/INSERT/UPDATE 可

-- =========================================================
-- profiles: ユーザープロフィール（auth.users と 1:1）
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (
    plan in ('free', 'light', 'heavy_monthly', 'heavy_yearly')
  ),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 本人のみ参照可
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 本人のみ更新可（プラン変更は Webhook の Service Role 経由が基本だが、念のため）
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================
-- subscriptions: Stripe サブスクリプションのキャッシュ
-- =========================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  plan text not null
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- =========================================================
-- usage: 利用履歴（カウント用。本文は保存しない）
-- =========================================================
create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  used_at timestamptz not null default now(),
  input_chars int not null default 0,
  output_chars int not null default 0,
  style text not null check (style in ('dearu', 'desumasu')),
  duration_ms int not null default 0
);

create index if not exists usage_user_id_used_at_idx
  on public.usage(user_id, used_at desc);

alter table public.usage enable row level security;

drop policy if exists "usage_select_own" on public.usage;
create policy "usage_select_own" on public.usage
  for select using (auth.uid() = user_id);

drop policy if exists "usage_insert_own" on public.usage;
create policy "usage_insert_own" on public.usage
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- conversions: 変換履歴（オプション、MVP では作成のみ）
-- プライバシー観点で本文を保存する場合は暗号化検討（要件 8.1 注記）
-- =========================================================
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text,
  output_text text,
  created_at timestamptz not null default now()
);

create index if not exists conversions_user_id_created_at_idx
  on public.conversions(user_id, created_at desc);

alter table public.conversions enable row level security;

drop policy if exists "conversions_select_own" on public.conversions;
create policy "conversions_select_own" on public.conversions
  for select using (auth.uid() = user_id);

drop policy if exists "conversions_insert_own" on public.conversions;
create policy "conversions_insert_own" on public.conversions
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversions_delete_own" on public.conversions;
create policy "conversions_delete_own" on public.conversions
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 新規ユーザー作成時に profiles を自動作成するトリガー
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
