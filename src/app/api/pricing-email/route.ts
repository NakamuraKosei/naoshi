import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";
import { createClientFromRequest } from "@/lib/supabase/bearer";

/**
 * /api/pricing-email
 * -------------------------------------------------
 * 料金プランのご案内メールをログイン中ユーザー本人へ送るAPI。
 * モバイルアプリ用: アプリ内には価格・購入リンクを置けない（ストア規約）ため、
 * 「メールで案内を受け取る」ボタンからこのAPIを呼び、メール経由で購入導線を提供する。
 * （アプリ外＝メールでの購入案内は規約上問題のない確立された手法）
 *
 * リクエスト:
 *   POST（ボディ不要。認証必須: Cookie または Bearer）
 *
 * レスポンス:
 *   200 { success: true }
 *   401 { error } / 429 { error } / 500 { error }
 */

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

// 送信元アドレス。
// 全ユーザーに送るには Resend でドメイン認証（naoshiai.com）を行い、
// 環境変数 RESEND_FROM に「Naoshi <info@naoshiai.com>」等を設定すること。
// 未設定時は Resend のテスト用送信元（アカウント本人にのみ送信可）。
const MAIL_FROM = process.env.RESEND_FROM ?? "Naoshi <onboarding@resend.dev>";

// 料金表（pricing-plans.tsx / requirements.md 第7章と同期させること）
const PRICING_TEXT = `■ 無料プラン  ¥0
  ・1回あたり300字まで / 月3回まで

■ ライトプラン  ¥500 / 週
  ・1回あたり2,500字まで / 週17,500字まで
  ・短期のレポート提出期間にぴったり

■ ヘビープラン（月額）  ¥2,980 / 月　★人気
  ・1回あたり5,000字まで / 月150,000字まで
  ・ダブルチェック機能つき

■ ヘビープラン（年額）  ¥24,000 / 年（実質¥2,000/月・33%OFF）
  ・1回あたり10,000字まで / 月150,000字まで
  ・ダブルチェック機能つき`;

export async function POST(request: Request) {
  // --- 1. 認証（Cookie / Bearer 両対応） ---
  const { user } = await createClientFromRequest(request);
  if (!user?.email) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // --- 2. レートリミット（ユーザー単位、10分あたり2回） ---
  // メール連打によるスパム・Resendクレジット浪費を防ぐ
  const rl = rateLimit(`pricing-email:user:${user.id}`, 2, 10 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "送信が多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  // --- 3. 案内メールを本人宛に送信 ---
  try {
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: user.email,
      subject: "【Naoshi】料金プランのご案内",
      text: `Naoshiをご利用いただきありがとうございます。

料金プランのご案内です。

${PRICING_TEXT}

▼ ご購入・プラン変更はこちらから
https://naoshiai.com/pricing

▼ ご契約内容の確認・解約はマイページから
https://naoshiai.com/account

※ このメールは、アプリの「料金・購入方法をメールで受け取る」操作により送信されています。
心当たりがない場合は、このメールを無視してください。

Naoshi（ナオシ）
https://naoshiai.com`,
    });

    if (error) {
      console.error("[pricing-email] send error:", error.message);
      return Response.json(
        { error: "送信に失敗しました。もう一度お試しください。" },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(
      "[pricing-email] unexpected error:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json(
      { error: "送信に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
