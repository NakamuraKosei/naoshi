"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/**
 * 料金プランカード一覧（design.md 7.1.4 / requirements.md 第7章）
 *
 * プラン（requirements.md 第7章の通り）:
 *  - 無料           : ¥0            / 300字/回 / 1日1回
 *  - ライト（週）   : ¥500/週        / 2,000字/回 / 週30回
 *  - ヘビー（月）   : ¥2,980/月      / 5,000字/回 / 月150,000字  ← 「人気」
 *  - ヘビー（年）   : ¥24,000/年     / 10,000字/回 / 月150,000字
 *
 * showDetails=true でpricingページ用の詳細機能リストを表示する。
 */
type Plan = {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  summary: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "無料",
    price: "¥0",
    priceSuffix: "",
    summary: "まず試してみたい方に。",
    features: [
      "1回あたり 300字まで",
      "月3回まで利用可",
      "だ・である調 / ですます調",
      "参考文献の保護",
    ],
    cta: "無料ではじめる",
  },
  {
    id: "light",
    name: "ライト（週）",
    price: "¥500",
    priceSuffix: "/ 週",
    summary: "短期レポート用に。",
    features: [
      "1回あたり 2,000字まで",
      "週17,500字まで利用可",
      "本物の週プラン、自動更新",
      "いつでも解約可",
    ],
    cta: "ライトを選ぶ",
  },
  {
    id: "heavy_monthly",
    name: "ヘビー（月）",
    price: "¥2,980",
    priceSuffix: "/ 月",
    summary: "レポートが多い学期に。",
    features: [
      "1回あたり 5,000字まで",
      "月150,000字まで利用可",
      "月額・自動更新",
      "いつでも解約可",
    ],
    cta: "ヘビー月額を選ぶ",
    popular: true,
  },
  {
    id: "heavy_yearly",
    name: "ヘビー（年）",
    price: "¥24,000",
    priceSuffix: "/ 年",
    summary: "月額換算で 33%OFF。",
    features: [
      "1回あたり 10,000字まで",
      "月150,000字まで利用可",
      "実質 ¥2,000 / 月",
      "年額一括払い",
    ],
    cta: "ヘビー年額を選ぶ",
  },
];

type PricingPlansProps = {
  // pricingページで使う場合はtrue。LP埋め込み時もほぼ同じ見た目。
  className?: string;
};

export function PricingPlans({ className }: PricingPlansProps) {
  const router = useRouter();
  // プランごとの読み込み状態（どのボタンがクリックされたか）
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * プランボタンのクリックハンドラ
   * - free: /login へ誘導
   * - 有料プラン: /api/stripe/checkout を叩き、返ってきた URL にリダイレクト
   *   未ログインの場合は /login?redirect=/pricing へ
   */
  async function handleSelect(planId: string) {
    setErrorMessage(null);
    if (planId === "free") {
      router.push("/login");
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      if (res.status === 401) {
        // 未ログインの場合は /login へ誘導
        router.push("/login?redirect=/pricing");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setErrorMessage(
          data.error ?? "決済ページの作成に失敗しました。",
        );
        return;
      }
      // Stripe Checkout にリダイレクト
      window.location.href = data.url;
    } catch {
      setErrorMessage("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-[#EF4444] bg-[#FEF2F2] px-4 py-3 text-center text-sm text-[#991B1B]"
        >
          {errorMessage}
        </div>
      )}
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {plans.map((plan) => (
        <Card
          key={plan.id}
          interactive
          className={cn(
            "flex h-full flex-col gap-6",
            // 人気プランはプライマリ色のボーダーで強調（design.md 6.4）
            plan.popular && "border-2 border-primary",
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                {plan.name}
              </h3>
              {plan.popular && <Badge variant="primary">人気</Badge>}
            </div>
            <p className="text-sm text-text-secondary">{plan.summary}</p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary">
              {plan.price}
            </span>
            {plan.priceSuffix && (
              <span className="text-sm text-text-secondary">
                {plan.priceSuffix}
              </span>
            )}
          </div>

          <ul className="space-y-3 text-sm text-text-secondary">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-4 w-4 flex-none text-primary"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              className="w-full"
              onClick={() => handleSelect(plan.id)}
              disabled={loadingPlan !== null}
              aria-busy={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? "読み込み中…" : plan.cta}
            </Button>
          </div>
        </Card>
      ))}
      </div>
    </>
  );
}
