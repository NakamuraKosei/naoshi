-- =========================================================
-- handle_new_user() のハードニング（多層防御）
-- =========================================================
-- public スキーマの SECURITY DEFINER 関数は、既定で anon / authenticated
-- ロールに EXECUTE 権限が付与され、PostgREST 経由で直接呼び出せてしまう。
-- handle_new_user() は on_auth_user_created トリガー専用の関数であり、
-- API から直接呼ばれることは想定していないため、実行権限を剥奪する。
--
-- ※ トリガー経由の実行は関数の所有者権限で動くため、ここで API ロールの
--    EXECUTE を剥奪してもユーザー登録時の profiles 自動作成には影響しない。
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from public;
