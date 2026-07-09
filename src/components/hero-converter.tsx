"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoginModal } from "@/components/login-modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

// 文体の型定義
type Style = "dearu" | "desumasu";

// カテゴリの型定義（レポート / ビジネス）
type Category = "report" | "business";

// 表示用の文字数上限（サーバー側でプランごとに実際の制限を適用）
const DISPLAY_MAX_CHARS = 5000;

// LP → /app へテキストを引き継ぐための sessionStorage キー
const PENDING_TEXT_KEY = "naoshi_pending_text";

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
  const router = useRouter();
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<Style>("dearu");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ログイン状態（null=確認中, true/false=確定）
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // ログイン完了後の /app リダイレクト待ちフラグ
  const pendingRedirect = useRef(false);

  const charCount = input.length;

  /** テキストを sessionStorage に保存して /app へ遷移 */
  function redirectToApp() {
    const text = input.trim();
    if (text.length > 0) {
      sessionStorage.setItem(PENDING_TEXT_KEY, text);
    }
    router.push("/app");
  }

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

      // ログイン完了 & リダイレクト待ちがあれば /app へ遷移
      if (loggedIn && pendingRedirect.current) {
        pendingRedirect.current = false;
        setTimeout(() => redirectToApp(), 500);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 「なおす」ボタン押下 — LPでは変換せず /app へリダイレクト */
  function handleSubmit() {
    if (input.trim().length === 0) {
      setErrorMessage("テキストを入力してください。");
      return;
    }

    // 未ログイン → ログインモーダル表示 → ログイン後に /app へ
    if (!isLoggedIn) {
      pendingRedirect.current = true;
      setShowLoginModal(true);
      return;
    }

    // ログイン済み → テキスト付きで /app へリダイレクト
    redirectToApp();
  }

  return (
    <>
      <section id="hero" className="bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
          {/* タグライン */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[28px] font-bold leading-[1.3] tracking-tight text-text-primary sm:text-4xl sm:leading-[1.15] md:text-[56px]">
              AIで書いたレポートを、
              <br />
              自然な日本語に。
            </h1>
            <p className="mt-4 text-lg leading-[1.75] text-text-secondary">
              日本語特化AIヒューマナイザー。<br className="sm:hidden" />レポートを貼り付けて「なおす」を押すだけ。
            </p>
            {/* 主要な価値をチップで示す（折り返しても自然に見える形） */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {["参考文献はそのまま", "編集してそのまま提出", "コピペチェッカー対策"].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#F4F6FA] px-3.5 py-1.5 text-xs font-medium text-text-secondary md:text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* 文体セレクタ */}
          <div className="mt-10 flex flex-col items-center gap-3">
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

          {/* 入力エリア（1カラム） */}
          <div className="mx-auto mt-8 max-w-3xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ここにAIが書いたレポートを貼り付けてください。"
              className="min-h-[240px] md:min-h-[300px]"
              aria-label="元の文章の入力"
            />
            <div className="mt-2 text-right text-xs tabular-nums text-text-muted">
              {charCount.toLocaleString()} / {DISPLAY_MAX_CHARS.toLocaleString()} 字
            </div>
          </div>

          {/* なおすボタン */}
          <div className="mt-8 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              className="min-w-[240px] py-4"
              onClick={handleSubmit}
              disabled={input.trim().length === 0}
            >
              なおす
            </Button>
          </div>
        </div>
      </section>

      {/* ログインモーダル */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

// --- サブコンポーネント ---

/** カテゴリセレクタ（レポート / ビジネス） — LP未使用だが将来用に残す */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CategorySelector({
  value,
  onChange,
}: {
  value: Category;
  onChange: (v: Category) => void;
}) {
  const options: { key: Category; label: string }[] = [
    { key: "report", label: "レポート" },
    { key: "business", label: "ビジネス" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="カテゴリの選択"
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
                ? "bg-surface-dark text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
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
    { key: "desumasu", label: "です・ます調" },
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

