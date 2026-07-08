-- マイ文体（文体プロファイル）テーブル
-- プライバシー方針: アップロードされた本文は保存しない。
-- 解析済みの抽象プロファイル（summary/features）のみ保持する。
create table if not exists public.user_style_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- 抽出済みプロファイル { summary: 注入用指示文, features: 表示用特徴リスト }
  profile jsonb not null,
  -- 解析に使ったサンプルの文字数（メタ情報・表示用）
  sample_chars integer not null default 0,
  -- 登録回数の日次制限用（JST日付で管理、1日3回まで）
  daily_regs integer not null default 1,
  last_reg_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_style_profiles enable row level security;

-- 本人のみ読み書き可能（RLS）
drop policy if exists "select own style profile" on public.user_style_profiles;
drop policy if exists "insert own style profile" on public.user_style_profiles;
drop policy if exists "update own style profile" on public.user_style_profiles;
drop policy if exists "delete own style profile" on public.user_style_profiles;

create policy "select own style profile" on public.user_style_profiles
  for select using (auth.uid() = user_id);
create policy "insert own style profile" on public.user_style_profiles
  for insert with check (auth.uid() = user_id);
create policy "update own style profile" on public.user_style_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own style profile" on public.user_style_profiles
  for delete using (auth.uid() = user_id);
