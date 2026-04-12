"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

// 文体の型定義
type Style = "dearu" | "desumasu";
type LimitType = "count" | "chars";

// API レスポンスの型
type HumanizeResponse = {
  output: string;
  durationMs: number;
  modificationPoints?: string[];
};

// Server Component から渡されるプラン情報
export type AppClientProps = {
  maxChars: number;
  limitType: LimitType;
  monthlyLimit: number;
  used: number;
  remaining: number;
  planLabel: string;
  // Stripe Checkout 完了後のサクセスバナー表示用
  checkoutSuccess?: boolean;
};

export function AppClient({
  maxChars,
  limitType,
  monthlyLimit,
  used,
  remaining,
  planLabel,
  checkoutSuccess = false,
}: AppClientProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [style, setStyle] = useState<Style>("dearu");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [modificationPoints, setModificationPoints] = useState<string[]>([]);
  // サクセスバナー表示（自動消去）
  const [showSuccess, setShowSuccess] = useState(checkoutSuccess);
  if (checkoutSuccess && showSuccess) {
    // 5秒後に自動で消す
    setTimeout(() => setShowSuccess(false), 5000);
  }

  const charCount = input.length;
  const isOverLimit = charCount > maxChars;
  const isQuotaExhausted = remaining <= 0;

  const isSubmitDisabled = useMemo(
    () => isLoading || input.trim().length === 0 || isOverLimit || isQuotaExhausted,
    [isLoading, input, isOverLimit, isQuotaExhausted],
  );

  // 残量の表示テキスト
  const remainingLabel = useMemo(() => {
    if (limitType === "count") {
      return `残り ${remaining} / ${monthlyLimit} 回`;
    }
    return `残り ${remaining.toLocaleString()} / ${monthlyLimit.toLocaleString()} 字（今月）`;
  }, [limitType, remaining, monthlyLimit]);

  async function handleHumanize() {
    // 超過時はモーダルを出す
    if (isQuotaExhausted) {
      setShowLimitModal(true);
      return;
    }

    setErrorMessage("");
    setOutput("");
    setModificationPoints([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, style }),
      });

      if (res.status === 403) {
        // 利用上限に達した
        setShowLimitModal(true);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(
          data.error ?? "うまく変換できませんでした。もう一度お試しください。",
        );
        return;
      }

      const data = (await res.json()) as HumanizeResponse;
      setOutput(data.output);
      setModificationPoints(data.modificationPoints ?? []);
    } catch {
      setErrorMessage("うまく変換できませんでした。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage("コピーに失敗しました。");
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* 画面見出し + 文体セレクタ */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
              レポートを、ちゃんと人間の言葉に。
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              左に貼り付けて「なおす」を押すだけ。
            </p>
            {/* プラン情報 + 残量表示 */}
            <p className={cn(
              "mt-2 text-xs",
              isQuotaExhausted ? "text-[#EF4444] font-semibold" : "text-text-muted",
            )}>
              {planLabel}プラン ・ {remainingLabel} ・
              1回あたり最大 {maxChars.toLocaleString()} 字
            </p>
          </div>
          <StyleSelector value={style} onChange={setStyle} />
        </div>

        {/* プランアップグレード完了バナー */}
        {showSuccess && (
          <div className="mb-4 rounded-md border border-[#10B981] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
            プランのアップグレードが完了しました。さっそくレポートを整えましょう。
          </div>
        )}

        {/* 上限到達バナー */}
        {isQuotaExhausted && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-md border border-[#EF4444] bg-[#FEF2F2] px-4 py-3"
          >
            <p className="text-sm text-[#991B1B]">
              今月の利用上限に達しました。プランをアップグレードすると引き続きご利用いただけます。
            </p>
            <Link href="/pricing">
              <Button variant="primary" size="sm">
                プランを変更する
              </Button>
            </Link>
          </div>
        )}

        {/* エラー表示 */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-[#EF4444] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
          >
            {errorMessage}
          </div>
        )}

        {/* 2カラム */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 左: 入力カード */}
          <section
            aria-label="入力エリア"
            className="flex min-h-[560px] flex-col rounded-lg border border-border bg-surface p-6 shadow-sm"
          >
            <div className="mb-3">
              <h2 className="text-base font-semibold text-text-primary">元の文章</h2>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ここにAIが書いたレポートを貼り付けてください。"
              className="flex-1 min-h-[420px]"
              disabled={isLoading}
              aria-label="元の文章の入力"
            />
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={cn("tabular-nums", isOverLimit ? "text-[#EF4444]" : "text-text-muted")}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} 字
              </span>
              {isOverLimit && (
                <span className="text-[#EF4444]">文字数が上限を超えています。</span>
              )}
            </div>
          </section>

          {/* 右: 出力カード */}
          <section
            aria-label="出力エリア"
            className="flex min-h-[560px] flex-col rounded-lg border border-border bg-surface p-6 shadow-sm"
          >
            <div className="mb-3">
              <h2 className="text-base font-semibold text-text-primary">なおした文章</h2>
            </div>
            {isLoading ? (
              <OutputSkeleton />
            ) : (
              <Textarea
                value={output}
                readOnly
                placeholder="ここに変換結果が表示されます。"
                className="flex-1 min-h-[420px] bg-[#FAFBFD]"
                aria-label="なおした文章"
              />
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-muted tabular-nums">
                {output.length.toLocaleString()} 字
              </span>
              <div className="flex items-center gap-3">
                {copied && <span className="text-xs text-[#10B981]">コピーしました</span>}
                <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!output || isLoading}>
                  コピー
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* 修正ポイント（変換完了後のみ表示） */}
        {modificationPoints.length > 0 && (
          <div className="mt-6">
            <details open className="rounded-xl border border-border bg-primary-lighter p-6">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
                修正ポイント
              </summary>
              <ul className="mt-4 space-y-2">
                {modificationPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-[1.75] text-text-secondary">
                    <span className="mt-1 block h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* なおすボタン */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            className="min-w-[240px] py-4"
            onClick={handleHumanize}
            disabled={isSubmitDisabled}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingDot />
                変換中…
              </span>
            ) : (
              "なおす"
            )}
          </Button>
        </div>
      </main>

      {/* 超過モーダル */}
      {showLimitModal && (
        <LimitExceededModal
          limitType={limitType}
          onClose={() => setShowLimitModal(false)}
        />
      )}
    </div>
  );
}

