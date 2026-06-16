"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/**
 * /login page（確認コード方式）
 * 1. メール入力 → コードをメール送信
 * 2. メールに届いた6桁コードを入力 → verifyOtp でログイン
 *   ※ マジックリンクのPKCE鍵不一致・メールスキャナ消費を避けるためコード方式に変更
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

  // 1段階目: メールアドレスにコードを送信
  async function handleSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました。");
        return;
      }
      setStep("code");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
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
      router.replace("/app");
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
      <div className="w-full max-w-md rounded-xl bg-surface p-10 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Logo size="md" asLink={false} />
        </div>

        {step === "code" ? (
          <div className="mt-8">
            <h2 className="text-center text-xl font-bold text-text-primary">確認コードを入力</h2>
            <p className="mt-3 text-center text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span> に届いた6桁のコードを入力してください。
            </p>

            {errorMessage && (
              <p className="mt-4 text-center text-sm text-error">{errorMessage}</p>
            )}

            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
              <Input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                disabled={loading}
                autoFocus
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length < 6}>
                {loading ? "確認中…" : "ログイン"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setErrorMessage(null); }}
              className="mt-4 w-full text-center text-xs text-text-muted transition-colors hover:text-primary"
            >
              メールアドレスを入力し直す
            </button>
            <p className="mt-3 text-center text-xs text-text-muted">
              コードの有効期限は1時間です。届かない場合は迷惑メールフォルダもご確認ください。
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-center text-sm leading-[1.75] text-text-secondary">
              メールアドレスで登録・ログインできます。パスワードは不要です。
            </p>

            {errorMessage && (
              <p className="mt-4 text-center text-sm text-error">{errorMessage}</p>
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
              />
              <label className="flex items-start gap-2 cursor-pointer">
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
                {loading ? "送信中…" : "確認コードを送る"}
              </Button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-text-secondary transition-colors hover:text-primary">
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
