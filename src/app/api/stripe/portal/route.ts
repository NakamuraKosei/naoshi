// Stripe Customer Portal セッション作成エンドポイント
// /account からのリクエストを受け、Customer Portal URL を返す

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // レートリミット（IP単位、1分あたり5リクエスト）
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`portal:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

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

    // profiles テーブルから stripe_customer_id を取得
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Stripe 顧客情報が見つかりません。まずはプランにご登録ください。" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    // NEXT_PUBLIC_SITE_URL が設定されていればそちらを優先（checkout と統一）
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    // Customer Portal セッション生成
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/account`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("[stripe/portal] error", error);
    return NextResponse.json(
      { error: "Customer Portal の作成に失敗しました。" },
      { status: 500 },
    );
  }
}
