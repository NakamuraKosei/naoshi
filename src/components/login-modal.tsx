"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * ログインモーダル（Google OAuth + Magic Link）
 * 未ログインユーザーが変換を試行した際に表示される遅延認証UI
 */
export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (!isOpen) return null;

  // Google OAuth
  async function handleGoogleLogin() {
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
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(data.error ?? "送信に失敗しました。");
        return;
      }
      setIsSent(true);
    } catch {
      setErrorMessage("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setEmail("");
    setIsSent(false);
    setErrorMessage("");
    setShowEmailForm(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[460px] rounded-xl bg-surface p-10 shadow-lg mx-4"
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

        {isSent ? (
          /* Magic Link 送信完了 */
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              メールを確認してください
            </h2>
            <p className="mt-3 text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span>{" "}
              にログイン用のリンクを送りました。
              リンクをクリックすると自動的に変換が始まります。
            </p>
            <p className="mt-3 text-xs text-text-muted">
              入力したテキストはそのまま保持されています。
            </p>
            <Button variant="secondary" className="mt-6 w-full" onClick={handleClose}>
              閉じる
            </Button>
          </div>
        ) : showEmailForm ? (
          /* Magic Link 入力フォーム */
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              メールアドレスでログイン
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              ログイン用のリンクをメールで送ります。パスワードは不要です。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                aria-label="メールアドレス"
              />
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? "送信中…" : "マジックリンクを送る"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setShowEmailForm(false); setErrorMessage(""); }}
              className="mt-4 block w-full text-center text-sm text-text-muted transition-colors hover:text-primary"
            >
              ← 他の方法でログイン
            </button>
          </div>
        ) : (
          /* メイン: Google OAuth + Magic Link 選択 */
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              無料で登録して使ってみる
            </h2>
            <p className="mt-2 text-sm leading-[1.75] text-text-secondary">
              月3回まで無料で変換できます。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
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

            <p className="mt-6 text-center text-xs text-text-muted">
              続行することで、
              <Link href="/terms" className="underline hover:text-primary">利用規約</Link>
              と
              <Link href="/privacy" className="underline hover:text-primary">プライバシーポリシー</Link>
              に同意したものとします。
            </p>
          </div>
        )}
      </div>
    </div>
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
