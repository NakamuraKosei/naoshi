"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

// 文体の型定義
type Style = "dearu" | "desumasu";
type Category = "report" | "business";
type LimitType = "count" | "chars";

// API レスポンスの型
type HumanizeResponse = {
  output: string;
  durationMs: number;
  modificationPoints?: string[];
};

// LP → /app へテキストを引き継ぐための sessionStorage キー
const PENDING_TEXT_KEY = "naoshi_pending_text";

// Server Component から渡されるプラン情報
// リセット周期
type ResetCycle = "monthly" | "weekly";

export type AppClientProps = {
  maxChars: number;
  limitType: LimitType;
  periodLimit: number;
  resetCycle: ResetCycle;
  used: number;
  remaining: number;
  planLabel: string;
  // ダブルチェック利用可否（ヘビープラン限定）
  canDoubleCheck: boolean;
  // Stripe Checkout 完了後のサクセスバナー表示用
  checkoutSuccess?: boolean;
};

export function AppClient({
  maxChars,
  limitType,
  periodLimit,
  resetCycle,
  remaining: initialRemaining,
  planLabel,
  canDoubleCheck,
  checkoutSuccess = false,
}: AppClientProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [category, setCategory] = useState<Category>("report");
  const [style, setStyle] = useState<Style>("dearu");
  const [doubleCheck, setDoubleCheck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [modificationPoints, setModificationPoints] = useState<string[]>([]);
  // 変換完了後の確認メッセージ表示フラグ
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  // フィードバック
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  // サクセスバナー表示（マウント5秒後に自動で消す）
  // ※ レンダー本体でsetTimeoutすると再レンダーのたびにタイマーが積まれるためuseEffectで1回だけ
  const [showSuccess, setShowSuccess] = useState(checkoutSuccess);
  useEffect(() => {
    if (!checkoutSuccess) return;
    const id = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(id);
  }, [checkoutSuccess]);

  // 残量をクライアント側でトラッキング（変換成功後に即時反映するため）
  const [currentRemaining, setCurrentRemaining] = useState(initialRemaining);

  // LPから引き継いだテキストがあれば入力欄にセット
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_TEXT_KEY);
    if (pending) {
      setInput(pending);
      sessionStorage.removeItem(PENDING_TEXT_KEY);
    }
  }, []);

  // カテゴリ変更時に文体のデフォルトも切り替える
  function handleCategoryChange(newCategory: Category) {
    setCategory(newCategory);
    setStyle(newCategory === "report" ? "dearu" : "desumasu");
  }

  const charCount = input.length;
  const isOverLimit = charCount > maxChars;
  const isQuotaExhausted = currentRemaining <= 0;

  // 文字数に応じて入出力エリアの文字サイズを段階的に下げる（Google翻訳と同様の発想）
  // 〜500字: 18px / 501〜2,000字: 16px / 2,001字〜: 15px
  // 入力と出力で大きさが揃うよう、長い方の文字数を基準にする
  const editorFontStyle = useMemo((): React.CSSProperties => {
    const length = Math.max(input.length, output.length);
    const size = length > 2000 ? 15 : length > 500 ? 16 : 18;
    const lineHeight = length > 2000 ? 1.7 : length > 500 ? 1.75 : 1.8;
    return {
      fontSize: `${size}px`,
      lineHeight,
      transition: "font-size 0.2s ease",
    };
  }, [input.length, output.length]);

  const isSubmitDisabled = useMemo(
    () => isLoading || input.trim().length === 0 || isOverLimit || isQuotaExhausted,
    [isLoading, input, isOverLimit, isQuotaExhausted],
  );

  // 残量の表示テキスト
  const remainingLabel = useMemo(() => {
    if (limitType === "count") {
      return `残り ${currentRemaining} / ${periodLimit} 回`;
    }
    const periodLabel = resetCycle === "weekly" ? "今週" : "今月";
    return `残り ${currentRemaining.toLocaleString()} / ${periodLimit.toLocaleString()} 字（${periodLabel}）`;
  }, [limitType, currentRemaining, periodLimit, resetCycle]);

  async function handleHumanize() {
    // 超過時はモーダルを出す
    if (isQuotaExhausted) {
      setShowLimitModal(true);
      return;
    }

    // 短すぎる入力は変換せず案内（サーバー側のMIN_INPUT_CHARSと揃える）
    if (input.trim().length < 10) {
      setErrorMessage("もう少し長い文章を入力してください（10文字以上）。");
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
        body: JSON.stringify({
          text: input,
          style,
          category,
          mode: doubleCheck ? "double_check" : "standard",
        }),
      });

      if (res.status === 403) {
        // 利用上限に達した
        setShowLimitModal(true);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // 504/タイムアウト系は文章が長すぎる可能性が高いので、専用の案内を出す
        if (res.status === 504 || res.status === 408) {
          setErrorMessage(
            "変換に時間がかかり、途中で中断されました。文章が長い場合は短く分けてお試しください。",
          );
        } else {
          setErrorMessage(
            data.error ?? "うまく変換できませんでした。もう一度お試しください。",
          );
        }
        return;
      }

      const data = (await res.json()) as HumanizeResponse;
      setOutput(data.output);
      setModificationPoints(data.modificationPoints ?? []);

      // 残量をクライアント側で即時更新
      if (limitType === "count") {
        setCurrentRemaining((prev) => Math.max(0, prev - 1));
      } else {
        // ダブルチェック時は3倍消費
        const inputChars = input.trim().length;
        const charCost = doubleCheck ? inputChars * 3 : inputChars;
        setCurrentRemaining((prev) => Math.max(0, prev - charCost));
      }

      // 完了オーバーレイを表示（ボタン or 背景タップで閉じる）
      setShowCompleteOverlay(true);
    } catch {
      setErrorMessage("うまく変換できませんでした。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  /** フィードバック送信 */
  async function handleFeedbackSubmit() {
    if (feedbackComment.trim().length === 0) return;
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: feedbackComment.trim() }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setFeedbackComment("");
        // 3秒後にフィードバック欄を閉じる
        setTimeout(() => {
          setShowFeedback(false);
          setFeedbackSent(false);
        }, 3000);
      }
    } catch {
      // 送信失敗時は何もしない（控えめな機能なので）
    } finally {
      setFeedbackSending(false);
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

      <main className="mx-auto w-full max-w-6xl px-6 pb-8 pt-6">
        {/* 画面見出し + 操作系（見出し単独 → プラン残量と選択ボタンを同じ行に） */}
        <div className="mb-6 flex flex-col gap-3">
          {/* 見出し（作業画面なので小さめ。宣伝コピーは控えめに） */}
          <h1 className="text-lg font-bold text-text-primary md:text-xl">
            文章をなおす
          </h1>
          {/* プラン残量（左） + カテゴリ・文体・ダブルチェック（右）を同じ行・同じ高さに */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className={cn(
              "inline-flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-full px-3 py-1 text-xs md:self-auto",
              isQuotaExhausted
                ? "bg-[#FEF2F2] text-[#EF4444] font-semibold"
                : "bg-primary-lighter text-text-secondary",
            )}>
              <span className="font-medium">{planLabel}プラン</span>
              <span className="text-text-muted">·</span>
              <span>{remainingLabel}</span>
              <span className="text-text-muted">·</span>
              <span>1回最大 {maxChars.toLocaleString()} 字</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CategorySelector value={category} onChange={handleCategoryChange} />
              <StyleSelector value={style} onChange={setStyle} />
              {canDoubleCheck && (
                <DoubleCheckToggle
                  checked={doubleCheck}
                  onChange={setDoubleCheck}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>
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

        {/* エラー表示（もう一度試すボタン付き） */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-2 rounded-md border border-[#EF4444] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleHumanize}
              disabled={isLoading}
              className="shrink-0 self-start rounded-full border border-[#EF4444] px-4 py-1.5 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50 sm:self-auto"
            >
              もう一度試す
            </button>
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
              style={editorFontStyle}
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
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-primary">なおした文章</h2>
              {output && !isLoading && (
                <span className="text-xs text-text-muted">クリックして編集できます</span>
              )}
            </div>
            {isLoading ? (
              <OutputSkeleton />
            ) : (
              // 変換結果はクライアント側でそのまま編集可能（API再呼び出し・課金には影響しない）。
              // output state を直接更新するため、コピー・文字数カウンターも編集に追従する。
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="ここに変換結果が表示されます。"
                className="flex-1 min-h-[420px]"
                style={editorFontStyle}
                aria-label="なおした文章（編集できます）"
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

        {/* フィードバック（変換完了後のみ表示） */}
        {output && !isLoading && (
          <div className="mt-4 text-right">
            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="text-xs text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
              >
                フィードバックを送る
              </button>
            ) : feedbackSent ? (
              <p className="text-xs text-[#10B981]">ありがとうございます！</p>
            ) : (
              <div className="ml-auto flex max-w-md items-end gap-2">
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="変換の感想やご要望をお聞かせください"
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                  rows={2}
                  maxLength={1000}
                  disabled={feedbackSending}
                />
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackSending || feedbackComment.trim().length === 0}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  送信
                </button>
              </div>
            )}
          </div>
        )}

        {/* なおすボタン（デスクトップ・sticky追従で常に画面内に表示） */}
        <div className="sticky bottom-6 z-30 mt-8 hidden justify-center md:flex">
          <Button
            variant="primary"
            size="lg"
            className="min-w-[240px] py-4 shadow-lg"
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

        {/* モバイル固定ボタンのスペーサー */}
        <div className="h-20 md:hidden" />
      </main>

      {/* なおすボタン（モバイル固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface px-6 py-3 md:hidden">
        <Button
          variant="primary"
          size="lg"
          className="w-full py-3"
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

      {/* なおし中オーバーレイ */}
      {isLoading && <ConvertingOverlay doubleCheck={doubleCheck} />}

      {/* 完了オーバーレイ */}
      {showCompleteOverlay && (
        <CompleteOverlay onClose={() => setShowCompleteOverlay(false)} />
      )}

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] rounded-xl bg-surface p-6 shadow-lg sm:p-10"
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

/** カテゴリセレクタ（レポート / ビジネス） */
function CategorySelector({ value, onChange }: { value: Category; onChange: (v: Category) => void }) {
  const options: { key: Category; label: string }[] = [
    { key: "report", label: "レポート" },
    { key: "business", label: "ビジネス" },
  ];
  return (
    <div role="radiogroup" aria-label="カテゴリの選択" className="inline-flex items-center rounded-full border border-border bg-surface p-1">
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
              selected ? "bg-surface-dark text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** 文体セレクタ */
function StyleSelector({ value, onChange }: { value: Style; onChange: (v: Style) => void }) {
  const options: { key: Style; label: string }[] = [
    { key: "dearu", label: "だ・である調" },
    { key: "desumasu", label: "です・ます調" },
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

/** ダブルチェックトグル（ヘビープラン限定） */
function DoubleCheckToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        checked
          ? "border-primary bg-primary-light text-primary"
          : "border-border bg-surface text-text-secondary hover:border-primary/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={cn(
          "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-primary" : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span>ダブルチェック</span>
      <span className="text-xs text-text-muted">×3</span>
    </label>
  );
}

/** なおし中オーバーレイ */
function ConvertingOverlay({ doubleCheck }: { doubleCheck: boolean }) {
  // ダブルチェックは上位AI(Opus)で処理するため通常より時間がかかる。
  // モードに応じて待ち時間の説明文を出し分ける。文の区切りで改行して読みやすくする。
  const description = doubleCheck ? (
    <>
      上位AIで書き換えています。
      <br />
      2分ほどかかります。
    </>
  ) : (
    <>
      文章を変換しています。
      <br />
      完了まで30秒ほどです。
    </>
  );

  // 進捗バー（おおよその目安）。
  // LLMは正確な進捗を取得できないため、上限92%へ漸近的に伸ばす擬似進捗。
  // 完了時はオーバーレイ自体が消える。ダブルチェックは時間が長いので伸びを緩やかに。
  const [progress, setProgress] = useState(8);
  useEffect(() => {
    const factor = doubleCheck ? 0.02 : 0.06;
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + (92 - p) * factor));
    }, 500);
    return () => clearInterval(id);
  }, [doubleCheck]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.4)] px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[340px] flex-col items-center gap-5 rounded-2xl bg-surface px-8 py-10 shadow-lg sm:px-12">
        {/* 回転アニメーション */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
        <p className="text-lg font-bold text-text-primary">なおし中…</p>
        <p className="max-w-[280px] text-center text-sm leading-relaxed text-text-muted">
          {description}
        </p>
        {/* 進捗バー（おおよそ） */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** 完了オーバーレイ（内容確認を促す） */
function CompleteOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.4)] px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-8 py-10 shadow-lg sm:px-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* チェックマーク */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-lg font-bold text-text-primary">変換が完了しました</p>
        <p className="max-w-[280px] text-center text-sm leading-relaxed text-text-secondary">
          内容に誤りがないか、必ず確認してから<br />ご利用ください。
        </p>
        <button
          onClick={onClose}
          className="mt-2 rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          確認する
        </button>
      </div>
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
