"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/**
 * /login page (Magic Link only)
 */
export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
      setSubmitted(true);
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

        {submitted ? (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-text-primary">メールを確認してください</h2>
            <p className="mt-3 text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span> にログイン用のリンクを送りました。
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                {loading ? "送信中…" : "マジックリンクを送る"}
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
