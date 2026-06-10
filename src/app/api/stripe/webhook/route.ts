// Stripe Webhook エンドポイント
// checkout.session.completed / customer.subscription.updated / deleted を受け取り、
// profiles / subscriptions テーブルを同期する。
// 署名検証に STRIPE_WEBHOOK_SECRET を使用。

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getPlanByPriceId } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
// Webhook は Node ランタイム必須（Edge では crypto の都合が合わない）
export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // 空文字列や未定義の場合もブロック（署名検証が無意味になるのを防止）
  if (!signature || !webhookSecret || webhookSecret.length === 0) {
    return NextResponse.json(
      { error: "Webhook 署名が不正、もしくはシークレット未設定。" },
      { status: 400 },
    );
  }

  // Next.js 16 の Route Handler で Raw ボディを取るには text() を使う
  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] signature verify failed", error);
    return NextResponse.json(
      { error: "署名検証に失敗しました。" },
      { status: 400 },
    );
  }

  const admin = createServiceClient();

  // サブスクからユーザーIDを特定する。
  // 基本は自前Checkoutで付与した metadata.user_id を使うが、
  // Stripeダッシュボードから手動作成されたサブスク等には metadata が無い。
  // その場合は stripe_customer_id から profiles を逆引きするフォールバック。
  async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
    if (sub.metadata?.user_id) return sub.metadata.user_id;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (!customerId) return null;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data?.id ?? null;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Checkout 完了時: profiles に stripe_customer_id とプランを書き込む
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (userId && customerId) {
          const now = new Date().toISOString();
          await admin
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              plan: plan ?? "free",
              plan_changed_at: now,
              updated_at: now,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub);
        // 価格 ID からプラン名を逆引き
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = getPlanByPriceId(priceId) ?? "free";

        // subscriptions テーブルを upsert
        if (userId) {
          // Stripe.Subscription の current_period_* は型に無いケースがあるため any 経由で取得
          const raw = sub as unknown as {
            current_period_start?: number;
            current_period_end?: number;
          };
          await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              status: sub.status,
              current_period_start: raw.current_period_start
                ? new Date(raw.current_period_start * 1000).toISOString()
                : null,
              current_period_end: raw.current_period_end
                ? new Date(raw.current_period_end * 1000).toISOString()
                : null,
              plan,
            },
            { onConflict: "stripe_subscription_id" },
          );

          // アクティブ系ステータスなら profiles のプランも更新
          const isActive =
            sub.status === "active" || sub.status === "trialing";
          const newPlan = isActive ? plan : "free";
          const now = new Date().toISOString();

          // plan_changed_at はプランが実際に変わった時だけ更新する。
          // subscription.updated は毎周期の請求やカード変更でも発火するため、
          // 無条件に更新すると check-limit の使用量カウントが請求のたびに
          // リセットされてしまう（期間上限が実質無効化される）。
          const { data: currentProfile } = await admin
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .maybeSingle();
          const planChanged = currentProfile?.plan !== newPlan;

          await admin
            .from("profiles")
            .update({
              plan: newPlan,
              ...(planChanged ? { plan_changed_at: now } : {}),
              updated_at: now,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // metadata が無い場合も customer_id から逆引きして、
        // 解約時に profiles.plan が有料のまま残るのを防ぐ
        const userId = await resolveUserId(sub);

        await admin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", sub.id);

        if (userId) {
          // 他にアクティブなサブスクが残っていないか確認（二重課金対策）
          const { data: activeSubs } = await admin
            .from("subscriptions")
            .select("plan")
            .eq("user_id", userId)
            .in("status", ["active", "trialing"])
            .neq("stripe_subscription_id", sub.id)
            .limit(1);

          // こちらも plan_changed_at はプランが実際に変わる時だけ更新（C1と同じ理由）
          const now = new Date().toISOString();
          const nextPlan =
            activeSubs && activeSubs.length > 0 ? activeSubs[0].plan : "free";
          const { data: currentProfile } = await admin
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .maybeSingle();
          const planChanged = currentProfile?.plan !== nextPlan;

          await admin
            .from("profiles")
            .update({
              plan: nextPlan,
              ...(planChanged ? { plan_changed_at: now } : {}),
              updated_at: now,
            })
            .eq("id", userId);
        }
        break;
      }

      default:
        // その他のイベントは無視
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook] handler error", error);
    return NextResponse.json({ error: "Webhook 処理失敗" }, { status: 500 });
  }
}
