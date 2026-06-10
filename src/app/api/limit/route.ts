import { checkLimit } from "@/lib/usage/check-limit";
import { rateLimit } from "@/lib/rate-limit";
import { createClientFromRequest } from "@/lib/supabase/bearer";

/**
 * /api/limit
 * -------------------------------------------------
 * 残量取得API（モバイルアプリ用に新設）。
 * Web版はサーバーコンポーネントから checkLimit() を直接呼んでいるが、
 * アプリは HTTP 経由でしか取得できないためこのルートを用意する。
 *
 * リクエスト:
 *   GET（認証必須: Cookie または Authorization: Bearer <アクセストークン>）
 *
 * レスポンス:
 *   200 LimitCheckResult（plan / maxChars / limitType / periodLimit /
 *       resetCycle / used / remaining / canDoubleCheck など）
 *   401 { error: string } -- 未認証
 *   429 { error: string } -- レートリミット
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  // --- 1. レートリミット（IP単位、1分あたり30リクエスト） ---
  // 画面フォーカスごとに呼ばれる軽いAPIなので humanize より緩め
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`limit:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  // --- 2. 認証（Cookie / Bearer 両対応） ---
  const auth = await createClientFromRequest(request);
  if (!auth.userId) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // --- 3. 残量チェック結果をそのまま返す ---
  const limit = await checkLimit(auth.userId, auth.supabase);
  // userId は内部用なのでレスポンスから除外する
  const { userId: _userId, ...publicLimit } = limit;
  return Response.json(publicLimit);
}
