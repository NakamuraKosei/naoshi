// Magic Link 送信エンドポイント
// /login フォームから { email } を POST で受け取り、Supabase Auth の
// signInWithOtp を呼び出してメールを送信する

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// ビルド時評価を避けるため動的実行
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // レートリミット（IP単位、1分あたり3リクエスト）
  // 任意のメールアドレスへ送信できるため、メール爆撃の踏み台化を防ぐ
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`magic-link:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

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
    // 確認コード方式で送信する。
    // emailRedirectTo を渡さないことで、PKCEのリンク（鍵不一致やメールスキャナ
    // 消費で失敗しやすい）に依存せず、メール内の6桁コードでログインさせる。
    const { error } = await supabase.auth.signInWithOtp({
      email,
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
