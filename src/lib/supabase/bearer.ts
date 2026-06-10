// モバイルアプリ用の Bearer トークン認証ヘルパー
// -------------------------------------------------
// Web版は Cookie セッション（@supabase/ssr）で認証しているが、
// モバイルアプリは Cookie を共有できないため、
// Authorization: Bearer <アクセストークン> での認証を追加する。
//
// 方針（後方互換）:
//   - Authorization ヘッダーがあれば → トークン付きクライアントを生成（RLS はユーザー権限で動く）
//   - なければ → 従来どおり Cookie クライアント（Web版の挙動は一切変わらない）

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";

export type AuthContext = {
  // 認証方式に応じた Supabase クライアント（RLS が本人権限で機能する）
  supabase: SupabaseClient;
  // 認証済みユーザー（未認証なら null）
  user: User | null;
  // 認証済みユーザーID（未認証なら null）
  userId: string | null;
};

// リクエストから Authorization ヘッダーを読み、適切なクライアントとユーザーを返す
export async function createClientFromRequest(
  request: Request,
): Promise<AuthContext> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    // --- Bearer 方式（モバイルアプリ） ---
    // グローバルヘッダーにトークンを載せることで、このクライアント経由の
    // DBアクセスはすべて本人権限（RLS）で実行される
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    // トークンを検証してユーザーを特定（無効なら userId = null）
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    return { supabase, user, userId: user?.id ?? null };
  }

  // --- Cookie 方式（Web版・従来どおり） ---
  const supabase = await createCookieClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, userId: user?.id ?? null };
}
