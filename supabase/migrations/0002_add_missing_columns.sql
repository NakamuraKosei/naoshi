-- 0002: コード側で使用しているが初期マイグレーションに含まれていなかったカラムを追加
-- plan_changed_at: プラン変更時に利用量をリセットするための基準日時
-- mode: 変換モード（standard / evasion）のトラッキング用

-- profiles テーブルに plan_changed_at カラムを追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_changed_at timestamptz DEFAULT now();

-- usage テーブルに mode カラムを追加
ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'standard';
