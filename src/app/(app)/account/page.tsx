// マイページ（/account）
// design.md 7.4: 上部プラン状態カード、下部使用状況カード + Customer Portal リンク

import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";
import { getPlanRule, getMonthStart, type PlanKey } from "@/lib/usage/plans";
import { PortalButton } from "./portal-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  // profiles からプラン情報を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, created_at, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const plan = (profile?.plan ?? "free") as PlanKey;
  const rule = getPlanRule(plan);

  // 今月1日のリセット起点（全プラン共通）
  const monthStart = getMonthStart();

  // 今月の使用回数
  const { count: monthCount } = await supabase
    .from("usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("used_at", monthStart.toISOString());

  // 今月の使用文字数合計
  const { data: usageRows } = await supabase
    .from("usage")
    .select("input_chars")
    .eq("user_id", user.id)
    .gte("used_at", monthStart.toISOString());

  const monthChars = (usageRows ?? []).reduce(
    (sum, row) => sum + ((row as { input_chars: number }).input_chars ?? 0),
    0,
  );

  // 累計の使用回数
  const { count: totalCount } = await supabase
    .from("usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = totalCount ?? 0;

  // 残量計算（制限方式に応じて）
  const used = rule.limitType === "count" ? (monthCount ?? 0) : monthChars;
  const remaining = Math.max(0, rule.monthlyLimit - used);

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* ページ見出し */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">マイページ</h1>
            <p className="mt-2 text-text-secondary">
              プランの状態と使用状況を確認できます。
            </p>
          </div>
          <Link
            href="/history"
            className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            利用履歴を見る →
          </Link>
        </div>

        {/* 変換画面へのCTA */}
        <Link href="/app" className="mb-6 block">
          <Card interactive className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-text-primary">レポートを整える</p>
              <p className="mt-1 text-sm text-text-secondary">変換画面に移動して、さっそく使ってみましょう。</p>
            </div>
            <Button variant="primary">なおす →</Button>
          </Card>
        </Link>

        {/* 上部: プラン状態カード */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>現在のプラン</CardTitle>
              <Badge variant={plan === "free" ? "neutral" : "primary"}>
                {rule.label}
              </Badge>
            </div>
            <CardDescription>
              {user.email}
              {profile?.created_at
                ? ` ・ 登録日: ${new Date(profile.created_at).toLocaleDateString("ja-JP")}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">1回あたりの文字数</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {rule.maxChars.toLocaleString()}字
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">月間上限</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {rule.limitType === "count"
                    ? `${rule.monthlyLimit}回/月`
                    : `${rule.monthlyLimit.toLocaleString()}字/月`}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <PortalButton hasCustomer={Boolean(profile?.stripe_customer_id)} />
          </CardFooter>
        </Card>

        {/* 下部: 使用状況カード */}
        <Card>
          <CardHeader>
            <CardTitle>今月の使用状況</CardTitle>
            <CardDescription>
              毎月1日（JST）にリセットされます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-text-secondary">今月の使用</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {rule.limitType === "count"
                    ? `${used} / ${rule.monthlyLimit} 回`
                    : `${used.toLocaleString()} / ${rule.monthlyLimit.toLocaleString()} 字`}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">残り</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {rule.limitType === "count"
                    ? `${remaining}回`
                    : `${remaining.toLocaleString()}字`}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">累計変換回数</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {total}回
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