// --- サブコンポーネント ---

/** 超過時のアップグレード誘導モーダル（requirements.md 7.2） */
function LimitExceededModal({
  limitType,
  onClose,
}: {
  limitType: LimitType;
  onClose: () => void;
}) {
  const message =
    limitType === "count"
      ? "今月の利用回数に達しました。"
      : "今月の利用文字数に達しました。";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] rounded-xl bg-surface p-10 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-text-primary">
          今月の利用上限に達しました
        </h2>
        <p className="mt-4 text-base leading-[1.75] text-text-secondary">
          {message}プランをアップグレードすると引き続きご利用いただけます。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/pricing" className="flex-1">
            <Button variant="primary" className="w-full">
              プランを変更する
            </Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 文体セレクタ */
function StyleSelector({ value, onChange }: { value: Style; onChange: (v: Style) => void }) {
  const options: { key: Style; label: string }[] = [
    { key: "dearu", label: "だ・である調" },
    { key: "desumasu", label: "ですます調" },
  ];
  return (
    <div role="radiogroup" aria-label="文体の選択" className="inline-flex items-center rounded-full border border-border bg-surface p-1">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selected ? "bg-primary text-white" : "text-text-secondary hover:text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** スケルトン */
function OutputSkeleton() {
  return (
    <div className="flex-1 min-h-[420px] animate-pulse space-y-3 rounded-lg border border-border bg-[#FAFBFD] p-5" aria-label="変換中">
      <div className="h-4 w-11/12 rounded bg-border/80" />
      <div className="h-4 w-10/12 rounded bg-border/80" />
      <div className="h-4 w-9/12 rounded bg-border/80" />
      <div className="h-4 w-11/12 rounded bg-border/80" />
      <div className="h-4 w-8/12 rounded bg-border/80" />
      <div className="h-4 w-10/12 rounded bg-border/80" />
    </div>
  );
}

/** ローディングドット */
function LoadingDot() {
  return <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />;
}
