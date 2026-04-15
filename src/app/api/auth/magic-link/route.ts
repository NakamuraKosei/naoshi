// Magic Link 送信エンドポイント
// /login フォームから { email } を POST で受け取り、Supabase Auth の
// signInWithOtp を呼び出してメールを送信する

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ビルド時評価を避けるため動的実行
export const dynamic = "force-dynamic";

// Supabase Auth のエラーをユーザー向けの日本語メッセージに変換
function getFriendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "メールの送信回数が上限に達しました。しばらく時間をおいてから再度お試しください。";
  }
  if (lower.includes("invalid email")) {
    return "メールアドレスの形式が正しくありません。";
  }
  if (lower.includes("not allowed") || lower.includes("not authorized")) {
    return "このメールアドレスではご利用いただけません。";
  }
  // その他の不明なエラー
  return "メールの送信に失敗しました。時間をおいて再度お試しください。";
}

export async function POST(request: Request) {
  try {
    // リクエストボディから email を取得
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません。" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // コールバック URL
    // NEXT_PUBLIC_SITE_URL が設定されていればそちらを優先（本番URL固定）
    // 未設定の場合はリクエストのoriginにフォールバック
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;
    const redirectTo = `${origin}/auth/callback`;

    // Magic Link を送信
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      // メール列挙攻撃対策:
      // レートリミット系のエラーのみユーザーに通知。
      // その他のエラー（存在しないメール等）は成功と同じレスポンスを返し、
      // 攻撃者がメールアドレスの存在有無を判別できないようにする。
      const lower = error.message.toLowerCase();
      if (lower.includes("rate limit") || lower.includes("too many")) {
        return NextResponse.json(
          { error: "メールの送信回数が上限に達しました。しばらく時間をおいてから再度お試しください。" },
          { status: 429 },
        );
      }
      // エラーはサーバーログにのみ記録し、ユーザーには成功と同じ応答
      console.error("[magic-link] auth error:", error.message);
    }

    // 成功でもエラーでも同じレスポンス（メール列挙防止）
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました。" },
      { status: 500 },
    );
  }
}
