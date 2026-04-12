// Supabase Service Role クライアント（管理者権限）
// Stripe Webhook など、認証ユーザーを介さずに DB 更新する場面で使用する。
// Service Role キーは絶対にクライアントに露出させないこと。

import { createClient } from "@supabase/supabase-js";

// 管理者権限の Supabase クライアントを返す
// 呼び出し時に env を評価するため、ビルド時に環境変数が無くてもエラーにならない
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        // サービスロールはセッションを持たない
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
