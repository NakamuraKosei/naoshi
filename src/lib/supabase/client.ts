// Supabase ブラウザ用クライアント（クライアントコンポーネント／ブラウザ実行コードから使う）
// @supabase/ssr の createBrowserClient を使う。

import { createBrowserClient } from "@supabase/ssr";

// ブラウザ用 Supabase クライアントを生成するヘルパー
// 環境変数が空の場合でもビルド時にエラーとならないよう、呼び出し時のみ評価する
export function createClient() {
  return createBrowserClient(
    // Supabase プロジェクト URL
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    // Anon キー（公開可能）
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
