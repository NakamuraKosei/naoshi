"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { createClient } from "@/lib/supabase/client";

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
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  // フォーカストラップ（Tabキー循環 + Escapeで閉じる）
  const trapRef = useFocusTrap(isOpen, handleClose);

  if (!isOpen) return null;

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
      // 成功: モーダルを閉じる（HeroConverter側のonAuthStateChangeが変換へ進める）
      handleClose();
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
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]"
      onClick={handleClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="ログイン"
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
              確認コードを入力
            </h2>
            <p className="mt-3 text-sm leading-[1.75] text-text-secondary">
              <span className="font-medium text-text-primary">{email}</span>{" "}
              に届いた6桁のコードを入力してください。入力したテキストはそのまま保持されています。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-4 rounded-md border border-error bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                disabled={isLoading}
                aria-label="確認コード"
                autoFocus
              />
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading || code.length < 6}>
                {isLoading ? "確認中…" : "ログイン"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => { setIsSent(false); setCode(""); setErrorMessage(""); }}
              className="mt-4 w-full text-center text-xs text-text-muted transition-colors hover:text-primary"
            >
              メールアドレスを入力し直す
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-text-primary">
              無料で登録して使ってみる
            </h2>
            <p className="mt-2 text-sm leading-[1.75] text-text-secondary">
              メールアドレスで登録すると、月3回まで無料で利用できます。
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
              <label className="flex items-start gap-2 cursor-pointer">
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
                {isLoading ? "送信中…" : "確認コードを送る"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
