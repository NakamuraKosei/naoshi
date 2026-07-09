"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

// コード再送のクールダウン秒数
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
 * /login page（確認コード方式）
 * 1. メール入力 → コードをメール送信
 * 2. メールに届いた6桁コードを入力 → verifyOtp でログイン
 *   ※ マジックリンクのPKCE鍵不一致・メールスキャナ消費を避けるためコード方式に変更
 *   ※ 見た目・機能はログインモーダル（login-modal.tsx）と揃える
 */
export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendDone, setResendDone] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // ログイン済み -> /app
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) { setChecking(false); return; }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/app");
      else setChecking(false);
    });
  }, [router]);

  // 再送クールダウンのカウントダウン
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // コード送信の共通処理（初回・再送で使う）
  async function sendCode(): Promise<boolean> {
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setErrorMessage(data.error ?? "送信に失敗しました。");
      return false;
    }
    return true;
  }

  // 1段階目: メールアドレスにコードを送信
  async function handleSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      if (await sendCode()) {
        setStep("code");
        setResendCooldown(RESEND_COOLDOWN_SEC);
      }
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  // コードの再送（クールダウン付き）
  async function handleResend() {
    if (resendCooldown > 0 || loading) return;
    setErrorMessage(null);
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

  // 2段階目: コードを検証してログイン
  async function handleVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) {
        setErrorMessage("コードが正しくないか、有効期限が切れています。もう一度お試しください。");
        return;
      }
      // 成功: チェックマークの演出を見せてから /app へ
      setIsSuccess(true);
      setTimeout(() => router.replace("/app"), 900);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary-lighter">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-primary-lighter px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl sm:p-10">
        <div className="flex flex-col items-center gap-2">
          <Logo size="md" asLink={false} />
        </div>

        {isSuccess ? (
          /* ログイン成功: チェックマークの演出（900ms後に /app へ遷移） */
          <div className="flex flex-col items-center py-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981] text-white [animation:check-pop_0.35s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="mt-4 text-base font-semibold text-text-primary">ログインしました</p>
          </div>
        ) : step === "code" ? (
          <div className="mt-8">
            <h2 className="text-center text-xl font-bold text-text-primary">確認コードを入力</h2>
            <p className="mt-3 text-center text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span> に届いた6桁のコードを入力してください。
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

            <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
              {/* 6桁コード: 1マスずつのボックス表示（実体は透明input） */}
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
                  disabled={loading}
                  aria-label="確認コード"
                  autoFocus
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex justify-center gap-2" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold text-text-primary transition-colors sm:h-14 sm:w-11",
                        code[i] ? "border-primary/50 bg-primary-lighter" : "border-border bg-surface",
                        codeFocused && i === Math.min(code.length, 5) && "border-primary ring-2 ring-primary/20",
                      )}
                    >
                      {code[i] ?? ""}
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length < 6}>
                {loading ? <Spinner /> : "ログイン"}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-4 text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendCooldown > 0 ? `コードを再送する（${resendCooldown}秒）` : "コードを再送する"}
              </button>
              <span aria-hidden className="text-border">|</span>
              <button
                type="button"
                onClick={() => { setStep("email"); setCode(""); setErrorMessage(null); setResendDone(false); }}
                className="text-text-muted transition-colors hover:text-primary"
              >
                メールアドレスを入力し直す
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-text-muted">
              コードの有効期限は1時間です。届かない場合は迷惑メールフォルダもご確認ください。
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-center text-sm leading-[1.75] text-text-secondary">
              メールアドレスで登録・ログインできます。<br className="hidden sm:block" />パスワードは不要です。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSendCode} className="mt-6 space-y-4">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-label="メールアドレス"
                data-autofocus
                autoFocus
              />
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs leading-[1.6] text-text-muted">
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">利用規約</Link>
                  および
                  <Link href="/privacy" className="text-primary hover:underline" target="_blank">プライバシーポリシー</Link>
                  に同意する
                </span>
              </label>
              <Button type="submit" variant="primary" className="w-full" disabled={loading || !agreed}>
                {loading ? <Spinner /> : "確認コードを送る"}
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

        {!isSuccess && (
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-text-secondary transition-colors hover:text-primary">
              ← トップに戻る
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
