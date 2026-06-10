-- 0004: 本番DBへ手動SQLで適用済みだったスキーマ変更をマイグレーションとして記録する
-- （SQL Editor から直接適用されており、migrations に欠落していた。
--   record-usage.ts が usage.category を INSERT し、feedback API が feedback テーブルを使う）
-- すべて冪等（if not exists）のため、適用済みの本番に流しても安全。

-- usage テーブルに category カラムを追加（レポート / ビジネスのトラッキング用）
alter table public.usage
  add column if not exists category text default 'report';

-- =========================================================
-- feedback: ユーザーフィードバック（/api/feedback から INSERT）
-- =========================================================
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- 本人のみ自分のフィードバックを INSERT 可
drop policy if exists "Users can insert own feedback" on public.feedback;
create policy "Users can insert own feedback" on public.feedback
  for insert to authenticated with check (auth.uid() = user_id);
