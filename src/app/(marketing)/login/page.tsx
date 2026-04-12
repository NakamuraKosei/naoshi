"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/**
 * /login page
 * Google OAuth + Magic Link
 * logged-in users are redirected to /app
 */
export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // logged in -> /app
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) { setChecking(false); return; }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/app");
      else setChecking(false);
    });
  }, [router]);

  // Google OAuth
  async function handleGoogleLogin() {
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMessage("Googleログインに失敗しました。もう一度お試しください。");
    }
  }

  // Magic Link
  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
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
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Logo size="md" asLink={false} />
        </div>

        {submitted ? (
          /* Magic Link sent */
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-text-primary">メールを確認してください</h2>
            <p className="mt-3 text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span> にログイン用のリンクを送りました。
            </p>
            <Link href="/" className="mt-6 inline-block text-sm text-text-muted transition-colors hover:text-primary">
              ← トップに戻る
            </Link>
          </div>
        ) : showEmailForm ? (
          /* Magic Link form */
          <div className="mt-8">
            <h2 className="text-center text-lg font-bold text-text-primary">メールアドレスでログイン</h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              パスワードは不要です。ログイン用のリンクをメールで送ります。
            </p>

            {errorMessage && (
              <p className="mt-4 text-center text-sm text-error">{errorMessage}</p>
            )}

            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "送信中…" : "マジックリンクを送る"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setShowEmailForm(false); setErrorMessage(null); }}
              className="mt-4 block w-full text-center text-sm text-text-muted transition-colors hover:text-primary"
            >
              ← 他の方法でログイン
            </button>
          </div>
        ) : (
          /* Main: Google + Magic Link selection */
          <div className="mt-8">
            <p className="text-center text-sm leading-[1.75] text-text-secondary">
              登録・ログインして、レポートを整えましょう。
            </p>

            {errorMessage && (
              <p className="mt-4 text-center text-sm text-error">{errorMessage}</p>
            )}

            <div className="mt-6 space-y-3">
              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-[#F8FAFC]"
              >
                <GoogleIcon />
                Googleで続ける
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-muted">または</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Magic Link */}
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-[#F8FAFC]"
              >
                <MailIcon />
                メールアドレスでログイン
              </button>
            </div>
          </div>
        )}

        {/* Terms */}
        {!submitted && (
          <p className="mt-8 text-center text-xs leading-[1.6] text-text-muted">
            続行することで、
            <Link href="/terms" className="text-primary hover:underline">利用規約</Link>
            および
            <Link href="/privacy" className="text-primary hover:underline">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
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

// --- Icons ---
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
