import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";
import { createClientFromRequest } from "@/lib/supabase/bearer";
import { rateLimit } from "@/lib/rate-limit";
import { isAllowedOrigin } from "@/lib/origin-guard";

/**
 * /api/account/delete
 * -------------------------------------------------
 * アカウント削除（退会）API。App Store ガイドライン 5.1.1(v) 対応。
 *
 * 処理順序（重要）:
 *   1. 有効な Stripe サブスクリプションをすべて即時解約
 *      （先にアカウントだけ消すと、ユーザーが解約手段を失ったまま請求が続いてしまう）
 *   2. auth.users からユーザーを削除
 *      → profiles / subscriptions / usage は ON DELETE CASCADE で全削除
 *
 * リクエスト:
 *   POST（ボディ不要。認証必須: Cookie または Bearer）
 *
 * レスポンス:
 *   200 { success: true }
 *   401 / 429 / 500 { error }
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  // --- 1. CSRF対策（クロスサイトPOSTの拒否） ---
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  }

  // --- 2. IP単位のレートリミット（認証前。未認証連打がAuthへ流れるのを防ぐ） ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipLimit = rateLimit(`account-delete:ip:${ip}`, 10, 60_000);
  if (!ipLimit.allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  // --- 3. 認証（Web=Cookie / アプリ=Bearer 両対応） ---
  const { user } = await createClientFromRequest(request);
  if (!user) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // --- 4. ユーザー単位のレートリミット ---
  const rl = rateLimit(`account-delete:user:${user.id}`, 3, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  const service = createServiceClient();

  try {
    // --- 3. Stripe サブスクリプションの即時解約 ---
    const { data: profile } = await service
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      const stripe = getStripe();
      try {
        // 解約対象: 課金が継続しうるステータスのみ（canceled / incomplete_expired は cancel 不可）
        const CANCELABLE = ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"];
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "all",
          limit: 100, // 1顧客が100件を超えることは実運用上ない
        });
        for (const subscription of subscriptions.data) {
          if (CANCELABLE.includes(subscription.status)) {
            await stripe.subscriptions.cancel(subscription.id);
          }
        }
      } catch (stripeErr) {
        // 顧客がStripe側に存在しない（テスト環境の名残・キー切替等）→ 解約不要なので削除を続行
        const isMissing =
          stripeErr instanceof Stripe.errors.StripeInvalidRequestError &&
          stripeErr.code === "resource_missing";
        if (!isMissing) {
          throw stripeErr; // それ以外のStripeエラーは退会を中断（請求事故の防止を最優先）
        }
        console.warn("[account-delete] stripe customer not found, skipping cancellation");
      }
    }

    // --- 4. ユーザー削除（関連データは CASCADE で全削除） ---
    const { error: deleteError } = await service.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[account-delete] delete user error:", deleteError.message);
      return Response.json(
        { error: "削除に失敗しました。お問い合わせください。" },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    // Stripe 解約に失敗した場合はアカウントを残す（請求事故の防止を最優先）
    console.error(
      "[account-delete] error:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json(
      { error: "削除に失敗しました。お問い合わせください。" },
      { status: 500 },
    );
  }
}
