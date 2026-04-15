// マイページ（/account）
// design.md 7.4: 上部プラン状態カード、下部使用状況カード + Customer Portal リンク

import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";
import { getPlanRule, type PlanKey } from "@/lib/usage/plans";
import { checkLimit } from "@/lib/usage/check-limit";
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

  // checkLimit() で使用量を一元的に計算（plan_changed_at を考慮）
  const limit = await checkLimit(user.id);
  const used = limit.used;
  const remaining = limit.remaining;

  // 累計の使用回数
  const { count: totalCount } = await supabase
    .from("usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = totalCount ?? 0;

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* ページ見出し */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">マイページ</h1>
            <p className="mt-2 text-sm text-text-secondary sm:text-base">
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
          <Card interactive className="flex flex-col gap-3 border-2 border-primary sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-text-primary">レポートを整える</p>
              <p className="mt-1 text-sm text-text-secondary">変換画面に移動して、さっそく使ってみましょう。</p>
            </div>
            <Button variant="primary" className="w-full shrink-0 sm:w-auto">なおす →</Button>
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
                <p className="text-sm text-text-secondary">
                  {rule.resetCycle === "weekly" ? "週間上限" : "月間上限"}
                </p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {rule.limitType === "count"
                    ? `${rule.periodLimit}回/月`
                    : `${rule.periodLimit.toLocaleString()}字/${rule.resetCycle === "weekly" ? "週" : "月"}`}
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
            <CardTitle>{rule.resetCycle === "weekly" ? "今週" : "今月"}の使用状況</CardTitle>
            <CardDescription>
              {rule.resetCycle === "weekly"
                ? "毎週月曜日（JST）にリセットされます"
                : "毎月1日（JST）にリセットされます"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-text-secondary">{rule.resetCycle === "weekly" ? "今週" : "今月"}の使用</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {rule.limitType === "count"
                    ? `${used} / ${rule.periodLimit} 回`
                    : `${used.toLocaleString()} / ${rule.periodLimit.toLocaleString()} 字`}
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
