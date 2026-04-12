// Magic Link コールバックエンドポイント
// メール本文のリンクをクリックするとここに戻ってくる。
// code パラメータを受け取り、exchangeCodeForSession でセッションを確立して /app へリダイレクト。

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // /login?redirect=/xxx から渡された戻り先（省略時は /app）
  const next = url.searchParams.get("redirect") ?? "/app";

  if (code) {
    const supabase = await createClient();
    // コードをセッションに交換（セッション Cookie がセットされる）
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // 失敗時はログインページに戻す
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
