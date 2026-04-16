import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getPlanRule } from "@/lib/usage/plans";

// 認証ガードは (app) グループの layout.tsx で実施済み
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "利用履歴",
  description: "Naoshi の直近の利用履歴（最新10件）を確認できます。",
};

// usage テーブル1行の型
type UsageRow = {
  id: string;
  used_at: string;
  input_chars: number;
  output_chars: number;
  style: "dearu" | "desumasu";
  mode: "standard" | "evasion" | null;
  duration_ms: number;
};

/**
 * 利用履歴ページ（requirements.md 第3.5）
 * - 最新10件の使用履歴を usage テーブルから取得
 * - 本文は保存しないため、メタ情報（文字数・文体・所要時間）のみ表示
 * - プライバシー重視: 入力テキストの閲覧・復元は行わない
 */
export default async function HistoryPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数未設定時（初期状態）は空リスト表示
  if (!supabaseUrl || !supabaseAnonKey) {
    return <HistoryShell rows={[]} plan="free" />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 通常は (app) レイアウトでリダイレクトされるが、念のため
    return <HistoryShell rows={[]} plan="free" />;
  }

  // プロフィールからプラン取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  // 最新10件を取得
  const { data: rows } = await supabase
    .from("usage")
    .select("id, used_at, input_chars, output_chars, style, mode, duration_ms")
    .eq("user_id", user.id)
    .order("used_at", { ascending: false })
    .limit(10);

  return (
    <HistoryShell
      rows={(rows ?? []) as UsageRow[]}
      plan={profile?.plan ?? "free"}
    />
  );
}

// 表示用シェル。プラン情報と履歴行を受け取るだけのプレゼンテーション層
function HistoryShell({ rows, plan }: { rows: UsageRow[]; plan: string }) {
  const rule = getPlanRule(plan);

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary md:text-4xl">
            利用履歴
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            直近10件の変換履歴です（{rule.label}プラン）。
            プライバシー保護のため、入力本文は保存していません。
          </p>
        </header>

        {rows.length === 0 ? (
          <Card className="text-center">
            <p className="text-base text-text-secondary">
              まだ利用履歴がありません。
            </p>
            <div className="mt-6">
              <Link href="/app">
                <Button variant="primary">さっそく試してみる</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <HistoryRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

// 1行分のカード表示
function HistoryRow({ row }: { row: UsageRow }) {
  const styleLabel = row.style === "dearu" ? "だ・である調" : "ですます調";
  // モード表示（現在は回避モード一本化のため固定）
  const usedAt = new Date(row.used_at);
  // JST で整形（YYYY/MM/DD HH:mm）
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(usedAt);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-text-primary">{formatted}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
            {styleLabel}
          </span>
        </div>
        <p className="text-xs text-text-muted tabular-nums">
          入力 {row.input_chars.toLocaleString()} 字 → 出力{" "}
          {row.output_chars.toLocaleString()} 字 ・ {(row.duration_ms / 1000).toFixed(1)} 秒
        </p>
      </div>
    </div>
  );
}
