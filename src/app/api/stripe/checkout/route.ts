// Stripe Checkout セッション作成エンドポイント
// 認証ユーザーからの POST { plan } を受け取り、該当プランの Checkout URL を返す

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId, type PlanId } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { plan?: PlanId };
    const plan = body.plan;
    if (!plan || !["light", "heavy_monthly", "heavy_yearly"].includes(plan)) {
      return NextResponse.json(
        { error: "プラン指定が不正です。" },
        { status: 400 },
      );
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: "プランの価格 ID が設定されていません。" },
        { status: 500 },
      );
    }

    // 既存の Stripe Customer があればそれを使う
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    // 既存サブスクリプションがあればキャンセル（二重課金防止）
    if (profile?.stripe_customer_id) {
      const existingSubs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "active",
      });
      for (const sub of existingSubs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // Checkout セッション生成
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      // 既存顧客があれば customer を指定、無ければ email を渡して新規作成させる
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      // Webhook でユーザーを特定できるよう metadata を付与
      metadata: {
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // 入力テキスト等はログに出さない方針だが、Stripe エラーは残してよい
    console.error("[stripe/checkout] error", error);
    return NextResponse.json(
      { error: "Checkout セッションの作成に失敗しました。" },
      { status: 500 },
    );
  }
}
