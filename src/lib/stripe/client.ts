// Stripe SDK クライアント（サーバー専用）
// 呼び出し時に環境変数を評価することでビルド時エラーを避ける

import Stripe from "stripe";

// Stripe API バージョンは固定する（将来のブレイキングチェンジ対策）
const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

// サーバーから Stripe SDK を使う際のヘルパー
// 環境変数が未設定の場合は呼び出し側でハンドリングしやすいように null を返す設計も考えたが、
// シンプルに throw せず、未設定でもインスタンスは生成する（API 呼び出し時にエラーになる）
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
  });
}

// プラン ID と価格 ID のマッピング
// requirements.md 第7章のプランに対応
export type PlanId = "light" | "heavy_monthly" | "heavy_yearly";

// プラン名から Stripe 価格 ID を取得
export function getPriceId(plan: PlanId): string {
  switch (plan) {
    case "light":
      return process.env.STRIPE_PRICE_LIGHT_WEEKLY ?? "";
    case "heavy_monthly":
      return process.env.STRIPE_PRICE_HEAVY_MONTHLY ?? "";
    case "heavy_yearly":
      return process.env.STRIPE_PRICE_HEAVY_YEARLY ?? "";
  }
}

// 逆引き: Stripe 価格 ID からプラン名を特定（Webhook で使用）
export function getPlanByPriceId(priceId: string): PlanId | null {
  if (priceId === process.env.STRIPE_PRICE_LIGHT_WEEKLY) return "light";
  if (priceId === process.env.STRIPE_PRICE_HEAVY_MONTHLY) return "heavy_monthly";
  if (priceId === process.env.STRIPE_PRICE_HEAVY_YEARLY) return "heavy_yearly";
  return null;
}
