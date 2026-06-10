-- 0005: 未使用の conversions テーブルを削除
-- input_text / output_text を平文保存する設計のテーブルだが、
-- コードから一切参照されておらず、「本文を保存しない」という
-- プライバシー方針（requirements.md 4.2）とも矛盾するため削除する。
-- ※ 削除時点でテーブルは空であることを確認済み（データ損失なし）。
--    履歴機能は usage テーブル（メタ情報のみ）で実現している。
drop table if exists public.conversions;
