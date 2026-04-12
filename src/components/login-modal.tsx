"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * ログインモーダル（Magic Link）
 * 未ログインユーザーが変換を試行した際に表示される遅延認証UI
 */
export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
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
        ) : (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              無料で登録して使ってみる
            </h2>
            <p className="mt-2 text-sm leading-[1.75] text-text-secondary">
              メールアドレスで登録すると、月3回まで無料で変換できます。
              パスワードは不要です。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
