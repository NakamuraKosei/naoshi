"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// コード再送のクールダウン秒数（連打によるメール浪費を防ぐ）
const RESEND_COOLDOWN_SEC = 30;

/** ボタン内に表示する回転スピナー（処理中の視覚フィードバック） */
function Spinner() {
  return (
    <svg
      className="mx-auto h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="処理中"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ログインモーダル（6桁コード認証）
 * 未ログインユーザーが変換を試行した際に表示される遅延認証UI。
 * - 背景ブラー＋登場アニメーションで質感を上げる
 * - 6桁コードは1マスずつのボックス表示（非表示inputで自動入力にも対応）
 * - コード再送（30秒クールダウン付き）
 */
export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  // コード入力欄のフォーカス状態（アクティブなマスの強調に使う）
  const [codeFocused, setCodeFocused] = useState(false);
  // 再送クールダウンの残り秒数
  const [resendCooldown, setResendCooldown] = useState(0);
  // 再送の完了メッセージ
  const [resendDone, setResendDone] = useState(false);
  // ログイン成功の演出中フラグ（チェックマークを見せてから閉じる）
  const [isSuccess, setIsSuccess] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  // フォーカストラップ（Tabキー循環 + Escapeで閉じる）
  const trapRef = useFocusTrap(isOpen, handleClose);

  // クールダウンのカウントダウン
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // コード送信の共通処理（初回・再送で使う）
  async function sendCode(): Promise<boolean> {
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErrorMessage(data.error ?? "送信に失敗しました。");
      return false;
    }
    return true;
  }

  // 1段階目: コードをメール送信
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);
    try {
      if (await sendCode()) {
        setIsSent(true);
        setResendCooldown(RESEND_COOLDOWN_SEC);
      }
    } catch {
      setErrorMessage("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  // コードの再送（クールダウン付き）
  async function handleResend() {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMessage("");
    setResendDone(false);
    try {
      if (await sendCode()) {
        setResendCooldown(RESEND_COOLDOWN_SEC);
        setResendDone(true);
      }
    } catch {
      setErrorMessage("再送に失敗しました。もう一度お試しください。");
    }
  }

  // 2段階目: コードを検証してログイン（成功すると親がonAuthStateChangeで検知して遷移）
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) {
        setErrorMessage("コードが正しくないか、有効期限が切れています。");
        return;
      }
      // 成功: チェックマークの演出を見せてから閉じる
      // （HeroConverter側のonAuthStateChangeが変換へ進める）
      setIsSuccess(true);
      setTimeout(() => handleClose(), 900);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setEmail("");
    setCode("");
    setIsSent(false);
    setErrorMessage("");
    setResendCooldown(0);
    setResendDone(false);
    setIsSuccess(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] backdrop-blur-sm [animation:overlay-in_0.15s_ease-out]"
      onClick={handleClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="ログイン"
        className="relative mx-4 w-full max-w-[460px] rounded-2xl bg-surface p-8 shadow-xl [animation:modal-in_0.2s_ease-out] sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-primary"
          aria-label="閉じる"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        {/* ロゴ */}
        <p className="text-2xl font-bold text-primary [font-family:var(--font-inter)]">Naoshi</p>

        {isSuccess ? (
          /* ログイン成功: チェックマークの演出（900ms後に自動で閉じる） */
          <div className="flex flex-col items-center py-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981] text-white [animation:check-pop_0.35s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="mt-4 text-base font-semibold text-text-primary">ログインしました</p>
          </div>
        ) : isSent ? (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              確認コードを入力
            </h2>
            <p className="mt-3 text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span>{" "}
              に届いた6桁のコードを入力してください。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}
            {resendDone && !errorMessage && (
              <div role="status" className="mt-4 rounded-md border border-[#10B981]/40 bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
                コードを再送しました。メールをご確認ください。
              </div>
            )}

            <form onSubmit={handleVerify} className="mt-6 space-y-5">
              {/* 6桁コード: 1マスずつのボックス表示。
                  実体は透明なinput（自動入力・ペースト・IME非依存の数字入力に対応） */}
              <div className="relative" onClick={() => codeInputRef.current?.focus()}>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                  disabled={isLoading}
                  aria-label="確認コード"
                  data-autofocus
                  autoFocus
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex justify-center gap-2" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold text-text-primary transition-colors sm:h-14 sm:w-11",
                        code[i]
                          ? "border-primary/50 bg-primary-lighter"
                          : "border-border bg-surface",
                        codeFocused && i === Math.min(code.length, 5) &&
                          "border-primary ring-2 ring-primary/20",
                      )}
                    >
                      {code[i] ?? ""}
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading || code.length < 6}>
                {isLoading ? <Spinner /> : "ログイン"}
              </Button>
            </form>

            {/* 再送＋入力し直し */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className="text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendCooldown > 0
                  ? `コードを再送する（${resendCooldown}秒）`
                  : "コードを再送する"}
              </button>
              <span aria-hidden className="text-border">|</span>
              <button
                type="button"
                onClick={() => { setIsSent(false); setCode(""); setErrorMessage(""); setResendDone(false); }}
                className="text-text-muted transition-colors hover:text-primary"
              >
                メールアドレスを入力し直す
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              無料で登録して使ってみる
            </h2>
            <p className="mt-2 text-sm leading-[1.75] text-text-secondary">
              メールアドレスで登録すると、<br className="hidden sm:block" />月3回まで無料で利用できます。
            </p>
            {/* 書いた文章が消えない安心を先に伝える（離脱防止） */}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#166534]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              入力した文章はそのまま保持されます
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                aria-label="メールアドレス"
                data-autofocus
              />
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs leading-[1.6] text-text-muted">
                  <Link href="/terms" className="underline hover:text-primary" target="_blank">利用規約</Link>
                  と
                  <Link href="/privacy" className="underline hover:text-primary" target="_blank">プライバシーポリシー</Link>
                  に同意する
                </span>
              </label>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading || !agreed}>
                {isLoading ? <Spinner /> : "確認コードを送る"}
              </Button>
            </form>

            {/* 登録の心理的ハードルを下げる一言 */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-text-muted">
              <span>登録は10秒</span>
              <span aria-hidden className="text-border">·</span>
              <span>パスワード不要</span>
              <span aria-hidden className="text-border">·</span>
              <span>月3回まで無料</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
