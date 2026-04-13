"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoginModal } from "@/components/login-modal";
import { LimitModal } from "@/components/limit-modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

// 文体の型定義
type Style = "dearu" | "desumasu";

// APIレスポンスの型
type HumanizeResponse = {
  output: string;
  durationMs: number;
  modificationPoints?: string[];
};

// 表示用の文字数上限（サーバー側でプランごとに実際の制限を適用）
const DISPLAY_MAX_CHARS = 3000;

/**
 * LPヒーローセクション：Sidekickerスタイルのダイレクト変換フロー
 *
 * フロー:
 *   1. ユーザーがテキストを貼り付けて「なおす」を押す
 *   2. 未ログイン → APIを呼ばずログインモーダル表示
 *   3. ログイン済み＋利用枠あり → 変換実行
 *   4. ログイン済み＋利用枠なし → アップグレードモーダル表示
 *   5. ログイン完了後 → 自動的に変換実行（再度ボタンを押させない）
 */
export function HeroConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [style, setStyle] = useState<Style>("dearu");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  // 修正ポイント
  const [modificationPoints, setModificationPoints] = useState<string[]>([]);

  // ログイン状態（null=確認中, true/false=確定）
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // ログイン完了後の自動変換フラグ
  const pendingConvert = useRef(false);

  const charCount = input.length;

  // 初回マウント時＆認証状態変化時にログイン状態を確認
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      setIsLoggedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    // 認証状態の変化を監視（ログイン完了時に即反映）
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      // ログイン完了 & 変換待ちがあれば自動実行
      if (loggedIn && pendingConvert.current) {
        pendingConvert.current = false;
        setSessionExpired(false);
        setTimeout(() => doConvert(), 500);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 変換APIを呼び出す（ログイン済み前提） */
  const doConvert = useCallback(async () => {
    const text = input.trim();
    if (text.length === 0) return;

    setErrorMessage("");
    setOutput("");
    setModificationPoints([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
      });

      // 未ログイン or セッション切れ
      if (res.status === 401) {
        setSessionExpired(true);
        setIsLoggedIn(false);
        pendingConvert.current = true;
        setShowLoginModal(true);
        return;
      }

      // 利用上限超過
      if (res.status === 403) {
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
  }, [input, style]);

  /** 「なおす」ボタン押下 */
  function handleSubmit() {
    if (input.trim().length === 0) {
      setErrorMessage("テキストを入力してください。");
      return;
    }

    // 未ログイン → APIを呼ばずにログインモーダル表示
    if (!isLoggedIn) {
      pendingConvert.current = true;
      setShowLoginModal(true);
      return;
    }

    // ログイン済み → 変換実行
    doConvert();
  }

  /** 出力をクリップボードにコピー */
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
    <>
      <section id="hero" className="bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
          {/* タグライン */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[28px] font-bold leading-[1.3] tracking-tight text-text-primary sm:text-4xl sm:leading-[1.15] md:text-[56px]">
              AIで書いたレポートを、
              <br className="hidden sm:block" />
              ちゃんと人間の言葉に。
            </h1>
            <p className="mt-4 text-lg leading-[1.75] text-text-secondary">
              貼り付けて「なおす」を押すだけ。<br className="sm:hidden" />AIのレポートを自然な文章になおします。
            </p>
          </div>

          {/* 文体セレクタ */}
          <div className="mt-10 flex justify-center">
            <StyleSelector value={style} onChange={setStyle} />
          </div>

          {/* エラーメッセージ */}
          {errorMessage && (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-3xl rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
            >
              {errorMessage}
            </div>
          )}

          {/* 2カラム（モバイルはスタック） */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 左: 入力エリア */}
            <div className="flex flex-col">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ここにAIが書いたレポートを貼り付けてください。"
                className="min-h-[320px] flex-1 md:min-h-[400px]"
                disabled={isLoading}
                aria-label="元の文章の入力"
              />
              <div className="mt-2 text-right text-xs tabular-nums text-text-muted">
                {charCount.toLocaleString()} / {DISPLAY_MAX_CHARS.toLocaleString()} 字
              </div>
            </div>

            {/* 右: 出力エリア */}
            <div className="flex flex-col">
              {isLoading ? (
                <OutputSkeleton />
              ) : (
                <Textarea
                  value={output}
                  readOnly
                  placeholder="ここに変換結果が表示されます。"
                  className="min-h-[320px] flex-1 bg-[#FAFBFD] md:min-h-[400px]"
                  aria-label="なおした文章"
                />
              )}
              <div className="mt-2 flex items-center justify-end gap-3">
                {copied && (
                  <span className="text-xs text-success">コピーしました</span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!output || isLoading}
                >
                  コピー
                </Button>
              </div>
            </div>
          </div>

          {/* 修正ポイント（変換完了後のみ表示） */}
          {modificationPoints.length > 0 && (
            <ModificationPointsSection points={modificationPoints} />
          )}

          {/* なおすボタン */}
          <div className="mt-8 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              className="min-w-[240px] py-4"
              onClick={handleSubmit}
              disabled={isLoading || input.trim().length === 0}
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
        </div>
      </section>

      {/* ログインモーダル */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 利用上限モーダル */}
      <LimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="count"
      />
    </>
  );
}

// --- サブコンポーネント ---

/** 修正ポイント解説セクション */
function ModificationPointsSection({ points }: { points: string[] }) {
  return (
    <div className="mt-6">
      <details open className="rounded-xl border border-border bg-primary-lighter p-6">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary">
          <PenIcon />
          修正ポイント
        </summary>
        <ul className="mt-4 space-y-2">
          {points.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm leading-[1.75] text-text-secondary"
            >
              <span className="mt-1 block h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              {point}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** ペンアイコン */
function PenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/** 文体セレクタ（ピルトグル） */
function StyleSelector({
  value,
  onChange,
}: {
  value: Style;
  onChange: (v: Style) => void;
}) {
  const options: { key: Style; label: string }[] = [
    { key: "dearu", label: "だ・である調" },
    { key: "desumasu", label: "ですます調" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="文体の選択"
      className="inline-flex items-center rounded-full border border-border bg-surface p-1"
    >
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
              selected
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** 出力エリアのスケルトン */
function OutputSkeleton() {
  return (
    <div
      className="flex-1 min-h-[320px] md:min-h-[400px] animate-pulse space-y-3 rounded-lg border border-border bg-[#FAFBFD] p-5"
      aria-label="変換中"
    >
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
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 animate-pulse rounded-full bg-white"
    />
  );
}
