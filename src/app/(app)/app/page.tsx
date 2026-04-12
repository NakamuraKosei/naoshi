import { AppClient } from "./app-client";
import { checkLimit } from "@/lib/usage/check-limit";
import { getPlanRule, PLAN_RULES } from "@/lib/usage/plans";

/**
 * 変換画面（/app）
 * Server Component でプラン情報を取得し、クライアント本体に注入する。
 */
export const dynamic = "force-dynamic";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Stripe Checkout 完了後のサクセスフラグ
  const checkoutSuccess = params.checkout === "success";

  // 環境変数未設定時はフリープラン固定
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const fallbackRule = getPlanRule("free");
    return (
      <AppClient
        maxChars={fallbackRule.maxChars}
        limitType={fallbackRule.limitType}
        monthlyLimit={fallbackRule.monthlyLimit}
        used={0}
        remaining={fallbackRule.monthlyLimit}
        planLabel={fallbackRule.label}
        checkoutSuccess={false}
      />
    );
  }

  const limit = await checkLimit();
  const rule = PLAN_RULES[limit.plan];

  return (
    <AppClient
      maxChars={limit.maxChars}
      limitType={limit.limitType}
      monthlyLimit={limit.monthlyLimit}
      used={limit.used}
      remaining={limit.remaining}
      planLabel={rule.label}
      checkoutSuccess={checkoutSuccess}
    />
  );
}
